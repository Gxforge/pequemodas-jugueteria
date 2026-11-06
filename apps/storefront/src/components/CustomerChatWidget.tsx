import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import {
  fetchCustomerChatThread,
  getStoredCustomerIdentity,
  isChatSupabaseConfigured,
  isSupabaseConfigured,
  openOrResumeCustomerChat,
  sendCustomerChatMessage,
  type CrmChatMessage
} from '@pequemodas/shared';
import { Button, Input, MessageStatusTicks } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';

export function CustomerChatWidget() {
  const configured = isSupabaseConfigured() || isChatSupabaseConfigured();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [identity, setIdentity] = useState(() => getStoredCustomerIdentity());
  const [nameInput, setNameInput] = useState(identity?.fullName ?? '');
  const [phoneInput, setPhoneInput] = useState(identity?.phone ?? '');
  const [draft, setDraft] = useState('');
  const [starting, setStarting] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<CrmChatMessage[]>([]);
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
    refetchInterval: isOpen ? 2500 : false
  });

  const mergedMessages = useMemo(() => {
    const serverMsgs = thread?.messages ?? [];
    const serverBodies = new Set(
      serverMsgs
        .filter((m) => m.sender_role === 'customer')
        .slice(-10)
        .map((m) => m.body)
    );
    const activePending = pendingQueue.filter(
      (p) => p.delivery_state === 'failed' || !serverBodies.has(p.body)
    );
    return [...serverMsgs, ...activePending];
  }, [thread?.messages, pendingQueue]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, mergedMessages.length]);

  if (!configured) return null;

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setStarting(true);
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
      setStarting(false);
    }
  };

  const dispatchOptimisticMessage = async (text: string, tempId?: string) => {
    const id = tempId ?? `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: CrmChatMessage = {
      id,
      sender_role: 'customer',
      sender_name: identity?.fullName ?? 'Tú',
      body: text,
      order_id: null,
      read_at: null,
      created_at: new Date().toISOString(),
      delivery_state: 'sending'
    };

    setPendingQueue((prev) =>
      tempId
        ? prev.map((m) => (m.id === tempId ? { ...m, delivery_state: 'sending' } : m))
        : [...prev, optimistic]
    );

    try {
      await sendCustomerChatMessage(text);
      setPendingQueue((prev) =>
        prev.map((m) => (m.id === id ? { ...m, delivery_state: 'sent' } : m))
      );
      await queryClient.invalidateQueries({ queryKey: ['customer-live-chat'] });
      setPendingQueue((prev) => prev.filter((m) => m.id !== id));
    } catch {
      setPendingQueue((prev) =>
        prev.map((m) => (m.id === id ? { ...m, delivery_state: 'failed' } : m))
      );
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    setDraft('');
    void dispatchOptimisticMessage(clean);
  };

  return (
    <>
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
          className="fixed z-50 bottom-0 sm:bottom-5 left-0 sm:left-5 w-full sm:w-[392px] h-[82vh] sm:h-[545px] bg-white sm:rounded-3xl shadow-2xl border border-brand-100 flex flex-col overflow-hidden"
        >
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
                conversación directa estilo WhatsApp con Katia.
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
              <Button type="submit" fullWidth isLoading={starting}>
                Iniciar conversación
              </Button>
            </form>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-[#efeae2]/60 p-3.5 space-y-2">
                {mergedMessages.map((msg) => {
                  const isCustomer = msg.sender_role === 'customer';
                  const isBot = msg.sender_role === 'bot';
                  const tickState =
                    msg.delivery_state ?? (msg.read_at ? 'read' : 'sent');

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[84%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-sm ${
                          isCustomer
                            ? 'bg-[#dcf8c6] border border-emerald-200 text-slate-900 rounded-br-sm'
                            : isBot
                              ? 'bg-sky-50 border border-sky-200 text-slate-900 rounded-bl-sm'
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
                        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                          <span>{formatDateTimeEs(msg.created_at)}</span>
                          {isCustomer && (
                            <MessageStatusTicks
                              state={tickState}
                              onRetry={() => void dispatchOptimisticMessage(msg.body, msg.id)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm focus:bg-white focus:border-brand-400 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Enviar mensaje"
                  className="h-10 w-10 rounded-full bg-brand-600 text-white flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
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
