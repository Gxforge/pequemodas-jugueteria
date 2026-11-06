import React from 'react';
import { AlertCircle, Clock } from 'lucide-react';

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
        className="inline-flex items-center text-slate-400 shrink-0"
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
        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 hover:underline shrink-0"
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
        className="inline-flex items-center text-sky-600 shrink-0 pl-0.5 pr-0.5"
      >
        <svg
          width="19"
          height="13"
          viewBox="0 0 22 14"
          fill="none"
          overflow="visible"
          aria-hidden="true"
        >
          <path
            d="M1.8 7.6L5.4 11.1L12.8 3.2"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7.6 7.6L11.2 11.1L18.8 3.2"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }

  return (
    <span
      title="Enviado (pendiente de revisión)"
      aria-label="Enviado"
      className="inline-flex items-center text-slate-500 shrink-0 pl-0.5 pr-0.5"
    >
      <svg
        width="14"
        height="13"
        viewBox="0 0 16 14"
        fill="none"
        overflow="visible"
        aria-hidden="true"
      >
        <path
          d="M2.2 7.6L5.9 11.2L13.6 3.2"
          stroke="currentColor"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
