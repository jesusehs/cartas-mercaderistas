-- =====================================================================
--  Cartas de Mercaderistas · Suckot S.A.C.
--  Esquema de base de datos (Supabase / Postgres)
--  Correr una sola vez en: Supabase > SQL Editor > New query > Run
--  (No contiene datos personales: esos se cargan desde la app.)
-- =====================================================================

-- ---------- Usuarios autorizados (lista blanca por correo) ----------
-- rol 'admin'      : ve todo, gestiona usuarios y configuración
-- rol 'supervisor' : ve por defecto sus mercaderistas y genera sus cartas
create table if not exists public.usuarios (
  email   text primary key,
  nombre  text,
  celular text,
  rol     text not null default 'supervisor' check (rol in ('admin','supervisor')),
  creado  timestamptz not null default now()
);

create or replace function public.es_autorizado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios u
                 where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email','')));
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.usuarios u
                 where lower(u.email) = lower(coalesce(auth.jwt() ->> 'email',''))
                   and u.rol = 'admin');
$$;

-- ---------- Tablas ----------
create table if not exists public.mercaderistas (
  id               uuid primary key default gen_random_uuid(),
  nombres          text not null,
  apellidos        text not null,
  dni              text not null unique,
  sexo             text not null default 'F' check (sexo in ('F','M')),
  fecha_ingreso    date,
  fecha_cap_sst    date,
  carnet_salud     text,
  codigo_cfr       text,
  supervisor_email text references public.usuarios(email) on update cascade on delete set null,
  activo           boolean not null default true,
  actualizado      timestamptz not null default now(),
  actualizado_por  text
);

create table if not exists public.tiendas (
  id               uuid primary key default gen_random_uuid(),
  cadena           text not null,
  tienda           text not null,
  nombre_carta     text,
  gerente          text,
  activa           boolean not null default true,
  actualizado      timestamptz not null default now(),
  actualizado_por  text,
  unique (cadena, tienda)
);

create table if not exists public.ruta (
  mercaderista_id  uuid not null references public.mercaderistas(id) on delete cascade,
  tienda_id        uuid not null references public.tiendas(id) on delete cascade,
  actualizado      timestamptz not null default now(),
  actualizado_por  text,
  primary key (mercaderista_id, tienda_id)
);

create table if not exists public.apoyos (
  id               uuid primary key default gen_random_uuid(),
  mercaderista_id  uuid not null references public.mercaderistas(id) on delete cascade,
  tienda_id        uuid not null references public.tiendas(id) on delete cascade,
  desde            date not null,
  hasta            date not null,
  nota             text,
  actualizado      timestamptz not null default now(),
  actualizado_por  text,
  check (hasta >= desde)
);

create table if not exists public.config (
  clave            text primary key,
  valor            text,
  actualizado      timestamptz not null default now(),
  actualizado_por  text
);

-- ---------- Auditoría: quién y cuándo modificó ----------
create or replace function public.tg_auditoria() returns trigger
language plpgsql as $$
begin
  new.actualizado := now();
  new.actualizado_por := coalesce(auth.jwt() ->> 'email', new.actualizado_por);
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['mercaderistas','tiendas','ruta','apoyos','config'] loop
    execute format('drop trigger if exists auditoria on public.%I', t);
    execute format('create trigger auditoria before insert or update on public.%I
                    for each row execute function public.tg_auditoria()', t);
  end loop;
end $$;

-- ---------- Seguridad (RLS): solo usuarios autorizados ----------
do $$
declare t text;
begin
  foreach t in array array['mercaderistas','tiendas','ruta','apoyos','config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "autorizados" on public.%I', t);
    execute format('create policy "autorizados" on public.%I for all to authenticated
                    using (public.es_autorizado()) with check (public.es_autorizado())', t);
  end loop;
end $$;

alter table public.usuarios enable row level security;
drop policy if exists "ver usuarios" on public.usuarios;
drop policy if exists "admin gestiona usuarios" on public.usuarios;
create policy "ver usuarios" on public.usuarios for select to authenticated
  using (public.es_autorizado());
create policy "admin gestiona usuarios" on public.usuarios for all to authenticated
  using (public.es_admin()) with check (public.es_admin());

-- Nadie sin sesión (anon) puede leer nada
revoke all on public.usuarios, public.mercaderistas, public.tiendas, public.ruta,
              public.apoyos, public.config from anon;

-- =====================================================================
--  v2: código de tienda y creación de accesos desde la app
-- =====================================================================
alter table public.tiendas add column if not exists codigo text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'tiendas_codigo_key') then
    alter table public.tiendas add constraint tiendas_codigo_key unique (codigo);
  end if;
end $$;

-- Crea el acceso (correo + contraseña) de un usuario. Solo lo puede usar un administrador.
-- Si el correo ya tiene acceso, no cambia su contraseña.
create or replace function public.crear_acceso(p_email text, p_clave text)
returns text language plpgsql security definer
set search_path = public, auth, extensions as $$
declare
  v_id uuid;
  v_email text := lower(trim(p_email));
begin
  if not public.es_admin() then raise exception 'Solo un administrador puede crear accesos'; end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Correo no válido: %', p_email; end if;
  if length(coalesce(p_clave, '')) < 6 then raise exception 'La contraseña de % debe tener al menos 6 caracteres', v_email; end if;
  select id into v_id from auth.users where lower(email) = v_email;
  if v_id is not null then return 'existente'; end if;
  v_id := gen_random_uuid();
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                          raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                          confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated', v_email,
          extensions.crypt(p_clave, extensions.gen_salt('bf')), now(),
          '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_id, v_id::text,
          jsonb_build_object('sub', v_id::text, 'email', v_email, 'email_verified', true),
          'email', now(), now(), now());
  return 'creado';
end $$;
revoke all on function public.crear_acceso(text, text) from public, anon;
grant execute on function public.crear_acceso(text, text) to authenticated;
