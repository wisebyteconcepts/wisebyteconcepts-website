import { describe, it, expect } from 'vitest';
import { 
  formatCurrency, 
  normalizeCurrencyCode, 
  getCurrencySymbol, 
  cleanCurrencyText, 
  formatServicePrice, 
  formatServicePricingDetails 
} from '../src/utils/currency';

describe('Shared Currency Formatting Utility', () => {
  describe('1. Currency Symbol Display & Code Removal', () => {
    it('formats INR with only symbol: ₹1,500 (removes redundant code)', () => {
      expect(formatCurrency(1500, 'INR (₹)')).toBe('₹1,500');
      expect(formatCurrency(1500, 'INR')).toBe('₹1,500');
    });

    it('formats USD with only symbol and cents when present: $199.99', () => {
      expect(formatCurrency(199.99, 'USD ($)')).toBe('$199.99');
      expect(formatCurrency(199.99, 'USD')).toBe('$199.99');
    });

    it('formats USD without trailing zeros for integers: $5,000', () => {
      expect(formatCurrency(5000, 'USD ($)')).toBe('$5,000');
    });

    it('formats EUR with only symbol: €50', () => {
      expect(formatCurrency(50, 'EUR (€)')).toBe('€50');
      expect(formatCurrency(50, 'EUR')).toBe('€50');
    });

    it('formats GBP with only symbol: £250', () => {
      expect(formatCurrency(250, 'GBP (£)')).toBe('£250');
    });

    it('formats JPY with only symbol: ¥10,000', () => {
      expect(formatCurrency(10000, 'JPY (¥)')).toBe('¥10,000');
    });
  });

  describe('2. Fallback for Currencies with No Distinct Symbol', () => {
    it('keeps currency code as fallback when symbol is not available (e.g. CHF)', () => {
      const chfFormatted = formatCurrency(2500, 'CHF (CHF)');
      // In Intl, CHF produces "CHF 2,500" (or with non-breaking space)
      expect(chfFormatted).toMatch(/CHF[\s\u00A0]2,500/);
    });

    it('getCurrencySymbol returns code when no symbol is available', () => {
      expect(getCurrencySymbol('CHF')).toBe('CHF');
      expect(getCurrencySymbol('INR')).toBe('₹');
      expect(getCurrencySymbol('USD')).toBe('$');
      expect(getCurrencySymbol('EUR')).toBe('€');
    });
  });

  describe('3. Text Cleanup Utility', () => {
    it('cleans redundant codes preceding symbols in arbitrary text strings', () => {
      expect(cleanCurrencyText('Total: INR ₹1,500')).toBe('Total: ₹1,500');
      expect(cleanCurrencyText('Price is USD $199.99 today')).toBe('Price is $199.99 today');
      expect(cleanCurrencyText('Fee: EUR €50')).toBe('Fee: €50');
    });
  });

  describe('4. JSON-LD ISO Code Normalization', () => {
    it('normalizes dropdown stored formats into clean 3-letter ISO codes for Schema.org', () => {
      expect(normalizeCurrencyCode('USD ($)')).toBe('USD');
      expect(normalizeCurrencyCode('INR (₹)')).toBe('INR');
      expect(normalizeCurrencyCode('EUR (€)')).toBe('EUR');
      expect(normalizeCurrencyCode('GBP (£)')).toBe('GBP');
      expect(normalizeCurrencyCode('CHF (CHF)')).toBe('CHF');
      expect(normalizeCurrencyCode('CAD ($)')).toBe('CAD');
      expect(normalizeCurrencyCode('AUD ($)')).toBe('AUD');
      expect(normalizeCurrencyCode('JPY (¥)')).toBe('JPY');
      expect(normalizeCurrencyCode('USD')).toBe('USD');
      expect(normalizeCurrencyCode('₹')).toBe('INR');
      expect(normalizeCurrencyCode('$')).toBe('USD');
    });
  });

  describe('5. Pricing Model Formatter (Fixed, Starting At, Range, Custom Quote)', () => {
    it('formats Fixed pricing', () => {
      expect(formatServicePrice({
        pricingModel: 'Fixed',
        amount: 1500,
        currency: 'INR (₹)',
      })).toBe('₹1,500');

      expect(formatServicePrice({
        pricingModel: 'Fixed',
        amount: 2999.5,
        currency: 'USD ($)',
      })).toBe('$2,999.50');
    });

    it('formats Starting At pricing with "From" prefix', () => {
      expect(formatServicePrice({
        pricingModel: 'Starting At',
        amount: 1500,
        currency: 'INR (₹)',
      })).toBe('From ₹1,500');

      expect(formatServicePrice({
        pricingModel: 'Starting At',
        amount: 50,
        currency: 'EUR (€)',
      })).toBe('From €50');
    });

    it('formats Range pricing with en-dash', () => {
      expect(formatServicePrice({
        pricingModel: 'Range',
        minAmount: 1000,
        maxAmount: 5000,
        currency: 'USD ($)',
      })).toBe('$1,000 – $5,000');

      expect(formatServicePrice({
        pricingModel: 'Range',
        minAmount: 500,
        maxAmount: 1500,
        currency: 'INR (₹)',
      })).toBe('₹500 – ₹1,500');
    });

    it('formats Custom Quote as text', () => {
      expect(formatServicePrice({
        pricingModel: 'Custom Quote',
      })).toBe('Custom Quote');
    });

    it('provides structured pricing details for hero / key info / sidebars', () => {
      const details = formatServicePricingDetails({
        pricingModel: 'Starting At',
        amount: 1500,
        currency: 'INR (₹)',
      });

      expect(details).toEqual({
        price: 'From ₹1,500',
        typeLabel: 'Starting Investment',
        isCustom: false,
      });
    });
  });
});
