import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { CrmBotConfig, CrmBotKeywordRule } from '@pequemodas/shared';
import { Button, Input, Modal, Textarea } from '@pequemodas/ui';

export interface BotConfigModalProps {
  isOpen: boolean;
  botConfig: CrmBotConfig | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (patch: Partial<CrmBotConfig>) => void;
}

export function BotConfigModal({
  isOpen,
  botConfig,
  isSaving,
  onClose,
  onSave
}: BotConfigModalProps) {
  const [enabled, setEnabled] = useState(true);
  const [botName, setBotName] = useState('Asistente PequeModas');
  const [welcome, setWelcome] = useState('');
  const [orderMsg, setOrderMsg] = useState('');
  const [waitMsg, setWaitMsg] = useState('');
  const [rules, setRules] = useState<CrmBotKeywordRule[]>([]);

  useEffect(() => {
    if (!botConfig) return;
    setEnabled(botConfig.is_enabled);
    setBotName(botConfig.bot_name);
    setWelcome(botConfig.welcome_message);
    setOrderMsg(botConfig.order_received_message);
    setWaitMsg(botConfig.offline_or_wait_message);
    setRules(Array.isArray(botConfig.keyword_rules) ? botConfig.keyword_rules : []);
  }, [botConfig]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      {
        id: `rule_${Date.now()}`,
        keywords: ['horario'],
        reply: 'Te atendemos todos los días por este chat.',
        active: true
      }
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      is_enabled: enabled,
      bot_name: botName.trim() || 'Asistente PequeModas',
      welcome_message: welcome.trim(),
      order_received_message: orderMsg.trim(),
      offline_or_wait_message: waitMsg.trim(),
      keyword_rules: rules
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurar Bot Asistente de la Tienda"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <label className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50 border border-sky-100 p-3 text-sm font-bold text-slate-900">
          <span>Activar respuestas automáticas del Bot</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 rounded"
          />
        </label>

        <Input
          label="Nombre visible del asistente"
          value={botName}
          onChange={(e) => setBotName(e.target.value)}
        />

        <Textarea
          label="Saludo cuando un cliente inicia chat"
          rows={2}
          value={welcome}
          onChange={(e) => setWelcome(e.target.value)}
        />

        <Textarea
          label="Respuesta automática al recibir compra en la App"
          rows={2}
          value={orderMsg}
          onChange={(e) => setOrderMsg(e.target.value)}
        />

        <Textarea
          label="Mensaje de cortesía mientras Katia responde"
          rows={2}
          value={waitMsg}
          onChange={(e) => setWaitMsg(e.target.value)}
        />

        <div className="space-y-2.5 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <p className="text-xs font-extrabold text-slate-800">
              Respuestas por palabras clave ({rules.length})
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={addRule}
            >
              Nueva regla
            </Button>
          </div>

          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <Input
                  placeholder="Palabras separadas por coma (ej. envio, domicilio)"
                  value={rule.keywords.join(', ')}
                  onChange={(e) => {
                    const kw = e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setRules((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, keywords: kw } : r))
                    );
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setRules((prev) => prev.filter((_, i) => i !== idx))
                  }
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                rows={2}
                placeholder="Respuesta que enviará el Bot..."
                value={rule.reply}
                onChange={(e) =>
                  setRules((prev) =>
                    prev.map((r, i) =>
                      i === idx ? { ...r, reply: e.target.value } : r
                    )
                  )
                }
              />
            </div>
          ))}
        </div>

        <Button type="submit" fullWidth isLoading={isSaving}>
          Guardar configuración del Bot
        </Button>
      </form>
    </Modal>
  );
}
