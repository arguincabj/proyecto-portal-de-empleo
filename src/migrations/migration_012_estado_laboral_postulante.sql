-- Migración 012: Agrega estado_laboral a la tabla postulantes
-- Valores posibles: 'en_busqueda' (en búsqueda laboral) | 'trabajando' (actualmente trabajando)

ALTER TABLE postulantes
  ADD COLUMN IF NOT EXISTS estado_laboral TEXT DEFAULT 'en_busqueda'
    CHECK (estado_laboral IN ('en_busqueda', 'trabajando'));
