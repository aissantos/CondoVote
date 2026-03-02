-- Função para injetar metadados críticos na raiz da sessão auth
CREATE OR REPLACE FUNCTION public.sync_profile_to_app_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizamos a tabela auth.users correspondente
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || json_build_object('role', NEW.role, 'condo_id', NEW.condo_id)::jsonb
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove qualquer trigger pré-existente
DROP TRIGGER IF EXISTS on_profile_update_sync_claims ON public.profiles;

-- Gatilho de Sincronização
CREATE TRIGGER on_profile_update_sync_claims
AFTER INSERT OR UPDATE OF role, condo_id ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_app_metadata();

-- Seed inicial para injetar nos usuários existentes ativados
UPDATE public.profiles SET updated_at = NOW();
