import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Boxes, ExternalLink, Phone } from 'lucide-react';
import type {
  CrmCustomerContact,
  CrmDirectOrder,
  CrmDirectOrderStatus
} from '@pequemodas/shared';
import { Badge } from '@pequemodas/ui';
import { buildWhatsAppUrl, formatCup } from '@pequemodas/utils';

export interface ChatThreadHeaderProps {
  contact: CrmCustomerContact;
  latestOrder?: CrmDirectOrder;
  onBackMobile: () => void;
  onToggleBot: (paused: boolean) => void;
  onChangeOrderStatus: (orderId: string, status: CrmDirectOrderStatus) => void;
}

export function ChatThreadHeader({
  contact,
  latestOrder,
  onBackMobile,
  onToggleBot,
  onChangeOrderStatus
}: ChatThreadHeaderProps) {
  return (
    <>
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackMobile}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100"
            aria-label="Volver a contactos"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="font-heading font-extrabold text-sm text-slate-900">
              {contact.full_name}
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              {contact.phone}
              {contact.municipality_or_address
                ? ` · ${contact.municipality_or_address}`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onToggleBot(!contact.bot_paused)}
            className={`rounded-full px-3 py-1 text-[11px] font-extrabold border ${
              contact.bot_paused
                ? 'bg-slate-100 text-slate-600 border-slate-200'
                : 'bg-sky-50 text-sky-700 border-sky-200'
            }`}
          >
            {contact.bot_paused ? 'Bot pausado' : 'Bot activo'}
          </button>
          <a
            href={buildWhatsAppUrl(
              contact.phone,
              `Hola ${contact.full_name}, te escribe Katia de PequeModas-Juguetería.`
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-whatsapp-50 text-whatsapp-700 px-2.5 py-1 text-[11px] font-bold"
          >
            WhatsApp <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {latestOrder && (
        <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warning">
              Último pedido: {latestOrder.reference_code} (
              {formatCup(latestOrder.estimated_total_cup)})
            </Badge>
            <select
              value={latestOrder.status}
              onChange={(e) =>
                onChangeOrderStatus(
                  latestOrder.id,
                  e.target.value as CrmDirectOrderStatus
                )
              }
              className="rounded-lg border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-slate-800"
            >
              <option value="pending">Pendiente de confirmar</option>
              <option value="confirmed">Confirmado con cliente</option>
              <option value="preparing">En preparación</option>
              <option value="completed">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <Link
            to="/inventario"
            className="inline-flex items-center gap-1 font-extrabold text-brand-700 hover:underline"
          >
            <Boxes className="h-3.5 w-3.5" />
            Actualizar stock
          </Link>
        </div>
      )}
    </>
  );
}
