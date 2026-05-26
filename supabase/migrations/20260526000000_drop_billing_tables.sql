-- Rimuove le tabelle di fatturazione non più necessarie.
-- admin_billing_snapshots era usata dal cron job per salvare snapshot mensili dei costi.
-- admin_settings era usata solo per persistere la chiave resend_plan lato cron.
-- Entrambe le funzionalità sono state rimosse.

drop trigger if exists trg_billing_snapshot_updated_at on admin_billing_snapshots;
drop function if exists update_billing_snapshot_updated_at();
drop table if exists admin_billing_snapshots;

drop trigger if exists trg_admin_settings_updated_at on admin_settings;
drop function if exists update_admin_settings_updated_at();
drop table if exists admin_settings;
