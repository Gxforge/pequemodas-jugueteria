import React, { useEffect, useRef, useState } from 'react';
import type { CrmChatThemeConfig } from '@pequemodas/shared';

const POS_STORAGE_KEY = 'pequemodas.chat.launcher.pos.v1';

export interface LauncherPosition {
  side: 'left' | 'right';
  bottomPx: number;
}

function loadSavedPosition(): LauncherPosition {
  if (typeof window === 'undefined') return { side: 'left', bottomPx: 84 };
  try {
    const raw = window.localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return { side: 'left', bottomPx: 84 };
    const parsed = JSON.parse(raw) as Partial<LauncherPosition>;
    return {
      side: parsed.side === 'right' ? 'right' : 'left',
      bottomPx:
        typeof parsed.bottomPx === 'number'
          ? Math.max(72, Math.min(420, parsed.bottomPx))
          : 84
    };
  } catch {
    return { side: 'left', bottomPx: 84 };
  }
}

interface FloatingChatLauncherProps {
  theme: CrmChatThemeConfig;
  unreadCount?: number;
  position: LauncherPosition;
  onPositionChange: (pos: LauncherPosition) => void;
  onOpen: () => void;
}

export function FloatingChatLauncher({
  theme,
  unreadCount = 0,
  position,
  onPositionChange,
  onOpen
}: FloatingChatLauncherProps) {
  const [expanded, setExpanded] = useState(true);
  const [dragCoords, setDragCoords] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setExpanded(false);
    }, 4200);
    return () => window.clearTimeout(timer);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStartRef.current;
    if (!st || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) > 7) {
      st.moved = true;
    }
    if (st.moved) {
      setDragCoords({
        x: Math.max(8, Math.min(window.innerWidth - 56, e.clientX - 24)),
        y: Math.max(64, Math.min(window.innerHeight - 68, e.clientY - 24))
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const st = dragStartRef.current;
    dragStartRef.current = null;
    if (!st) return;

    if (st.moved) {
      const nextSide: 'left' | 'right' =
        e.clientX > window.innerWidth / 2 ? 'right' : 'left';
      const rawBottom = window.innerHeight - e.clientY - 20;
      const clampedBottom = Math.max(
        76,
        Math.min(window.innerHeight - 110, Math.round(rawBottom))
      );
      const nextPos: LauncherPosition = { side: nextSide, bottomPx: clampedBottom };
      setDragCoords(null);
      onPositionChange(nextPos);
      try {
        window.localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(nextPos));
      } catch {
        // Ignorar modo privado
      }
      return;
    }

    setDragCoords(null);
    onOpen();
  };

  const fixedStyle: React.CSSProperties = dragCoords
    ? {
        left: `${dragCoords.x}px`,
        top: `${dragCoords.y}px`,
        background: `linear-gradient(135deg, ${theme.headerFrom}, ${theme.headerTo})`,
        touchAction: 'none'
      }
    : {
        [position.side]: '14px',
        bottom: `${position.bottomPx}px`,
        background: `linear-gradient(135deg, ${theme.headerFrom}, ${theme.headerTo})`,
        touchAction: 'none'
      };

  return (
    <button
      type="button"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label="Abrir chat directo con la tienda"
      title="Toca para abrir el chat o arrástralo de lado si te estorba"
      style={fixedStyle}
      className={`fixed z-40 inline-flex items-center justify-center text-white shadow-elevated select-none cursor-grab active:cursor-grabbing ${
        dragCoords ? '' : 'transition-all duration-500 ease-out'
      } ${
        expanded
          ? 'rounded-full px-4 py-2.5 gap-2'
          : 'h-12 w-12 rounded-full p-0 hover:scale-105'
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="shrink-0"
        aria-hidden="true"
      >
        <path
          d="M12 3C6.75 3 2.5 6.69 2.5 11.25c0 2.08.89 3.98 2.36 5.43L3.8 20.4a.6.6 0 0 0 .77.73l3.98-1.36c1.08.31 2.24.48 3.45.48 5.25 0 9.5-3.69 9.5-8.25S17.25 3 12 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="8.5" cy="11.25" r="1.15" fill="currentColor" />
        <circle cx="12" cy="11.25" r="1.15" fill="currentColor" />
        <circle cx="15.5" cy="11.25" r="1.15" fill="currentColor" />
      </svg>

      {expanded && (
        <span className="text-xs sm:text-sm font-extrabold whitespace-nowrap">
          Chat con la tienda
        </span>
      )}

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white ring-2 ring-white">
          {unreadCount}
        </span>
      )}
    </button>
  );
}

export { loadSavedPosition };
