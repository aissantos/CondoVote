UPDATE storage.buckets SET public = false WHERE id = 'proxies';

DROP POLICY IF EXISTS "Owner or admin reads proxy" ON storage.objects;
CREATE POLICY "Owner or admin reads proxy"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'proxies'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role IN ('ADMIN', 'SUPERADMIN')
        AND condo_id = (
          SELECT condo_id FROM public.checkins
          WHERE proxy_document_url LIKE '%' || name || '%'
          LIMIT 1
        )
      )
    )
  );

UPDATE storage.buckets SET public = false WHERE id = 'topic_attachments';

DROP POLICY IF EXISTS "Condo members read topic attachments" ON storage.objects;
CREATE POLICY "Condo members read topic attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'topic_attachments'
    AND auth.role() = 'authenticated'
  );
