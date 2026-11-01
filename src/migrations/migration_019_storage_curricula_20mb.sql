-- ============================================================
-- Portal Municipal de Empleo — Migración 019
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ============================================================
-- Objetivo:
--   1. Actualizar el bucket "curricula" a 20 MB y solo PDF.
--   2. Eliminar el bucket "cvs" vacío (no se usa en el proyecto).
--   3. Reemplazar las políticas RLS del bucket "curricula" por
--      versiones más seguras y explícitas.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Actualizar límite de tamaño y MIME permitidos en "curricula"
--    Pasa de 5 MB (5_242_880) a 20 MB (20_971_520) y restringe a PDF.
-- ------------------------------------------------------------
UPDATE storage.buckets
SET
  file_size_limit  = 20971520,           -- 20 MB
  allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'curricula';

-- ------------------------------------------------------------
-- 2. Eliminar el bucket "cvs" vacío (creado en migración 006
--    pero nunca utilizado por la aplicación).
--    SEGURO: el bucket está vacío, no hay archivos ni referencias.
-- ------------------------------------------------------------
DELETE FROM storage.buckets WHERE id = 'cvs';

-- ------------------------------------------------------------
-- 3. Remplazar políticas RLS del bucket "curricula"
--    con versiones más seguras que verifican:
--    - que el primer segmento del path coincida con auth.uid()
--    - que el rol del usuario sea "postulante" o "municipalidad"
-- ------------------------------------------------------------

-- Limpiar políticas anteriores del bucket "curricula"
DROP POLICY IF EXISTS "curricula: postulante sube su cv"    ON storage.objects;
DROP POLICY IF EXISTS "curricula: leer cv"                  ON storage.objects;
DROP POLICY IF EXISTS "curricula: postulante elimina su cv" ON storage.objects;

-- 3a. INSERT: el postulante sube a su propia carpeta (path: {uid}/...)
CREATE POLICY "curricula: solo postulante puede subir a su carpeta"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'curricula'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'postulante'
    )
  );

-- 3b. SELECT: el postulante lee sus propios CVs; la municipalidad lee todos
CREATE POLICY "curricula: leer cv propio o como municipalidad"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'curricula'
    AND auth.role() = 'authenticated'
    AND (
      -- El postulante accede a su propia carpeta
      (
        (storage.foldername(name))[1] = auth.uid()::text
        AND EXISTS (
          SELECT 1 FROM public.usuarios
          WHERE id = auth.uid() AND rol = 'postulante'
        )
      )
      OR
      -- La municipalidad puede leer cualquier CV
      EXISTS (
        SELECT 1 FROM public.usuarios
        WHERE id = auth.uid() AND rol = 'municipalidad'
      )
    )
  );

-- 3c. DELETE: el postulante elimina solo sus propios CVs
CREATE POLICY "curricula: postulante elimina solo sus cvs"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'curricula'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.usuarios
      WHERE id = auth.uid() AND rol = 'postulante'
    )
  );

-- ------------------------------------------------------------
-- Verificación final (opcional, ejecutar por separado)
-- ------------------------------------------------------------
-- SELECT id, name, public, file_size_limit, allowed_mime_types
-- FROM storage.buckets
-- WHERE id IN ('curricula', 'avatars');
