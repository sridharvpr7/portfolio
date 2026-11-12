-- ============================================================
-- Portfolio Visitor Analytics — Database Migration
-- Run once against your Neon PostgreSQL database:
--   psql $DATABASE_URL -f api/db/migrations/001_initial.sql
-- ============================================================

-- Extension for uuid generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ──────────────────────────────────────────────────────────
-- Visitor accounts (Google-authenticated)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visitor_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub          TEXT UNIQUE NOT NULL,          -- verified Google subject claim
  display_name        TEXT,                          -- from verified Google token (read-only)
  email               TEXT,                          -- from verified Google token (read-only)
  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_visits        INTEGER NOT NULL DEFAULT 0,
  email_consent       BOOLEAN NOT NULL DEFAULT FALSE,
  email_consent_at    TIMESTAMPTZ,
  greeting_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  greeting_sent_at    TIMESTAMPTZ,
  email_unsubscribed  BOOLEAN NOT NULL DEFAULT FALSE,
  email_unsub_at      TIMESTAMPTZ,
  deleted_at          TIMESTAMPTZ,                   -- soft delete for GDPR
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Visit events
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS visit_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token       TEXT NOT NULL,                 -- opaque first-party session id
  visitor_account_id  UUID REFERENCES visitor_accounts(id) ON DELETE SET NULL,
  page_path           TEXT NOT NULL DEFAULT '/',
  referrer            TEXT,
  user_agent_class    TEXT,                          -- Desktop / Mobile / Bot (coarse, no fingerprint)
  is_bot              BOOLEAN NOT NULL DEFAULT FALSE,
  visited_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────────
-- Active sessions / heartbeats (for live counter)
-- ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS active_sessions (
  session_token       TEXT PRIMARY KEY,
  visitor_account_id  UUID REFERENCES visitor_accounts(id) ON DELETE CASCADE,
  last_heartbeat_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_path           TEXT NOT NULL DEFAULT '/',
  is_bot              BOOLEAN NOT NULL DEFAULT FALSE
);

-- ──────────────────────────────────────────────────────────
-- Indexes
-- ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_visit_events_visited_at   ON visit_events(visited_at);
CREATE INDEX IF NOT EXISTS idx_visit_events_session      ON visit_events(session_token);
CREATE INDEX IF NOT EXISTS idx_visit_events_account      ON visit_events(visitor_account_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_heartbeat ON active_sessions(last_heartbeat_at);

-- ──────────────────────────────────────────────────────────
-- updated_at trigger for visitor_accounts
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_visitor_accounts_updated_at ON visitor_accounts;
CREATE TRIGGER trg_visitor_accounts_updated_at
  BEFORE UPDATE ON visitor_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
