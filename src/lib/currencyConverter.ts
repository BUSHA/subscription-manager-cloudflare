import React from 'react';

// Cache for exchange rates - null until API returns
let ratesCache: Record<string, number> | null = null;
let ratesError: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour cache
let isFetching = false;
let ratesVersion = 0;
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  ratesVersion++;
  listeners.forEach(fn => fn());
}

async function fetchExchangeRates(baseCurrency: string = 'USD'): Promise<Record<string, number>> {
  const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.status}`);
  }
  const data = await response.json() as { rates?: Record<string, number> };
  return data.rates || {};
}

async function getExchangeRates(baseCurrency: string = 'USD'): Promise<void> {
  const now = Date.now();

  if ((now - cacheTimestamp) < CACHE_DURATION) {
    return;
  }

  if (isFetching) {
    return;
  }

  isFetching = true;
  ratesError = null;
  try {
    ratesCache = await fetchExchangeRates(baseCurrency);
    cacheTimestamp = now;
  } catch (error) {
    ratesError = error instanceof Error ? error.message : 'Failed to fetch exchange rates';
    console.error('Error fetching exchange rates:', ratesError);
  } finally {
    isFetching = false;
    notifyListeners();
  }
}

export function clearRatesCache(): void {
  ratesCache = null;
  ratesError = null;
  cacheTimestamp = 0;
}

export function convertCurrencySync(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number | null {
  if (!ratesCache) {
    return null;
  }

  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = ratesCache[fromCurrency.toUpperCase()];
  const toRate = ratesCache[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    return amount;
  }

  const amountInUSD = amount / fromRate;
  return amountInUSD * toRate;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number | null {
  return convertCurrencySync(amount, fromCurrency, toCurrency);
}

export async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  if (!ratesCache) {
    return null;
  }
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const fromRate = ratesCache[fromCurrency.toUpperCase()];
  const toRate = ratesCache[toCurrency.toUpperCase()];

  if (!fromRate || !toRate) {
    return null;
  }

  return toRate / fromRate;
}

export function areRatesLoaded(): boolean {
  return ratesCache !== null;
}

export function getRatesError(): string | null {
  return ratesError;
}

export async function preloadRates(baseCurrency: string = 'USD'): Promise<void> {
  await getExchangeRates(baseCurrency);
}

export function useExchangeRates(): { loaded: boolean; error: string | null } {
  const [, setVersion] = React.useState(ratesVersion);

  React.useEffect(() => {
    const handler = () => setVersion(ratesVersion);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  return { loaded: ratesCache !== null, error: ratesError };
}
