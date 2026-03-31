-- ============================================================
-- Preventivo Veloce — Archivio preventivi
-- ============================================================

-- Colonna archived su quotes (default FALSE = visibile normalmente)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS quotes_archived_idx ON quotes (user_id, archived);
