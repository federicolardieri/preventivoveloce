-- ============================================================
-- Preventivo Veloce — Storage bucket avatars + RLS policies
-- ============================================================

-- Crea il bucket avatars come pubblico (le URL pubbliche funzionano senza auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy: l'utente autenticato può caricare nella propria cartella (avatars/{user_id}/*)
CREATE POLICY "Utente carica il proprio avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: chiunque può leggere gli avatar (bucket pubblico)
CREATE POLICY "Avatar pubblicamente leggibili"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Policy: l'utente può aggiornare i propri file
CREATE POLICY "Utente aggiorna il proprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: l'utente può eliminare i propri file
CREATE POLICY "Utente elimina il proprio avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
