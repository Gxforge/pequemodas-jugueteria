import React, { useState } from 'react';
import { HelpCircle, SlidersHorizontal, X } from 'lucide-react';
import type { CategoryRow, ProductSortOption } from '@pequemodas/shared';
import { Select } from '@pequemodas/ui';
import { SmartSearchBox } from './SmartSearchBox';

interface CatalogCompactToolbarProps {
  search: string;
  categoryId: string;
  subcategoryId: string;
  onlyAvailable: boolean;
  sort: ProductSortOption;
  rootCategories: CategoryRow[];
  subcategories: CategoryRow[];
  onSearchChange: (val: string) => void;
  onCategoryChange: (val: string) => void;
  onSubcategoryChange: (val: string) => void;
  onOnlyAvailableChange: (val: boolean) => void;
  onSortChange: (val: ProductSortOption) => void;
}

export function CatalogCompactToolbar({
  search,
  categoryId,
  subcategoryId,
  onlyAvailable,
  sort,
  rootCategories,
  subcategories,
  onSearchChange,
  onCategoryChange,
  onSubcategoryChange,
  onOnlyAvailableChange,
  onSortChange
}: CatalogCompactToolbarProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeExtraFilters =
    (sort !== 'newest' ? 1 : 0) + (onlyAvailable ? 1 : 0) + (subcategoryId ? 1 : 0);

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
            Catálogo
          </h1>
          <button
            type="button"
            onClick={() => setHelpOpen((v) => !v)}
            aria-label="Ayuda rápida sobre cómo usar el catálogo"
            title="¿Cómo buscar y pedir?"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-extrabold border transition-all ${
              helpOpen
                ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                : 'bg-white text-brand-700 border-brand-200 hover:bg-brand-50'
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            <span>Ayuda</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold border transition-all ${
            filtersOpen || activeExtraFilters > 0
              ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Ordenar{activeExtraFilters > 0 ? ` (${activeExtraFilters})` : ''}</span>
        </button>
      </div>

      {helpOpen && (
        <div className="rounded-2xl bg-gradient-to-r from-brand-50 via-white to-sky-50 border border-brand-200 p-3.5 text-xs sm:text-sm text-slate-700 flex items-start justify-between gap-3 shadow-sm">
          <div className="space-y-1">
            <p className="font-heading font-extrabold text-slate-900">
              ¿Cómo encontrar y pedir rápido?
            </p>
            <ul className="space-y-0.5 text-xs text-slate-600">
              <li>
                • <strong>Busca sin preocuparte:</strong> entiende aunque falte una letra o tilde, o escribe <em>«mi carrito»</em>.
              </li>
              <li>
                • <strong>Filtra en 1 toque:</strong> toca cualquier burbuja de sección abajo para ver solo esa colección.
              </li>
              <li>
                • <strong>Haz tu pedido:</strong> entra al artículo, elige talla o modelo y agrégalo a tu bolsita.
              </li>
            </ul>
          </div>
          <button
            type="button"
            onClick={() => setHelpOpen(false)}
            aria-label="Cerrar ayuda"
            className="p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <SmartSearchBox
        value={search}
        onChange={onSearchChange}
        onSubmitSearch={onSearchChange}
        placeholder="Buscar prenda, juguete o escribe 'carrito'..."
      />

      {rootCategories.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold whitespace-nowrap border transition-all ${
              !categoryId
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
            }`}
          >
            Todo
          </button>
          {rootCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onCategoryChange(categoryId === c.id ? '' : c.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-extrabold whitespace-nowrap border transition-all ${
                categoryId === c.id
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-brand-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {filtersOpen && (
        <div className="rounded-2xl bg-white border border-slate-200 p-3 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="w-full sm:w-52">
            <Select
              value={sort}
              onChange={(e) => onSortChange(e.target.value as ProductSortOption)}
              options={[
                { value: 'newest', label: 'Más recientes' },
                { value: 'price_asc', label: 'Precio: menor a mayor' },
                { value: 'price_desc', label: 'Precio: mayor a menor' },
                { value: 'name_asc', label: 'Nombre: A - Z' }
              ]}
            />
          </div>
          {subcategories.length > 0 && (
            <div className="w-full sm:w-52">
              <Select
                value={subcategoryId}
                onChange={(e) => onSubcategoryChange(e.target.value)}
                options={[
                  { value: '', label: 'Todas las subcategorías' },
                  ...subcategories.map((s) => ({ value: s.id, label: s.name }))
                ]}
              />
            </div>
          )}
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => onOnlyAvailableChange(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            Solo disponibles hoy
          </label>
        </div>
      )}
    </div>
  );
}
