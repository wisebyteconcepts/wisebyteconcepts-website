import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageAdapter } from '@/services/localStorageAdapter';
import { Query } from '@/types';

// Mock localStorage in Node test environment
const mockStorage: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  key: (i: number) => Object.keys(mockStorage)[i] || null,
  length: 0,
};

describe('Contact Queries Management Tests', () => {
  let adapter: LocalStorageAdapter;

  beforeEach(() => {
    localStorage.clear();
    adapter = new LocalStorageAdapter();
  });

  const sampleQuery: Query = {
    id: 'query_test_1',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.org',
    phone: '+1 555-0199',
    message: 'Need full cloud infrastructure overhaul with Kubernetes clusters.',
    services: [
      { id: 'srv_cloud', name: 'Cloud Architecture', category: 'Infrastructure' }
    ],
    projects: [
      { id: 'prj_telemetry', name: 'Telemetry Engine' }
    ],
    budget: '$15,000 – $35,000',
    timeline: '1–2 Months',
    contactMethod: 'email',
    createdAt: new Date().toISOString(),
    status: 'New',
    isRead: false,
    notified: false,
    notes: 'Initial test inquiry',
  };

  it('creates and persists a query correctly with default status New and unread state', async () => {
    const created = await adapter.createQuery(sampleQuery);
    expect(created.id).toBe('query_test_1');
    expect(created.status).toBe('New');
    expect(created.isRead).toBe(false);
    expect(created.notified).toBe(false);

    const all = await adapter.getQueries();
    expect(all.length).toBe(1);
    expect(all[0].name).toBe('Sarah Connor');
    expect(all[0].services[0].id).toBe('srv_cloud');
    expect(all[0].projects[0].id).toBe('prj_telemetry');
  });

  it('updates query status and notes properly', async () => {
    await adapter.createQuery(sampleQuery);

    const updated = await adapter.updateQuery({
      ...sampleQuery,
      status: 'In progress',
      isRead: true,
      notes: 'Spoke with Sarah, scheduling kick-off call on Thursday.',
    });

    expect(updated.status).toBe('In progress');
    expect(updated.isRead).toBe(true);
    expect(updated.notes).toContain('Spoke with Sarah');

    const retrieved = await adapter.getQueries();
    expect(retrieved[0].status).toBe('In progress');
    expect(retrieved[0].isRead).toBe(true);
  });

  it('deletes query completely from storage', async () => {
    await adapter.createQuery(sampleQuery);
    let all = await adapter.getQueries();
    expect(all.length).toBe(1);

    await adapter.deleteQuery('query_test_1');
    all = await adapter.getQueries();
    expect(all.length).toBe(0);
  });

  it('sorts queries newest first by timestamp', async () => {
    const q1: Query = {
      ...sampleQuery,
      id: 'q_old',
      createdAt: '2026-01-01T10:00:00Z',
    };
    const q2: Query = {
      ...sampleQuery,
      id: 'q_new',
      createdAt: '2026-06-01T10:00:00Z',
    };

    await adapter.createQuery(q1);
    await adapter.createQuery(q2);

    const sorted = await adapter.getQueries();
    expect(sorted[0].id).toBe('q_new');
    expect(sorted[1].id).toBe('q_old');
  });
});
