-- ============================================================
-- Migration 009: Limpieza de esquemas duplicados y vínculo Oferta -> Empresa
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Eliminar tablas duplicadas / no utilizadas (_profiles)
DROP TABLE IF EXISTS municipalidad_profiles CASCADE;
DROP TABLE IF EXISTS empresa_profiles CASCADE;
DROP TABLE IF EXISTS postulante_profiles CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- 2. Vincular 'ofertas' formalmente con 'empresas'
-- Agregamos la columna empresa_id con clave foránea
ALTER TABLE ofertas 
  ADD COLUMN IF NOT EXISTS empresa_id UUID REFERENCES empresas(id) ON DELETE SET NULL;

-- 3. Crear índice para optimizar búsquedas por empresa
CREATE INDEX IF NOT EXISTS idx_ofertas_empresa_id ON ofertas(empresa_id);

-- 4. Asociar ofertas existentes (si coinciden por nombre o asignar a una empresa existente)
UPDATE ofertas o
SET empresa_id = e.id
FROM empresas e
WHERE o.empresa_nombre = e.razon_social
  AND o.empresa_id IS NULL;
