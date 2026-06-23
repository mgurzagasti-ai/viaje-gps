# RLS para Viaje GPS

## 1. Como encaja RLS en esta arquitectura

Hoy la app ya tiene una separacion logica por propietario:

- cada `trip` tiene `owner_monitor_id`
- el monitor web filtra viajes por esa cuenta
- la app movil entra por `tripCode`

Eso sirve a nivel de codigo, pero todavia la proteccion principal vive en Next.js. Si alguien llegara a consultar Supabase por fuera del flujo esperado, la base no estaria imponiendo por si sola el aislamiento entre clientes.

RLS agrega una segunda capa:

- Next.js sigue validando sesiones y reglas de negocio
- Supabase valida fila por fila quien puede leer o escribir

La idea final es:

1. El monitor inicia sesion con una identidad real de Supabase Auth.
2. Esa identidad queda relacionada con un `monitor_account`.
3. Las politicas RLS comparan el usuario autenticado con `owner_monitor_id`.
4. La base solo devuelve las filas de ese monitor.

En el caso de la app movil, lo ideal a futuro es algo parecido:

1. El conductor inicia sesion o recibe un token de sesion propio.
2. Ese token se relaciona con un `user` y un `trip`.
3. RLS permite leer o escribir solo sobre ese viaje.

## 2. Que falta para usar RLS de verdad

Con el codigo actual, varias consultas a Supabase usan `SUPABASE_SERVICE_ROLE_KEY`. Esa key salta RLS, asi que sirve para tareas administrativas del servidor pero no para aplicar seguridad por usuario final.

Para que RLS sea la barrera real, el siguiente salto de arquitectura seria:

- usar Supabase Auth para monitores
- guardar en `monitor_accounts` una referencia al usuario autenticado de Supabase
- hacer consultas de usuario final con el token del usuario, no con service role
- dejar la `service_role` solo para migraciones, backoffice o tareas internas

Una forma simple de evolucionarlo:

- agregar `auth_user_id uuid unique` en `monitor_accounts`
- al crear la cuenta, crear tambien el usuario en Supabase Auth
- desde Next.js usar el token de Supabase del monitor en vez de la `service_role` para lecturas/escrituras del panel

## 3. SQL base de RLS

Este SQL asume un paso futuro donde `monitor_accounts.auth_user_id = auth.uid()`.

```sql
alter table monitor_accounts
  add column if not exists auth_user_id uuid unique;

alter table monitor_accounts enable row level security;
alter table trips enable row level security;
alter table trip_members enable row level security;
alter table locations enable row level security;
alter table emergency_alerts enable row level security;

drop policy if exists "monitor_accounts_select_own" on monitor_accounts;
create policy "monitor_accounts_select_own"
on monitor_accounts
for select
using (auth_user_id = auth.uid());

drop policy if exists "monitor_accounts_update_own" on monitor_accounts;
create policy "monitor_accounts_update_own"
on monitor_accounts
for update
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "trips_select_own" on trips;
create policy "trips_select_own"
on trips
for select
using (
  owner_monitor_id in (
    select id
    from monitor_accounts
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "trips_insert_own" on trips;
create policy "trips_insert_own"
on trips
for insert
with check (
  owner_monitor_id in (
    select id
    from monitor_accounts
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "trips_update_own" on trips;
create policy "trips_update_own"
on trips
for update
using (
  owner_monitor_id in (
    select id
    from monitor_accounts
    where auth_user_id = auth.uid()
  )
)
with check (
  owner_monitor_id in (
    select id
    from monitor_accounts
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "trips_delete_own" on trips;
create policy "trips_delete_own"
on trips
for delete
using (
  owner_monitor_id in (
    select id
    from monitor_accounts
    where auth_user_id = auth.uid()
  )
);

drop policy if exists "trip_members_select_by_owned_trip" on trip_members;
create policy "trip_members_select_by_owned_trip"
on trip_members
for select
using (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "trip_members_write_by_owned_trip" on trip_members;
create policy "trip_members_write_by_owned_trip"
on trip_members
for all
using (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
)
with check (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "locations_select_by_owned_trip" on locations;
create policy "locations_select_by_owned_trip"
on locations
for select
using (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "locations_write_by_owned_trip" on locations;
create policy "locations_write_by_owned_trip"
on locations
for all
using (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
)
with check (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "emergency_select_by_owned_trip" on emergency_alerts;
create policy "emergency_select_by_owned_trip"
on emergency_alerts
for select
using (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
);

drop policy if exists "emergency_write_by_owned_trip" on emergency_alerts;
create policy "emergency_write_by_owned_trip"
on emergency_alerts
for all
using (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
)
with check (
  trip_id in (
    select id
    from trips
    where owner_monitor_id in (
      select id
      from monitor_accounts
      where auth_user_id = auth.uid()
    )
  )
);
```

## 4. Limitacion actual importante

Si seguis consultando Supabase con `SUPABASE_SERVICE_ROLE_KEY`, estas politicas no te van a proteger en runtime porque esa key bypassa RLS.

Por eso el orden correcto seria:

1. Mantener el aislamiento actual en Next.js.
2. Migrar el login de monitor a Supabase Auth.
3. Activar estas politicas.
4. Mover las consultas del panel a contexto de usuario autenticado.

## 5. Recomendacion concreta

Tu mejor siguiente paso tecnico es:

- agregar `auth_user_id` a `monitor_accounts`
- crear login real con Supabase Auth para monitores
- despues aplicar estas politicas y dejar de depender de `service_role` para el panel

Asi el aislamiento ya no depende solo de que el codigo filtre bien, sino tambien de que la base lo haga cumplir.
