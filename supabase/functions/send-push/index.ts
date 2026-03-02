import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') as string;

webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@condovote.com',
  Deno.env.get('VITE_VAPID_PUBLIC_KEY') || '',
  Deno.env.get('VAPID_PRIVATE_KEY') || ''
);

// Roles autorizadas a disparar notificações
const ALLOWED_ROLES = ['ADMIN', 'SUPERADMIN'] as const;

serve(async (req) => {
  // Responder preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ─── 1. VERIFICAR AUTENTICAÇÃO ──────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: missing Bearer token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Usar client anon para verificar o JWT do chamador
    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user: caller }, error: authError } = await callerClient.auth.getUser();

    if (authError || !caller) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 2. VERIFICAR AUTORIZAÇÃO (role) ───────────────────────
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: callerProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, condo_id')
      .eq('id', caller.id)
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_ROLES.includes(callerProfile.role as typeof ALLOWED_ROLES[number])) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: insufficient role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 3. VALIDAR PAYLOAD ────────────────────────────────────
    const { title, body, user_id, condo_id, url } = await req.json();

    // ADMINs só podem enviar para o próprio condomínio
    if (callerProfile.role === 'ADMIN' && condo_id && condo_id !== callerProfile.condo_id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: cannot send to another condo' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── 4. BUSCAR SUBSCRIPTIONS ───────────────────────────────
    let query = serviceClient.from('push_subscriptions').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (condo_id) {
      const { data: users } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('condo_id', condo_id);

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'Nenhum morador encontrado', sentCount: 0 }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      query = query.in('user_id', users.map((u) => u.id));
    }

    const { data: subscriptions, error: subError } = await query;
    if (subError) throw subError;

    // ─── 5. DISPARAR NOTIFICAÇÕES ──────────────────────────────
    const notificationPayload = JSON.stringify({
      title: title || 'Notificação CondoVote',
      body: body || 'Verifique o painel do seu condomínio',
      url: url || '/resident/home',
    });

    const results = await Promise.allSettled(
      (subscriptions ?? []).map(async (sub) => {
        const formattedSub = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } };
        try {
          await webpush.sendNotification(formattedSub, notificationPayload);
        } catch (e: unknown) {
          const err = e as { statusCode?: number };
          if (err.statusCode === 404 || err.statusCode === 410) {
            // Subscription expirada — remover do banco
            await serviceClient.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          } else {
            console.error('[send-push] Falha WebPush:', { endpoint: sub.endpoint, statusCode: err.statusCode });
            throw e;
          }
        }
      })
    );

    const sentCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ success: true, sentCount, failCount }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    console.error('[send-push] Erro interno:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
