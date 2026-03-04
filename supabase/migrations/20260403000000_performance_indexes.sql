-- supabase/migrations/20260403000000_performance_indexes.sql

-- Votes: queries por topic_id + user_id são as mais frequentes (verificação de voto duplo)
CREATE INDEX IF NOT EXISTS idx_votes_topic_user
  ON public.votes (topic_id, user_id);

-- Votes: queries por topic_id (relatório de resultado)
CREATE INDEX IF NOT EXISTS idx_votes_topic_id
  ON public.votes (topic_id);

-- Topics: listagem de pautas abertas por condo
CREATE INDEX IF NOT EXISTS idx_topics_condo_status
  ON public.topics (condo_id, status)
  WHERE status = 'OPEN';   -- partial index — só pautas abertas

-- Checkins: verificação de quórum por assembleia
-- Guard: só cria o índice se a coluna já existir (pode ter sido adicionada por outra migration)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'checkins'
      AND column_name  = 'assembly_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_checkins_assembly
      ON public.checkins (assembly_id, condo_id);
  END IF;
END $$;

-- Profiles: listagem de moradores por condo
CREATE INDEX IF NOT EXISTS idx_profiles_condo_role
  ON public.profiles (condo_id, role)
  WHERE role = 'RESIDENT';  -- partial index

-- Assembly documents: listagem por condo + assembly
CREATE INDEX IF NOT EXISTS idx_assembly_docs_condo_assembly
  ON public.assembly_documents (condo_id, assembly_id);

-- Audit log: buscas por actor e por data
CREATE INDEX IF NOT EXISTS idx_audit_log_actor
  ON public.audit_log (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record
  ON public.audit_log (table_name, record_id, created_at DESC);
