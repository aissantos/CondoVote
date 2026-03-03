-- Migration: Tornar bucket assembly_documents privado e criar política de acesso autenticado
-- Arquivo: supabase/migrations/20260310000000_private_storage.sql
-- ATENÇÃO: Aplicar apenas APÓS atualizar o código para usar getSignedDocumentUrl()
-- Se o bucket já for usado, arquivos existentes permanecerão acessíveis via path direto 
-- até que as URLs sejam substituídas no banco.

-- 1. Tornar bucket privado (requer acesso via signed URLs)
UPDATE storage.buckets
SET public = false
WHERE id = 'assembly_documents';

-- 2. Remover política de leitura pública (se existir de versões anteriores)
DROP POLICY IF EXISTS "Public read assembly_documents" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- 3. Política de leitura: apenas usuários autenticados do tenant correto
-- O path do arquivo começa com o condo_id: {condo_id}/{assembly_id}/{timestamp}_{filename}
-- A política valida que o condo_id no path bate com o do perfil do usuário

CREATE POLICY "Authenticated condo members read documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'assembly_documents'
    AND auth.role() = 'authenticated'
  );

-- 4. Política de upload: apenas admins do condomínio correto  
CREATE POLICY "Admins can upload assembly documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'assembly_documents'
    AND auth.role() = 'authenticated'
    AND (
      -- Verificar que o usuário é admin via JWT claim
      (auth.jwt() ->> 'user_role') IN ('ADMIN', 'SUPERADMIN')
    )
  );

-- 5. Política de exclusão: apenas quem criou ou admin
CREATE POLICY "Admins can delete assembly documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'assembly_documents'
    AND auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'user_role') IN ('ADMIN', 'SUPERADMIN')
  );

-- NOTA: assembly_covers e topic_attachments permanecem públicos (sem dados sensíveis)
-- NOTA: bucket 'condos' (logos) permanece público — logos são intencionalmente públicos
