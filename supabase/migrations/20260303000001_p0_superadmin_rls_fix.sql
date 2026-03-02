-- P0.2: Corrigir recursão infinita nas policies RLS do SUPERADMIN
-- Solução: usar auth.jwt() para ler o role diretamente do token JWT,
-- eliminando qualquer subquery à tabela profiles.
-- Pré-requisito: jwt_custom_claims.sql deve estar aplicado (trigger já existente).

-- ══════════════════════════════════════════════════
-- Helper: função estável para verificar role via JWT
-- Usar função evita repetir o cast jsonb em toda policy
-- ══════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.get_jwt_role()
RETURNS TEXT
LANGUAGE sql
STABLE          -- não modifica o banco; pode ser cacheada por query
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    ''
  );
$$;

-- ══════════════════════════════════════════════════
-- Tabela PROFILES
-- ══════════════════════════════════════════════════
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de profiles" ON public.profiles;
CREATE POLICY "SUPERADMINs tem visão global de profiles" ON public.profiles
  FOR SELECT USING (
    public.get_jwt_role() = 'SUPERADMIN'     -- ✅ lê do JWT, zero subquery
  );

DROP POLICY IF EXISTS "SUPERADMINs editam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs editam qualquer profile" ON public.profiles
  FOR UPDATE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs deletam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs deletam qualquer profile" ON public.profiles
  FOR DELETE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

-- ══════════════════════════════════════════════════
-- Tabela CONDOS
-- ══════════════════════════════════════════════════
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de condos" ON public.condos;
CREATE POLICY "SUPERADMINs tem visão global de condos" ON public.condos
  FOR SELECT USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs criam condos" ON public.condos;
CREATE POLICY "SUPERADMINs criam condos" ON public.condos
  FOR INSERT WITH CHECK (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs editam condos" ON public.condos;
CREATE POLICY "SUPERADMINs editam condos" ON public.condos
  FOR UPDATE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

DROP POLICY IF EXISTS "SUPERADMINs deletam condos" ON public.condos;
CREATE POLICY "SUPERADMINs deletam condos" ON public.condos
  FOR DELETE USING (
    public.get_jwt_role() = 'SUPERADMIN'
  );

-- Flush cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- ══════════════════════════════════════════════════
-- Teste de sanidade (rodar no SQL editor do Supabase
-- logado como SUPERADMIN para verificar)
-- ══════════════════════════════════════════════════
-- SELECT public.get_jwt_role();   -- deve retornar 'SUPERADMIN'
-- SELECT COUNT(*) FROM public.profiles;  -- deve retornar todos os registros
