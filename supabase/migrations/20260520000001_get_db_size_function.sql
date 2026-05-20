-- Funzione per leggere la dimensione del database PostgreSQL
-- Usata dalla admin console per mostrare lo storage DB senza richiedere il Management API token
CREATE OR REPLACE FUNCTION public.get_db_size_bytes()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Esposta a service_role (usata solo dal backend admin, mai lato client)
REVOKE ALL ON FUNCTION public.get_db_size_bytes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_db_size_bytes() TO service_role;
