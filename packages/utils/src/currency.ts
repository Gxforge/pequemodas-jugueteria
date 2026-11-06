import { BRAND_IDENTITY } from '@pequemodas/config';

export function formatCup(amount: number): string {
  if (!Number.isFinite(amount)) {
    return `0 ${BRAND_IDENTITY.currencyCode}`;
  }
  const hasDecimals = Math.round(amount * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2
  }).format(amount);
  return `${formatted} ${BRAND_IDENTITY.currencyCode}`;
}

export function roundMoney(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
