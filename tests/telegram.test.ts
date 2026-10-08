import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  escapeHtml, 
  formatSingleQueryMessage, 
  formatBatchQueryMessage, 
  enqueueQueryNotification,
  isNotificationsEnabled,
  setNotificationsEnabled,
  QueryPayload
} from '../server/telegram';

describe('Telegram Notification Service', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('escapeHtml', () => {
    it('escapes special characters so Telegram HTML formatting is never broken', () => {
      expect(escapeHtml('<script>alert("test & more")</script>')).toBe(
        '&lt;script&gt;alert(&quot;test &amp; more&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("John's Tech & 'AI' <Solutions>")).toBe(
        'John&#39;s Tech &amp; &#39;AI&#39; &lt;Solutions&gt;'
      );
    });

    it('gracefully handles empty or null values', () => {
      expect(escapeHtml('')).toBe('');
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('formatSingleQueryMessage', () => {
    const mockQuery: QueryPayload = {
      id: 'query_123_abc',
      name: 'Alice <Engineer> & Bob',
      email: 'alice@secret.com',
      phone: '+1 555-0199',
      message: 'This is a top secret client message body that should NOT be in the notification.',
      services: [{ id: 'svc-1', name: 'Web Development & Design' }],
      projects: [{ id: 'proj-1', name: 'Cloud Portal <Pro>' }],
      budget: '$5,000 - $10,000',
      timeline: '2-4 weeks',
      createdAt: '2026-10-08T12:00:00Z',
    };

    it('formats a concise notification message with sender, services, project, budget, timeline, and admin link', () => {
      const message = formatSingleQueryMessage(mockQuery, 'https://example.com');

      expect(message).toContain('New query received');
      expect(message).toContain('Alice &lt;Engineer&gt; &amp; Bob');
      expect(message).toContain('Web Development &amp; Design');
      expect(message).toContain('Cloud Portal &lt;Pro&gt;');
      expect(message).toContain('$5,000 - $10,000');
      expect(message).toContain('2-4 weeks');
      expect(message).toContain('https://example.com/admin/queries?id=query_123_abc');

      // Requirement 3: Short, no full message body or sensitive details (phone/email)
      expect(message).not.toContain('top secret client message');
      expect(message).not.toContain('alice@secret.com');
      expect(message).not.toContain('555-0199');
    });

    it('handles query with missing optional fields gracefully', () => {
      const minimalQuery: QueryPayload = {
        id: 'query_simple_999',
        name: 'Simple User',
      };

      const message = formatSingleQueryMessage(minimalQuery, 'http://localhost:3000');
      expect(message).toContain('Simple User');
      expect(message).toContain('http://localhost:3000/admin/queries?id=query_simple_999');
      expect(message).toContain('Flexible / TBD');
    });
  });

  describe('formatBatchQueryMessage', () => {
    it('formats aggregated notification for burst submissions', () => {
      const batch: QueryPayload[] = [
        { id: 'q1', name: 'User One', services: [{ id: 's1', name: 'Full-Stack' }], budget: '$5k' },
        { id: 'q2', name: 'User Two', services: [{ id: 's2', name: 'Mobile' }], budget: '$10k' },
      ];

      const batchMessage = formatBatchQueryMessage(batch, 'https://example.com');
      expect(batchMessage).toContain('2 New queries received');
      expect(batchMessage).toContain('User One');
      expect(batchMessage).toContain('User Two');
      expect(batchMessage).toContain('https://example.com/admin/queries');
    });
  });

  describe('Abuse Protection & Honeypot Suppression', () => {
    it('silently skips spam submissions where honeypot is filled', async () => {
      const spamQuery: QueryPayload = {
        id: 'query_bot_1',
        name: 'Bot User',
        honeypot: 'http://spam-link.example.com',
      };

      const result = await enqueueQueryNotification(spamQuery, 'https://example.com');
      expect(result.notified).toBe(false);
      expect(result.skipped).toBe(true);
    });

    it('silently skips when isSpam is marked true', async () => {
      const spamQuery: QueryPayload = {
        id: 'query_spam_2',
        name: 'Spam Sender',
        isSpam: true,
      };

      const result = await enqueueQueryNotification(spamQuery, 'https://example.com');
      expect(result.notified).toBe(false);
      expect(result.skipped).toBe(true);
    });

    it('silently skips when Telegram notifications are unconfigured or missing env vars', async () => {
      delete process.env.TELEGRAM_BOT_TOKEN;
      delete process.env.TELEGRAM_CHAT_ID;

      const validQuery: QueryPayload = {
        id: 'query_unconf_3',
        name: 'Real User',
      };

      const result = await enqueueQueryNotification(validQuery, 'https://example.com');
      expect(result.notified).toBe(false);
      expect(result.skipped).toBe(true);
    });
  });

  describe('Runtime Toggle Control', () => {
    it('allows toggling notifications on and off dynamically', () => {
      setNotificationsEnabled(false);
      expect(isNotificationsEnabled()).toBe(false);

      setNotificationsEnabled(true);
      expect(isNotificationsEnabled()).toBe(true);
    });
  });
});
