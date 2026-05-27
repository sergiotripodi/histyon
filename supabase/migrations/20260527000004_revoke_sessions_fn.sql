-- =============================================================================
-- MIGRATION: Session revocation helper functions
--
-- get_my_sessions() / get_sessions_for_user() (migration 000003) expose sessions.
-- These functions close them:
--   • revoke_session(session_id)               — authenticated user, own sessions only
--   • revoke_other_sessions(user_id, keep_id)  — service_role only (password-change flow)
-- =============================================================================

-- ─── 1. Revoke a single session (called by the logged-in user themselves) ─────
CREATE OR REPLACE FUNCTION public.revoke_session(p_session_id UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Safety check: only delete sessions that belong to the caller
  DELETE FROM auth.sessions
  WHERE id      = p_session_id
    AND user_id = auth.uid();
  -- Cascade on session_id FK in auth.refresh_tokens handles token invalidation
END;
$$;

COMMENT ON FUNCTION public.revoke_session(UUID) IS
  'Deletes a session owned by auth.uid(). Cascades to refresh_tokens — fully invalidates the session.';

GRANT EXECUTE ON FUNCTION public.revoke_session(UUID) TO authenticated;

-- ─── 2. Revoke all sessions except the current one (password-change flow) ─────
CREATE OR REPLACE FUNCTION public.revoke_other_sessions(p_user_id UUID, p_current_session_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM auth.sessions
  WHERE user_id = p_user_id
    AND id      != p_current_session_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.revoke_other_sessions(UUID, UUID) IS
  'Deletes all sessions for p_user_id except p_current_session_id. service_role only.';

REVOKE EXECUTE ON FUNCTION public.revoke_other_sessions(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_other_sessions(UUID, UUID) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.revoke_other_sessions(UUID, UUID) TO service_role;
