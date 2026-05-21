-- Tabella snapshot mensili per la console admin di fatturazione.
-- Ogni record rappresenta un mese chiuso con i costi reali per servizio.
-- Viene popolata dal cron job il giorno 30 di ogni mese tramite
-- POST /api/admin/billing/snapshot (autenticato con CRON_SECRET).

create table if not exists admin_billing_snapshots (
  month                text        primary key,          -- 'YYYY-MM'
  vercel_recurring     numeric     not null default 0,   -- piano Vercel
  supabase_recurring   numeric     not null default 0,   -- piano Supabase
  resend_recurring     numeric     not null default 0,   -- piano Resend
  vercel_addon         numeric     not null default 0,   -- domini, overage Vercel
  supabase_addon       numeric     not null default 0,   -- storage/compute overage
  resend_addon         numeric     not null default 0,   -- email overage
  notes                text,
  saved_at             timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

alter table admin_billing_snapshots
  add column if not exists total_cost numeric
    generated always as (
      vercel_recurring + supabase_recurring + resend_recurring +
      vercel_addon     + supabase_addon     + resend_addon
    ) stored;

create or replace function update_billing_snapshot_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_billing_snapshot_updated_at on admin_billing_snapshots;
create trigger trg_billing_snapshot_updated_at
  before update on admin_billing_snapshots
  for each row execute function update_billing_snapshot_updated_at();

alter table admin_billing_snapshots enable row level security;
-- Nessuna policy RLS: accesso esclusivo via service_role key dalle API route admin.
