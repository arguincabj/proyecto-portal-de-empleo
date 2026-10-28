-- ============================================================
-- Portal Municipal de Empleo — Migración 012
-- Agregar columna avatar_url en tabla usuarios
-- ============================================================

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS avatar_url text;
