-- Add attachments column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
