import React from 'react';
import { Badge, Card } from '@pequemodas/ui';

export interface DatabaseSpaceCardProps {
  title: string;
  subtitle: string;
  usedMb: number;
  quotaMb: number;
  accentHex: string;
  extraPill: string;
}

export function DatabaseSpaceCard({
  title,
  subtitle,
  usedMb,
  quotaMb,
  accentHex,
  extraPill
}: DatabaseSpaceCardProps) {
  const pct = Math.min(100, Math.max(usedMb > 0 ? 2 : 1, (usedMb / quotaMb) * 100));
  const freeMb = Math.max(0, Math.round((quotaMb - usedMb) * 10) / 10);

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 40 40" className="h-10 w-10 shrink-0" aria-hidden="true">
            <rect width="40" height="40" rx="12" fill="#f8fafc" />
            <ellipse cx="20" cy="12" rx="10" ry="4.5" fill={accentHex} />
            <path
              d="M10 12v8c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5v-8"
              fill={accentHex}
              fillOpacity="0.28"
            />
            <path
              d="M10 20v8c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5v-8"
              fill={accentHex}
              fillOpacity="0.5"
            />
          </svg>
          <div>
            <h3 className="font-heading text-sm sm:text-base font-extrabold text-slate-900">
              {title}
            </h3>
            <p className="text-xs text-slate-500">{subtitle}</p>
          </div>
        </div>
        <Badge tone="sky">{extraPill}</Badge>
      </div>

      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: accentHex }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
        <span>Ocupado: {usedMb} MB</span>
        <span>
          Disponible: {freeMb} MB de {quotaMb} MB
        </span>
      </div>
    </Card>
  );
}
