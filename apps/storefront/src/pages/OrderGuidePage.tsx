import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, ShoppingBag, Truck } from 'lucide-react';
import { Alert, Button, Card } from '@pequemodas/ui';
import { usePageMeta } from '../hooks/usePageMeta';

export function OrderGuidePage() {
  usePageMeta(
    'Información de Pedidos',
    'Conoce paso a paso cómo solicitar tus productos infantiles por WhatsApp.'
  );

  const steps = [
    {
      title: '1. Explora y elige tus productos',
      desc: 'Navega por categorías o utiliza el buscador. En cada artículo verás su precio en CUP, fotografías y variantes disponibles (tallas, colores, edades o modelos).',
      Icon: ShoppingBag
    },
    {
      title: '2. Revisa tu carrito y modalidad',
      desc: 'Ajusta las cantidades deseadas y elige si prefieres Entrega a domicilio o Recogida según las opciones habilitadas por la tienda.',
      Icon: Truck
    },
    {
      title: '3. Envía el resumen por WhatsApp',
      desc: 'La tienda genera automáticamente un mensaje ordenado con productos, variantes, cantidades y subtotal estimado para que no tengas que escribirlo a mano.',
      Icon: MessageCircle
    },
    {
      title: '4. Confirmación manual con Katia',
      desc: 'Katia verifica en tiempo real la disponibilidad física, te confirma la tarifa de entrega (si aplica) y acuerda contigo la entrega o recogida.',
      Icon: CheckCircle2
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          ¿Cómo realizar tu pedido?
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Un proceso sencillo, transparente y sin necesidad de tarjetas ni pagos en línea.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {steps.map(({ title, desc, Icon }) => (
          <Card key={title} className="space-y-2">
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="font-heading text-base font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
          </Card>
        ))}
      </div>

      <Alert variant="info" title="Importante sobre la disponibilidad">
        Abrir WhatsApp prepara tu solicitud, pero no reserva ni descuenta productos
        automáticamente. Tu pedido queda firme una vez confirmado directamente por Katia.
      </Alert>

      <div className="pt-2">
        <Link to="/catalogo">
          <Button size="lg">Comenzar a ver el catálogo</Button>
        </Link>
      </div>
    </div>
  );
}
