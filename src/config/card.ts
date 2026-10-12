/**
 * Shared Card Configurations and Constraints
 */

export const CARD_HOOK_MAX_LENGTH = 120;

/**
 * Returns card hook text without truncation.
 */
export function formatCardHook(text?: string | null): string {
  if (!text) return '';
  return text.trim();
}
