-- ============================================================
-- APLICAR DIRETO NO SQL EDITOR DO SUPABASE DASHBOARD
-- Este script é idempotente — pode ser rodado múltiplas vezes.
-- Corrige: colunas opcionais da tabela assemblies + RLS completa
-- ============================================================

-- 1. Garante que as colunas opcionais existem
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assemblies' AND column_name='cover_url') THEN
    ALTER TABLE public.assemblies ADD COLUMN cover_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assemblies' AND column_name='notice_url') THEN
    ALTER TABLE public.assemblies ADD COLUMN notice_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assemblies' AND column_name='format') THEN
    ALTER TABLE public.assemblies ADD COLUMN format TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assemblies' AND column_name='first_call_time') THEN
    ALTER TABLE public.assemblies ADD COLUMN first_call_time TIME;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='assemblies' AND column_name='second_call_time') THEN
    ALTER TABLE public.assemblies ADD COLUMN second_call_time TIME;
  END IF;
END;
$$;

-- 2. Garante que RLS está habilitada na tabela
ALTER TABLE public.assemblies ENABLE ROW LEVEL SECURITY;

-- 3. Recria as 4 políticas RLS (SELECT / INSERT / UPDATE / DELETE)
DROP POLICY IF EXISTS "Residentes e admins leem assembleias do condominio" ON public.assemblies;
CREATE POLICY "Residentes e admins leem assembleias do condominio"
  ON public.assemblies FOR SELECT
  USING (
    condo_id IN (SELECT condo_id FROM public.profiles WHERE id = auth.uid())
  );

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

-- 4. Recarrega o schema no PostgREST (elimina cache de schema)
NOTIFY pgrst, 'reload schema';

SELECT 'OK: assemblies schema + RLS configurados com sucesso' AS resultado;
