import React from 'react';
import { RotateCcw } from 'lucide-react';
import {
  CHAT_THEME_PRESETS,
  DEFAULT_CHAT_THEME,
  type CrmChatThemeConfig
} from '@pequemodas/shared';
import { Button, Input, MessageStatusTicks } from '@pequemodas/ui';

interface BotAppearanceTabProps {
  headerTitle: string;
  headerSubtitle: string;
  botName: string;
  theme: CrmChatThemeConfig;
  onHeaderTitleChange: (val: string) => void;
  onHeaderSubtitleChange: (val: string) => void;
  onThemeChange: (next: CrmChatThemeConfig) => void;
}

const COLOR_FIELDS: Array<{ key: keyof CrmChatThemeConfig; label: string }> = [
  { key: 'headerFrom', label: 'Cabecera / Botón (Color 1)' },
  { key: 'headerTo', label: 'Cabecera / Botón (Degradado 2)' },
  { key: 'botBubbleBg', label: 'Fondo burbuja del Robot' },
  { key: 'botBubbleText', label: 'Letra burbuja del Robot' },
  { key: 'customerBubbleBg', label: 'Fondo burbuja del Cliente' },
  { key: 'customerBubbleText', label: 'Letra burbuja del Cliente' },
  { key: 'adminBubbleBg', label: 'Fondo burbuja de Tienda (Katia)' },
  { key: 'adminBubbleText', label: 'Letra burbuja de Tienda' },
  { key: 'chatBg', label: 'Fondo general de conversación' }
];

export function BotAppearanceTab({
  headerTitle,
  headerSubtitle,
  botName,
  theme,
  onHeaderTitleChange,
  onHeaderSubtitleChange,
  onThemeChange
}: BotAppearanceTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Input
          label="Título arriba del chat"
          value={headerTitle}
          onChange={(e) => onHeaderTitleChange(e.target.value)}
          placeholder="Atención PequeModas"
        />
        <Input
          label="Subtítulo debajo del título"
          value={headerSubtitle}
          onChange={(e) => onHeaderSubtitleChange(e.target.value)}
          placeholder="Katia + Asistente en línea"
        />
      </div>

      {/* Paletas listas de un toque */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-extrabold text-slate-800">
            Estilos listos (toca uno o ajusta cada color abajo):
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={() => onThemeChange({ ...DEFAULT_CHAT_THEME })}
          >
            Restaurar original
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHAT_THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onThemeChange({ ...preset.theme })}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white hover:border-brand-300 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm transition-all"
            >
              <span
                className="h-4 w-4 rounded-full border border-white shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${preset.theme.headerFrom}, ${preset.theme.headerTo})`
                }}
              />
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Selectores libres de cada color */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {COLOR_FIELDS.map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-white"
          >
            <span>{label}</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-slate-500 uppercase">
                {theme[key]}
              </span>
              <input
                type="color"
                value={theme[key]}
                onChange={(e) =>
                  onThemeChange({ ...theme, [key]: e.target.value })
                }
                className="h-7 w-9 rounded cursor-pointer border-0 bg-transparent p-0"
              />
            </span>
          </label>
        ))}
      </div>

      {/* Vista Previa en Vivo */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <div
          className="px-3.5 py-2.5 text-white flex items-center justify-between"
          style={{
            background: `linear-gradient(90deg, ${theme.headerFrom}, ${theme.headerTo})`
          }}
        >
          <div>
            <p className="font-heading font-extrabold text-xs">
              {headerTitle || 'Atención PequeModas'}
            </p>
            <p className="text-[10px] text-white/90">
              {headerSubtitle || 'Katia + Asistente en línea'}
            </p>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
            Vista previa
          </span>
        </div>
        <div className="p-3 space-y-2 text-xs" style={{ backgroundColor: theme.chatBg }}>
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-2xl rounded-bl-sm px-3 py-1.5 shadow-sm border border-black/5"
              style={{
                backgroundColor: theme.botBubbleBg,
                color: theme.botBubbleText
              }}
            >
              <p className="text-[10px] font-extrabold opacity-80">
                🤖 {botName || 'Asistente PequeModas'}
              </p>
              <p>¡Hola! Escríbenos tu consulta aquí.</p>
            </div>
          </div>
          <div className="flex justify-end">
            <div
              className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-1.5 shadow-sm border border-black/5"
              style={{
                backgroundColor: theme.customerBubbleBg,
                color: theme.customerBubbleText
              }}
            >
              <p>¡Hola! Quiero ver un vestido infantil</p>
              <div className="flex items-center justify-end gap-1 text-[10px] opacity-70 mt-0.5">
                <span>19:35</span>
                <MessageStatusTicks state="read" />
              </div>
            </div>
          </div>
          <div className="flex justify-start">
            <div
              className="max-w-[80%] rounded-2xl rounded-bl-sm px-3 py-1.5 shadow-sm border border-black/10"
              style={{
                backgroundColor: theme.adminBubbleBg,
                color: theme.adminBubbleText
              }}
            >
              <p className="text-[10px] font-extrabold text-brand-600">Katia</p>
              <p>¡Claro que sí! Ya te atiendo con gusto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
