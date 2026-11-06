import React from 'react';
import { RefreshCw } from 'lucide-react';
import type { DualProjectOverview } from '@pequemodas/shared';
import { Badge } from '@pequemodas/ui';
import { DatabaseSpaceCard } from './DatabaseSpaceCard';

interface InfrastructureDualPoolSectionProps {
  storage1UsedMb: number;
  storage2UsedMb: number;
  db1UsedMb: number;
  db2UsedMb: number;
  contactsCount: number;
  dualOverview?: DualProjectOverview;
}

export function InfrastructureDualPoolSection({
  storage1UsedMb,
  storage2UsedMb,
  db1UsedMb,
  db2UsedMb,
  contactsCount,
  dualOverview
}: InfrastructureDualPoolSectionProps) {
  return (
    <>
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-extrabold text-slate-900">
            Capacidad de Fotografías (2 GB Totales en Doble Servidor)
          </h2>
          <Badge tone="brand">
            <RefreshCw className="h-3 w-3 mr-1" />
            Reparto Round-Robin Activo (1 GB + 1 GB)
          </Badge>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <DatabaseSpaceCard
            title="Almacenamiento de Fotos 1"
            subtitle="Servidor Principal · Portadas, logo y galería de productos"
            usedMb={storage1UsedMb}
            quotaMb={1024}
            accentHex="#ec4899"
            extraPill="1 GB Principal"
          />
          <DatabaseSpaceCard
            title="Almacenamiento de Fotos 2 (+1 GB Extra)"
            subtitle="Segundo Servidor · Expansión automática para nuevas fotos"
            usedMb={storage2UsedMb}
            quotaMb={1024}
            accentHex="#8b5cf6"
            extraPill="+1 GB Extra"
          />
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-base font-extrabold text-slate-900">
            Bases de Datos de Clientes, Pedidos y Chats (Sistema Round-Robin)
          </h2>
          <Badge tone="sky">
            {contactsCount} conversaciones repartidas entre ambas bases
          </Badge>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <DatabaseSpaceCard
            title="Base de Datos 1 · Catálogo + Chat (Turno A)"
            subtitle={`${dualOverview?.p1.contactsCount ?? 0} contactos en esta base · Artículos y precios`}
            usedMb={db1UsedMb}
            quotaMb={500}
            accentHex="#0284c7"
            extraPill="Round-Robin A"
          />
          <DatabaseSpaceCard
            title="Base de Datos 2 · Clientes + Chat (Turno B)"
            subtitle={`${dualOverview?.p2?.contactsCount ?? 0} contactos en esta base · Mensajes y pedidos`}
            usedMb={db2UsedMb}
            quotaMb={500}
            accentHex="#10b981"
            extraPill="Round-Robin B"
          />
        </div>
      </div>
    </>
  );
}
