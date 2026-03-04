CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES auth.users(id),
  actor_role  TEXT NOT NULL,
  action      TEXT NOT NULL,
  table_name  TEXT,
  record_id   UUID,
  before_data JSONB,
  after_data  JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Apenas SUPERADMIN lê audit_log" ON public.audit_log
  FOR SELECT USING ((auth.jwt() ->> 'user_role') = 'SUPERADMIN');

CREATE POLICY "audit_log é append-only" ON public.audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.audit_topic_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.audit_log (actor_id, actor_role, action, table_name, record_id, before_data, after_data)
    VALUES (
      auth.uid(),
      (auth.jwt() ->> 'user_role'),
      'TOPIC_STATUS_CHANGED',
      'topics',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_topic_status_change ON public.topics;
CREATE TRIGGER on_topic_status_change
  AFTER UPDATE OF status ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.audit_topic_status_change();
