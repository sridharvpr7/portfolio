-- ============================================================
-- Contact Submissions & Idempotency — Database Migration
-- Run once against your Neon PostgreSQL database:
--   psql $DATABASE_URL -f api/db/migrations/002_contact_submissions.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS contact_submissions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key  TEXT UNIQUE NOT NULL,
  submission_id    TEXT UNIQUE NOT NULL,
  visitor_name     TEXT NOT NULL,
  visitor_email    TEXT NOT NULL,
  subject          TEXT NOT NULL,
  message          TEXT NOT NULL,
  telegram_sent    BOOLEAN NOT NULL DEFAULT FALSE,
  telegram_error   TEXT,
  email_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  email_error      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_key ON contact_submissions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions(created_at);

