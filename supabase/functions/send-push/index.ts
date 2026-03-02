import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import webpush from 'npm:web-push@3.6.7';

// Cors Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Setup Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

// Setup VAPID Keys e Detalhes
webpush.setVapidDetails(
  Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@condovote.com',
  Deno.env.get('VITE_VAPID_PUBLIC_KEY') || '',
  Deno.env.get('VAPID_PRIVATE_KEY') || ''
);

serve(async (req) => {
  // Trata OPTIONS de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { title, body, user_id, condo_id, url } = await req.json();

    let query = supabase.from('push_subscriptions').select('*');

    if (user_id) {
      query = query.eq('user_id', user_id);
    } else if (condo_id) {
      // Se mandar condo_id, busca usuários daquele condomínio
      const { data: users } = await supabase.from('profiles').select('id').eq('condo_id', condo_id);
      if (users && users.length > 0) {
        query = query.in('user_id', users.map(u => u.id));
      } else {
         return new Response(JSON.stringify({ success: true, message: 'Nenhum morador encontrado' }), {
           headers: { ...corsHeaders, 'Content-Type': 'application/json' },
         });
      }
    }

    const { data: subscriptions, error } = await query;

    if (error) {
       throw error;
    }

    const notificationPayload = JSON.stringify({
      title: title || 'Notificação CondoVote',
      body: body || 'Verifique o painel do seu condomínio',
      url: url || '/resident/home',
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: atob(sub.p256dh).split('').map(c => c.charCodeAt(0)),
          auth: atob(sub.auth).split('').map(c => c.charCodeAt(0))
        }
      };
      
      // Converte array numeric para Bufferish Deno requirement no webpush param keys
      const formattedSub = {
         endpoint: sub.endpoint,
         keys: {
            p256dh: btoa(String.fromCharCode.apply(null, pushConfig.keys.p256dh)),
            auth: btoa(String.fromCharCode.apply(null, pushConfig.keys.auth))
         }
      };

      try {
        await webpush.sendNotification(formattedSub, notificationPayload);
      } catch (e: any) {
        // Se a Inscrição expirou ou WebPush bloqueou (Ex: 410 Gone), nós apagamos do banco
        if (e.statusCode === 404 || e.statusCode === 410) {
           await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
           console.error('Falha de envio WebPush', e);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, sentCount: subscriptions.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
