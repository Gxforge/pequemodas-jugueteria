import React from 'react';
import { Sparkles } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className = ''
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-3xl border border-dashed border-brand-200 bg-gradient-to-b from-white to-brand-50/40 px-6 py-10 sm:py-14 text-center max-w-2xl mx-auto ${className}`}
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100/80 text-brand-600 shadow-sm">
        {icon ?? <Sparkles className="h-8 w-8" />}
      </div>
      <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      {(primaryAction || secondaryAction) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          {primaryAction}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-slate-200/75 ${className}`}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-3 shadow-card">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-5 w-4/5" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  );
}
