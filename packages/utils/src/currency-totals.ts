import {
  CURRENCY_CODES,
  DEFAULT_CURRENCY_CODE,
  type CurrencyCode,
  type CurrencyTotals
} from '@pequemodas/config';
import { formatMoney, normalizeCurrencyCode, roundMoney } from './currency';

export interface CurrencyTotal {
  currencyCode: CurrencyCode;
  amount: number;
}

export interface CurrencyAmountLine {
  amount?: number;
  unitPrice?: number;
  quantity?: number;
  currencyCode?: unknown;
  currency_code?: unknown;
}

function lineAmount(line: CurrencyAmountLine): number {
  const direct = Number(line.amount);
  const computed = Number(line.unitPrice) * Number(line.quantity ?? 1);
  const value = Number.isFinite(direct) ? direct : computed;
  return Number.isFinite(value) ? Math.max(0, roundMoney(value)) : 0;
}

export function sumCurrencyTotals(lines: CurrencyAmountLine[]): CurrencyTotal[] {
  const bucket: CurrencyTotals = {};
  lines.forEach((line) => {
    const code = normalizeCurrencyCode(line.currencyCode ?? line.currency_code);
    bucket[code] = roundMoney((bucket[code] ?? 0) + lineAmount(line));
  });
  return CURRENCY_CODES.filter((code) => (bucket[code] ?? 0) > 0).map((code) => ({
    currencyCode: code,
    amount: bucket[code] ?? 0
  }));
}

export function totalsToObject(totals: CurrencyTotal[]): CurrencyTotals {
  return totals.reduce<CurrencyTotals>((acc, total) => {
    acc[total.currencyCode] = roundMoney(total.amount);
    return acc;
  }, {});
}

export function totalsFromObject(value: CurrencyTotals | null | undefined): CurrencyTotal[] {
  return CURRENCY_CODES.map((code) => ({
    currencyCode: code,
    amount: Number(value?.[code] ?? 0)
  })).filter((total) => Number.isFinite(total.amount) && total.amount > 0);
}

export function getCurrencyTotal(
  value: CurrencyTotal[] | CurrencyTotals | null | undefined,
  currencyCode: unknown
): number {
  const code = normalizeCurrencyCode(currencyCode);
  if (Array.isArray(value)) {
    return value.find((total) => total.currencyCode === code)?.amount ?? 0;
  }
  return Number(value?.[code] ?? 0) || 0;
}

export function formatCurrencyTotals(
  value: CurrencyTotal[] | CurrencyTotals | null | undefined
): string {
  const totals = Array.isArray(value) ? value : totalsFromObject(value);
  if (!totals.length) return formatMoney(0, DEFAULT_CURRENCY_CODE);
  return totals
    .map((total) => formatMoney(total.amount, total.currencyCode))
    .join(' + ');
}
