-- =============================================================================
-- MIGRATION: Account retention policy + audit log retention
--
-- Legal basis:
--   GDPR Art. 5(1)(e) — storage limitation: keep only as long as necessary
--   GDPR Art. 17      — right to erasure: delete rejected accounts after 30 days
--   D.Lgs. 196/2003   — same as GDPR for Italian data
--   Garante guidance  — security audit logs: max 2 years for medical SaaS
--
-- Policy:
--   Rejected accounts   → deletion_scheduled_at = created + 30 days
--   Suspended accounts  → deletion_scheduled_at = suspended + 90 days
--   Activity logs       → purged after 2 years (pg_cron, weekly)
-- =============================================================================

-- ─── 1. Profiles: add deletion tracking fields ────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS deletion_reason TEXT
    CHECK (deletion_reason IN ('rejected', 'user_requested', 'suspended_expired')),
  ADD COLUMN IF NOT EXISTS deletion_warning_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.profiles.deletion_reason IS
  'Why this account is scheduled for deletion (GDPR Art.17 documentation)';
COMMENT ON COLUMN public.profiles.deletion_warning_sent_at IS
  'When the 7-day pre-deletion warning email was sent to this user';

-- ─── 2. Enable pg_cron for log retention ─────────────────────────────────────
-- pg_cron purges old activity logs at DB level — no app code required.
-- Runs every Sunday at 04:00 UTC (low-traffic window).

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove stale schedule if it exists (idempotent)
SELECT cron.unschedule('purge-activity-logs') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'purge-activity-logs'
);

SELECT cron.schedule(
  'purge-activity-logs',
  '0 4 * * 0',   -- every Sunday 04:00 UTC
  $$
    DELETE FROM public.doctor_activity_logs WHERE created_at < now() - INTERVAL '2 years';
    DELETE FROM public.admin_activity_logs  WHERE created_at < now() - INTERVAL '2 years';
  $$
);
