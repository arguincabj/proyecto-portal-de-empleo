-- ============================================================
-- Portal Municipal de Empleo — Migración 011: Domicilio de Postulantes
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Agregar campos de localidad, dirección y código postal a la tabla 'postulantes'
ALTER TABLE postulantes
  ADD COLUMN IF NOT EXISTS localidad TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS codigo_postal TEXT;
