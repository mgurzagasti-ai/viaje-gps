create table if not exists monitor_accounts (
  id text primary key,
  name text not null,
  username text not null unique,
  password text not null,
  created_at timestamptz not null,
  auth_user_id uuid unique
);

alter table monitor_accounts
  add column if not exists auth_user_id uuid unique;

create table if not exists users (
  id text primary key,
  name text not null,
  phone text not null,
  role text not null check (role in ('coordinator', 'driver', 'support', 'traveler'))
);

create table if not exists trips (
  id text primary key,
  name text not null,
  code text not null unique,
  status text not null check (status in ('planned', 'active', 'paused', 'completed')),
  starts_at timestamptz not null,
  origin text not null,
  destination text not null,
  checkpoint text not null,
  owner_monitor_id text not null references monitor_accounts(id) on delete cascade,
  alternative_checkpoints jsonb not null default '[]'::jsonb
);

alter table trips
  add column if not exists alternative_checkpoints jsonb not null default '[]'::jsonb;

alter table trips
  add column if not exists owner_monitor_id text references monitor_accounts(id) on delete cascade;

create table if not exists trip_members (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  member_role text not null check (member_role in ('coordinator', 'driver', 'support', 'traveler')),
  joined_at timestamptz not null
);

create unique index if not exists trip_members_trip_user_idx
  on trip_members (trip_id, user_id);

create table if not exists locations (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy double precision not null,
  speed double precision not null,
  battery_level integer not null,
  signal_strength text not null check (signal_strength in ('high', 'medium', 'low')),
  recorded_at timestamptz not null,
  source text not null check (source in ('mobile'))
);

create index if not exists locations_trip_recorded_at_idx
  on locations (trip_id, recorded_at desc);

create index if not exists locations_trip_user_recorded_at_idx
  on locations (trip_id, user_id, recorded_at desc);

create table if not exists emergency_alerts (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  user_id text not null references users(id) on delete cascade,
  type text not null check (type in ('accident', 'sos')),
  message text not null,
  status text not null check (status in ('active', 'resolved')) default 'active',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  resolved_at timestamptz
);

create index if not exists emergency_alerts_trip_status_updated_idx
  on emergency_alerts (trip_id, status, updated_at desc);

create unique index if not exists emergency_alerts_trip_user_active_idx
  on emergency_alerts (trip_id, user_id, status)
  where status = 'active';

create table if not exists sessions (
  token text primary key,
  user_id text not null references users(id) on delete cascade,
  trip_id text not null references trips(id) on delete cascade,
  created_at timestamptz not null
);

create unique index if not exists sessions_user_trip_idx
  on sessions (user_id, trip_id);

insert into monitor_accounts (id, name, username, password, created_at)
values
  ('mon_default', 'Viaje GPS Demo', 'viaje-gps', 'viaje123', '2026-05-18T16:50:00.000Z')
on conflict (id) do nothing;

-- Nota:
-- Las cuentas nuevas ya se guardan con hash scrypt desde la app.
-- Si una cuenta vieja sigue en texto plano, se migra automaticamente al primer login exitoso.
-- Si una cuenta todavia no tiene auth_user_id, se enlaza con Supabase Auth al primer login exitoso.

insert into users (id, name, phone, role)
values
  ('usr_lucia', 'Lucia Fernandez', '+54 388 455 1001', 'driver'),
  ('usr_martin', 'Martin Quiroga', '+54 388 455 1002', 'driver'),
  ('usr_camila', 'Camila Ruiz', '+54 388 455 1003', 'driver'),
  ('usr_bruno', 'Bruno Salas', '+54 388 455 1004', 'driver')
on conflict (id) do nothing;

insert into trips (
  id,
  name,
  code,
  status,
  starts_at,
  origin,
  destination,
  checkpoint,
  owner_monitor_id,
  alternative_checkpoints
)
values
  (
    'trip_jujuy_001',
    'Viaje Jujuy Norte',
    'JUJUY-2026',
    'active',
    '2026-05-18T17:30:00.000Z',
    'San Salvador de Jujuy',
    'Humahuaca',
    'Termas de Reyes',
    'mon_default',
    '["Yala - descanso", "Volcan - agrupacion"]'::jsonb
  )
on conflict (id) do nothing;

insert into trip_members (id, trip_id, user_id, member_role, joined_at)
values
  ('tm_1', 'trip_jujuy_001', 'usr_lucia', 'driver', '2026-05-18T17:15:00.000Z'),
  ('tm_2', 'trip_jujuy_001', 'usr_martin', 'driver', '2026-05-18T17:15:00.000Z'),
  ('tm_3', 'trip_jujuy_001', 'usr_camila', 'driver', '2026-05-18T17:18:00.000Z'),
  ('tm_4', 'trip_jujuy_001', 'usr_bruno', 'driver', '2026-05-18T17:20:00.000Z')
on conflict (id) do nothing;

insert into locations (
  id,
  trip_id,
  user_id,
  latitude,
  longitude,
  accuracy,
  speed,
  battery_level,
  signal_strength,
  recorded_at,
  source
)
values
  ('loc_1', 'trip_jujuy_001', 'usr_lucia', -24.1785, -65.3126, 6, 45, 82, 'high', '2026-05-18T18:07:48.000Z', 'mobile'),
  ('loc_2', 'trip_jujuy_001', 'usr_martin', -24.121, -65.427, 9, 0, 65, 'medium', '2026-05-18T18:08:04.000Z', 'mobile'),
  ('loc_3', 'trip_jujuy_001', 'usr_camila', -24.045, -65.3921, 5, 38, 91, 'high', '2026-05-18T18:08:10.000Z', 'mobile'),
  ('loc_4', 'trip_jujuy_001', 'usr_bruno', -24.0902, -65.4782, 18, 12, 48, 'low', '2026-05-18T18:07:32.000Z', 'mobile')
on conflict (id) do nothing;

insert into emergency_alerts (
  id,
  trip_id,
  user_id,
  type,
  message,
  status,
  created_at,
  updated_at,
  resolved_at
)
values
  (
    'alert_demo_1',
    'trip_jujuy_001',
    'usr_bruno',
    'sos',
    'Pedido urgente de ayuda a la flota.',
    'active',
    '2026-05-18T18:08:20.000Z',
    '2026-05-18T18:08:20.000Z',
    null
  )
on conflict (id) do nothing;
