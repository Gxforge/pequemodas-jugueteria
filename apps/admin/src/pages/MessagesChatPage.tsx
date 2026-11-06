import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot } from 'lucide-react';
import {
  fetchCrmContacts,
  fetchCrmNotificationsAndBot,
  fetchCrmThreadDetail,
  saveCrmBotConfig,
  sendCrmAdminReply,
  toggleCrmContactBot,
  updateCrmDirectOrderStatus,
  type CrmChatMessage,
  type CrmDirectOrderStatus
} from '@pequemodas/shared';
import { Button } from '@pequemodas/ui';
import { AdminChatMessagesPane } from '../components/AdminChatMessagesPane';
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
  const [pendingByThread, setPendingByThread] = useState<
    Record<string, CrmChatMessage[]>
  >({});
  const [botModalOpen, setBotModalOpen] = useState(false);

  useEffect(() => {
    const paramId = searchParams.get('contacto');
    if (paramId) setSelectedId(paramId);
  }, [searchParams]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin-crm-contacts'],
    queryFn: fetchCrmContacts,
    refetchInterval: 4500
  });

  const { data: botBundle } = useQuery({
    queryKey: ['admin-crm-notifications'],
    queryFn: fetchCrmNotificationsAndBot
  });

  const { data: thread } = useQuery({
    queryKey: ['admin-crm-thread', selectedId],
    queryFn: () => fetchCrmThreadDetail(selectedId!),
    enabled: Boolean(selectedId),
    refetchInterval: selectedId ? 2500 : false
  });

  const mergedMessages = useMemo(() => {
    const serverMsgs = thread?.messages ?? [];
    const localPending = (selectedId && pendingByThread[selectedId]) || [];
    const serverBodies = new Set(
      serverMsgs
        .filter((m) => m.sender_role === 'admin')
        .slice(-10)
        .map((m) => m.body)
    );
    const stillPending = localPending.filter(
      (p) => p.delivery_state === 'failed' || !serverBodies.has(p.body)
    );
    return [...serverMsgs, ...stillPending];
  }, [thread?.messages, pendingByThread, selectedId]);

  const filteredContacts = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [contacts, filterText]);

  const sendFastReply = async (body: string, retryId?: string) => {
    if (!selectedId) return;
    const threadKey = selectedId;
    const tempId = retryId ?? `adm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const optimistic: CrmChatMessage = {
      id: tempId,
      sender_role: 'admin',
      sender_name: 'Tienda',
      body,
      order_id: null,
      read_at: null,
      created_at: new Date().toISOString(),
      delivery_state: 'sending'
    };

    setPendingByThread((prev) => {
      const list = prev[threadKey] ?? [];
      const next = retryId
        ? list.map((m) => (m.id === retryId ? { ...m, delivery_state: 'sending' as const } : m))
        : [...list, optimistic];
      return { ...prev, [threadKey]: next };
    });

    try {
      await sendCrmAdminReply(threadKey, body);
      setPendingByThread((prev) => ({
        ...prev,
        [threadKey]: (prev[threadKey] ?? []).map((m) =>
          m.id === tempId ? { ...m, delivery_state: 'sent' as const } : m
        )
      }));
      await queryClient.invalidateQueries({ queryKey: ['admin-crm-thread', threadKey] });
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-contacts'] });
      setPendingByThread((prev) => ({
        ...prev,
        [threadKey]: (prev[threadKey] ?? []).filter((m) => m.id !== tempId)
      }));
    } catch {
      setPendingByThread((prev) => ({
        ...prev,
        [threadKey]: (prev[threadKey] ?? []).map((m) =>
          m.id === tempId ? { ...m, delivery_state: 'failed' as const } : m
        )
      }));
    }
  };

  const toggleBotMut = useMutation({
    mutationFn: (paused: boolean) => toggleCrmContactBot(selectedId!, paused),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-thread', selectedId] });
      void queryClient.invalidateQueries({ queryKey: ['admin-crm-contacts'] });
    }
  });

  const orderStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: CrmDirectOrderStatus }) =>
      updateCrmDirectOrderStatus(selectedId!, id, status),
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

  const activeContact =
    thread?.contact ??
    contacts.find((c) => c.id === selectedId || c.raw_id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Chat de Clientes y Pedidos en Vivo
          </h1>
          <p className="text-sm text-slate-600">
            Envío instantáneo con confirmación de entrega (✓) y lectura (✓✓ azul) en sistema Round-Robin.
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
          className={`lg:col-span-8 flex flex-col bg-[#efeae2]/55 ${
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
                Podrás responderle al instante como en WhatsApp, ver sus pedidos y pausar o activar el Bot.
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
              <AdminChatMessagesPane
                contact={activeContact}
                messages={mergedMessages}
                onSendMessage={(body, retryId) => void sendFastReply(body, retryId)}
              />
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
