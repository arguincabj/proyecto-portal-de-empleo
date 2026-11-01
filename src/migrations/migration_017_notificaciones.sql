-- ============================================================
-- Portal Municipal de Empleo — Migración 017: Notificaciones de Postulantes
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS notificaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo       TEXT NOT NULL,
  mensaje      TEXT NOT NULL,
  tipo         TEXT NOT NULL DEFAULT 'info', -- 'entrevista', 'info', 'alerta'
  leida        BOOLEAN NOT NULL DEFAULT FALSE,
  metadata     JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario ON notificaciones(usuario_id, created_at DESC);

-- Habilitar RLS
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;

-- El postulante solo puede ver y actualizar sus propias notificaciones
CREATE POLICY "notificaciones: postulante ve las suyas"
  ON notificaciones FOR SELECT
  USING (usuario_id = auth.uid());

CREATE POLICY "notificaciones: postulante actualiza las suyas"
  ON notificaciones FOR UPDATE
  USING (usuario_id = auth.uid())
  WITH CHECK (usuario_id = auth.uid());

-- La municipalidad (service role / admin) puede insertar notificaciones para cualquier usuario
-- Esta política permite inserciones desde el supabaseAdmin (service role) sin restricciones
CREATE POLICY "notificaciones: municipalidad puede insertar"
  ON notificaciones FOR INSERT
  WITH CHECK (true);
