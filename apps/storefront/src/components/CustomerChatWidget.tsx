import React, { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import {
  fetchCustomerChatThread,
  getStoredCustomerIdentity,
  isChatSupabaseConfigured,
  openOrResumeCustomerChat,
  sendCustomerChatMessage
} from '@pequemodas/shared';
import { Button, Input } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';

export function CustomerChatWidget() {
  const configured = isChatSupabaseConfigured();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [identity, setIdentity] = useState(() => getStoredCustomerIdentity());
  const [nameInput, setNameInput] = useState(identity?.fullName ?? '');
  const [phoneInput, setPhoneInput] = useState(identity?.phone ?? '');
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onOpenChat = () => {
      setIdentity(getStoredCustomerIdentity());
      setIsOpen(true);
      void queryClient.invalidateQueries({ queryKey: ['customer-live-chat'] });
    };
    window.addEventListener('pequemodas:open-chat', onOpenChat);
    return () => window.removeEventListener('pequemodas:open-chat', onOpenChat);
  }, [queryClient]);

  const { data: thread } = useQuery({
    queryKey: ['customer-live-chat', identity?.customerToken],
    queryFn: fetchCustomerChatThread,
    enabled: configured && isOpen && Boolean(identity?.customerToken),
    refetchInterval: isOpen ? 5000 : false
  });

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, thread?.messages.length]);

  if (!configured) return null;

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setBusy(true);
    try {
      const saved = await openOrResumeCustomerChat({
        fullName: nameInput,
        phone: phoneInput
      });
      setIdentity(saved);
      await queryClient.invalidateQueries({ queryKey: ['customer-live-chat'] });
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'No se pudo abrir el chat.');
    } finally {
      setBusy(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setErrMsg(null);
    setBusy(true);
    try {
      const msg = draft.trim();
      setDraft('');
      await sendCustomerChatMessage(msg);
      await queryClient.invalidateQueries({ queryKey: ['customer-live-chat'] });
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Error al enviar mensaje.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Botón flotante para conversar directo con la tienda */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir chat directo con la tienda"
          className="fixed z-30 bottom-20 md:bottom-6 left-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-sky-600 text-white px-4 py-2.5 shadow-elevated hover:opacity-95 transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-xs sm:text-sm font-extrabold">Chat con la tienda</span>
        </button>
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat en vivo PequeModas-Juguetería"
          className="fixed z-50 bottom-0 sm:bottom-5 left-0 sm:left-5 w-full sm:w-[390px] h-[82vh] sm:h-[540px] bg-white sm:rounded-3xl shadow-2xl border border-brand-100 flex flex-col overflow-hidden"
        >
          {/* Cabecera estilo mensajería moderna */}
          <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand/logo-foreground.webp"
                alt="PequeModas"
                className="h-9 w-9 rounded-full bg-white/95 p-0.5 object-contain"
              />
              <div>
                <p className="font-heading font-extrabold text-sm leading-tight">
                  Atención PequeModas
                </p>
                <p className="text-[11px] text-white/90 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Katia + Asistente en línea
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar chat"
              className="rounded-full p-1.5 hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!identity ? (
            <form onSubmit={handleStartChat} className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-3.5 text-xs text-slate-700 leading-relaxed">
                Déjanos tu <strong>nombre</strong> y <strong>teléfono</strong> para abrir tu
                conversación directa con Katia y guardar tus pedidos sin perder el hilo.
              </div>
              {errMsg && <p className="text-xs font-bold text-rose-600">{errMsg}</p>}
              <Input
                label="Tu nombre"
                requiredMark
                placeholder="Ej. Laura Gómez"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
              />
              <Input
                label="Tu teléfono de contacto"
                requiredMark
                placeholder="Ej. +53 5xxxxxxx"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
              <Button type="submit" fullWidth isLoading={busy}>
                Iniciar conversación
              </Button>
            </form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-slate-50 p-3.5 space-y-2.5">
                {(thread?.messages ?? []).map((msg) => {
                  const isCustomer = msg.sender_role === 'customer';
                  const isBot = msg.sender_role === 'bot';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm ${
                          isCustomer
                            ? 'bg-brand-600 text-white rounded-br-sm'
                            : isBot
                              ? 'bg-sky-50 border border-sky-200 text-slate-800 rounded-bl-sm'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                        }`}
                      >
                        {!isCustomer && (
                          <p className="text-[10px] font-extrabold text-sky-700 mb-0.5 flex items-center gap-1">
                            {isBot && <Bot className="h-3 w-3" />}
                            {msg.sender_name || (isBot ? 'Asistente' : 'Katia')}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        <p
                          className={`text-[10px] mt-1 text-right ${
                            isCustomer ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {formatDateTimeEs(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              {errMsg && (
                <p className="px-3 py-1 text-xs font-bold text-rose-600 bg-rose-50">
                  {errMsg}
                </p>
              )}

              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe tu mensaje aquí..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-brand-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  aria-label="Enviar mensaje"
                  className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
