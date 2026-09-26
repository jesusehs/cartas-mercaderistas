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
