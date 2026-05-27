-- =============================================================================
-- MIGRATION: PostgreSQL helper functions to expose auth.sessions safely
--
-- auth.sessions is not accessible via PostgREST (auth schema not exposed).
-- These SECURITY DEFINER functions allow controlled access:
--   • get_my_sessions()               — doctor calls with own auth context
--   • get_sessions_for_user(uid UUID) — service-role only (admin dashboard)
-- =============================================================================

-- ─── 1. Doctor: view own active sessions ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_sessions()
RETURNS TABLE (
  id           UUID,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ,
  user_agent   TEXT,
  ip           TEXT
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.created_at,
    s.updated_at,
    s.refreshed_at,
    s.user_agent,
    s.ip::TEXT
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY COALESCE(s.refreshed_at, s.updated_at) DESC
  LIMIT 10;
$$;

COMMENT ON FUNCTION public.get_my_sessions() IS
  'Returns up to 10 auth sessions for the currently logged-in user. GDPR Art. 15 — right of access.';

GRANT EXECUTE ON FUNCTION public.get_my_sessions() TO authenticated;

-- ─── 2. Admin: view sessions for any user (service-role only) ─────────────────
CREATE OR REPLACE FUNCTION public.get_sessions_for_user(uid UUID)
RETURNS TABLE (
  id           UUID,
  created_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ,
  refreshed_at TIMESTAMPTZ,
  user_agent   TEXT,
  ip           TEXT
)
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.created_at,
    s.updated_at,
    s.refreshed_at,
    s.user_agent,
    s.ip::TEXT
  FROM auth.sessions s
  WHERE s.user_id = uid
  ORDER BY COALESCE(s.refreshed_at, s.updated_at) DESC
  LIMIT 10;
$$;

COMMENT ON FUNCTION public.get_sessions_for_user(UUID) IS
  'Returns up to 10 auth sessions for the given user. Callable only by service_role (admin dashboard).';

-- Revoke from everyone, then grant only service_role
REVOKE EXECUTE ON FUNCTION public.get_sessions_for_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_sessions_for_user(UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_sessions_for_user(UUID) TO service_role;
