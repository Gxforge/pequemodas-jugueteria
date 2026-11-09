export type CurrencyCode = 'CUP' | 'USD';

export const CURRENCY_CODES: readonly CurrencyCode[] = ['CUP', 'USD'] as const;

export const DEFAULT_CURRENCY_CODE: CurrencyCode = 'CUP';

export type CurrencyTotals = Partial<Record<CurrencyCode, number>>;
