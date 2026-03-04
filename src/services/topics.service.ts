import { supabase } from '../lib/supabase';
import { getSignedDocumentUrl } from '../lib/storage';
import type { Database } from '../lib/database.types';
import type { Result } from './types';

export type TopicRow = Database['public']['Tables']['topics']['Row'];
export type TopicInsert = Database['public']['Tables']['topics']['Insert'];
export type TopicUpdate = Database['public']['Tables']['topics']['Update'];

/**
 * Busca uma pauta específica. Se houver anexo (bucket privado),
 * gera automaticamente uma URL assinada provisória.
 */
export async function getTopicWithSignedAttachment(topicId: string): Promise<Result<TopicRow>> {
  const { data: topic, error } = await supabase
    .from('topics')
    .select('*')
    .eq('id', topicId)
    .single();
  
  if (error) {
    return { data: null, error: { code: error.code, message: error.message } };
  }

  if (topic?.attachment_url) {
    const signedUrl = await getSignedDocumentUrl(topic.attachment_url);
    if (signedUrl) {
      topic.attachment_url = signedUrl;
    }
  }

  return { data: topic, error: null };
}

/**
 * Atualiza o status de uma pauta (abrir/fechar votação)
 */
export async function updateTopicStatus(
  topicId: string, 
  status: 'OPEN' | 'CLOSED' | 'DRAFT'
): Promise<Result<TopicRow>> {
  const { data, error } = await supabase
    .from('topics')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', topicId)
    .select()
    .single();

  if (error) {
    return { data: null, error: { code: error.code, message: error.message } };
  }

  return { data, error: null };
}
