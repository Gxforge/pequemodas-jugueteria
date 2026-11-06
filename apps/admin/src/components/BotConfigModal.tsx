import React, { useEffect, useState } from 'react';
import { Bot, Palette, Plus, Trash2 } from 'lucide-react';
import {
  DEFAULT_CHAT_THEME,
  type CrmBotConfig,
  type CrmBotKeywordRule,
  type CrmChatThemeConfig
} from '@pequemodas/shared';
import { Button, Input, Modal, Textarea } from '@pequemodas/ui';
import { BotAppearanceTab } from './BotAppearanceTab';

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
  const [activeTab, setActiveTab] = useState<'texts' | 'colors'>('colors');
  const [enabled, setEnabled] = useState(true);
  const [botName, setBotName] = useState('Asistente PequeModas');
  const [headerTitle, setHeaderTitle] = useState('Atención PequeModas');
  const [headerSubtitle, setHeaderSubtitle] = useState('Katia + Asistente en línea');
  const [theme, setTheme] = useState<CrmChatThemeConfig>({ ...DEFAULT_CHAT_THEME });
  const [welcome, setWelcome] = useState('');
  const [orderMsg, setOrderMsg] = useState('');
  const [waitMsg, setWaitMsg] = useState('');
  const [rules, setRules] = useState<CrmBotKeywordRule[]>([]);

  useEffect(() => {
    if (!botConfig) return;
    setEnabled(botConfig.is_enabled);
    setBotName(botConfig.bot_name);
    setHeaderTitle(botConfig.header_title || 'Atención PequeModas');
    setHeaderSubtitle(botConfig.header_subtitle || 'Katia + Asistente en línea');
    setTheme({ ...DEFAULT_CHAT_THEME, ...(botConfig.theme_config ?? {}) });
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
      header_title: headerTitle.trim() || 'Atención PequeModas',
      header_subtitle: headerSubtitle.trim() || 'Katia + Asistente en línea',
      theme_config: theme,
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
      title="Personalizar Robot y Colores del Chat"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[78vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('colors')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition-all ${
              activeTab === 'colors'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="h-4 w-4" />
            <span>Colores y Diseño</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('texts')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition-all ${
              activeTab === 'texts'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>Respuestas del Robot</span>
          </button>
        </div>

        {activeTab === 'colors' ? (
          <BotAppearanceTab
            headerTitle={headerTitle}
            headerSubtitle={headerSubtitle}
            botName={botName}
            theme={theme}
            onHeaderTitleChange={setHeaderTitle}
            onHeaderSubtitleChange={setHeaderSubtitle}
            onThemeChange={setTheme}
          />
        ) : (
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-sky-50 border border-sky-100 p-3 text-sm font-bold text-slate-900">
              <span>Activar respuestas automáticas del Robot</span>
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="h-4 w-4 rounded"
              />
            </label>

            <Input
              label="Nombre visible del robot"
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
                      placeholder="Palabras por coma (ej. envio, domicilio)"
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
                    placeholder="Respuesta que enviará el Robot..."
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
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Guardar personalización
          </Button>
        </div>
      </form>
    </Modal>
  );
}
