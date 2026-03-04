import { supabase } from '../lib/supabase';
import type { Result } from './types';

/**
 * Exporta todos os dados pessoais do usuário em formato JSON Blob.
 */
export async function exportUserData(userId: string): Promise<Result<Blob>> {
  try {
    const [profile, votes, checkins, consents] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('votes').select('*, topics(title)').eq('user_id', userId),
      supabase.from('checkins').select('*, assemblies(title, assembly_date)').eq('user_id', userId),
      supabase.from('consents').select('*').eq('user_id', userId),
    ]);

    const export_data = {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      votes: votes.data,
      checkins: checkins.data,
      consents: consents.data,
    };

    const blob = new Blob([JSON.stringify(export_data, null, 2)], { type: 'application/json' });
    return { data: blob, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Erro ao exportar dados do usuário';
    const errRec = err as Record<string, unknown> | null;
    const errorCode = typeof errRec?.code === 'string' ? errRec.code : 'UNKNOWN';
    return { data: null, error: { code: errorCode, message: errorMsg } };
  }
}
