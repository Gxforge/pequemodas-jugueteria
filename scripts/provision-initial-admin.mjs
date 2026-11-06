#!/usr/bin/env node
/**
 * Procedimiento seguro para crear la cuenta administradora inicial de Katia.
 * Uso (nunca guardar contraseñas en archivos del repositorio):
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   INITIAL_ADMIN_EMAIL=katia@dominio.cu INITIAL_ADMIN_PASSWORD='...' \
 *   node scripts/provision-initial-admin.mjs
 */
import { createClient } from '@supabase/supabase-js';

if (typeof globalThis.WebSocket === 'undefined') {
  // Evita error de RealtimeClient en Node 20 cuando solo se usa Auth/PostgREST
  globalThis.WebSocket = class {};
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.trim();
const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
const adminName = process.env.INITIAL_ADMIN_NAME?.trim() || 'Katia';

if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
  console.error(
    'Faltan variables requeridas: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD.'
  );
  process.exit(1);
}

if (adminPassword.length < 10) {
  console.error('Por seguridad, la contraseña inicial debe tener al menos 10 caracteres.');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data: store, error: storeErr } = await adminClient
    .from('stores')
    .select('id')
    .eq('slug', 'pequemodas-jugueteria')
    .single();

  if (storeErr || !store) {
    throw new Error('Primero ejecuta las migraciones y seed.sql de la tienda.');
  }

  const { data: existingProfiles } = await adminClient
    .from('profiles')
    .select('id, email')
    .eq('role', 'owner');

  if (existingProfiles && existingProfiles.length > 0) {
    console.log(
      `Ya existe una propietaria registrada (${existingProfiles[0]?.email}). Operación cancelada por seguridad.`
    );
    return;
  }

  const { data: createdUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminName }
  });

  if (authErr || !createdUser.user) {
    throw new Error(`Error al crear usuario en Supabase Auth: ${authErr?.message}`);
  }

  const { error: profErr } = await adminClient.from('profiles').upsert({
    id: createdUser.user.id,
    store_id: store.id,
    email: adminEmail,
    full_name: adminName,
    role: 'owner',
    is_active: true
  });

  if (profErr) {
    throw new Error(`Error al vincular perfil administrativo: ${profErr.message}`);
  }

  console.log(`[OK] Cuenta administradora propietaria creada exitosamente para ${adminEmail}.`);
}

main().catch((err) => {
  console.error('[ERROR]', err instanceof Error ? err.message : err);
  process.exit(1);
});
