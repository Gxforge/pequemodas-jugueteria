import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { CrmChatMessage, CrmCustomerContact } from '@pequemodas/shared';
import { Button, MessageStatusTicks } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';

interface AdminChatMessagesPaneProps {
  contact: CrmCustomerContact;
  messages: CrmChatMessage[];
  onSendMessage: (body: string, retryId?: string) => void;
}

export function AdminChatMessagesPane({
  contact,
  messages,
  onSendMessage
}: AdminChatMessagesPaneProps) {
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, contact.id]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((m) => {
          const fromStore = m.sender_role !== 'customer';
          const tickState = m.delivery_state ?? (m.read_at ? 'read' : 'sent');

          return (
            <div
              key={m.id}
              className={`flex ${fromStore ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2 shadow-sm border ${
                  m.sender_role === 'admin'
                    ? 'bg-[#dcf8c6] border-emerald-200 text-slate-900 rounded-br-sm'
                    : m.sender_role === 'bot'
                      ? 'bg-sky-50 border-sky-200 text-slate-900 rounded-br-sm'
                      : 'bg-white border-slate-200 text-slate-900 rounded-bl-sm'
                }`}
              >
                <p className="text-[10px] font-extrabold text-sky-800 mb-0.5">
                  {m.sender_role === 'admin'
                    ? `Tú (${m.sender_name || 'Tienda'})`
                    : m.sender_name || m.sender_role}
                </p>
                <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                  {m.body}
                </p>
                <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-slate-500">
                  <span>{formatDateTimeEs(m.created_at)}</span>
                  {fromStore && (
                    <MessageStatusTicks
                      state={tickState}
                      onRetry={() => onSendMessage(m.body, m.id)}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const clean = replyText.trim();
          if (!clean) return;
          setReplyText('');
          onSendMessage(clean);
        }}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder={`Escribe un mensaje a ${contact.full_name}...`}
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:bg-white focus:border-brand-400 focus:outline-none"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!replyText.trim()}
          leftIcon={<Send className="h-4 w-4" />}
        >
          Enviar
        </Button>
      </form>
    </>
  );
}
