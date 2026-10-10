/**
 * Centralized Budget Configuration
 * Configurable budget tiers for India (INR) and Rest of the World (USD).
 * Formatters use symbol only (₹ / $) as specified.
 */

export type CurrencyType = 'INR' | 'USD';

export interface BudgetTier {
  key: 'tier_1' | 'tier_2' | 'tier_3' | 'tier_4';
  label: string;
  min?: number;
  max?: number;
}

export const BUDGET_CONFIG: Record<CurrencyType, {
  currency: CurrencyType;
  symbol: string;
  currencyName: string;
  tiers: BudgetTier[];
}> = {
  INR: {
    currency: 'INR',
    symbol: '₹',
    currencyName: 'Indian Rupee',
    tiers: [
      { key: 'tier_1', label: 'Less than ₹10,000', max: 10000 },
      { key: 'tier_2', label: '₹10,000 to ₹20,000', min: 10000, max: 20000 },
      { key: 'tier_3', label: '₹20,000 to ₹50,000', min: 20000, max: 50000 },
      { key: 'tier_4', label: 'More than ₹50,000', min: 50000 },
    ],
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    currencyName: 'US Dollar',
    tiers: [
      { key: 'tier_1', label: 'Less than $500', max: 500 },
      { key: 'tier_2', label: '$500 to $1,500', min: 500, max: 1500 },
      { key: 'tier_3', label: '$1,500 to $5,000', min: 1500, max: 5000 },
      { key: 'tier_4', label: 'More than $5,000', min: 5000 },
    ],
  },
};

/**
 * Returns the display label for a given tier key and currency.
 * Fallbacks cleanly to tier label or raw value if not found.
 */
export function getBudgetTierLabel(tierKey: string, currency: CurrencyType = 'USD'): string {
  const config = BUDGET_CONFIG[currency] || BUDGET_CONFIG.USD;
  const found = config.tiers.find((t) => t.key === tierKey);
  return found ? found.label : tierKey;
}
