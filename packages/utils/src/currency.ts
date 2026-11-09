import {
  CURRENCY_CODES,
  DEFAULT_CURRENCY_CODE,
  type CurrencyCode
} from '@pequemodas/config';

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  const code = String(value ?? '').trim().toUpperCase();
  return CURRENCY_CODES.includes(code as CurrencyCode)
    ? (code as CurrencyCode)
    : DEFAULT_CURRENCY_CODE;
}

export function formatMoney(amount: number, currencyCode: unknown = 'CUP'): string {
  const code = normalizeCurrencyCode(currencyCode);
  if (!Number.isFinite(amount)) {
    return `0 ${code}`;
  }
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `${formatted} ${code}`;
}

export function formatCup(amount: number): string {
  return formatMoney(amount, 'CUP');
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
