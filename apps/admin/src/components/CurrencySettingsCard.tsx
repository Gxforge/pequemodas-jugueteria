import React from 'react';
import type { UseFormRegister } from 'react-hook-form';
import type { StoreSettingsFormInput } from '@pequemodas/schemas';
import { Card, Select } from '@pequemodas/ui';

export function CurrencySettingsCard({
  register
}: {
  register: UseFormRegister<StoreSettingsFormInput>;
}) {
  return (
    <Card className="space-y-3 border-sky-100 bg-gradient-to-r from-sky-50/60 via-white to-brand-50/60">
      <div>
        <h2 className="font-heading text-lg font-bold text-slate-900">
          Moneda de los precios
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Elige la moneda principal para los productos nuevos. Después puedes poner cada
          artículo en CUP o en USD desde su ficha.
        </p>
      </div>
      <div className="max-w-xs">
        <Select
          label="Moneda principal para productos nuevos"
          hint="CUP y USD nunca se convierten ni se mezclan"
          options={[
            { value: 'CUP', label: 'CUP · pesos cubanos' },
            { value: 'USD', label: 'USD · dólares' }
          ]}
          {...register('defaultCurrencyCode')}
        />
      </div>
      <p className="text-xs font-semibold text-slate-600">
        Cambiar esta opción no modifica los productos que ya existen.
      </p>
    </Card>
  );
}
