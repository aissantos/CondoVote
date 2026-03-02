-- P0.1: Garantir idempotência de votos por pauta
-- Um morador só pode ter exatamente 1 voto por topic_id

-- Antes de adicionar a constraint, remover possíveis duplicatas
-- (rodar apenas uma vez em ambiente de desenvolvimento — produção não deve ter dados ainda)
DELETE FROM public.votes
WHERE id NOT IN (
  SELECT DISTINCT ON (topic_id, user_id) id
  FROM public.votes
  ORDER BY topic_id, user_id, created_at ASC
);

-- Adicionar constraint de unicidade
ALTER TABLE public.votes
  ADD CONSTRAINT votes_unique_per_topic_user
  UNIQUE (topic_id, user_id);

-- Comentário de auditoria
COMMENT ON CONSTRAINT votes_unique_per_topic_user ON public.votes
  IS 'Garante que cada morador vote exatamente uma vez por pauta. P0.1 - auditoria 2026-03-02';
