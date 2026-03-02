-- Roadmap V2 - Fase 1: Módulo SuperAdmin (RBAC)
-- Este script injeta políticas RLS definitivas e supremas para que a role 'SUPERADMIN' tenha Bypass global de leitura e gravação no banco de dados isoladamente.

-- ==========================================
-- 1. Políticas RLS para Tabela PROFILES
-- ==========================================
-- Permite leitura de TODOS os perfis se o usuário for SUPERADMIN
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de profiles" ON public.profiles;
CREATE POLICY "SUPERADMINs tem visão global de profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Permite atualizar TODOS os perfis
DROP POLICY IF EXISTS "SUPERADMINs editam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs editam qualquer profile" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Permite deletar TODOS os perfis
DROP POLICY IF EXISTS "SUPERADMINs deletam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs deletam qualquer profile" ON public.profiles
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );


-- ==========================================
-- 2. Políticas RLS para Tabela CONDOS
-- ==========================================
-- Permite leitura de TODOS os domínios corporativos
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de condos" ON public.condos;
CREATE POLICY "SUPERADMINs tem visão global de condos" ON public.condos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Permite atualizar/inserção/deleção de Condomínios e Empresas
DROP POLICY IF EXISTS "SUPERADMINs criam condos" ON public.condos;
CREATE POLICY "SUPERADMINs criam condos" ON public.condos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

DROP POLICY IF EXISTS "SUPERADMINs editam condos" ON public.condos;
CREATE POLICY "SUPERADMINs editam condos" ON public.condos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

DROP POLICY IF EXISTS "SUPERADMINs deletam condos" ON public.condos;
CREATE POLICY "SUPERADMINs deletam condos" ON public.condos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPERADMIN')
  );

-- Notify pra Flush Cache
NOTIFY pgrst, 'reload schema';
