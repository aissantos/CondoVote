import { supabase } from '../lib/supabase';
import type { Result } from './types';

export async function recordConsent(
  userId: string,
  type: 'TERMS_OF_USE' | 'PRIVACY_POLICY' | 'PUSH_NOTIFICATIONS',
  version: string
): Promise<Result<boolean>> {
  try {
    // @ts-expect-error Pula checagem restrita até que a migration da tabela 'consents' seja refletida no typegen
    const { error } = await supabase.from('consents').insert({
      user_id: userId,
      consent_type: type,
      version,
      granted: true,
      user_agent: navigator.userAgent
    });

    if (error) throw error;
    return { data: true, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao registrar consentimento';
    const errRec = err as Record<string, unknown> | null;
    const errorCode = typeof errRec?.code === 'string' ? errRec.code : 'UNKNOWN';
    return { data: null, error: { code: errorCode, message: errorMsg } };
  }
}
