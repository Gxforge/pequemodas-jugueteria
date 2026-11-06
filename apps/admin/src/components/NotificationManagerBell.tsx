import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CheckCheck, MessageCircle, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import {
  fetchCrmNotificationsAndBot,
  markCrmNotificationsRead,
  saveCrmBotConfig
} from '@pequemodas/shared';
import { Badge, Button } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';

export function NotificationManagerBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-crm-notifications'],
    queryFn: fetchCrmNotificationsAndBot,
    refetchInterval: 15000
  });

  const notifications = data?.notifications ?? [];
  const botConfig = data?.botConfig ?? null;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMut = useMutation({
    mutationFn: (id?: string) => markCrmNotificationsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-overview'] });
    }
  });

  const togglePrefMut = useMutation({
    mutationFn: (patch: { notify_on_cart_add?: boolean; notify_on_chat?: boolean }) =>
      saveCrmBotConfig(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-notifications'] });
    }
  });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={`Centro de avisos (${unreadCount} nuevos)`}
        className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-brand-50 text-slate-700 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-extrabold text-white shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-12 z-50 w-[calc(100vw-1.5rem)] sm:w-96 rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-brand-50 to-sky-50 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-extrabold text-slate-900">
                  Avisos Inteligentes (Sin Spam)
                </p>
                <p className="text-[11px] text-slate-600">
                  Agrupa carritos y mensajes para avisarte sin saturar
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPrefs((p) => !p)}
                  aria-label="Ajustar avisos"
                  className="p-1.5 rounded-lg hover:bg-white text-slate-600"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markReadMut.mutate(undefined)}
                    aria-label="Marcar todos como leídos"
                    className="p-1.5 rounded-lg hover:bg-white text-brand-700"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {showPrefs && botConfig && (
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-2 text-xs">
                <label className="flex items-center justify-between gap-2 font-semibold text-slate-700">
                  <span>Avisar cuando un cliente escribe al chat</span>
                  <input
                    type="checkbox"
                    checked={botConfig.notify_on_chat}
                    onChange={(e) =>
                      togglePrefMut.mutate({ notify_on_chat: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 font-semibold text-slate-700">
                  <span>Avisar carritos activos (máx. 1 cada 30 min)</span>
                  <input
                    type="checkbox"
                    checked={botConfig.notify_on_cart_add}
                    onChange={(e) =>
                      togglePrefMut.mutate({ notify_on_cart_add: e.target.checked })
                    }
                    className="h-4 w-4 rounded"
                  />
                </label>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <p className="p-5 text-center text-xs text-slate-500">
                  Todo al día. Aquí verás cuando un cliente compre en la App, te escriba o arme un carrito.
                </p>
              ) : (
                notifications.slice(0, 15).map((item) => {
                  const Icon =
                    item.kind === 'customer_message' ? MessageCircle : ShoppingBag;
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 space-y-1.5 transition-colors ${
                        item.is_read ? 'bg-white' : 'bg-brand-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-slate-900">
                          <Icon className="h-3.5 w-3.5 text-brand-600 shrink-0" />
                          <span>{item.title}</span>
                        </div>
                        {item.event_count > 1 && (
                          <Badge tone="sky">×{item.event_count}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-snug">{item.body}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">
                          {formatDateTimeEs(item.updated_at)}
                        </span>
                        <div className="flex items-center gap-2">
                          {item.contact_id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                markReadMut.mutate(item.id);
                                setOpen(false);
                                navigate(`/mensajes?contacto=${item.contact_id}`);
                              }}
                            >
                              Atender chat
                            </Button>
                          )}
                          {item.kind !== 'customer_message' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                markReadMut.mutate(item.id);
                                setOpen(false);
                                navigate('/inventario');
                              }}
                            >
                              Ver stock
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
