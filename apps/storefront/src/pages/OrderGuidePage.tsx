import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@pequemodas/ui';
import { usePageMeta } from '../hooks/usePageMeta';

interface VisualStep {
  num: string;
  image: string;
  title: string;
  shortHint: string;
  topCallout: string;
  bottomCallout: string;
  accentClass: string;
}

const VISUAL_STEPS: VisualStep[] = [
  {
    num: '1',
    image: '/guia/paso-1.webp',
    title: 'Elige tus favoritos',
    shortHint: 'Mira fotos reales, precio en CUP y toca Agregar.',
    topCallout: '👆 Toca la talla o color',
    bottomCallout: '🛍️ Pulsa «Agregar»',
    accentClass: 'from-brand-600 to-pink-500'
  },
  {
    num: '2',
    image: '/guia/paso-2.webp',
    title: 'Revisa tu bolsita',
    shortHint: 'Ajusta cantidades y escoge Domicilio o Recogida.',
    topCallout: '➕ Ajusta unidades',
    bottomCallout: '🛵 Domicilio o Recogida',
    accentClass: 'from-sky-600 to-cyan-500'
  },
  {
    num: '3',
    image: '/guia/paso-3.webp',
    title: 'Envía en 1 toque',
    shortHint: 'Directo aquí en el Chat de la App o por WhatsApp.',
    topCallout: '⚡ Sin tarjetas ni pagos online',
    bottomCallout: '💬 En la App o WhatsApp',
    accentClass: 'from-emerald-600 to-teal-500'
  },
  {
    num: '4',
    image: '/guia/paso-4.webp',
    title: 'Katia te confirma',
    shortHint: 'Revisa existencia física y coordina la entrega contigo.',
    topCallout: '✅ Revisión personal',
    bottomCallout: '💖 Trato directo humano',
    accentClass: 'from-violet-600 to-brand-500'
  }
];

export function OrderGuidePage() {
  usePageMeta(
    'Cómo pedir paso a paso',
    'Guía visual rápida con imágenes anotadas para pedir en PequeModas-Juguetería.'
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-extrabold text-brand-700 mb-2">
            ✨ Guía Visual Rápida
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
            ¿Cómo hacer tu pedido?
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-600">
          4 pasos sencillos · Sin tarjetas ni pagos en línea
        </p>
      </div>

      {/* Cuadrícula Visual con Imágenes Anotadas */}
      <div className="grid sm:grid-cols-2 gap-5">
        {VISUAL_STEPS.map((step) => (
          <article
            key={step.num}
            className="group rounded-3xl bg-white border border-slate-200/90 shadow-card overflow-hidden flex flex-col hover:border-brand-200 transition-all"
          >
            <div className="relative aspect-[17/11] bg-slate-100 overflow-hidden">
              <img
                src={step.image}
                alt={step.title}
                loading="lazy"
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Número de paso */}
              <span
                className={`absolute top-3 left-3 h-9 w-9 rounded-2xl bg-gradient-to-br ${step.accentClass} text-white font-heading font-extrabold text-base flex items-center justify-center shadow-lg ring-2 ring-white`}
              >
                {step.num}
              </span>

              {/* Anotación visual superior con flecha indicadora */}
              <div className="absolute top-3 right-3 rounded-full bg-white/95 backdrop-blur px-3 py-1 text-[11px] font-extrabold text-slate-900 shadow-md border border-slate-200/80 flex items-center gap-1">
                <span>{step.topCallout}</span>
              </div>

              {/* Anotación visual inferior apuntando a la escena */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-end">
                <div className="rounded-2xl bg-slate-900/85 backdrop-blur text-white px-3 py-1.5 text-[11px] font-bold shadow-lg flex items-center gap-1.5">
                  <span>{step.bottomCallout}</span>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-base sm:text-lg font-extrabold text-slate-900">
                  {step.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  {step.shortHint}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Nota breve e intuitiva + Acciones */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-50 via-white to-brand-50 border border-sky-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="h-10 w-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <p className="text-xs sm:text-sm text-slate-700">
            <strong className="text-slate-900">Reserva segura:</strong> Tu pedido no descuenta ni cobra nada automático; queda confirmado cuando Katia te responde.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle className="h-4 w-4" />}
            onClick={() => window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))}
          >
            Preguntar en Chat
          </Button>
          <Link to="/catalogo">
            <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Ir al catálogo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
