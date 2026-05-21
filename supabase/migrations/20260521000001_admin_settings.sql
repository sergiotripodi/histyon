-- Tabella impostazioni admin (key-value).
-- Usata per persistere configurazioni che il cron deve leggere
-- ma che non sono accessibili via cookie lato server (es. piano Resend attivo).

create table if not exists admin_settings (
  key        text        primary key,
  value      text        not null,
  updated_at timestamptz not null default now()
);

create or replace function update_admin_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_admin_settings_updated_at on admin_settings;
create trigger trg_admin_settings_updated_at
  before update on admin_settings
  for each row execute function update_admin_settings_updated_at();

alter table admin_settings enable row level security;

-- Seed: piano di default
insert into admin_settings (key, value)
values ('resend_plan', 'free')
on conflict (key) do nothing;
