import React from 'react';
import { formatMoney, type CurrencyTotal } from '@pequemodas/utils';

interface CurrencyTotalsProps {
  totals: CurrencyTotal[];
  size?: 'sm' | 'lg';
  showNote?: boolean;
}

export function CurrencyTotals({
  totals,
  size = 'lg',
  showNote = false
}: CurrencyTotalsProps) {
  const visible = totals.length > 0
    ? totals
    : [{ currencyCode: 'CUP' as const, amount: 0 }];
  const large = size === 'lg';

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((total, index) => (
          <React.Fragment key={total.currencyCode}>
            {index > 0 && (
              <span className="font-bold text-slate-400">+</span>
            )}
            <span
              className={
                large
                  ? 'font-heading text-xl sm:text-2xl font-extrabold text-slate-900'
                  : 'font-heading text-lg font-extrabold text-brand-600'
              }
            >
              {formatMoney(total.amount, total.currencyCode)}
            </span>
          </React.Fragment>
        ))}
      </div>
      {showNote && visible.length > 1 && (
        <p className="text-[11px] font-semibold text-slate-500">
          Cada moneda se suma por separado, sin convertir.
        </p>
      )}
    </div>
  );
}
