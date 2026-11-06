import React, { useState } from 'react';
import { MessageCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { Button } from './Button';
import { Input, Select, Textarea } from './FormFields';
import { AvailabilityBadge, Badge, Card } from './CardAndBadge';
import { Alert, Modal } from './ModalAndAlert';
import { EmptyState, ProductCardSkeleton } from './EmptyAndSkeleton';

export function DesignSystemShowcase() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <Card padding="lg" className="bg-gradient-to-r from-brand-50 via-white to-sky-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <BrandLogo size="lg" />
          <Badge tone="brand">Sistema de Diseño Oficial — StudioLexair</Badge>
        </div>
        <p className="mt-4 text-sm sm:text-base text-slate-600">
          Guía visual y demostración interactiva de componentes reutilizables optimizados
          para teléfonos Android y escritorio, con paleta alegre, limpia y accesible.
        </p>
      </Card>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold text-slate-900">1. Paleta Cromática</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { name: 'Coral Marca', cls: 'bg-brand-600 text-white', hex: '#D4385B' },
            { name: 'Cielo Juguete', cls: 'bg-sky-600 text-white', hex: '#0284C7' },
            { name: 'Sol Destacado', cls: 'bg-sunny-500 text-slate-900', hex: '#F59E0B' },
            { name: 'Menta Stock', cls: 'bg-mint-600 text-white', hex: '#059669' },
            { name: 'WhatsApp Pedido', cls: 'bg-whatsapp-600 text-white', hex: '#1DA851' }
          ].map((swatch) => (
            <div key={swatch.name} className={`rounded-2xl p-4 shadow-sm ${swatch.cls}`}>
              <p className="font-bold text-sm">{swatch.name}</p>
              <p className="text-xs opacity-90 mt-1">{swatch.hex}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold text-slate-900">2. Botones e Insignias</h2>
        <Card className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="primary" leftIcon={<ShoppingBag className="h-4 w-4" />}>
              Añadir al carrito
            </Button>
            <Button variant="secondary" leftIcon={<Sparkles className="h-4 w-4" />}>
              Explorar categorías
            </Button>
            <Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />}>
              Solicitar por WhatsApp
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Abrir Modal Demo
            </Button>
            <Button variant="danger" size="sm">
              Archivar
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <AvailabilityBadge status="available" quantity={5} />
            <AvailabilityBadge status="inquire" />
            <AvailabilityBadge status="out_of_stock" />
            <Badge tone="sunny">Destacado</Badge>
            <Badge tone="sky">Nueva temporada</Badge>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold text-slate-900">3. Formularios y Alertas</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card className="space-y-3">
            <Input label="Nombre del producto" placeholder="Ej. Conjunto de algodón" requiredMark />
            <Select
              label="Modalidad de inventario"
              options={[
                { value: 'quantity', label: 'Control por cantidades' },
                { value: 'manual', label: 'Disponibilidad manual' }
              ]}
            />
            <Textarea label="Descripción" placeholder="Detalles claros de tallas y materiales..." />
          </Card>
          <div className="space-y-3">
            <Alert variant="info" title="Confirmación manual por WhatsApp">
              Abrir WhatsApp prepara tu resumen sin descontar inventario automáticamente.
            </Alert>
            <Alert variant="success" title="Imágenes optimizadas a WebP">
              Reducción automática de peso para redes móviles en Cuba.
            </Alert>
            <Alert variant="warning" title="Límite de almacenamiento supervisado">
              Se validan formatos MIME y tamaño máximo antes de subir a Supabase Storage.
            </Alert>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold text-slate-900">
          4. Estados Vacíos y Skeleton Loaders
        </h2>
        <div className="grid sm:grid-cols-3 gap-4 items-start">
          <div className="sm:col-span-2">
            <EmptyState
              title="Catálogo en preparación"
              description="Pronto verás aquí las novedades de ropa infantil y juguetes seleccionados por Katia."
            />
          </div>
          <ProductCardSkeleton />
        </div>
      </section>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Ventana Modal Adaptable"
        description="Se comporta como hoja inferior cómoda en Android y diálogo centrado en escritorio."
        footer={<Button onClick={() => setModalOpen(false)}>Entendido</Button>}
      >
        <p className="text-sm text-slate-600">
          Soporta cierre con tecla Escape, enfoque accesible y desplazamiento interno seguro.
        </p>
      </Modal>
    </div>
  );
}
