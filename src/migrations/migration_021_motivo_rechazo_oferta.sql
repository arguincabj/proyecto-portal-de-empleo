-- Migración 021: Agrega motivo_rechazo_oferta a la tabla ofertas
-- y el estado 'borrador' para ofertas rechazadas que la empresa puede editar

ALTER TABLE ofertas
  ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT DEFAULT NULL;

-- El estado 'borrador' permite a la empresa editar la oferta antes de reenviarla
-- Estados posibles: pendiente | publicada | cerrada | rechazada | borrador
