-- Atomic deletion of a single patient and all related data in one transaction.
-- Deletes: egress_logs (for patient's tickets) → tickets → patient record.
-- Storage objects are deleted separately by the Server Action (best-effort).
-- Called from Server Action deletePatient() after ownership verification.

CREATE OR REPLACE FUNCTION public.delete_patient_data(
  p_doctor_id  uuid,
  p_patient_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete egress logs for all tickets belonging to this patient
  DELETE FROM public.egress_logs
  WHERE ticket_id IN (
    SELECT id FROM public.tickets
    WHERE patient_id = p_patient_id
      AND doctor_id  = p_doctor_id
  );

  DELETE FROM public.tickets
  WHERE patient_id = p_patient_id
    AND doctor_id  = p_doctor_id;

  DELETE FROM public.patients
  WHERE id        = p_patient_id
    AND doctor_id = p_doctor_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_patient_data(uuid, uuid) FROM PUBLIC;
