import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, Send } from 'lucide-react';
import {
  fetchCrmContacts,
  fetchCrmNotificationsAndBot,
  fetchCrmThreadDetail,
  saveCrmBotConfig,
  sendCrmAdminReply,
  toggleCrmContactBot,
  updateCrmDirectOrderStatus,
  type CrmDirectOrderStatus
} from '@pequemodas/shared';
import { Button, Card } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';
import { BotConfigModal } from '../components/BotConfigModal';
import { ChatContactsSidebar } from '../components/ChatContactsSidebar';
import { ChatThreadHeader } from '../components/ChatThreadHeader';

export function MessagesChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get('contacto')
  );
  const [filterText, setFilterText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [botModalOpen, setBotModalOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const paramId = searchParams.get('contacto');
    if (paramId) setSelectedId(paramId);
  }, [searchParams]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-crm-contacts'],
    queryFn: fetchCrmContacts,
    refetchInterval: 8000
  });

  const { data: botBundle } = useQuery({
    queryKey: ['admin-crm-notifications'],
    queryFn: fetchCrmNotificationsAndBot
  });

  const { data: thread } = useQuery({
    queryKey: ['admin-crm-thread', selectedId],
    queryFn: () => fetchCrmThreadDetail(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 5000 : false
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages.length, selectedId]);

  const filteredContacts = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [contacts, filterText]);

  const sendReplyMut = useMutation({
    mutationFn: (body: string) => sendCrmAdminReply(selectedId!, body),
    onSuccess: () => {
      setReplyText('');
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-thread', selectedId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-contacts'] });
    }
  });

  const toggleBotMut = useMutation({
    mutationFn: (paused: boolean) => toggleCrmContactBot(selectedId!, paused),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-thread', selectedId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-contacts'] });
    }
  });

  const orderStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CrmDirectOrderStatus }) =>
      updateCrmDirectOrderStatus(id, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-thread', selectedId] });
    }
  });

  const saveBotMut = useMutation({
    mutationFn: saveCrmBotConfig,
    onSuccess: () => {
      setBotModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-notifications'] });
    }
  });

  const activeContact = thread?.contact ?? contacts.find((c) => c.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Chat de Clientes y Pedidos en Vivo
          </h1>
          <p className="text-sm text-slate-600">
            Toca cualquier contacto para abrir su conversación estilo WhatsApp y gestionar sus compras.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Bot className="h-4 w-4 text-sky-600" />}
          onClick={() => setBotModalOpen(true)}
        >
          Configurar Bot Asistente
        </Button>
      </div>

      <div className="rounded-3xl bg-white border border-slate-200 shadow-card overflow-hidden grid lg:grid-cols-12 h-[74vh] min-h-[520px]">
        <ChatContactsSidebar
          contacts={filteredContacts}
          isLoading={isLoading}
          selectedId={selectedId}
          filterText={filterText}
          onFilterChange={setFilterText}
          onSelect={(id) => {
            setSelectedId(id);
            setSearchParams({ contacto: id });
          }}
        />

        <div
          className={`lg:col-span-8 flex flex-col bg-slate-50/70 ${
            selectedId ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {!selectedId || !activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <Bot className="h-10 w-10 text-brand-300 mb-2" />
              <p className="font-heading font-bold text-base text-slate-700">
                Selecciona un contacto a la izquierda
              </p>
              <p className="text-xs max-w-sm mt-1">
                Podrás responderle al instante, ver sus pedidos directos en CUP y pausar o activar el Bot cuando desees.
              </p>
            </div>
          ) : (
            <>
              <ChatThreadHeader
                contact={activeContact}
                latestOrder={thread?.orders?.[0]}
                onBackMobile={() => {
                  setSelectedId(null);
                  setSearchParams({});
                }}
                onToggleBot={(paused) => toggleBotMut.mutate(paused)}
                onChangeOrderStatus={(id, status) =>
                  orderStatusMut.mutate({ id, status })
                }
              />

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {(thread?.messages ?? []).map((m) => {
                  const fromStore = m.sender_role !== 'customer';
                  return (
                    <div
                      key={m.id}
                      className={`flex ${fromStore ? 'justify-end' : 'justify-start'}`}
                    >
                      <Card
                        padding="sm"
                        className={`max-w-[82%] shadow-sm ${
                          m.sender_role === 'admin'
                            ? 'bg-brand-600 text-white border-brand-600'
                            : m.sender_role === 'bot'
                              ? 'bg-sky-50 border-sky-200 text-slate-800'
                              : 'bg-white border-slate-200 text-slate-900'
                        }`}
                      >
                        <p className="text-[10px] font-bold opacity-80 mb-0.5">
                          {m.sender_name || m.sender_role}
                        </p>
                        <p className="text-xs sm:text-sm whitespace-pre-wrap">{m.body}</p>
                        <p className="text-[10px] opacity-70 text-right mt-1">
                          {formatDateTimeEs(m.created_at)}
                        </p>
                      </Card>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (replyText.trim()) sendReplyMut.mutate(replyText.trim());
                }}
                className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Responder a ${activeContact.full_name}...`}
                  className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-brand-400 focus:outline-none"
                />
                <Button
                  type="submit"
                  size="sm"
                  isLoading={sendReplyMut.isPending}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Enviar
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      <BotConfigModal
        isOpen={botModalOpen}
        botConfig={botBundle?.botConfig ?? null}
        isSaving={saveBotMut.isPending}
        onClose={() => setBotModalOpen(false)}
        onSave={(patch) => saveBotMut.mutate(patch)}
      />
    </div>
  );
}
