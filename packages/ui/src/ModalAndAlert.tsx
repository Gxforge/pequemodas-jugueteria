import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidthClass = 'max-w-lg'
}: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`w-full ${maxWidthClass} rounded-t-3xl sm:rounded-3xl bg-white shadow-elevated border border-slate-100 max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="modal-title" className="font-heading text-lg font-bold text-slate-900">
              {title}
            </h2>
            {description && <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 flex-1">{children}</div>

        {footer && (
          <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-3.5 flex flex-wrap items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const ALERT_STYLES: Record<
  AlertVariant,
  { wrap: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  info: {
    wrap: 'bg-sky-50 border-sky-200 text-sky-900',
    Icon: Info
  },
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    Icon: CheckCircle2
  },
  warning: {
    wrap: 'bg-amber-50 border-amber-200 text-amber-900',
    Icon: AlertTriangle
  },
  error: {
    wrap: 'bg-rose-50 border-rose-200 text-rose-900',
    Icon: AlertCircle
  }
};

export function Alert({
  variant = 'info',
  title,
  children,
  className = ''
}: {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { wrap, Icon } = ALERT_STYLES[variant];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${wrap} ${className}`}
    >
      <Icon className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="space-y-1 flex-1">
        {title && <p className="font-bold">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
