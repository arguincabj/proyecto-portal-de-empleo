-- ============================================================
-- Portal Municipal de Empleo — Migración 010: Perfil Laboral
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Agregar campos del Perfil Laboral a la tabla 'postulantes'
-- estudios, cursos, experiencia, idiomas, habilidades, horarios
ALTER TABLE postulantes
  ADD COLUMN IF NOT EXISTS estudios TEXT,
  ADD COLUMN IF NOT EXISTS cursos TEXT,
  ADD COLUMN IF NOT EXISTS experiencia TEXT,
  ADD COLUMN IF NOT EXISTS idiomas TEXT,
  ADD COLUMN IF NOT EXISTS habilidades TEXT,
  ADD COLUMN IF NOT EXISTS horarios TEXT;
