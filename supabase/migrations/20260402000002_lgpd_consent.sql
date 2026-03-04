CREATE TABLE IF NOT EXISTS public.consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  version      TEXT NOT NULL,
  granted      BOOLEAN NOT NULL,
  granted_at   TIMESTAMPTZ DEFAULT NOW(),
  ip_address   INET,
  user_agent   TEXT
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User manages own consents" ON public.consents
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "SUPERADMIN reads all consents" ON public.consents
  FOR SELECT USING ((auth.jwt() ->> 'user_role') = 'SUPERADMIN');
