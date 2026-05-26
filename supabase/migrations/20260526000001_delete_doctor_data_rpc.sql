-- Atomic deletion of all doctor data in a single transaction.
-- Called from Server Action deleteAccount() after password re-verification.
-- The auth.users record is deleted separately via admin API outside Postgres.

CREATE OR REPLACE FUNCTION public.delete_doctor_data(p_doctor_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.egress_logs WHERE doctor_id = p_doctor_id;
  DELETE FROM public.tickets     WHERE doctor_id = p_doctor_id;
  DELETE FROM public.patients    WHERE doctor_id = p_doctor_id;
  DELETE FROM public.profiles    WHERE id        = p_doctor_id;
END;
$$;

-- Only the service role (called from server-side) can invoke this function.
REVOKE EXECUTE ON FUNCTION public.delete_doctor_data(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_doctor_data(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_doctor_data(uuid) FROM authenticated;
