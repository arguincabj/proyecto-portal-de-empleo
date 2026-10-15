-- ============================================================
-- Migration 008: Aprobación de perfiles de empresa
-- Agregar columnas estado_aprobacion y email a la tabla empresas
-- ============================================================

-- Agregar columna estado_aprobacion
alter table empresas
  add column if not exists estado_aprobacion text not null default 'pendiente'
    check (estado_aprobacion in ('pendiente', 'aprobada', 'rechazada'));

-- Agregar columna email de contacto de la empresa
alter table empresas
  add column if not exists email text not null default '';

-- Agregar columna motivo_rechazo para feedback de la administración municipal
alter table empresas
  add column if not exists motivo_rechazo text;

-- ============================================================
-- RLS: Permitir a la municipalidad ver y actualizar TODAS las empresas
-- ============================================================

-- Municipalidad puede ver todas las empresas
drop policy if exists "empresas: municipalidad ve todas" on empresas;
create policy "empresas: municipalidad ve todas"
  on empresas for select
  using (rol_actual() = 'municipalidad');

-- Municipalidad puede actualizar el estado_aprobacion de cualquier empresa
drop policy if exists "empresas: municipalidad aprueba" on empresas;
create policy "empresas: municipalidad aprueba"
  on empresas for update
  using (rol_actual() = 'municipalidad');

-- ============================================================
-- Poner todas las empresas existentes en estado pendiente
-- (solo si aún no tienen valor asignado por algún motivo)
-- ============================================================
update empresas set estado_aprobacion = 'pendiente' where estado_aprobacion = 'pendiente';
