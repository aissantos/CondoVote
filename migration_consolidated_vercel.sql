-- Migration: Aplicar modificacoes das Fases 26, 27 e 29 no Banco de Dados Remoto
-- Este script adiciona as tabelas, colunas adicionais e buckets de Storage que faltavam no projeto hospedado.

-- ==========================================
-- FASE 26: Documentos de Assembleias (Atas, Editais)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.assembly_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_id UUID REFERENCES public.assemblies(id) ON DELETE CASCADE,
  condo_id UUID REFERENCES public.condos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('EDITAL', 'ATA', 'BALANCETE', 'OUTROS')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.assembly_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins do condomínio inserem documentos" ON public.assembly_documents;
CREATE POLICY "Admins do condomínio inserem documentos" ON public.assembly_documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN' AND condo_id = assembly_documents.condo_id)
  );

DROP POLICY IF EXISTS "Moradores leem documentos da assembleia" ON public.assembly_documents;
CREATE POLICY "Moradores leem documentos da assembleia" ON public.assembly_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND condo_id = assembly_documents.condo_id)
  );

INSERT INTO storage.buckets (id, name, public) VALUES ('assembly_documents', 'assembly_documents', true) ON CONFLICT DO NOTHING;

-- ==========================================
-- FASE 27: Metadados Expandidos da Assembleia e Capas
-- ==========================================
ALTER TABLE public.assemblies
  ADD COLUMN IF NOT EXISTS first_call_time TIME,
  ADD COLUMN IF NOT EXISTS second_call_time TIME,
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS notice_url TEXT;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('assembly_covers', 'assembly_covers', true) 
ON CONFLICT DO NOTHING;

-- Políticas Unificadas do Storage para Capas e PDF (Prevenindo duplicação)
DROP POLICY IF EXISTS "Leitura publica assembleias" ON storage.objects;
CREATE POLICY "Leitura publica assembleias" ON storage.objects
  FOR SELECT USING (bucket_id IN ('assembly_covers', 'assembly_documents'));

DROP POLICY IF EXISTS "Admin Upload assemblies" ON storage.objects;
CREATE POLICY "Admin Upload assemblies" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('assembly_covers', 'assembly_documents') AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

DROP POLICY IF EXISTS "Admin Delete assemblies" ON storage.objects;
CREATE POLICY "Admin Delete assemblies" ON storage.objects
  FOR DELETE USING (
    bucket_id IN ('assembly_covers', 'assembly_documents') AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- ==========================================
-- FASE 29: Anexos para as Pautas (Topics)
-- ==========================================
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS attachment_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('topic_attachments', 'topic_attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access Topics" ON storage.objects;
CREATE POLICY "Public Access Topics" ON storage.objects FOR SELECT
USING ( bucket_id = 'topic_attachments' );

DROP POLICY IF EXISTS "Admin Upload Access Topics" ON storage.objects;
CREATE POLICY "Admin Upload Access Topics" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'topic_attachments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ADMIN', 'SUPERADMIN')
  )
);

DROP POLICY IF EXISTS "Admin Delete Access Topics" ON storage.objects;
CREATE POLICY "Admin Delete Access Topics" ON storage.objects FOR DELETE
USING (
  bucket_id = 'topic_attachments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ADMIN', 'SUPERADMIN')
  )
);

DROP POLICY IF EXISTS "Admin Update Access Topics" ON storage.objects;
CREATE POLICY "Admin Update Access Topics" ON storage.objects FOR UPDATE
USING (
  bucket_id = 'topic_attachments' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('ADMIN', 'SUPERADMIN')
  )
);

-- Para garantir que o PostgREST atualiza o Cache imediatamente, prevenindo erros de schema
NOTIFY pgrst, 'reload schema';
