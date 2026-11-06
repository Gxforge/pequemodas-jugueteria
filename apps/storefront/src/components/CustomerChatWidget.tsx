import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Palette, Sparkles, X } from 'lucide-react';
import {
  DEFAULT_CHAT_THEME,
  fetchCustomerChatThread,
  fetchPublicBotAppearance,
  getStoredCustomerIdentity,
  isChatSupabaseConfigured,
  isSupabaseConfigured,
  openOrResumeCustomerChat,
  sendCustomerChatMessage,
  type CrmChatMessage,
  type CrmChatThemeConfig
} from '@pequemodas/shared';
import { CustomerChatPanelBody } from './CustomerChatPanelBody';
import {
  FloatingChatLauncher,
  loadSavedPosition,
  type LauncherPosition
} from './FloatingChatLauncher';

const LOCAL_THEME_KEY = 'pequemodas.customer.chat.theme.v1';

function readCustomTheme(): Partial<CrmChatThemeConfig> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_THEME_KEY);
    return raw ? (JSON.parse(raw) as Partial<CrmChatThemeConfig>) : null;
  } catch {
    return null;
  }
}

export function CustomerChatWidget() {
  const configured = isSupabaseConfigured() || isChatSupabaseConfigured();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [launcherPos, setLauncherPos] = useState<LauncherPosition>(() =>
    loadSavedPosition()
  );
  const [customTheme, setCustomTheme] = useState<Partial<CrmChatThemeConfig> | null>(
    () => readCustomTheme()
  );
  const [identity, setIdentity] = useState(() => getStoredCustomerIdentity());
  const [starting, setStarting] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<CrmChatMessage[]>([]);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  useEffect(() => {
    const onOpenChat = () => {
      setIdentity(getStoredCustomerIdentity());
      setIsOpen(true);
      void queryClient.invalidateQueries({ queryKey: ['customer-live-chat'] });
    };
    window.addEventListener('pequemodas:open-chat', onOpenChat);
    return () => window.removeEventListener('pequemodas:open-chat', onOpenChat);
  }, [queryClient]);

  const { data: botAppearance } = useQuery({
    queryKey: ['public-bot-appearance'],
    queryFn: fetchPublicBotAppearance,
    enabled: configured,
    staleTime: 60_000
  });

  const activeTheme: CrmChatThemeConfig = useMemo(
    () => ({
      ...DEFAULT_CHAT_THEME,
      ...(botAppearance?.theme_config ?? {}),
      ...(customTheme ?? {})
    }),
    [botAppearance?.theme_config, customTheme]
  );

  const applyCustomerTheme = (next: Partial<CrmChatThemeConfig> | null) => {
    setCustomTheme(next);
    try {
      if (next) window.localStorage.setItem(LOCAL_THEME_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(LOCAL_THEME_KEY);
    } catch {
      // Ignorar modo privado
    }
  };

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

  if (!configured) return null;

  const handleStartChat = async (fullName: string, phone: string) => {
    setErrMsg(null);
    setStarting(true);
    try {
      const saved = await openOrResumeCustomerChat({ fullName, phone });
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

  const sideClass =
    launcherPos.side === 'right' ? 'right-0 sm:right-4' : 'left-0 sm:left-4';

  return (
    <>
      {!isOpen && (
        <FloatingChatLauncher
          theme={activeTheme}
          unreadCount={thread?.contact?.unread_for_customer ?? 0}
          position={launcherPos}
          onPositionChange={setLauncherPos}
          onOpen={() => setIsOpen(true)}
        />
      )}

      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat en vivo PequeModas-Juguetería"
          className={`fixed z-50 bottom-0 sm:bottom-5 ${sideClass} w-full sm:w-[392px] h-[82vh] sm:h-[550px] bg-white sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden`}
        >
          <div
            className="text-white px-4 py-3 flex items-center justify-between"
            style={{
              background: `linear-gradient(90deg, ${activeTheme.headerFrom}, ${activeTheme.headerTo})`
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src="/brand/logo-foreground.webp"
                alt="PequeModas"
                className="h-9 w-9 rounded-full bg-white/95 p-0.5 object-contain shrink-0"
              />
              <div className="truncate">
                <p className="font-heading font-extrabold text-sm leading-tight truncate">
                  {botAppearance?.header_title || 'Atención PequeModas'}
                </p>
                <p className="text-[11px] text-white/90 flex items-center gap-1 truncate">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  {botAppearance?.header_subtitle || 'Katia + Asistente en línea'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPaletteOpen((v) => !v)}
                aria-label="Personalizar colores del chat"
                title="Cambiar colores de mi chat"
                className="rounded-full p-1.5 hover:bg-white/20"
              >
                <Palette className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar chat"
                className="rounded-full p-1.5 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <CustomerChatPanelBody
            identity={identity}
            activeTheme={activeTheme}
            hasCustomTheme={Boolean(customTheme)}
            paletteOpen={paletteOpen}
            botName={botAppearance?.bot_name}
            mergedMessages={mergedMessages}
            starting={starting}
            errMsg={errMsg}
            onApplyTheme={applyCustomerTheme}
            onStartChat={(n, p) => void handleStartChat(n, p)}
            onSendMessage={(txt, retryId) => void dispatchOptimisticMessage(txt, retryId)}
          />
        </div>
      )}
    </>
  );
}
