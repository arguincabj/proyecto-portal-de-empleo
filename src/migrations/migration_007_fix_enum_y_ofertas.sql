-- ============================================================
-- 1. Eliminar temporalmente las policies de RLS en 'ofertas'
-- ============================================================
DROP POLICY IF EXISTS "ofertas: lectura pública (activas)" ON ofertas;
DROP POLICY IF EXISTS "ofertas: lectura pública (publicadas)" ON ofertas;
DROP POLICY IF EXISTS "ofertas: lectura pública" ON ofertas;
DROP POLICY IF EXISTS "ofertas: lectura autenticada (todas)" ON ofertas;
DROP POLICY IF EXISTS "ofertas: insertar (empresa o municipalidad)" ON ofertas;
DROP POLICY IF EXISTS "ofertas: actualizar (municipalidad)" ON ofertas;
DROP POLICY IF EXISTS "ofertas: eliminar (municipalidad)" ON ofertas;

-- ============================================================
-- 2. Cambiar la columna a texto plano para no tener problemas de enum
-- ============================================================
ALTER TABLE ofertas ALTER COLUMN estado DROP DEFAULT;
ALTER TABLE ofertas ALTER COLUMN estado TYPE text USING estado::text;
ALTER TABLE ofertas ALTER COLUMN estado SET DEFAULT 'publicada';

-- ============================================================
-- 3. Restaurar las policies de seguridad RLS usando texto
-- ============================================================
CREATE POLICY "ofertas: lectura pública"
  ON ofertas FOR SELECT
  USING (estado IN ('publicada', 'activa'));

CREATE POLICY "ofertas: lectura autenticada (todas)"
  ON ofertas FOR SELECT
  USING (rol_actual() in ('empresa', 'municipalidad'));

CREATE POLICY "ofertas: insertar (empresa o municipalidad)"
  ON ofertas FOR INSERT
  WITH CHECK (rol_actual() in ('empresa', 'municipalidad'));

CREATE POLICY "ofertas: actualizar (empresa o municipalidad)"
  ON ofertas FOR UPDATE
  USING (rol_actual() in ('empresa', 'municipalidad'));

CREATE POLICY "ofertas: eliminar (municipalidad)"
  ON ofertas FOR DELETE
  USING (rol_actual() = 'municipalidad');

-- ============================================================
-- 4. Limpiar si quedó algo viejo e insertar las ofertas de ejemplo
-- ============================================================
DELETE FROM ofertas;

INSERT INTO ofertas (empresa_nombre, titulo, descripcion, estado) VALUES
(
  'Panadería Don José',
  'Empleado/a de Mostrador y Ventas',
  'Buscamos persona responsable para atención al público en mostrador de panadería. Tareas: despacho de productos, cobro, orden y limpieza del local.

Requisitos:
- Experiencia en atención al público (deseable)
- Disponibilidad horaria: turnos rotativos mañana/tarde
- Buena presencia y trato cordial

Modalidad: Presencial
Horario: Lunes a sábados, 6hs diarias
Zona: Centro de Funes',
  'publicada'
),
(
  'Ferretería El Clavo',
  'Repositor/a y Vendedor/a de Salón',
  'Incorporamos vendedor/a para atención en salón de ferretería. Se valorará conocimiento en materiales de construcción y herramientas.

Requisitos:
- Secundario completo
- Conocimiento básico de productos de ferretería
- Manejo de PC (sistema de ventas)
- Disponibilidad full-time

Beneficios: Salario según convenio + premios por ventas
Modalidad: Presencial
Zona: Av. San Martín, Funes',
  'publicada'
),
(
  'Clínica Funes Salud',
  'Recepcionista Administrativa',
  'Se requiere recepcionista para clínica médica. Manejo de turnos, atención telefónica y presencial de pacientes, facturación de obras sociales.

Requisitos:
- Experiencia mínima de 1 año en puesto similar
- Manejo de Excel y sistemas de gestión de turnos
- Excelente trato interpersonal
- Disponibilidad para turno tarde (14 a 20hs)

Modalidad: Presencial
Contratación: Relación de dependencia',
  'publicada'
),
(
  'Supermercado La Esquina',
  'Cajero/a - Turno Mañana',
  'Buscamos cajero/a para cubrir turno mañana en nuestro supermercado. Experiencia con manejo de efectivo y medios de pago electrónicos.

Requisitos:
- Mayor de 18 años
- Secundario completo
- Experiencia en caja (preferente)
- Disponibilidad de lunes a sábados de 8 a 14hs

Se ofrece: Salario según convenio de comercio + obra social
Modalidad: Presencial
Zona: Barrio Centro, Funes',
  'publicada'
),
(
  'Estudio Contable Rodríguez & Asoc.',
  'Asistente Contable Jr.',
  'Estudio contable en expansión busca asistente para tareas de registración contable, liquidación de sueldos e impuestos.

Requisitos:
- Estudiante avanzado o graduado en Cs. Económicas
- Conocimiento de sistemas Tango o similar
- Manejo de AFIP (Mis Comprobantes, SIRADIG)
- Proactividad y ganas de aprender

Se ofrece: Contratación en relación de dependencia, excelente ambiente laboral, capacitación continua.
Modalidad: Híbrido (3 días presencial + 2 remoto)
Zona: Centro de Funes',
  'publicada'
),
(
  'Municipalidad de Funes',
  'Operario/a de Mantenimiento de Espacios Verdes',
  'La Dirección de Servicios Públicos busca operarios para el mantenimiento de parques y plazas de la ciudad.

Tareas:
- Corte de césped y poda de árboles
- Mantenimiento de juegos infantiles y mobiliario urbano
- Riego y cuidado de canteros

Requisitos:
- Mayor de 18 años
- Experiencia en tareas de jardinería o mantenimiento (deseable)
- Disponibilidad para trabajo al aire libre
- Registro de conducir (deseable)

Modalidad: Presencial
Contratación: Contrato temporal 6 meses (renovable)',
  'publicada'
),
(
  'Pizzería Napoli',
  'Repartidor/a con Moto Propia',
  'Buscamos repartidor/a con moto propia para delivery de comidas. Zona de reparto: Funes y alrededores.

Requisitos:
- Moto propia en buen estado
- Registro de conducir vigente
- Conocimiento de las calles de Funes
- Disponibilidad para turno noche (19 a 23:30hs)

Se ofrece: Sueldo fijo + propinas + viáticos por combustible
Modalidad: Presencial',
  'publicada'
);
