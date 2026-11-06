import React from 'react';
import { Search } from 'lucide-react';
import type { CrmCustomerContact } from '@pequemodas/shared';

export interface ChatContactsSidebarProps {
  contacts: CrmCustomerContact[];
  isLoading: boolean;
  selectedId: string | null;
  filterText: string;
  onFilterChange: (val: string) => void;
  onSelect: (contactId: string) => void;
}

export function ChatContactsSidebar({
  contacts,
  isLoading,
  selectedId,
  filterText,
  onFilterChange,
  onSelect
}: ChatContactsSidebarProps) {
  return (
    <div
      className={`lg:col-span-4 border-r border-slate-200 flex flex-col ${
        selectedId ? 'hidden lg:flex' : 'flex'
      }`}
    >
      <div className="p-3 border-b border-slate-100 bg-slate-50/70">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={filterText}
            onChange={(e) => onFilterChange(e.target.value)}
            placeholder="Buscar cliente o teléfono..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-brand-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isLoading ? (
          <p className="p-5 text-xs text-slate-500">Cargando conversaciones...</p>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-center space-y-1">
            <p className="font-heading font-bold text-sm text-slate-700">
              Aún no hay chats iniciados
            </p>
            <p className="text-xs text-slate-500">
              Cuando un cliente compre o escriba desde la tienda aparecerá aquí con su nombre y teléfono.
            </p>
          </div>
        ) : (
          contacts.map((c) => {
            const active =
              c.id === selectedId || c.raw_id === selectedId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={`w-full text-left px-4 py-3.5 flex items-start justify-between gap-2 transition-colors ${
                  active ? 'bg-brand-50/80' : 'hover:bg-slate-50'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-heading font-extrabold text-sm text-slate-900 truncate">
                      {c.full_name}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">
                      {c.shard === 'p1' ? 'Base 1' : 'Base 2'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold text-sky-700">{c.phone}</p>
                    {c.unread_for_admin > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-extrabold text-white">
                        {c.unread_for_admin}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {c.last_message_preview || 'Sin mensajes'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
