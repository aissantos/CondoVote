import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// Substitua pela sua chave VAPID Pública extraída do seu gerador backend / web-push
const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const subscribeToPush = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker não suportado pelo navegador.');
      }
      if (!publicVapidKey) {
        throw new Error("Push notifications API isn't fully configured in the environment (Missing VAPID KEY).");
      }
      if (!('PushManager' in window)) {
        throw new Error('Push Notifications não suportados pelo navegador.');
      }

      const registration = await navigator.serviceWorker.ready;

      // Questiona ou resgata permissão
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permissão negada para notificações.');
      }

      // Converte chave e inscreve no PushManager
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
      });

      // Extrai chaves e endpoint
      const p256dh = pushSubscription.getKey('p256dh');
      const auth = pushSubscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('Falha ao extrair chaves de segurança da Inscrição Push.');
      }

      const encodedP256dh = btoa(String.fromCharCode.apply(null, new Uint8Array(p256dh) as unknown as number[]));
      const encodedAuth = btoa(String.fromCharCode.apply(null, new Uint8Array(auth) as unknown as number[]));

      // Salva no banco de dados
      const { error: dbError } = await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: pushSubscription.endpoint,
        p256dh: encodedP256dh,
        auth: encodedAuth
      }, { onConflict: 'endpoint' });

      if (dbError) throw dbError;

      setIsSubscribed(true);
      return true;

    } catch (err) {
      console.error('Erro na subscrição push: ', err);
      // Aqui pode-se notificar com Toast UI
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendPush = useCallback(async (payload: { title: string; body: string; user_id?: string; condo_id?: string; url?: string }) => {
    try {
      const { error } = await supabase.functions.invoke('send-push', {
        body: payload
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Falha ao enviar push via Edge Function', err);
      return false;
    }
  }, []);

  return { subscribeToPush, sendPush, isSubscribed, pushLoading: loading };
}
