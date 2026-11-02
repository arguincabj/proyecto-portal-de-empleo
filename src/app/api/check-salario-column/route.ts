import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/check-salario-column
 * Endpoint de diagnóstico: verifica si la columna 'salario' ya fue agregada
 * a la tabla 'ofertas' en Supabase. Usarlo una sola vez para confirmar la migración.
 */
export async function GET() {
  try {
    // Intentar seleccionar la columna salario de ofertas (con limit 0, sin datos)
    const { error } = await supabaseAdmin
      .from('ofertas')
      .select('salario')
      .limit(0)

    if (error) {
      return NextResponse.json({
        ok: false,
        columnaExiste: false,
        mensaje: '❌ La columna "salario" NO existe en la tabla "ofertas". Ejecutá la migración 020 en el SQL Editor de Supabase.',
        instruccion: 'ALTER TABLE ofertas ADD COLUMN IF NOT EXISTS salario NUMERIC DEFAULT NULL;',
        error: error.message,
      })
    }

    return NextResponse.json({
      ok: true,
      columnaExiste: true,
      mensaje: '✅ La columna "salario" existe correctamente en la tabla "ofertas". El filtro de salario funcionará.',
    })
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      error: err instanceof Error ? err.message : 'Error inesperado',
    }, { status: 500 })
  }
}
