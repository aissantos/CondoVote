-- Migration: RLS completa para a tabela assemblies
-- Problema: a tabela 'assemblies' tem RLS habilitada mas nenhuma policy de
-- INSERT/UPDATE/DELETE foi definida, causando 400 Bad Request ao criar assembleias.

-- ============================================================
-- SELECT: qualquer usuário autenticado do mesmo condomínio
-- ============================================================
DROP POLICY IF EXISTS "Residentes e admins leem assembleias do condominio" ON public.assemblies;
CREATE POLICY "Residentes e admins leem assembleias do condominio"
  ON public.assemblies FOR SELECT
  USING (
    condo_id IN (
      SELECT condo_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ============================================================
-- INSERT: somente ADMIN do condomínio (e SUPERADMIN via JWT)
-- ============================================================
DROP POLICY IF EXISTS "Admins criam assembleias do condominio" ON public.assemblies;
CREATE POLICY "Admins criam assembleias do condominio"
  ON public.assemblies FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPERADMIN')
    OR (
      condo_id IN (
        SELECT condo_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    )
  );

-- ============================================================
-- UPDATE: somente ADMIN do condomínio (e SUPERADMIN)
-- ============================================================
DROP POLICY IF EXISTS "Admins atualizam assembleias do condominio" ON public.assemblies;
CREATE POLICY "Admins atualizam assembleias do condominio"
  ON public.assemblies FOR UPDATE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPERADMIN')
    OR (
      condo_id IN (
        SELECT condo_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    )
  );

-- ============================================================
-- DELETE: somente ADMIN do condomínio (e SUPERADMIN)
-- ============================================================
DROP POLICY IF EXISTS "Admins excluem assembleias do condominio" ON public.assemblies;
CREATE POLICY "Admins excluem assembleias do condominio"
  ON public.assemblies FOR DELETE
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'SUPERADMIN')
    OR (
      condo_id IN (
        SELECT condo_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
      )
    )
  );

-- Força o PostgREST a recarregar o schema e as policies
NOTIFY pgrst, 'reload schema';
