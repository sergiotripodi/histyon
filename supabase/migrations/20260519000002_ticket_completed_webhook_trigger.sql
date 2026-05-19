-- Abilita pg_net per chiamate HTTP asincrone dal DB
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Funzione chiamata dal trigger: fa POST al webhook quando un ticket diventa COMPLETED.
-- Gestisce egress logging e cache invalidation lato web app — l'agent scrive solo sul DB.
CREATE OR REPLACE FUNCTION notify_ticket_completed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'COMPLETED' AND (OLD.status IS DISTINCT FROM 'COMPLETED') THEN
    PERFORM extensions.net.http_post(
      url     := 'https://www.histyon.com/api/webhook/job-complete',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ahdjhadaksdnandsakka343248hde8hdkasjdakdsdadasdadasadad'
      ),
      body    := jsonb_build_object(
        'ticketId', NEW.id::text,
        'status',   'COMPLETED'
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger sulla tabella tickets
CREATE OR REPLACE TRIGGER on_ticket_completed
AFTER UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION notify_ticket_completed();
