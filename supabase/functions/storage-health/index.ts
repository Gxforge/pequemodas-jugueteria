import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: isAdmin, error: roleError } = await userClient.rpc('is_store_admin');
    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Acceso restringido a administración' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: images, error: imgError } = await userClient
      .from('product_images')
      .select('size_bytes');

    if (imgError) throw imgError;

    const totalBytes = (images ?? []).reduce(
      (sum: number, row: { size_bytes: number }) => sum + (row.size_bytes ?? 0),
      0
    );
    const freeQuotaBytes = 1024 * 1024 * 1024; // 1 GB cuota plan gratuito Supabase

    return new Response(
      JSON.stringify({
        imageCount: images?.length ?? 0,
        usedBytes: totalBytes,
        freeQuotaBytes,
        usagePercent: Number(((totalBytes / freeQuotaBytes) * 100).toFixed(2))
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
