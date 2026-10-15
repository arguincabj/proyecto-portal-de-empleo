-- ============================================================
-- Portal Municipal de Empleo — Migración CONSOLIDADA (limpia)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================
-- ATENCIÓN: Esto borra y recrea TODAS las tablas y tipos.
-- Solo usar en base de desarrollo/prueba.
-- ============================================================

-- ------------------------------------------------------------
-- 1. BORRAR TABLAS EXISTENTES (en orden por dependencias)
-- ------------------------------------------------------------
drop table if exists derivaciones          cascade;
drop table if exists postulaciones         cascade;
drop table if exists oferta_categorias     cascade;
drop table if exists postulante_categorias cascade;
drop table if exists ofertas               cascade;
drop table if exists categorias            cascade;
drop table if exists postulantes           cascade;
drop table if exists empresas              cascade;
drop table if exists usuarios              cascade;

-- ------------------------------------------------------------
-- 2. BORRAR TIPOS ENUMERADOS EXISTENTES
-- ------------------------------------------------------------
drop type if exists estado_oferta      cascade;
drop type if exists estado_postulacion cascade;
drop type if exists estado_empresa     cascade;
drop type if exists rol_usuario        cascade;
-- por si se crearon con nombres invertidos
drop type if exists oferta_estado      cascade;

-- ------------------------------------------------------------
-- 3. BORRAR POLÍTICAS DE STORAGE (si existen)
-- ------------------------------------------------------------
drop policy if exists "curricula: postulante sube su cv"  on storage.objects;
drop policy if exists "curricula: leer cv"                on storage.objects;
drop policy if exists "curricula: postulante elimina su cv" on storage.objects;

-- ------------------------------------------------------------
-- 4. BORRAR FUNCIÓN AUXILIAR (si existe)
-- ------------------------------------------------------------
drop function if exists rol_actual();

-- ============================================================
-- AHORA CREAMOS TODO DESDE CERO
-- ============================================================

-- EXTENSIONES
create extension if not exists "pgcrypto";

-- TIPOS ENUMERADOS
create type estado_oferta      as enum ('borrador', 'activa', 'cerrada');
create type estado_postulacion as enum ('recibida', 'en_revision', 'derivada', 'rechazada_municipalidad');
create type estado_empresa     as enum ('pendiente', 'en_proceso', 'contratado', 'rechazado');
create type rol_usuario        as enum ('postulante', 'empresa', 'municipalidad');

-- USUARIOS
create table usuarios (
  id         uuid primary key,
  nombre     text        not null,
  apellido   text        not null,
  telefono   text        not null,
  rol        rol_usuario not null,
  created_at timestamptz not null default now()
);

-- EMPRESAS
create table empresas (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid        not null unique references usuarios(id) on delete cascade,
  razon_social text        not null default '',
  cuit         text        not null default '' unique,
  rubro        text        not null default '',
  descripcion  text,
  created_at   timestamptz not null default now()
);

-- POSTULANTES
create table postulantes (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid        not null unique references usuarios(id) on delete cascade,
  cv_url     text,
  dni        text unique,
  created_at timestamptz not null default now()
);

-- CATEGORÍAS LABORALES
create table categorias (
  id     uuid primary key default gen_random_uuid(),
  nombre text not null unique
);

-- RELACIÓN POSTULANTE ↔ CATEGORÍAS (N:M)
create table postulante_categorias (
  postulante_id uuid not null references postulantes(id) on delete cascade,
  categoria_id  uuid not null references categorias(id)  on delete cascade,
  primary key (postulante_id, categoria_id)
);

-- OFERTAS LABORALES
create table ofertas (
  id             uuid          primary key default gen_random_uuid(),
  empresa_nombre text          not null,
  titulo         text          not null,
  descripcion    text          not null,
  estado         estado_oferta not null default 'activa',
  created_at     timestamptz   not null default now()
);

-- RELACIÓN OFERTA ↔ CATEGORÍAS (N:M)
create table oferta_categorias (
  oferta_id    uuid not null references ofertas(id)    on delete cascade,
  categoria_id uuid not null references categorias(id) on delete cascade,
  primary key (oferta_id, categoria_id)
);

-- POSTULACIONES
create table postulaciones (
  id            uuid               primary key default gen_random_uuid(),
  oferta_id     uuid               not null references ofertas(id)     on delete cascade,
  postulante_id uuid               not null references postulantes(id) on delete cascade,
  estado        estado_postulacion not null default 'recibida',
  created_at    timestamptz        not null default now(),
  unique (oferta_id, postulante_id)
);

-- DERIVACIONES
create table derivaciones (
  id                       uuid           primary key default gen_random_uuid(),
  postulacion_id           uuid           not null unique references postulaciones(id) on delete cascade,
  municipalidad_usuario_id uuid           not null references usuarios(id),
  nota_municipalidad       text,
  estado_empresa           estado_empresa not null default 'pendiente',
  nota_empresa             text,
  created_at               timestamptz    not null default now(),
  updated_at               timestamptz    not null default now()
);

-- DATOS INICIALES — categorías laborales
insert into categorias (nombre) values
  ('Administración'),
  ('Comercio y Ventas'),
  ('Construcción'),
  ('Educación'),
  ('Gastronomía'),
  ('Informática y Tecnología'),
  ('Logística y Transporte'),
  ('Salud'),
  ('Seguridad'),
  ('Servicios Generales')
on conflict (nombre) do nothing;

-- ============================================================
-- RLS + POLÍTICAS
-- ============================================================

-- Función auxiliar: rol del usuario autenticado
create or replace function rol_actual()
returns rol_usuario
language sql
security definer
stable
as $$
  select rol from usuarios where id = auth.uid()
$$;

-- Habilitar RLS
alter table usuarios              enable row level security;
alter table postulantes           enable row level security;
alter table empresas              enable row level security;
alter table ofertas               enable row level security;
alter table categorias            enable row level security;
alter table oferta_categorias     enable row level security;
alter table postulante_categorias enable row level security;
alter table postulaciones         enable row level security;
alter table derivaciones          enable row level security;

-- USUARIOS
create policy "usuarios: ver propio perfil"
  on usuarios for select using (auth.uid() = id);
create policy "usuarios: municipalidad ve todos"
  on usuarios for select using (rol_actual() = 'municipalidad');
create policy "usuarios: editar propio perfil"
  on usuarios for update using (auth.uid() = id);

-- POSTULANTES
create policy "postulantes: ver propio perfil"
  on postulantes for select using (auth.uid() = usuario_id);
create policy "postulantes: municipalidad ve todos"
  on postulantes for select using (rol_actual() = 'municipalidad');
create policy "postulantes: editar propio perfil"
  on postulantes for update using (auth.uid() = usuario_id);

-- EMPRESAS
create policy "empresas: ver propio perfil"
  on empresas for select using (auth.uid() = usuario_id);
create policy "empresas: municipalidad ve todas"
  on empresas for select using (rol_actual() = 'municipalidad');
create policy "empresas: editar propio perfil"
  on empresas for update using (auth.uid() = usuario_id);

-- OFERTAS
create policy "ofertas: lectura pública (activas)"
  on ofertas for select using (estado = 'activa');
create policy "ofertas: lectura autenticada (todas)"
  on ofertas for select using (rol_actual() in ('empresa', 'municipalidad'));
create policy "ofertas: insertar (empresa o municipalidad)"
  on ofertas for insert with check (rol_actual() in ('empresa', 'municipalidad'));
create policy "ofertas: actualizar (municipalidad)"
  on ofertas for update using (rol_actual() = 'municipalidad');
create policy "ofertas: eliminar (municipalidad)"
  on ofertas for delete using (rol_actual() = 'municipalidad');

-- CATEGORÍAS
create policy "categorias: lectura pública"
  on categorias for select using (true);
create policy "categorias: insertar (municipalidad)"
  on categorias for insert with check (rol_actual() = 'municipalidad');
create policy "categorias: actualizar (municipalidad)"
  on categorias for update using (rol_actual() = 'municipalidad');
create policy "categorias: eliminar (municipalidad)"
  on categorias for delete using (rol_actual() = 'municipalidad');

-- OFERTA_CATEGORIAS
create policy "oferta_categorias: lectura pública"
  on oferta_categorias for select using (true);
create policy "oferta_categorias: insertar (empresa o municipalidad)"
  on oferta_categorias for insert with check (rol_actual() in ('empresa', 'municipalidad'));
create policy "oferta_categorias: eliminar (empresa o municipalidad)"
  on oferta_categorias for delete using (rol_actual() in ('empresa', 'municipalidad'));

-- POSTULANTE_CATEGORIAS
create policy "postulante_categorias: ver propias"
  on postulante_categorias for select using (
    exists (select 1 from postulantes where id = postulante_id and usuario_id = auth.uid())
    or rol_actual() = 'municipalidad'
  );
create policy "postulante_categorias: insertar propias"
  on postulante_categorias for insert with check (
    exists (select 1 from postulantes where id = postulante_id and usuario_id = auth.uid())
  );
create policy "postulante_categorias: eliminar propias"
  on postulante_categorias for delete using (
    exists (select 1 from postulantes where id = postulante_id and usuario_id = auth.uid())
  );

-- POSTULACIONES
create policy "postulaciones: ver propias (postulante)"
  on postulaciones for select using (
    exists (select 1 from postulantes where id = postulante_id and usuario_id = auth.uid())
  );
create policy "postulaciones: ver todas (empresa o municipalidad)"
  on postulaciones for select using (rol_actual() in ('empresa', 'municipalidad'));
create policy "postulaciones: postular"
  on postulaciones for insert with check (
    exists (select 1 from postulantes where id = postulante_id and usuario_id = auth.uid())
  );
create policy "postulaciones: actualizar estado (municipalidad)"
  on postulaciones for update using (rol_actual() = 'municipalidad');
create policy "postulaciones: retirar (postulante)"
  on postulaciones for delete using (
    exists (select 1 from postulantes where id = postulante_id and usuario_id = auth.uid())
  );

-- DERIVACIONES
create policy "derivaciones: ver (empresa o municipalidad)"
  on derivaciones for select using (rol_actual() in ('empresa', 'municipalidad'));
create policy "derivaciones: insertar (municipalidad)"
  on derivaciones for insert with check (rol_actual() = 'municipalidad');
create policy "derivaciones: actualizar (municipalidad)"
  on derivaciones for update using (rol_actual() = 'municipalidad');
create policy "derivaciones: eliminar (municipalidad)"
  on derivaciones for delete using (rol_actual() = 'municipalidad');

-- ============================================================
-- STORAGE — Bucket para CVs
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'curricula',
  'curricula',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "curricula: postulante sube su cv"
  on storage.objects for insert
  with check (
    bucket_id = 'curricula'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
    and rol_actual() = 'postulante'
  );

create policy "curricula: leer cv"
  on storage.objects for select
  using (
    bucket_id = 'curricula'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or rol_actual() = 'municipalidad'
    )
  );

create policy "curricula: postulante elimina su cv"
  on storage.objects for delete
  using (
    bucket_id = 'curricula'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
