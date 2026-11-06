import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

const PADDING_MAP = {
  none: '',
  sm: 'p-3.5',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-7'
} as const;

export function Card({
  padding = 'md',
  interactive = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={`rounded-2xl bg-white border border-slate-100 shadow-card ${
        interactive
          ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated hover:border-brand-100'
          : ''
      } ${PADDING_MAP[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export type BadgeTone =
  | 'brand'
  | 'sky'
  | 'sunny'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

const TONE_MAP: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
  sunny: 'bg-sunny-100 text-amber-800 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200'
};

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONE_MAP[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function AvailabilityBadge({
  status,
  quantity
}: {
  status: 'available' | 'out_of_stock' | 'inquire';
  quantity?: number | null;
}) {
  if (status === 'out_of_stock') {
    return <Badge tone="danger">Agotado</Badge>;
  }
  if (status === 'inquire') {
    return <Badge tone="warning">Consultar disponibilidad</Badge>;
  }
  return (
    <Badge tone="success">
      Disponible{typeof quantity === 'number' && quantity > 0 ? ` (${quantity})` : ''}
    </Badge>
  );
}
