import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Verifica si un postulante ha alcanzado 3 rechazos (sumando rechazos de empresa, preentrevistas desfavorables y descartes municipales).
 * Si alcanza 3 o más rechazos:
 * 1. Se le asigna automáticamente la derivación a CIT / Cursos y Videos en su perfil de postulante.
 * 2. Se le envía una notificación personal con link a '/cursos-y-videos'.
 * 3. Se notifica a la administración municipal informando que el perfil alcanzó su 3er rechazo.
 */
export async function verificarYAsignarCursoCIT(postulanteId: string): Promise<{
  asignado: boolean
  totalRechazados: number
}> {
  try {
    // 1. Obtener todas las postulaciones del postulante
    const { data: postulaciones, error: errPost } = await supabaseAdmin
      .from('postulaciones')
      .select('id, estado')
      .eq('postulante_id', postulanteId)

    if (errPost || !postulaciones || postulaciones.length === 0) {
      return { asignado: false, totalRechazados: 0 }
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
      // Ignorar si la tabla no está disponible
    }

    // 4. Contar postulaciones descartadas por municipalidad
    const rechazosMuni = postulaciones.filter((p) => p.estado === 'rechazada_municipalidad').length

    const totalRechazados = (rechazosEmpresas || 0) + rechazosPreentrevistas + rechazosMuni

    // 5. Si tiene 3 o más rechazos, marcar al postulante como derivado al CIT / Cursos y notificar
    if (totalRechazados >= 3) {
      // Actualizar registro en postulantes
      await supabaseAdmin
        .from('postulantes')
        .update({
          cit_asignado: true,
          cit_fecha_asignacion: new Date().toISOString(),
          cit_estado: 'pendiente',
        })
        .eq('id', postulanteId)

      // Obtener datos del postulante para enviar la notificación
      const { data: postulante } = await supabaseAdmin
        .from('postulantes')
        .select('id, usuario_id')
        .eq('id', postulanteId)
        .maybeSingle()

      if (postulante?.usuario_id) {
        // Verificar si ya se envió la notificación de cursos al postulante para no duplicar
        const { data: yaNotificado } = await supabaseAdmin
          .from('notificaciones')
          .select('id')
          .eq('usuario_id', postulante.usuario_id)
          .eq('tipo', 'cursos')
          .limit(1)

        if (!yaNotificado || yaNotificado.length === 0) {
          await supabaseAdmin.from('notificaciones').insert({
            usuario_id: postulante.usuario_id,
            titulo: '¡Acceso a Cursos y Videos de Formación Laboral!',
            mensaje:
              'Registramos 3 rechazos en tus procesos de postulación. La Oficina de Empleo de la Municipalidad de Funes pone a tu disposición un espacio exclusivo de Cursos y Videos formativos para ayudarte a optimizar tu CV, entrenar entrevistas y mejorar tus oportunidades laborales.',
            tipo: 'cursos',
            metadata: {
              total_rechazos: totalRechazados,
            },
          })
        }
      }

      // Notificar a la administración municipal SOLO cuando llega al 3er rechazo
      try {
        const { data: adminUsers } = await supabaseAdmin
          .from('usuarios')
          .select('id')
          .eq('rol', 'municipalidad')

        if (adminUsers && adminUsers.length > 0) {
          // Verificar si ya se alertó al admin de este postulante
          const { data: yaAlertadoAdmin } = await supabaseAdmin
            .from('notificaciones')
            .select('id')
            .eq('tipo', 'alerta_3_rechazos')
            .contains('metadata', { postulante_id: postulanteId })
            .limit(1)

          if (!yaAlertadoAdmin || yaAlertadoAdmin.length === 0) {
            const notifsAdmin = adminUsers.map((u: { id: string }) => ({
              usuario_id: u.id,
              titulo: 'Postulante alcanzó su 3er rechazo',
              mensaje: `Un postulante acumuló ${totalRechazados} rechazos laborales y fue habilitado para Cursos y Videos. Ya está disponible en la sección de Postulantes Rechazados de administración.`,
              tipo: 'alerta_3_rechazos',
              metadata: {
                link: '/admin/rechazados',
                link_texto: 'Ver postulantes rechazados',
                postulante_id: postulanteId,
              },
            }))
            await supabaseAdmin.from('notificaciones').insert(notifsAdmin)
          }
        }
      } catch (errAdmin) {
        console.error('Error al notificar admin sobre 3er rechazo:', errAdmin)
      }

      return { asignado: true, totalRechazados }
    }

    return { asignado: false, totalRechazados }
  } catch (err) {
    console.error('Error al verificar asignación CIT:', err)
    return { asignado: false, totalRechazados: 0 }
  }
}

/**
 * Retorna los IDs de todos los postulantes que tienen efectivamente 3 o más rechazos acumulados
 */
export async function obtenerIdsPostulantesConTresRechazos(): Promise<string[]> {
  try {
    const idsSet = new Set<string>()

    // Contar rechazos reales por postulante desde derivaciones rechazadas
    const { data: derivacionesRechazadas } = await supabaseAdmin
      .from('derivaciones')
      .select('postulacion_id')
      .eq('estado_empresa', 'rechazado')

    const postuIdsFromDer = (derivacionesRechazadas ?? [])
      .map((d) => d.postulacion_id)
      .filter(Boolean)

    if (postuIdsFromDer.length > 0) {
      const { data: postulaciones } = await supabaseAdmin
        .from('postulaciones')
        .select('id, postulante_id')
        .in('id', postuIdsFromDer)

      const conteoPorPostulante: Record<string, number> = {}
      ;(postulaciones ?? []).forEach((p) => {
        if (p.postulante_id) {
          conteoPorPostulante[p.postulante_id] = (conteoPorPostulante[p.postulante_id] || 0) + 1
          if (conteoPorPostulante[p.postulante_id] >= 3) {
            idsSet.add(p.postulante_id)
          }
        }
      })
    }

    return Array.from(idsSet)
  } catch (err) {
    console.error('Error al obtener postulantes con 3 rechazos:', err)
    return []
  }
}

/**
 * Retorna la cantidad de postulantes que han alcanzado 3 o más rechazos
 */
export async function contarPostulantesConTresRechazos(): Promise<number> {
  const ids = await obtenerIdsPostulantesConTresRechazos()
  return ids.length
}

/**
 * Retorna el conteo total de rechazos para un postulante dado
 */
export async function contarRechazosDePostulante(postulanteId: string): Promise<number> {
  const res = await verificarYAsignarCursoCIT(postulanteId)
  return res.totalRechazados
}
