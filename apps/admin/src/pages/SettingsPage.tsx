import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImagePlus, Save } from 'lucide-react';
import { storeSettingsFormSchema, type StoreSettingsFormInput } from '@pequemodas/schemas';
import { updateStoreSettings, uploadStoreLogo } from '@pequemodas/shared';
import { Alert, BrandLogo, Button, Card, Input, Textarea } from '@pequemodas/ui';
import { useAuth } from '../context/AuthContext';

export function SettingsPage() {
  const { store, settings, refreshStoreContext } = useAuth();
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const form = useForm<StoreSettingsFormInput>({
    resolver: zodResolver(storeSettingsFormSchema),
    defaultValues: {
      commercialName: 'PequeModas-Juguetería',
      description: '',
      logoUrl: '',
      phone: '',
      whatsappPhone: '',
      address: '',
      businessHours: '',
      deliveryEnabled: true,
      pickupEnabled: true,
      deliveryInfo: '',
      pickupInfo: '',
      recordWhatsappRequests: true,
      socialLinks: {
        instagram: '',
        facebook: '',
        telegram: '',
        whatsappGroup: ''
      }
    }
  });

  useEffect(() => {
    if (!settings) return;
    form.reset({
      commercialName: settings.commercial_name,
      description: settings.description ?? '',
      logoUrl: settings.logo_url ?? '',
      phone: settings.phone ?? '',
      whatsappPhone: settings.whatsapp_phone ?? '',
      address: settings.address ?? '',
      businessHours: settings.business_hours ?? '',
      deliveryEnabled: settings.delivery_enabled,
      pickupEnabled: settings.pickup_enabled,
      deliveryInfo: settings.delivery_info ?? '',
      pickupInfo: settings.pickup_info ?? '',
      recordWhatsappRequests: settings.record_whatsapp_requests,
      socialLinks: {
        instagram: settings.social_links?.instagram ?? '',
        facebook: settings.social_links?.facebook ?? '',
        telegram: settings.social_links?.telegram ?? '',
        whatsappGroup: settings.social_links?.whatsappGroup ?? ''
      }
    });
  }, [settings, form]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !store) return;
    setUploadingLogo(true);
    setErrorMsg(null);
    try {
      const res = await uploadStoreLogo(store.id, file);
      form.setValue('logoUrl', res.publicUrl, { shouldDirty: true });
      await refreshStoreContext();
      setSavedMsg('Logotipo actualizado correctamente.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al subir el logotipo.');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (values: StoreSettingsFormInput) => {
    if (!store) return;
    setSavedMsg(null);
    setErrorMsg(null);
    try {
      await updateStoreSettings(store.id, values);
      await refreshStoreContext();
      setSavedMsg('Configuración comercial guardada con éxito.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar ajustes.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Configuración de la Tienda
        </h1>
        <p className="text-sm text-slate-600">
          Configura tu número de WhatsApp, horarios, información de entrega/recogida y redes
          sociales. Ningún dato comercial se publica sin tu autorización.
        </p>
      </div>

      {savedMsg && <Alert variant="success">{savedMsg}</Alert>}
      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Identidad y Marca</h2>
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl">
            <BrandLogo
              logoUrl={form.watch('logoUrl') || settings?.logo_url}
              commercialName={form.watch('commercialName')}
              size="lg"
            />
            <div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => void handleLogoUpload(e)}
              />
              <Button
                size="sm"
                variant="outline"
                isLoading={uploadingLogo}
                leftIcon={<ImagePlus className="h-4 w-4" />}
                onClick={() => logoInputRef.current?.click()}
              >
                Cambiar logotipo
              </Button>
            </div>
          </div>

          <Input
            label="Nombre comercial"
            requiredMark
            error={form.formState.errors.commercialName?.message}
            {...form.register('commercialName')}
          />
          <Textarea
            label="Descripción de bienvenida de la tienda"
            rows={3}
            placeholder="Presentación breve de PequeModas-Juguetería para los padres..."
            {...form.register('description')}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Contacto y Pedidos por WhatsApp
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Número de WhatsApp para recibir pedidos"
              placeholder="Ej. +535xxxxxxx"
              hint="Incluye el código de país (+53 para Cuba)."
              error={form.formState.errors.whatsappPhone?.message}
              {...form.register('whatsappPhone')}
            />
            <Input
              label="Teléfono de atención (opcional)"
              placeholder="Ej. +535xxxxxxx"
              {...form.register('phone')}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Dirección pública (solo si deseas mostrarla)"
              placeholder="Dejar en blanco para no mostrar dirección"
              {...form.register('address')}
            />
            <Input
              label="Horarios de atención"
              placeholder="Ej. Lunes a Sábado, 9:00 AM - 6:00 PM"
              {...form.register('businessHours')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded"
              {...form.register('recordWhatsappRequests')}
            />
            Registrar copia de solicitudes de WhatsApp en el panel administrativo
          </label>
        </Card>

        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Modalidades de Entrega y Recogida
          </h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                {...form.register('deliveryEnabled')}
              />
              Permitir Entrega a domicilio
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                {...form.register('pickupEnabled')}
              />
              Permitir Recogida
            </label>
          </div>
          <Textarea
            label="Zonas, tarifas y condiciones de entrega a domicilio"
            rows={3}
            placeholder="Describe aquí tus municipios cubiertos, condiciones o cómo se coordina la mensajería..."
            {...form.register('deliveryInfo')}
          />
          <Textarea
            label="Instrucciones de recogida"
            rows={3}
            placeholder="Indica punto de recogida o coordinación previa por WhatsApp..."
            {...form.register('pickupInfo')}
          />
        </Card>

        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">Redes Sociales</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Instagram (enlace)"
              placeholder="https://instagram.com/..."
              {...form.register('socialLinks.instagram')}
            />
            <Input
              label="Facebook (enlace)"
              placeholder="https://facebook.com/..."
              {...form.register('socialLinks.facebook')}
            />
            <Input
              label="Grupo o Canal de WhatsApp"
              placeholder="https://chat.whatsapp.com/..."
              {...form.register('socialLinks.whatsappGroup')}
            />
            <Input
              label="Canal de Telegram"
              placeholder="https://t.me/..."
              {...form.register('socialLinks.telegram')}
            />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={form.formState.isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Guardar configuración
          </Button>
        </div>
      </form>
    </div>
  );
}
