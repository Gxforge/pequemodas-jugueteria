import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CheckCheck,
  MessageCircle,
  ShoppingBag,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  fetchCrmNotificationsAndBot,
  markCrmNotificationsRead,
  saveCrmBotConfig,
  type CrmAdminNotification
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
    refetchInterval: 10000
  });

  const notifications = data?.notifications ?? [];
  const botConfig = data?.botConfig ?? null;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markReadMut = useMutation({
    mutationFn: (id?: string) => markCrmNotificationsRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-notifications'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dual-overview'] });
    }
  });

  const togglePrefMut = useMutation({
    mutationFn: (patch: { notify_on_cart_add?: boolean; notify_on_chat?: boolean }) =>
      saveCrmBotConfig(patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-notifications'] });
    }
  });

  const handleOpenNotificationTarget = (item: CrmAdminNotification) => {
    markReadMut.mutate(item.id);
    setOpen(false);
    if (item.contact_id) {
      navigate(`/mensajes?contacto=${encodeURIComponent(item.contact_id)}`);
    } else {
      navigate('/inventario');
    }
  };

  const drawerPortal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-slate-900/35 backdrop-blur-[1px]"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <aside
              role="dialog"
              aria-label="Avisos Inteligentes de la Tienda"
              className="relative z-10 w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col"
            >
              <div className="px-4 py-4 bg-gradient-to-r from-brand-50 via-white to-sky-50 border-b border-slate-200 flex items-center justify-between gap-2">
                <div>
                  <p className="font-heading text-base font-extrabold text-slate-900">
                    Avisos Inteligentes (Sin Spam)
                  </p>
                  <p className="text-xs text-slate-600">
                    Toca cualquier aviso para abrirlo aquí mismo en tu aplicación
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowPrefs((p) => !p)}
                    aria-label="Ajustar avisos"
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => markReadMut.mutate(undefined)}
                      aria-label="Marcar todos como leídos"
                      className="p-2 rounded-xl hover:bg-slate-100 text-brand-700"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Cerrar panel de avisos"
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {showPrefs && botConfig && (
                <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
                  <label className="flex items-center justify-between gap-2 font-bold text-slate-700">
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
                  <label className="flex items-center justify-between gap-2 font-bold text-slate-700">
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

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <Bell className="h-8 w-8 text-brand-300 mx-auto" />
                    <p className="font-heading font-bold text-sm text-slate-700">
                      Todo al día en tu tienda
                    </p>
                    <p className="text-xs text-slate-500">
                      Aquí aparecerán agrupados los mensajes de clientes, compras directas y carritos activos.
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 25).map((item) => {
                    const Icon =
                      item.kind === 'customer_message' ? MessageCircle : ShoppingBag;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleOpenNotificationTarget(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleOpenNotificationTarget(item);
                        }}
                        className={`p-4 space-y-1.5 cursor-pointer transition-colors hover:bg-brand-50/60 ${
                          item.is_read ? 'bg-white' : 'bg-brand-50/35'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 font-heading font-extrabold text-xs sm:text-sm text-slate-900">
                            <Icon className="h-4 w-4 text-brand-600 shrink-0" />
                            <span>{item.title}</span>
                          </div>
                          {item.event_count > 1 && (
                            <Badge tone="sky">×{item.event_count}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.body}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            {formatDateTimeEs(item.updated_at)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {item.contact_id && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenNotificationTarget(item);
                                }}
                              >
                                Abrir conversación
                              </Button>
                            )}
                            {item.kind !== 'customer_message' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markReadMut.mutate(item.id);
                                  setOpen(false);
                                  navigate('/inventario');
                                }}
                              >
                                Revisar stock
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Centro de avisos (${unreadCount} nuevos)`}
        className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-slate-200 bg-white hover:bg-brand-50 text-slate-700 transition-colors shrink-0"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-extrabold text-white shadow">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {drawerPortal}
    </>
  );
}
