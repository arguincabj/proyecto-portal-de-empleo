-- ============================================================
-- Portal Municipal de Empleo — Migración 018: Categorías Laborales en Perfil de Postulantes
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Agregar campo 'categorias_laborales' a la tabla 'postulantes'
-- Almacena un array JSON o lista de categorías seleccionadas (TEXT[] o JSONB o TEXT)
-- Usamos TEXT[] con fallback compatible o TEXT (JSON)
ALTER TABLE postulantes
  ADD COLUMN IF NOT EXISTS categorias_laborales TEXT[] DEFAULT '{}';
