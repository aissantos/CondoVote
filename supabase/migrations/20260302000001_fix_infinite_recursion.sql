-- Fix for infinite recursion in profiles RLS policies

-- 1. Create a SECURITY DEFINER function to check for superadmin safely 
-- This bypasses RLS on the profiles table, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  ) = 'SUPERADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update PROFILES RLS overrides
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de profiles" ON public.profiles;
CREATE POLICY "SUPERADMINs tem visão global de profiles" ON public.profiles
  FOR SELECT USING ( public.is_superadmin() );

DROP POLICY IF EXISTS "SUPERADMINs editam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs editam qualquer profile" ON public.profiles
  FOR UPDATE USING ( public.is_superadmin() );

DROP POLICY IF EXISTS "SUPERADMINs deletam qualquer profile" ON public.profiles;
CREATE POLICY "SUPERADMINs deletam qualquer profile" ON public.profiles
  FOR DELETE USING ( public.is_superadmin() );

-- 3. Update CONDOS RLS overrides
DROP POLICY IF EXISTS "SUPERADMINs tem visão global de condos" ON public.condos;
CREATE POLICY "SUPERADMINs tem visão global de condos" ON public.condos
  FOR SELECT USING ( public.is_superadmin() );

DROP POLICY IF EXISTS "SUPERADMINs criam condos" ON public.condos;
CREATE POLICY "SUPERADMINs criam condos" ON public.condos
  FOR INSERT WITH CHECK ( public.is_superadmin() );

DROP POLICY IF EXISTS "SUPERADMINs editam condos" ON public.condos;
CREATE POLICY "SUPERADMINs editam condos" ON public.condos
  FOR UPDATE USING ( public.is_superadmin() );

DROP POLICY IF EXISTS "SUPERADMINs deletam condos" ON public.condos;
CREATE POLICY "SUPERADMINs deletam condos" ON public.condos
  FOR DELETE USING ( public.is_superadmin() );

NOTIFY pgrst, 'reload schema';
