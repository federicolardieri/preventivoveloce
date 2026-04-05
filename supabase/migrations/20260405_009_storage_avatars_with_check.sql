-- ============================================================
-- Fix: aggiunge WITH CHECK alla policy UPDATE dello storage avatars.
--
-- Senza WITH CHECK un utente autenticato poteva aggiornare un file
-- nella propria cartella e rinominarlo in una cartella di un altro
-- utente (name: '{altro_user_id}/avatar.jpg'), scrivendo quindi
-- dati in uno spazio non suo.
-- ============================================================

DROP POLICY IF EXISTS "Utente aggiorna il proprio avatar" ON storage.objects;

CREATE POLICY "Utente aggiorna il proprio avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
