import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import * as Sentry from '@sentry/react';
import type { Result } from './types';

export type VoteInsert = Database['public']['Tables']['votes']['Insert'];
export type VoteRow    = Database['public']['Tables']['votes']['Row'];

/**
 * Verifica se o usuário já votou em uma pauta.
 * Retorna o voto existente ou null — nunca lança exceção.
 */
export async function getExistingVote(
  topicId: string,
  userId: string
): Promise<Result<VoteRow | null>> {
  const { data, error } = await supabase
    .from('votes')
    .select('*')
    .eq('topic_id', topicId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) return { data: null, error: { code: error.code, message: error.message } };
  return { data, error: null };
}

/**
 * Registra um voto. Idempotente via UNIQUE constraint — retorna sucesso
 * se o voto já existia (tratamento do 23505 como sucesso de negócio).
 */
export async function castVote(payload: VoteInsert): Promise<Result<VoteRow>> {
  return Sentry.startSpan(
    { name: 'castVote', op: 'db.insert', attributes: { 'vote.topic_id': payload.topic_id } },
    async () => {
      const { data, error } = await supabase
        .from('votes')
        .insert(payload)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Voto duplicado — tratar como sucesso silencioso
          const existing = await getExistingVote(payload.topic_id, payload.user_id!);
          if (existing.data) return { data: existing.data, error: null };
        }
        Sentry.setTag('vote.error_code', error.code);
        return { data: null, error: { code: error.code, message: error.message, context: payload } };
      }

      return { data: data!, error: null };
    }
  );
}
