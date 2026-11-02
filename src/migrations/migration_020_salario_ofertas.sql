-- ============================================================
-- Portal Municipal de Empleo — Migración 020: Salario opcional en ofertas
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Agregar columna 'salario' opcional (NUMERIC) en la tabla ofertas
ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT NULL;

-- 2. Crear índice para optimizar búsquedas y filtros por salario
CREATE INDEX IF NOT EXISTS idx_ofertas_salario ON ofertas(salario);
