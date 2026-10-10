/**
 * Text normalization and similarity calculation for duplicate query checks.
 */

export const SIMILARITY_THRESHOLD = 0.4; // 40% threshold as requested

/**
 * Normalizes text by lowercasing, removing punctuation, and collapsing whitespace.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes Jaccard / Bigram word similarity score between two briefs (0.0 to 1.0).
 */
export function computeBriefSimilarity(textA: string, textB: string): number {
  const normA = normalizeText(textA);
  const normB = normalizeText(textB);

  if (!normA && !normB) return 1.0;
  if (!normA || !normB) return 0.0;
  if (normA === normB) return 1.0;

  const wordsA = new Set(normA.split(' ').filter(Boolean));
  const wordsB = new Set(normB.split(' ').filter(Boolean));

  if (wordsA.size === 0 || wordsB.size === 0) return 0.0;

  let intersectionCount = 0;
  wordsA.forEach((w) => {
    if (wordsB.has(w)) intersectionCount++;
  });

  const unionSize = new Set([...wordsA, ...wordsB]).size;
  if (unionSize === 0) return 1.0;

  return intersectionCount / unionSize;
}

export interface QueryFingerprintData {
  serviceIds: string[];
  projectIds: string[];
  budgetTier?: string;
  budgetCurrency?: string;
  normalizedEmail: string;
  normalizedPhone: string;
}

/**
 * Normalizes an email address.
 */
export function normalizeEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

/**
 * Normalizes a phone number to digits only or clean E.164.
 */
export function normalizePhone(phone?: string): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Creates a unique deterministic fingerprint string for duplicate matching.
 */
export function buildQueryFingerprint(data: QueryFingerprintData): string {
  const sortedServices = [...data.serviceIds].sort().join(',');
  const sortedProjects = [...data.projectIds].sort().join(',');
  const tier = data.budgetTier || '';
  const curr = data.budgetCurrency || '';
  const email = data.normalizedEmail;
  const phone = data.normalizedPhone;

  return `${email}|${phone}|${sortedServices}|${sortedProjects}|${tier}|${curr}`;
}
