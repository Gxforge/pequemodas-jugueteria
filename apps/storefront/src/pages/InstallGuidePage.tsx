import React from 'react';
import { Download, Share2, Smartphone, Tablet } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { Card } from '@pequemodas/ui';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function InstallGuidePage() {
  const { settings } = useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  usePageMeta(
    'Instalar la aplicación',
    `Cómo añadir ${storeName} a un teléfono Android, iPhone o iPad.`
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Cómo tener {storeName} en tu teléfono
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          La tienda es una Aplicación Web: no se descarga del App Store ni ocupa
          una tienda de aplicaciones. Se añade a la pantalla de inicio y se abre
          como una app, con el catálogo y las fotos guardados para gastar menos
          datos.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-brand-600 font-bold">
            <Smartphone className="h-5 w-5" />
            <h2>Android (Chrome)</h2>
          </div>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5 marker:font-extrabold marker:text-brand-600">
            <li>Abre la tienda en Chrome y espera a que cargue por completo.</li>
            <li>
              Toca los tres puntos (<strong>⋮</strong>) arriba a la derecha.
            </li>
            <li>
              Elige <strong>«Instalar aplicación»</strong> o{' '}
              <strong>«Añadir a pantalla de inicio»</strong> y confirma.
            </li>
            <li>Si aparece una tarjeta de «Instalar Aplicación», también puedes tocarla.</li>
          </ol>
          <p className="text-xs text-slate-500">
            En Android el navegador puede mostrar el aviso de instalación automáticamente.
          </p>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2 text-sky-600 font-bold">
            <Tablet className="h-5 w-5" />
            <h2>iPhone o iPad (Safari)</h2>
          </div>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal pl-5 marker:font-extrabold marker:text-sky-600">
            <li>
              Abre la tienda en <strong>Safari</strong>. Si llegaste desde
              WhatsApp, Facebook o Instagram, toca «Abrir en Safari» primero.
            </li>
            <li>
              Toca <strong>«Compartir»</strong>: el cuadrado con la flecha hacia
              arriba. Con barra compacta, toca antes los tres puntos.
            </li>
            <li>
              Desliza y elige <strong>«Añadir a pantalla de inicio»</strong>.
            </li>
            <li>
              Deja activado <strong>«Abrir como App Web»</strong> (iOS 26 o
              posterior) y confirma con <strong>«Añadir»</strong>.
            </li>
          </ol>
          <p className="text-xs text-slate-500">
            En iPhone no aparece un botón automático de instalación: Apple pide
            hacer estos pasos desde el menú Compartir de Safari.
          </p>
        </Card>
      </div>

      <Card className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Share2 className="h-5 w-5 text-sky-600" />
          <Download className="h-5 w-5 text-brand-600" />
          <span>¿No ves la opción?</span>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">
          Comprueba que estás en Safari (iPhone/iPad) o Chrome (Android), cierra
          la vista previa de la app de mensajería y vuelve a abrir el enlace
          oficial. La aplicación nunca pide permisos de pago ni datos bancarios.
        </p>
      </Card>
    </div>
  );
}
