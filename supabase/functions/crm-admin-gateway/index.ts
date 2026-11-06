import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function verifyCatalogAdmin(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Sesión administrativa requerida.');
  }
  const catalogUrl = Deno.env.get('CATALOG_SUPABASE_URL') ?? '';
  const catalogAnonKey = Deno.env.get('CATALOG_SUPABASE_ANON_KEY') ?? '';
  if (!catalogUrl || !catalogAnonKey) {
    throw new Error('Puente de autenticación administrativa no configurado.');
  }

  const catalogClient = createClient(catalogUrl, catalogAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data: userData, error: userErr } = await catalogClient.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error('Sesión expirada o no válida.');
  }

  const { data: profile, error: profErr } = await catalogClient
    .from('profiles')
    .select('id, full_name, role, is_active')
    .eq('id', userData.user.id)
    .single();

  if (
    profErr ||
    !profile ||
    !profile.is_active ||
    (profile.role !== 'owner' && profile.role !== 'admin')
  ) {
    throw new Error('Acceso restringido únicamente a administradoras activas.');
  }

  return {
    id: profile.id as string,
    name: (profile.full_name as string | null) || 'Katia'
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const admin = await verifyCatalogAdmin(req.headers.get('Authorization'));
    const crmUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const crmServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const crm = createClient(crmUrl, crmServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const payload = (await req.json()) as Record<string, unknown>;
    const action = String(payload.action || '');

    if (action === 'overview') {
      const { data, error } = await crm.rpc('get_crm_storage_overview');
      if (error) throw new Error(error.message);
      return jsonResponse(data);
    }

    if (action === 'list_threads') {
      const { data, error } = await crm
        .from('customer_contacts')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(120);
      if (error) throw new Error(error.message);
      return jsonResponse({ contacts: data ?? [] });
    }

    if (action === 'get_thread') {
      const contactId = String(payload.contactId || '');
      await crm
        .from('customer_contacts')
        .update({ unread_for_admin: 0 })
        .eq('id', contactId);
      await crm
        .from('admin_notifications')
        .update({ is_read: true })
        .eq('contact_id', contactId)
        .eq('is_read', false);

      const [{ data: contact }, { data: messages }, { data: orders }] =
        await Promise.all([
          crm.from('customer_contacts').select('*').eq('id', contactId).single(),
          crm
            .from('chat_messages')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: true })
            .limit(200),
          crm
            .from('direct_orders')
            .select('*')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })
            .limit(30)
        ]);

      return jsonResponse({
        contact: contact ?? null,
        messages: messages ?? [],
        orders: orders ?? []
      });
    }

    if (action === 'send_admin_message') {
      const contactId = String(payload.contactId || '');
      const body = String(payload.body || '').trim();
      if (!contactId || !body) throw new Error('Mensaje vacío.');

      const { error: msgErr } = await crm.from('chat_messages').insert({
        contact_id: contactId,
        sender_role: 'admin',
        sender_name: admin.name,
        body
      });
      if (msgErr) throw new Error(msgErr.message);

      const { data: curr } = await crm
        .from('customer_contacts')
        .select('unread_for_customer')
        .eq('id', contactId)
        .single();

      await crm
        .from('customer_contacts')
        .update({
          unread_for_customer: ((curr?.unread_for_customer as number) ?? 0) + 1,
          unread_for_admin: 0,
          last_message_preview: `Tú: ${body.slice(0, 110)}`,
          last_message_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', contactId);

      return jsonResponse({ ok: true });
    }

    if (action === 'toggle_contact_bot') {
      const contactId = String(payload.contactId || '');
      const botPaused = Boolean(payload.botPaused);
      const { error } = await crm
        .from('customer_contacts')
        .update({ bot_paused: botPaused, updated_at: new Date().toISOString() })
        .eq('id', contactId);
      if (error) throw new Error(error.message);
      return jsonResponse({ ok: true, botPaused });
    }

    if (action === 'update_direct_order_status') {
      const orderId = String(payload.orderId || '');
      const status = String(payload.status || 'pending');
      const { data: order, error } = await crm
        .from('direct_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('*')
        .single();
      if (error || !order) throw new Error(error?.message ?? 'Pedido no encontrado.');

      const statusLabels: Record<string, string> = {
        pending: 'Pendiente de revisión',
        confirmed: 'Confirmado — recuerda actualizar el stock en Inventario',
        preparing: 'En preparación para entrega/recogida',
        completed: 'Entregado y completado',
        cancelled: 'Cancelado'
      };

      await crm.from('chat_messages').insert({
        contact_id: order.contact_id,
        sender_role: 'admin',
        sender_name: admin.name,
        order_id: order.id,
        body: `📌 Estado del pedido ${order.reference_code}: ${statusLabels[status] || status}`
      });

      return jsonResponse({ ok: true, order });
    }

    if (action === 'list_notifications') {
      const [{ data: notifications }, { data: botConfig }] = await Promise.all([
        crm
          .from('admin_notifications')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(40),
        crm.from('bot_config').select('*').eq('id', 1).single()
      ]);
      return jsonResponse({
        notifications: notifications ?? [],
        botConfig: botConfig ?? null
      });
    }

    if (action === 'mark_notifications_read') {
      const notificationId = payload.notificationId
        ? String(payload.notificationId)
        : null;
      let q = crm
        .from('admin_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() });
      q = notificationId ? q.eq('id', notificationId) : q.eq('is_read', false);
      await q;
      return jsonResponse({ ok: true });
    }

    if (action === 'save_bot_config') {
      const patch = (payload.patch ?? {}) as Record<string, unknown>;
      const allowed: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      for (const k of [
        'is_enabled',
        'bot_name',
        'welcome_message',
        'order_received_message',
        'offline_or_wait_message',
        'keyword_rules',
        'notify_on_cart_add',
        'notify_on_chat',
        'cart_cooldown_minutes'
      ]) {
        if (k in patch) allowed[k] = patch[k];
      }
      const { data, error } = await crm
        .from('bot_config')
        .update(allowed)
        .eq('id', 1)
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return jsonResponse({ botConfig: data });
    }

    return jsonResponse({ error: `Acción desconocida: ${action}` }, 400);
  } catch (err) {
    return jsonResponse(
      { error: err instanceof Error ? err.message : 'Error interno CRM' },
      401
    );
  }
});
