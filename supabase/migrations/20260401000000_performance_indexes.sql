-- 20260401000000_performance_indexes.sql
-- Adiciona índices de performance conforme recomendação do Roadmap 5.0 - Dimensão 1

-- 1. Acelera consultas de histórico/total de votos da pauta
CREATE INDEX IF NOT EXISTS idx_votes_topic_id ON public.votes (topic_id);

-- 2. Acelera listagens de pautas de uma assembleia/condomínio e pesquisas por status (muito usado no ResidentHome e Dashboard)
CREATE INDEX IF NOT EXISTS idx_topics_assembly_condo ON public.topics (assembly_id, condo_id, status);

-- 3. Acelera contagem de faltas/presenças por assembleia e validação rápida do direito a voto na triagem
CREATE INDEX IF NOT EXISTS idx_checkins_assembly_user ON public.checkins (condo_id, user_id);
