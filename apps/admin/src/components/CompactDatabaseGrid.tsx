import React from 'react';
import { Link } from 'react-router-dom';
import { Database, HelpCircle, Image as ImageIcon } from 'lucide-react';

export interface CompactDatabaseGridProps {
  db1UsedMb: number;
  db2UsedMb: number;
  storage1UsedMb: number;
  storage2UsedMb: number;
}

interface UnitSummary {
  id: 'bd-1' | 'bd-2' | 'bd-3' | 'bd-4';
  code: string;
  label: string;
  usedMb: number;
  quotaMb: number;
  colorHex: string;
  kind: 'data' | 'photos';
}

export function CompactDatabaseGrid({
  db1UsedMb,
  db2UsedMb,
  storage1UsedMb,
  storage2UsedMb
}: CompactDatabaseGridProps) {
  const units: UnitSummary[] = [
    {
      id: 'bd-1',
      code: 'BD-1',
      label: 'Catálogo y Tienda',
      usedMb: db1UsedMb,
      quotaMb: 500,
      colorHex: '#0284c7',
      kind: 'data'
    },
    {
      id: 'bd-2',
      code: 'BD-2',
      label: 'Chats y Pedidos',
      usedMb: db2UsedMb,
      quotaMb: 500,
      colorHex: '#10b981',
      kind: 'data'
    },
    {
      id: 'bd-3',
      code: 'BD-3',
      label: 'Fotografías 1',
      usedMb: storage1UsedMb,
      quotaMb: 1024,
      colorHex: '#ec4899',
      kind: 'photos'
    },
    {
      id: 'bd-4',
      code: 'BD-4',
      label: 'Fotografías 2',
      usedMb: storage2UsedMb,
      quotaMb: 1024,
      colorHex: '#8b5cf6',
      kind: 'photos'
    }
  ];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading text-base font-extrabold text-slate-900">
          Base de Datos
        </h2>
        <Link
          to="/bases-de-datos"
          className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          <span>Ver detalles</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3.5">
        {units.map((u) => {
          const pct = Math.min(100, Math.max(2, (u.usedMb / u.quotaMb) * 100));
          return (
            <Link
              key={u.id}
              to={`/bases-de-datos?unidad=${u.id}`}
              className="group rounded-2xl bg-white border border-slate-200/90 hover:border-brand-300 p-4 shadow-card transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${u.colorHex}18`, color: u.colorHex }}
                  >
                    {u.kind === 'photos' ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <Database className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-heading text-base font-extrabold text-slate-900 leading-tight">
                      {u.code}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-500">
                      {u.label}
                    </p>
                  </div>
                </div>

                <span
                  title="Ver detalles"
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 group-hover:bg-brand-50 px-2 py-0.5 text-[10.5px] font-bold text-slate-600 group-hover:text-brand-700"
                >
                  <HelpCircle className="h-3 w-3" />
                  <span>Detalles</span>
                </span>
              </div>

              <div className="space-y-1.5">
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: u.colorHex }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span>{u.usedMb.toFixed(1)} MB</span>
                  <span className="text-slate-400">de {u.quotaMb} MB</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
