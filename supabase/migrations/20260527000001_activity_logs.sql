-- =============================================================================
-- MIGRATION: Audit Log System
-- GDPR Art. 32 + D.Lgs. 196/2003 — misure tecniche appropriate per dati sanitari
--
-- Tabelle:
--   doctor_activity_logs  — ogni azione significativa di un medico
--   admin_activity_logs   — accessi e azioni amministrative
--     (rinomina e espansione di admin_access_logs)
--
-- Campi coerenti tra le due tabelle:
--   action, success, ip_address, user_agent, metadata, created_at
-- =============================================================================

-- ─── 1. doctor_activity_logs ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.doctor_activity_logs (
  id           UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action       TEXT        NOT NULL,
  -- Entità coinvolta (opzionale — per azioni su pazienti/ticket)
  entity_type  TEXT        CHECK (entity_type IN ('patient','ticket','account','session')),
  entity_id    UUID,
  -- Esito
  success      BOOLEAN     NOT NULL DEFAULT true,
  -- Contesto richiesta
  ip_address   TEXT,
  user_agent   TEXT,
  -- Dati aggiuntivi liberi (es. { patient_name: 'Mario Rossi' })
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_doctor_activity_logs_doctor_created
  ON public.doctor_activity_logs (doctor_id, created_at DESC);

-- RLS: il medico legge solo i propri log — scrittura solo via service role
ALTER TABLE public.doctor_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_activity_logs_select_own" ON public.doctor_activity_logs;
CREATE POLICY "doctor_activity_logs_select_own"
  ON public.doctor_activity_logs FOR SELECT
  USING (doctor_id = auth.uid());

-- Nessuna INSERT/UPDATE/DELETE via anonkey — solo service role
REVOKE INSERT, UPDATE, DELETE ON public.doctor_activity_logs FROM authenticated, anon;

-- ─── 2. admin_activity_logs (rinomina + espansione di admin_access_logs) ─────

-- Rinomina tabella (idempotente tramite DO block)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_access_logs'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_activity_logs'
  ) THEN
    ALTER TABLE public.admin_access_logs RENAME TO admin_activity_logs;
  END IF;
END $$;

-- Crea la tabella se non è ancora stata rinominata (prima migrazione fresca)
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id       UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action         TEXT        NOT NULL,
  target_user_id UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  success        BOOLEAN     NOT NULL DEFAULT true,
  ip_address     TEXT,
  user_agent     TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Aggiunge colonne mancanti (idempotente)
ALTER TABLE public.admin_activity_logs
  ADD COLUMN IF NOT EXISTS target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS success        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS user_agent     TEXT,
  ADD COLUMN IF NOT EXISTS metadata       JSONB;

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_created
  ON public.admin_activity_logs (admin_id, created_at DESC);

-- RLS: solo service role scrive; nessun accesso anonkey in lettura
-- (admin legge i log via service role nel dashboard)
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_activity_logs_no_public" ON public.admin_activity_logs;
CREATE POLICY "admin_activity_logs_no_public"
  ON public.admin_activity_logs FOR ALL
  USING (false);

REVOKE INSERT, UPDATE, DELETE ON public.admin_activity_logs FROM authenticated, anon;
