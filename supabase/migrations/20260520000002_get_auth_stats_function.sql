-- Auth stats diretti da PostgreSQL — nessun Management API token richiesto
-- Usata dalla admin console per MAU, third-party MAU e connessioni DB
CREATE OR REPLACE FUNCTION public.get_auth_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'mau', (
      -- Utenti che hanno fatto login negli ultimi 30 giorni (stessa definizione Supabase)
      SELECT count(*)::bigint
      FROM auth.users
      WHERE last_sign_in_at > now() - interval '30 days'
        AND deleted_at IS NULL
    ),
    'total_users', (
      SELECT count(*)::bigint
      FROM auth.users
      WHERE deleted_at IS NULL
    ),
    'third_party_mau', (
      -- Utenti OAuth (Google, GitHub, ecc.) attivi negli ultimi 30 giorni
      SELECT count(*)::bigint
      FROM auth.users
      WHERE raw_app_meta_data->>'provider' NOT IN ('email', 'phone')
        AND last_sign_in_at > now() - interval '30 days'
        AND deleted_at IS NULL
    ),
    'db_connections', (
      -- Connessioni PostgreSQL attive sul database corrente
      SELECT count(*)::bigint
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state IS NOT NULL
    ),
    'db_connections_active', (
      SELECT count(*)::bigint
      FROM pg_stat_activity
      WHERE datname = current_database()
        AND state = 'active'
    )
  );
$$;

-- Esposta solo a service_role (usata dal backend admin, mai lato client)
REVOKE ALL ON FUNCTION public.get_auth_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_auth_stats() TO service_role;
