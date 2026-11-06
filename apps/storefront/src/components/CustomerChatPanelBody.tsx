import React, { useEffect, useRef, useState } from 'react';
import { Bot, RotateCcw, Send } from 'lucide-react';
import {
  CHAT_THEME_PRESETS,
  type CrmChatMessage,
  type CrmChatThemeConfig,
  type StoredCustomerIdentity
} from '@pequemodas/shared';
import { Button, Input, MessageStatusTicks } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';

interface CustomerChatPanelBodyProps {
  identity: StoredCustomerIdentity | null;
  activeTheme: CrmChatThemeConfig;
  hasCustomTheme: boolean;
  paletteOpen: boolean;
  botName?: string;
  mergedMessages: CrmChatMessage[];
  starting: boolean;
  errMsg: string | null;
  onApplyTheme: (next: Partial<CrmChatThemeConfig> | null) => void;
  onStartChat: (fullName: string, phone: string) => void;
  onSendMessage: (text: string, retryId?: string) => void;
}

export function CustomerChatPanelBody({
  identity,
  activeTheme,
  hasCustomTheme,
  paletteOpen,
  botName,
  mergedMessages,
  starting,
  errMsg,
  onApplyTheme,
  onStartChat,
  onSendMessage
}: CustomerChatPanelBodyProps) {
  const [nameInput, setNameInput] = useState(identity?.fullName ?? '');
  const [phoneInput, setPhoneInput] = useState(identity?.phone ?? '');
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mergedMessages.length]);

  return (
    <>
      {paletteOpen && (
        <div className="bg-slate-50 border-b border-slate-200 px-3.5 py-2.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-800">
              Personaliza los colores de tu chat:
            </span>
            {hasCustomTheme && (
              <button
                type="button"
                onClick={() => onApplyTheme(null)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Original
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHAT_THEME_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onApplyTheme(p.theme)}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:border-brand-400"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${p.theme.headerFrom}, ${p.theme.headerTo})`
                  }}
                />
                {p.name.split(' ')[0]}
              </button>
            ))}
            <label className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 cursor-pointer">
              <span>Color libre</span>
              <input
                type="color"
                value={activeTheme.headerFrom}
                onChange={(e) =>
                  onApplyTheme({
                    ...activeTheme,
                    headerFrom: e.target.value,
                    headerTo: e.target.value
                  })
                }
                className="h-4 w-5 border-0 bg-transparent p-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {!identity ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onStartChat(nameInput, phoneInput);
          }}
          className="p-5 space-y-4 flex-1 overflow-y-auto"
        >
          <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-3.5 text-xs text-slate-700 leading-relaxed">
            Déjanos tu <strong>nombre</strong> y <strong>teléfono</strong> para abrir tu
            conversación directa con Katia.
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
          <div
            className="flex-1 overflow-y-auto p-3.5 space-y-2"
            style={{ backgroundColor: activeTheme.chatBg }}
          >
            {mergedMessages.map((msg) => {
              const isCustomer = msg.sender_role === 'customer';
              const isBot = msg.sender_role === 'bot';
              const tickState = msg.delivery_state ?? (msg.read_at ? 'read' : 'sent');
              const bubbleStyle: React.CSSProperties = isCustomer
                ? {
                    backgroundColor: activeTheme.customerBubbleBg,
                    color: activeTheme.customerBubbleText
                  }
                : isBot
                  ? {
                      backgroundColor: activeTheme.botBubbleBg,
                      color: activeTheme.botBubbleText
                    }
                  : {
                      backgroundColor: activeTheme.adminBubbleBg,
                      color: activeTheme.adminBubbleText
                    };

              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    style={bubbleStyle}
                    className={`max-w-[84%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm shadow-sm border border-black/5 ${
                      isCustomer ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`}
                  >
                    {!isCustomer && (
                      <p className="text-[10px] font-extrabold opacity-80 mb-0.5 flex items-center gap-1">
                        {isBot && <Bot className="h-3 w-3" />}
                        {msg.sender_name || (isBot ? botName || 'Asistente' : 'Katia')}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                    <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] opacity-70">
                      <span>{formatDateTimeEs(msg.created_at)}</span>
                      {isCustomer && (
                        <MessageStatusTicks
                          state={tickState}
                          onRetry={() => onSendMessage(msg.body, msg.id)}
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
            onSubmit={(e) => {
              e.preventDefault();
              const clean = draft.trim();
              if (!clean) return;
              setDraft('');
              onSendMessage(clean);
            }}
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
              style={{ backgroundColor: activeTheme.headerFrom }}
              className="h-10 w-10 rounded-full text-white flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </>
      )}
    </>
  );
}
