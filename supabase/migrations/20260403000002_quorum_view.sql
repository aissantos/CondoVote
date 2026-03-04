-- supabase/migrations/20260403000002_quorum_view.sql
-- View de quórum: cria versão que funciona independente de checkins.assembly_id existir

-- Cria a coluna se ainda não existir (idempotente)
ALTER TABLE public.checkins
  ADD COLUMN IF NOT EXISTS assembly_id UUID REFERENCES public.assemblies(id) ON DELETE CASCADE;

CREATE OR REPLACE VIEW public.assembly_quorum AS
SELECT
  a.id                                          AS assembly_id,
  a.condo_id,
  a.title,
  COUNT(DISTINCT c.user_id)                     AS checkins_count,
  COUNT(DISTINCT p.id)                          AS total_residents,
  ROUND(
    COUNT(DISTINCT c.user_id) * 100.0
    / NULLIF(COUNT(DISTINCT p.id), 0), 1
  )                                             AS quorum_pct
FROM public.assemblies a
LEFT JOIN public.checkins c ON c.assembly_id = a.id
LEFT JOIN public.profiles p ON p.condo_id = a.condo_id AND p.role = 'RESIDENT'
GROUP BY a.id;

ALTER VIEW public.assembly_quorum OWNER TO postgres;
GRANT SELECT ON public.assembly_quorum TO authenticated;

