'use client'

import { useState, useTransition } from 'react'
import type { FileRejection } from 'react-dropzone'
import { FileText, Trash2, Upload, LoaderCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dropzone, DropzoneEmptyState } from '@/components/kibo-ui/dropzone'
import { cn } from '@/lib/utils'
import { subirCv, eliminarCvById } from './actions'
import { CV_MAX_BYTES } from './cv-limites'

const CV_ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
}

function mensajeRechazo(rechazos: FileRejection[]) {
  const codigo = rechazos[0]?.errors[0]?.code
  if (codigo === 'file-too-large') return 'El archivo no puede superar 20 MB'
  if (codigo === 'file-invalid-type') return 'Solo se aceptan archivos PDF, DOC o DOCX'
  if (codigo === 'too-many-files') return 'Subí un solo archivo a la vez'
  return 'No se pudo cargar el archivo'
}

export type CvItemInfo = {
  id: string
  nombre: string
  fecha: string | null
  signedUrl: string | null
}

type Props = {
  cvs: CvItemInfo[]
}

export function CvUpload({ cvs }: Props) {
  const [subiendo, startSubida] = useTransition()
  const [eliminandoId, setEliminandoId] = useState<string | null>(null)
  const ocupado = subiendo || Boolean(eliminandoId)

  const limiteAlcanzado = cvs.length >= 3

  function handleUpload(archivos: File[]) {
    const archivo = archivos[0]
    if (!archivo) return

    if (limiteAlcanzado) {
      toast.error('Alcanzaste el límite de 3 currículums. Eliminá uno para agregar otro.')
      return
    }

    const fd = new FormData()
    fd.append('cv', archivo)

    startSubida(async () => {
      try {
        const result = await subirCv(fd)
        if (result.ok) toast.success('CV subido correctamente')
        else toast.error(result.error)
      } catch {
        toast.error('No se pudo subir el archivo. Verificá que no supere 20 MB.')
      }
    })
  }

  function handleEliminar(id: string) {
    setEliminandoId(id)
    ;(async () => {
      try {
        const result = await eliminarCvById(id)
        if (result.ok) toast.success('CV eliminado correctamente')
        else toast.error(result.error)
      } catch {
        toast.error('Error inesperado al eliminar el CV')
      } finally {
        setEliminandoId(null)
      }
    })()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-foreground-secondary">
          Podés subir hasta <strong>3 currículums</strong> distintos (por ejemplo, con diferentes perfiles o especializaciones).
        </p>
        <span className={cn(
          'text-xs font-semibold px-2.5 py-1 rounded-full border',
          limiteAlcanzado
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-primary-50 text-primary-700 border-primary-200'
        )}>
          {cvs.length} / 3 CVs
        </span>
      </div>

      {cvs.length > 0 ? (
        <div className="space-y-3">
          {cvs.map((cvItem) => (
            <div
              key={cvItem.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-surface-muted p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:border-primary-200"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-600">
                  <FileText className="size-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground" title={cvItem.nombre}>
                    {cvItem.nombre}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    {cvItem.fecha ? `Subido el ${cvItem.fecha}` : 'CV cargado'}
                    {cvItem.signedUrl && (
                      <>
                        {' · '}
                        <a
                          href={cvItem.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary-600 hover:underline"
                        >
                          Ver / Descargar
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={ocupado}
                onClick={() => handleEliminar(cvItem.id)}
                className="self-end sm:self-auto text-danger hover:text-danger hover:bg-danger/10 border-danger/30"
              >
                {eliminandoId === cvItem.id ? (
                  <>
                    <LoaderCircle className="size-4 motion-safe:animate-spin mr-1" aria-hidden />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4 mr-1" aria-hidden />
                    Eliminar
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-foreground-secondary">
          No tenés ningún currículum cargado todavía.
        </div>
      )}

      {!limiteAlcanzado ? (
        <Dropzone
          accept={CV_ACCEPT}
          maxSize={CV_MAX_BYTES}
          maxFiles={1}
          disabled={ocupado}
          onDrop={handleUpload}
          onDropRejected={(rechazos) => toast.error(mensajeRechazo(rechazos))}
          className={cn(
            'min-h-36 rounded-xl border-2 border-dashed border-border bg-surface-muted p-6 whitespace-normal sm:p-8',
            'hover:border-primary-400 hover:bg-primary-50',
            'data-[drag-active=true]:border-primary-500 data-[drag-active=true]:bg-primary-50 data-[drag-active=true]:ring-0',
            'disabled:opacity-60 transition-colors'
          )}
        >
          <DropzoneEmptyState>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                {subiendo ? (
                  <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-5" aria-hidden />
                )}
              </div>
              <p className="text-sm font-medium text-foreground">
                {subiendo ? 'Subiendo...' : 'Subir nuevo CV'}
              </p>
              <p className="text-xs text-foreground-secondary">
                Arrastrá el archivo acá o hacé clic para seleccionarlo
              </p>
              <p className="text-xs text-foreground-muted">PDF, DOC o DOCX — hasta 20 MB</p>
            </div>
          </DropzoneEmptyState>
        </Dropzone>
      ) : (
        <p className="text-center text-xs text-foreground-secondary">
          Has alcanzado el límite máximo de 3 currículums. Si querés agregar uno diferente, eliminá alguno de los anteriores.
        </p>
      )}
    </div>
  )
}
