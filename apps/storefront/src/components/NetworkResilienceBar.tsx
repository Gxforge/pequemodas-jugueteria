import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';
import { readOfflineSnapshot } from '../pwa/offlineSnapshot';
import { useNetworkQuality } from '../pwa/useNetworkQuality';

export function NetworkResilienceBar() {
  // Mantiene la optimización silenciosa de red lenta activa, pero sin mostrar avisos molestos
  const { isOnline, retryNow } = useNetworkQuality();

  if (isOnline) return null;

  const snap = readOfflineSnapshot();
  const savedTime = snap?.savedAt
    ? new Date(snap.savedAt).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-50 border-b border-amber-200 text-amber-950 px-4 py-2 text-xs sm:text-sm"
    >
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo sin conexión:</strong> puedes seguir viendo el catálogo guardado
            {savedTime ? ` (${savedTime})` : ''} y armando tu carrito. El stock real se
            verificará al recuperar señal.
          </span>
        </div>
        <button
          type="button"
          onClick={retryNow}
          className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 text-white px-3 py-1 text-xs font-bold hover:bg-amber-700"
        >
          <RefreshCw className="h-3 w-3" />
          Reintentar
        </button>
      </div>
    </div>
  );
}
