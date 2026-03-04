-- supabase/migrations/20260403000001_voting_result_view.sql

CREATE OR REPLACE VIEW public.topic_vote_summary AS
SELECT
  t.id                                                    AS topic_id,
  t.title,
  t.status,
  t.condo_id,
  t.assembly_id,
  COUNT(v.id)                                             AS total_votes,
  COUNT(v.id) FILTER (WHERE v.choice = 'SIM')             AS votes_sim,
  COUNT(v.id) FILTER (WHERE v.choice = 'NÃO')             AS votes_nao,
  COUNT(v.id) FILTER (WHERE v.choice = 'ABSTENÇÃO')       AS votes_abstencao,
  ROUND(
    COUNT(v.id) FILTER (WHERE v.choice = 'SIM') * 100.0
    / NULLIF(COUNT(v.id), 0), 1
  )                                                       AS pct_sim,
  t.created_at,
  t.updated_at
FROM public.topics t
LEFT JOIN public.votes v ON v.topic_id = t.id
GROUP BY t.id;

-- RLS: mesma política das topics
ALTER VIEW public.topic_vote_summary OWNER TO postgres;
GRANT SELECT ON public.topic_vote_summary TO authenticated;
