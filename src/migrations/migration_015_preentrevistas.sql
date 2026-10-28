-- ============================================================
-- Portal Municipal de Empleo — Migración 015: Preentrevistas de Postulantes
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- Tabla para gestionar preentrevistas realizadas por el administrador (municipalidad)
-- Nota: La preentrevista es opcional. El administrador puede derivar directamente o agendar una preentrevista.
-- Si el postulante no asiste o no puede, se puede reprogramar (actualizando fecha u observaciones).

CREATE TABLE IF NOT EXISTS preentrevistas (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postulacion_id           UUID NOT NULL REFERENCES postulaciones(id) ON DELETE CASCADE,
  municipalidad_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  fecha_hora               TIMESTAMPTZ NOT NULL,
  lugar_modalidad          TEXT DEFAULT 'Presencial en Oficina de Empleo',
  estado                   TEXT NOT NULL DEFAULT 'programada', -- 'programada', 'completada', 'reprogramada', 'cancelada'
  notas                    TEXT,
  resultado                TEXT, -- 'aprobada', 'no_asistio', 'desfavorable', 'pendiente'
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsquedas rápidas por postulación
CREATE INDEX IF NOT EXISTS idx_preentrevistas_postulacion ON preentrevistas(postulacion_id);

-- Habilitar RLS
ALTER TABLE preentrevistas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS:
-- 1. Municipalidad tiene acceso completo
CREATE POLICY "preentrevistas: municipalidad gestiona todas"
  ON preentrevistas FOR ALL
  USING (rol_actual() = 'municipalidad')
  WITH CHECK (rol_actual() = 'municipalidad');

-- 2. El postulante puede ver sus propias preentrevistas
CREATE POLICY "preentrevistas: postulante ve las suyas"
  ON preentrevistas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM postulaciones p
      JOIN postulantes post ON p.postulante_id = post.id
      WHERE p.id = preentrevistas.postulacion_id
        AND post.usuario_id = auth.uid()
    )
  );
