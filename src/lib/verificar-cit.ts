import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Verifica si un postulante ha alcanzado 3 rechazos en entrevistas (sumando rechazos de empresa y preentrevistas desfavorables)
 * Si alcanza 3 o más rechazos, se le asigna automáticamente la derivación al Curso de Introducción al Trabajo (CIT).
 */
export async function verificarYAsignarCursoCIT(postulanteId: string): Promise<{
  asignado: boolean
  totalRechazos: number
}> {
  try {
    // 1. Obtener todas las postulaciones del postulante
    const { data: postulaciones, error: errPost } = await supabaseAdmin
      .from('postulaciones')
      .select('id')
      .eq('postulante_id', postulanteId)

    if (errPost || !postulaciones || postulaciones.length === 0) {
      return { asignado: false, totalRechazos: 0 }
    }

    const postulacionIds = postulaciones.map((p) => p.id)

    // 2. Contar rechazos en entrevistas de empresas (derivaciones con estado 'rechazado')
    const { count: rechazosEmpresas } = await supabaseAdmin
      .from('derivaciones')
      .select('id', { count: 'exact', head: true })
      .in('postulacion_id', postulacionIds)
      .eq('estado_empresa', 'rechazado')

    // 3. Contar rechazos en preentrevistas municipales (resultado 'desfavorable')
    let rechazosPreentrevistas = 0
    try {
      const { count: countPre } = await supabaseAdmin
        .from('preentrevistas')
        .select('id', { count: 'exact', head: true })
        .in('postulacion_id', postulacionIds)
        .eq('resultado', 'desfavorable')

      rechazosPreentrevistas = countPre || 0
    } catch {
      // Ignorar si la tabla aún no tiene datos
    }

    const totalRechazos = (rechazosEmpresas || 0) + rechazosPreentrevistas

    // 4. Si tiene 3 o más rechazos, marcar al postulante como derivado al CIT
    if (totalRechazos >= 3) {
      await supabaseAdmin
        .from('postulantes')
        .update({
          cit_asignado: true,
          cit_fecha_asignacion: new Date().toISOString(),
          cit_estado: 'pendiente',
        })
        .eq('id', postulanteId)

      return { asignado: true, totalRechazos }
    }

    return { asignado: false, totalRechazos }
  } catch (err) {
    console.error('Error al verificar asignación CIT:', err)
    return { asignado: false, totalRechazos: 0 }
  }
}
