-- Aggiunge colonna per salvare la firma autografa del cliente (base64 PNG)
ALTER TABLE public.quote_tokens
ADD COLUMN IF NOT EXISTS signature_data TEXT;
