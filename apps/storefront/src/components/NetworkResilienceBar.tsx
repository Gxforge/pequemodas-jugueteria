import React, { useState } from 'react';
import { Gauge, RefreshCw, WifiOff, X } from 'lucide-react';
import { readOfflineSnapshot } from '../pwa/offlineSnapshot';
import { useNetworkQuality } from '../pwa/useNetworkQuality';

export function NetworkResilienceBar() {
  const { isOnline, isSlowConnection, saveData, retryNow } = useNetworkQuality();
  const [dismissedSlow, setDismissedSlow] = useState(false);

  if (!isOnline) {
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

  if (isSlowConnection && !dismissedSlow) {
    return (
      <div
        role="status"
        className="bg-sky-50 border-b border-sky-200 text-sky-900 px-4 py-1.5 text-xs"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-sky-600 shrink-0" />
            <span>
              {saveData ? 'Ahorro de datos activo' : 'Conexión móvil lenta detectada'} ·
              Imágenes WebP ligeras y caché inteligente activados.
            </span>
          </div>
          <button
            type="button"
            aria-label="Cerrar aviso de red lenta"
            onClick={() => setDismissedSlow(true)}
            className="p-1 text-sky-700 hover:text-sky-950"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
