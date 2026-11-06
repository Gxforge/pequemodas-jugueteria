import React from 'react';
import { AlertCircle, Check, CheckCheck, Clock } from 'lucide-react';

export type TickVisualState = 'sending' | 'sent' | 'read' | 'failed';

export function MessageStatusTicks({
  state,
  onRetry
}: {
  state: TickVisualState;
  onRetry?: () => void;
}) {
  if (state === 'sending') {
    return (
      <span
        title="Enviando mensaje..."
        aria-label="Enviando"
        className="inline-flex items-center text-slate-400"
      >
        <Clock className="h-3.5 w-3.5 animate-pulse" />
      </span>
    );
  }

  if (state === 'failed') {
    return (
      <button
        type="button"
        onClick={onRetry}
        title="No se pudo enviar. Toca para reintentar."
        aria-label="Reintentar envío"
        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 hover:underline"
      >
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Reintentar</span>
      </button>
    );
  }

  if (state === 'read') {
    return (
      <span
        title="Revisado"
        aria-label="Leído"
        className="inline-flex items-center text-sky-600"
      >
        <CheckCheck className="h-4 w-4 stroke-[2.5]" />
      </span>
    );
  }

  return (
    <span
      title="Enviado (pendiente de revisión)"
      aria-label="Enviado"
      className="inline-flex items-center text-slate-500"
    >
      <Check className="h-3.5 w-3.5 stroke-[2.3]" />
    </span>
  );
}
