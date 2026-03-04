-- 20260400000000_topics_assembly_link.sql
-- Pré-requisito: adiciona colunas que as migrations subsequentes dependem.
-- Deve ser aplicada ANTES de:
--   20260401000000_performance_indexes.sql  (usa assembly_id em CREATE INDEX)
--   20260403000001_voting_result_view.sql   (usa assembly_id e updated_at em VIEW)
--   20260403000002_quorum_view.sql          (usa checkins.assembly_id em VIEW)
--   20260403000003_data_integrity.sql       (usa assembly_id em CHECK CONSTRAINT)

-- Vincula uma pauta à assembleia a que pertence
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS assembly_id UUID REFERENCES public.assemblies(id) ON DELETE SET NULL;

-- Coluna updated_at necessária para a view topic_vote_summary
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Vincula o check-in (presença) à assembleia correspondente
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS assembly_id UUID REFERENCES public.assemblies(id) ON DELETE CASCADE;

-- Trigger para manter updated_at atualizado automaticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_topics_updated_at ON public.topics;
CREATE TRIGGER set_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

NOTIFY pgrst, 'reload schema';

