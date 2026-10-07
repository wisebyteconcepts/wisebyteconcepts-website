/**
 * Shared Currency Formatting Utility
 * 
 * Provides consistent currency symbol extraction and formatting across the application:
 * - Shows only the symbol and removes redundant currency code before it (e.g., ₹1,500, $199.99, €50).
 * - Falls back to the ISO code if no narrow symbol is available (e.g., CHF 2,500).
 * - Extracts valid 3-letter ISO codes for Schema.org JSON-LD structured data (INR, USD, EUR).
 */

/**
 * Normalizes any currency string into a clean 3-letter ISO 4217 currency code.
 * E.g., 'USD ($)' -> 'USD', 'INR (₹)' -> 'INR', 'EUR (€)' -> 'EUR', '$' -> 'USD'.
 */
export function normalizeCurrencyCode(currencyInput?: string): string {
  if (!currencyInput || typeof currencyInput !== 'string') {
    return 'USD';
  }
  const trimmed = currencyInput.trim();
  
  // Look for 3-letter uppercase ISO code inside or outside parentheses
  const match = trimmed.match(/\b([A-Za-z]{3})\b/);
  if (match) {
    return match[1].toUpperCase();
  }

  // Symbol-to-code fallbacks
  if (trimmed.includes('₹')) return 'INR';
  if (trimmed.includes('€')) return 'EUR';
  if (trimmed.includes('£')) return 'GBP';
  if (trimmed.includes('¥')) return 'JPY';
  if (trimmed.includes('$')) return 'USD';

  return 'USD';
}

/**
 * Cleans string by stripping redundant currency codes directly preceding a currency symbol.
 * E.g., 'INR ₹1,500' -> '₹1,500', 'USD $199.99' -> '$199.99', 'EUR €50' -> '€50'.
 */
export function cleanCurrencyText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/\b[A-Za-z]{3}\s*([₹$€£¥])/g, '$1');
}

/**
 * Retrieves only the narrow symbol for a given currency (e.g., '$', '€', '£', '₹', '¥').
 * If no narrow symbol is available (like CHF), returns the ISO code as fallback.
 */
export function getCurrencySymbol(currencyInput?: string): string {
  const code = normalizeCurrencyCode(currencyInput);
  try {
    const parts = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    const symbolPart = parts.find((p) => p.type === 'currency');
    const symbol = symbolPart ? symbolPart.value.trim() : code;
    return symbol || code;
  } catch {
    return code;
  }
}

/**
 * Single shared currency formatter using Intl.NumberFormat with currencyDisplay: "narrowSymbol".
 * - Shows only the symbol where available (e.g., ₹1,500, $199.99, €50).
 * - Leaves off decimal zeros for integers (1500 -> ₹1,500, 50 -> €50).
 * - Shows up to 2 decimal places when decimals exist (199.99 -> $199.99).
 * - Falls back to code if no narrow symbol is available (e.g., CHF 2,500).
 */
export function formatCurrency(amount: number, currencyInput?: string): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }

  const code = normalizeCurrencyCode(currencyInput);

  try {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return cleanCurrencyText(formatted);
  } catch {
    const symbol = getCurrencySymbol(currencyInput);
    const num = Number.isInteger(amount)
      ? amount.toLocaleString('en-US')
      : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return symbol === code ? `${code} ${num}` : `${symbol}${num}`;
  }
}

export interface PricingOptions {
  pricingModel?: string;
  amount?: number;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  pricing?: any;
}

/**
 * Shared formatter for any service, product, or custom pricing structure.
 * Formats Fixed, Starting At, Range, Hourly, and Custom Quote consistently.
 */
export function formatServicePrice(item?: PricingOptions | null): string {
  if (!item) return '';

  const model = String(
    item.pricingModel || (item.pricing && (item.pricing as any).type) || ''
  ).trim();
  const currency = item.currency;

  if (model === 'Custom Quote' || model.toLowerCase() === 'custom') {
    return 'Custom Quote';
  }

  if (model === 'Range' || model.toLowerCase() === 'range') {
    if (item.minAmount !== undefined && item.maxAmount !== undefined) {
      return `${formatCurrency(item.minAmount, currency)} – ${formatCurrency(item.maxAmount, currency)}`;
    }
  }

  if (model === 'Starting At' || model.toLowerCase() === 'starting_from') {
    const amt = item.amount !== undefined ? item.amount : item.pricing?.amount;
    if (amt !== undefined) {
      return `From ${formatCurrency(amt, currency)}`;
    }
  }

  if (model.toLowerCase().includes('hour')) {
    const amt = item.amount !== undefined ? item.amount : item.pricing?.amount;
    if (amt !== undefined) {
      return `${formatCurrency(amt, currency)} / hr`;
    }
  }

  if (model === 'Fixed' || model.toLowerCase() === 'fixed') {
    const amt = item.amount !== undefined ? item.amount : item.pricing?.amount;
    if (amt !== undefined) {
      return formatCurrency(amt, currency);
    }
  }

  const fallbackAmt = item.amount !== undefined ? item.amount : item.pricing?.amount;
  if (fallbackAmt !== undefined && fallbackAmt > 0) {
    return formatCurrency(fallbackAmt, currency);
  }

  return '';
}

/**
 * Detailed pricing helper for detail pages, sidebars, and key metric bars.
 */
export function formatServicePricingDetails(item?: PricingOptions | null): {
  price: string;
  typeLabel: string;
  isCustom: boolean;
} | null {
  if (!item) return null;

  const model = String(
    item.pricingModel || (item.pricing && (item.pricing as any).type) || ''
  ).trim();
  const currency = item.currency;

  if (model === 'Custom Quote' || model.toLowerCase() === 'custom') {
    return {
      price: 'Custom Quote',
      typeLabel: 'Consultation & Custom Scope',
      isCustom: true,
    };
  }

  if (model === 'Range' || model.toLowerCase() === 'range') {
    if (item.minAmount !== undefined && item.maxAmount !== undefined) {
      return {
        price: `${formatCurrency(item.minAmount, currency)} – ${formatCurrency(item.maxAmount, currency)}`,
        typeLabel: 'Estimated Project Range',
        isCustom: false,
      };
    }
  }

  if (model === 'Starting At' || model.toLowerCase() === 'starting_from') {
    const amt = item.amount !== undefined ? item.amount : item.pricing?.amount;
    if (amt !== undefined) {
      return {
        price: `From ${formatCurrency(amt, currency)}`,
        typeLabel: 'Starting Investment',
        isCustom: false,
      };
    }
  }

  if (model.toLowerCase().includes('hour')) {
    const amt = item.amount !== undefined ? item.amount : item.pricing?.amount;
    if (amt !== undefined) {
      return {
        price: `${formatCurrency(amt, currency)} / hr`,
        typeLabel: 'Hourly Rate',
        isCustom: false,
      };
    }
  }

  if (model === 'Fixed' || model.toLowerCase() === 'fixed') {
    const amt = item.amount !== undefined ? item.amount : item.pricing?.amount;
    if (amt !== undefined) {
      return {
        price: formatCurrency(amt, currency),
        typeLabel: 'Fixed Rate',
        isCustom: false,
      };
    }
  }

  const fallbackAmt = item.amount !== undefined ? item.amount : item.pricing?.amount;
  if (fallbackAmt !== undefined && fallbackAmt > 0) {
    return {
      price: formatCurrency(fallbackAmt, currency),
      typeLabel: 'Project Rate',
      isCustom: false,
    };
  }

  return null;
}
