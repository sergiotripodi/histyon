-- Bucket tissues: RLS policies
-- Dottori autenticati possono creare signed upload URL solo nella propria cartella input/{user_id}/
CREATE POLICY "doctor_can_upload_own_input"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tissues'
  AND (storage.foldername(name))[1] = 'input'
  AND (storage.foldername(name))[2] = (auth.uid())::text
);

-- Service role: accesso completo (proxy tile, delete, signed URL DZI)
CREATE POLICY "service_role_full_access"
ON storage.objects FOR ALL
TO service_role
USING  (bucket_id = 'tissues')
WITH CHECK (bucket_id = 'tissues');
