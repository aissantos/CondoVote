-- P0.1: Garantir idempotência de votos por pauta
-- Um morador só pode ter exatamente 1 voto por topic_id
-- Idempotente: não falha se a constraint já existir

-- Antes de adicionar a constraint, remover possíveis duplicatas
DELETE FROM public.votes
WHERE id NOT IN (
  SELECT DISTINCT ON (topic_id, user_id) id
  FROM public.votes
  ORDER BY topic_id, user_id, created_at ASC
);

-- Adicionar constraint apenas se ainda não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'votes_unique_per_topic_user'
      AND conrelid = 'public.votes'::regclass
  ) THEN
    ALTER TABLE public.votes
      ADD CONSTRAINT votes_unique_per_topic_user
      UNIQUE (topic_id, user_id);
  END IF;
END;
$$;

-- Comentário de auditoria
COMMENT ON CONSTRAINT votes_unique_per_topic_user ON public.votes
  IS 'Garante que cada morador vote exatamente uma vez por pauta. P0.1 - auditoria 2026-03-02';
