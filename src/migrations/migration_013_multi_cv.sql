-- Migración 013: Soporte para hasta 3 CVs por postulante y selección en postulaciones

-- 1. Crear tabla curricula
CREATE TABLE IF NOT EXISTS curricula (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  postulante_id UUID NOT NULL REFERENCES postulantes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para búsqueda rápida por postulante
CREATE INDEX IF NOT EXISTS idx_curricula_postulante_id ON curricula(postulante_id);

-- 2. Habilitar RLS en tabla curricula
ALTER TABLE curricula ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para postulantes
DROP POLICY IF EXISTS "Los postulantes pueden ver sus propios curricula" ON curricula;
CREATE POLICY "Los postulantes pueden ver sus propios curricula"
  ON curricula FOR SELECT
  USING (
    postulante_id IN (
      SELECT id FROM postulantes WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Los postulantes pueden insertar sus propios curricula" ON curricula;
CREATE POLICY "Los postulantes pueden insertar sus propios curricula"
  ON curricula FOR INSERT
  WITH CHECK (
    postulante_id IN (
      SELECT id FROM postulantes WHERE usuario_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Los postulantes pueden eliminar sus propios curricula" ON curricula;
CREATE POLICY "Los postulantes pueden eliminar sus propios curricula"
  ON curricula FOR DELETE
  USING (
    postulante_id IN (
      SELECT id FROM postulantes WHERE usuario_id = auth.uid()
    )
  );

-- Admins / Municipalidad pueden ver todos los CVs
DROP POLICY IF EXISTS "Admins pueden ver todos los curricula" ON curricula;
CREATE POLICY "Admins pueden ver todos los curricula"
  ON curricula FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios
      WHERE id = auth.uid() AND rol = 'municipalidad'
    )
  );

-- 3. Vincular cv_id en postulaciones
ALTER TABLE postulaciones
  ADD COLUMN IF NOT EXISTS cv_id UUID REFERENCES curricula(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_postulaciones_cv_id ON postulaciones(cv_id);
