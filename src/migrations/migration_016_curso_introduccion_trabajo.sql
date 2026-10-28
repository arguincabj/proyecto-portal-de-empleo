-- ============================================================
-- Portal Municipal de Empleo — Migración 016: Curso de Introducción al Trabajo (CIT)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Agregar columnas en la tabla postulantes para controlar las derivaciones al CIT (Curso de Introducción al Trabajo)
-- cit_asignado: Indica si fue derivado al curso dictado por el municipio tras 3 rechazos en entrevistas
-- cit_fecha_asignacion: Cuándo fue derivado al curso
-- cit_estado: 'pendiente', 'en_curso', 'completado'

ALTER TABLE postulantes
  ADD COLUMN IF NOT EXISTS cit_asignado BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cit_fecha_asignacion TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cit_estado TEXT DEFAULT 'pendiente';
