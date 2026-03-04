-- supabase/migrations/20260403000003_data_integrity.sql

-- Garante que topics.assembly_id exista antes das constraints
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS assembly_id UUID REFERENCES public.assemblies(id) ON DELETE SET NULL;

-- Forçar integridade da árvore de dependência: A Pauta e a Assembleia devem ser do mesmo Condomínio
-- NOTA: PostgreSQL não permite subquery em CHECK constraint (SQLSTATE 0A000).
-- Usamos trigger BEFORE INSERT OR UPDATE para impor a mesma regra.
ALTER TABLE public.topics
  DROP CONSTRAINT IF EXISTS topics_condo_matches_assembly;

CREATE OR REPLACE FUNCTION public.validate_topic_condo_assembly()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assembly_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.assemblies
      WHERE id = NEW.assembly_id AND condo_id = NEW.condo_id
    ) THEN
      RAISE EXCEPTION
        'Integridade violada: assembly_id % não pertence ao condo_id % da pauta',
        NEW.assembly_id, NEW.condo_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_topic_condo_assembly ON public.topics;
CREATE TRIGGER enforce_topic_condo_assembly
  BEFORE INSERT OR UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.validate_topic_condo_assembly();


-- Database Trigger Constraint Mestra: Não permitir inclusão de Votos em tópico que não esteja "OPEN"
CREATE OR REPLACE FUNCTION public.validate_vote_on_open_topic()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT status FROM public.topics WHERE id = NEW.topic_id) != 'OPEN' THEN
    RAISE EXCEPTION 'Votação encerrada: pauta % não está OPEN', NEW.topic_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_vote_on_open_topic
  BEFORE INSERT ON public.votes
  FOR EACH ROW EXECUTE FUNCTION public.validate_vote_on_open_topic();

-- Database Trigger Constraint Mestra: Não permitir gravação de Check-ins em assembleias que não estejam ativas
CREATE OR REPLACE FUNCTION public.validate_checkin_active_assembly()
RETURNS TRIGGER AS $$
DECLARE assembly_status TEXT;
BEGIN
  SELECT status INTO assembly_status FROM public.assemblies WHERE id = NEW.assembly_id;
  IF assembly_status NOT IN ('OPEN', 'IN_PROGRESS') THEN
    RAISE EXCEPTION 'Check-in negado: assembleia % não está ativa', NEW.assembly_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_checkin_active_assembly
  BEFORE INSERT ON public.checkins
  FOR EACH ROW EXECUTE FUNCTION public.validate_checkin_active_assembly();
