import React from 'react';

// Cache for exchange rates - initialized with fallback rates immediately
let ratesCache: Record<string, number> = getFallbackRates('USD');
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
let isFetching = false;
let ratesVersion = 0;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  ratesVersion++;
  listeners.forEach(fn => fn());
}

// Fetch exchange rates from API
async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }
    const data = await response.json() as { rates?: Record<string, number> };
    return data.rates || {};
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Return fallback rates if API fails
    return getFallbackRates(baseCurrency);
  }
}

// Fallback rates in case API is unavailable
function getFallbackRates(baseCurrency: string): Record<string, number> {
  const fallbackUSD: Record<string, number> = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.5,
    INR: 83.12,
    CAD: 1.36,
    AUD: 1.53,
    CHF: 0.88,
    CNY: 7.24,
    SEK: 10.45,
    NZD: 1.62,
    MXN: 17.15,
    SGD: 1.34,
    HKD: 7.82,
    NOK: 10.68,
    KRW: 1320.5,
    TRY: 32.15,
    RUB: 92.5,
    BRL: 4.97,
    ZAR: 18.65,
    DKK: 6.88,
    PLN: 3.98,
    THB: 35.2,
    IDR: 15650,
    HUF: 355.8,
    CZK: 22.85,
    ILS: 3.65,
    CLP: 920.5,
    PHP: 56.2,
    AED: 3.67,
    COP: 3925,
    SAR: 3.75,
    MYR: 4.72,
    RON: 4.58,
  };

  if (baseCurrency.toUpperCase() === 'USD') {
    return fallbackUSD;
  }

  // Convert fallback rates to requested base currency
  const baseRate = fallbackUSD[baseCurrency.toUpperCase()] || 1;
  const result: Record<string, number> = {};
  for (const [currency, rate] of Object.entries(fallbackUSD)) {
    result[currency] = rate / baseRate;
  }
  return result;
}

// Get cached or fetch fresh rates
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  const now = Date.now();
  
  // Return cached rates if still valid
  if ((now - cacheTimestamp) < CACHE_DURATION) {
    return ratesCache;
  }

  // Avoid concurrent fetches
  if (isFetching) {
    return ratesCache;
  }

  isFetching = true;
  try {
    const newRates = await fetchExchangeRates(baseCurrency);
    ratesCache = newRates;
    cacheTimestamp = now;
    notifyListeners();
  } finally {
    isFetching = false;
  }
  return ratesCache;
}

// Clear cache and reset to fallback rates
export function clearRatesCache(): void {
  ratesCache = getFallbackRates('USD');
  cacheTimestamp = 0;
}

/**
 * Convert an amount from one currency to another
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency code (e.g., 'USD', 'EUR')
 * @param toCurrency - Target currency code (e.g., 'USD', 'EUR')
 * @returns Converted amount
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rates = await getExchangeRates('USD');
  const fromRate = rates[fromCurrency.toUpperCase()] || 1;
  const toRate = rates[toCurrency.toUpperCase()] || 1;

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Synchronous version of convertCurrency using cached rates
 * @param amount - The amount to convert
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Converted amount
 */
export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = ratesCache[fromCurrency.toUpperCase()] || 1;
  const toRate = ratesCache[toCurrency.toUpperCase()] || 1;

  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

/**
 * Get the exchange rate from one currency to another
 * @param fromCurrency - Source currency code
 * @param toCurrency - Target currency code
 * @returns Exchange rate
 */
export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rates = await getExchangeRates('USD');
  const fromRate = rates[fromCurrency.toUpperCase()] || 1;
  const toRate = rates[toCurrency.toUpperCase()] || 1;

  return toRate / fromRate;
}

/**
 * Check if live API rates are loaded (not just fallback)
 * @returns true if API rates have been fetched
 */
export function areRatesLoaded(): boolean {
  return cacheTimestamp > 0;
}

/**
 * Refresh exchange rates from API (fallback rates are used immediately)
 * @param baseCurrency - Base currency for rates (default: USD)
 */
export async function preloadRates(baseCurrency: string = 'USD'): Promise<void> {
  await getExchangeRates(baseCurrency);
}

/**
 * React hook that triggers re-render when exchange rates update
 * Use this in components that depend on currency conversion
 */
export function useExchangeRates(): number {
  const [, setVersion] = React.useState(ratesVersion);
  
  React.useEffect(() => {
    const handler = () => setVersion(ratesVersion);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);
  
  return ratesVersion;
}
