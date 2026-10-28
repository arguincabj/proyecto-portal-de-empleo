-- ============================================================
-- Portal Municipal de Empleo — Migración 014: Duración y Comienzo de Selección
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Agregar columnas para registrar el período de selección laboral
-- fecha_inicio_seleccion: Fecha estipulada de inicio del proceso de selección (por defecto hoy)
-- duracion_dias: Duración de la búsqueda a elección (entre 30 y 60 días, por defecto 30)
-- fecha_fin_seleccion: Fecha límite calculada para la convocatoria

ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS fecha_inicio_seleccion DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS duracion_dias INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS fecha_fin_seleccion DATE;

-- Opcional: constraint para garantizar rango de 30 a 60 días
ALTER TABLE ofertas
  DROP CONSTRAINT IF EXISTS check_duracion_dias;

ALTER TABLE ofertas
  ADD CONSTRAINT check_duracion_dias
  CHECK (duracion_dias IS NULL OR (duracion_dias >= 30 AND duracion_dias <= 60));

-- Actualizar ofertas existentes asignando fechas por defecto si están vacías
UPDATE ofertas
SET
  fecha_inicio_seleccion = COALESCE(fecha_inicio_seleccion, created_at::date),
  duracion_dias = COALESCE(duracion_dias, 30),
  fecha_fin_seleccion = COALESCE(fecha_fin_seleccion, (COALESCE(fecha_inicio_seleccion, created_at::date) + INTERVAL '30 days')::date)
WHERE fecha_fin_seleccion IS NULL;
