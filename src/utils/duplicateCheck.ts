/**
 * Utilities for duplicate query detection and brief similarity scoring
 */

export function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates word-level similarity score between 0 and 1.
 * Default similarity threshold is 0.40 (40%).
 */
export function calculateBriefSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);
  if (!normA && !normB) return 1;
  if (!normA || !normB) return 0;
  if (normA === normB) return 1;

  const wordsA = normA.split(' ').filter(Boolean);
  const wordsB = normB.split(' ').filter(Boolean);
  if (wordsA.length === 0 || wordsB.length === 0) return 0;

  const setA = new Set(wordsA);
  const setB = new Set(wordsB);

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection++;
  }

  const union = new Set([...wordsA, ...wordsB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Builds a deterministic fingerprint for an inquiry based on:
 * - normalized email (lowercased)
 * - phone digits / E.164
 * - sorted services
 * - sorted projects
 * - budget tier and currency
 */
export function buildQueryFingerprint(data: {
  email: string;
  phone?: string;
  serviceIds: string[];
  projectIds: string[];
  budgetTier?: string;
  currency?: string;
}): string {
  const emailNorm = (data.email || '').trim().toLowerCase();
  const phoneNorm = (data.phone || '').replace(/\D/g, '');
  const servicesNorm = [...(data.serviceIds || [])].sort().join(',');
  const projectsNorm = [...(data.projectIds || [])].sort().join(',');
  const tierNorm = data.budgetTier || '';
  const currNorm = data.currency || '';

  return `${emailNorm}|${phoneNorm}|${servicesNorm}|${projectsNorm}|${tierNorm}|${currNorm}`;
}
