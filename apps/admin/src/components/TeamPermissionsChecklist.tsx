import React from 'react';
import {
  ROLE_PRESETS,
  type TeamPermissions,
  type TeamRole
} from '@pequemodas/shared';
import { Input, Select } from '@pequemodas/ui';

export const TASK_PERMISSION_ITEMS: Array<{
  key: keyof TeamPermissions;
  title: string;
  helper: string;
}> = [
  {
    key: 'chat',
    title: 'Atender Chat de Clientes y Pedidos',
    helper: 'Puede responder mensajes en vivo, confirmar compras y usar WhatsApp.'
  },
  {
    key: 'products',
    title: 'Subir y editar Productos, Fotos y Precios',
    helper: 'Puede agregar ropa o juguetes, subir imágenes y cambiar precios o tallas.'
  },
  {
    key: 'categories',
    title: 'Organizar Categorías y Portadas',
    helper: 'Puede crear secciones (ej. Ropa Niña, Juguetes) y cambiar su portada.'
  },
  {
    key: 'inventory',
    title: 'Actualizar Cantidades Disponibles (Stock)',
    helper: 'Puede descontar unidades vendidas o marcar artículos agotados.'
  },
  {
    key: 'team',
    title: 'Invitar Personas y Asignarles Tareas',
    helper: 'Puede invitar ayudantes y decidir qué pantallas ven.'
  },
  {
    key: 'settings',
    title: 'Cambiar Datos Generales de la Tienda',
    helper: 'Puede editar teléfonos, horarios, entregas y logotipo.'
  }
];

export interface TeamPermissionsChecklistProps {
  role: TeamRole;
  jobTitle: string;
  permissions: TeamPermissions;
  onRoleChange: (nextRole: TeamRole, presetPerms: TeamPermissions, presetTitle: string) => void;
  onJobTitleChange: (title: string) => void;
  onTogglePermission: (key: keyof TeamPermissions, enabled: boolean) => void;
}

export function TeamPermissionsChecklist({
  role,
  jobTitle,
  permissions,
  onRoleChange,
  onJobTitleChange,
  onTogglePermission
}: TeamPermissionsChecklistProps) {
  const roleOptions = (Object.keys(ROLE_PRESETS) as TeamRole[]).map((r) => ({
    value: r,
    label: ROLE_PRESETS[r].label
  }));

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-3">
        <Select
          label="Puesto o función principal"
          value={role}
          options={roleOptions}
          onChange={(e) => {
            const next = e.target.value as TeamRole;
            const preset = ROLE_PRESETS[next];
            onRoleChange(next, { ...preset.defaultPermissions }, preset.label);
          }}
        />
        <Input
          label="Nombre del puesto que verá (editable)"
          placeholder="Ej. Ventas por la tarde, Ayudante de fotos"
          value={jobTitle}
          onChange={(e) => onJobTitleChange(e.target.value)}
        />
      </div>

      <p className="text-xs text-slate-600 bg-sky-50/70 border border-sky-100 rounded-xl px-3 py-2">
        {ROLE_PRESETS[role].description}
      </p>

      <div className="space-y-2">
        <p className="text-xs font-extrabold text-slate-900">
          ¿Qué tareas y pantallas le permites usar dentro de la aplicación?
        </p>
        <div className="grid sm:grid-cols-2 gap-2.5">
          {TASK_PERMISSION_ITEMS.map((item) => {
            const checked = role === 'owner' ? true : Boolean(permissions[item.key]);
            return (
              <label
                key={item.key}
                className={`flex items-start gap-2.5 rounded-2xl border p-3 cursor-pointer transition-colors ${
                  checked
                    ? 'border-brand-300 bg-brand-50/50'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={role === 'owner'}
                  onChange={(e) => onTogglePermission(item.key, e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-snug">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    {item.helper}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
