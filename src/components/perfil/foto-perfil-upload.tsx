'use client'

import { useState, useRef, useTransition } from 'react'
import {
  Camera,
  Upload,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Building2,
  UserCog,
  Loader2,
  X,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { subirFotoPerfil, eliminarFotoPerfil } from '@/app/(dashboard)/actions/avatar'

type Props = {
  currentAvatarUrl?: string | null
  nombre?: string
  apellido?: string
  rol?: 'postulante' | 'empresa' | 'municipalidad'
}

export function FotoPerfilUpload({
  currentAvatarUrl,
  nombre = '',
  apellido = '',
  rol = 'postulante',
}: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl ?? null)
  const [isPending, startTransition] = useTransition()

  // Modal de ajuste de imagen
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  })

  // Controles de manipulación (zoom, pan, rotación)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270

  // Referencias para drag/pan
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const iniciales =
    (nombre ? nombre.charAt(0) : '') + (apellido ? apellido.charAt(0) : '') || 'U'

  // Al seleccionar archivo desde el input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato no soportado. Usá JPG, PNG o WebP.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 8 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const src = event.target?.result as string
      const img = new window.Image()
      img.onload = () => {
        setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
        setSelectedImageSrc(src)
        // Resetear controles
        setZoom(1)
        setPan({ x: 0, y: 0 })
        setRotation(0)
        setModalOpen(true)
      }
      img.src = src
    }
    reader.readAsDataURL(file)

    // Resetear valor para permitir seleccionar la misma imagen
    e.target.value = ''
  }

  // Pointer events para arrastrar y encuadrar
  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    setPan({
      x: panStart.current.x + dx,
      y: panStart.current.y + dy,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // Ignorar si ya fue liberado
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setRotation(0)
  }

  // Renderizar al Canvas y guardar
  const handleGuardarRecorte = async () => {
    if (!selectedImageSrc) return

    startTransition(async () => {
      try {
        const CROP_SIZE = 400 // Resolución de salida
        const PREVIEW_SIZE = 260 // Tamaño de la ventana en pantalla

        const canvas = document.createElement('canvas')
        canvas.width = CROP_SIZE
        canvas.height = CROP_SIZE
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          toast.error('No se pudo inicializar el procesador de imágenes.')
          return
        }

        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = selectedImageSrc
        })

        // Fondo transparente o blanco
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE)

        // Escala entre la vista previa y la salida final
        const scaleFactor = CROP_SIZE / PREVIEW_SIZE

        // Transformaciones centradas
        ctx.save()
        ctx.translate(CROP_SIZE / 2, CROP_SIZE / 2)
        ctx.rotate((rotation * Math.PI) / 180)

        // Traslación por pan (ajustada a la rotación)
        const rad = (-rotation * Math.PI) / 180
        const cos = Math.cos(rad)
        const sin = Math.sin(rad)
        const rotatedPanX = (pan.x * cos - pan.y * sin) * scaleFactor
        const rotatedPanY = (pan.x * sin + pan.y * cos) * scaleFactor
        ctx.translate(rotatedPanX, rotatedPanY)

        // Escalar la imagen manteniendo su proporción
        const baseScale = Math.max(
          PREVIEW_SIZE / img.naturalWidth,
          PREVIEW_SIZE / img.naturalHeight
        )
        const drawScale = baseScale * zoom * scaleFactor
        const drawW = img.naturalWidth * drawScale
        const drawH = img.naturalHeight * drawScale

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
        ctx.restore()

        // Obtener blob JPEG optimizado
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
        )

        if (!blob) {
          toast.error('Error al generar la imagen recortada.')
          return
        }

        const formData = new FormData()
        formData.append('foto', blob, 'avatar.jpg')

        const res = await subirFotoPerfil(formData)
        if (res.ok && res.avatarUrl) {
          setAvatarUrl(res.avatarUrl)
          setModalOpen(false)
          toast.success('Foto de perfil actualizada exitosamente.')
        } else {
          toast.error(res.error || 'Error al guardar la foto de perfil.')
        }
      } catch (err) {
        console.error(err)
        toast.error('Ocurrió un error al procesar la foto.')
      }
    })
  }

  // Eliminar foto
  const handleEliminar = async () => {
    if (!confirm('¿Seguro que deseás eliminar tu foto de perfil?')) return

    startTransition(async () => {
      const res = await eliminarFotoPerfil()
      if (res.ok) {
        setAvatarUrl(null)
        toast.success('Foto de perfil eliminada.')
      } else {
        toast.error(res.error || 'Error al eliminar la foto.')
      }
    })
  }

  // Dimensiones base de la imagen para la vista previa
  const baseScale =
    imageNaturalSize.width && imageNaturalSize.height
      ? Math.max(260 / imageNaturalSize.width, 260 / imageNaturalSize.height)
      : 1
  const displayWidth = imageNaturalSize.width * baseScale * zoom
  const displayHeight = imageNaturalSize.height * baseScale * zoom

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Tarjeta de visualización en el perfil */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {/* Círculo del Avatar */}
        <div className="relative group shrink-0">
          <div className="size-24 sm:size-28 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-teal-50 border-2 border-emerald-500/20 shadow-md flex items-center justify-center">
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl}
                alt={`Foto de ${nombre}`}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-emerald-800">
                {rol === 'empresa' ? (
                  <Building2 className="size-10 sm:size-12 text-emerald-700/70" />
                ) : rol === 'municipalidad' ? (
                  <UserCog className="size-10 sm:size-12 text-emerald-700/70" />
                ) : (
                  <span className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-emerald-800">
                    {iniciales}
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="absolute bottom-0 right-0 size-8 sm:size-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-md border-2 border-white flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
            title="Subir o cambiar foto"
          >
            <Camera className="size-4" />
          </button>
        </div>

        {/* Acciones y descripción */}
        <div className="flex-1 text-center sm:text-left space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition-all"
            >
              <Upload className="size-3.5 sm:size-4" />
              <span>{avatarUrl ? 'Cambiar foto' : 'Subir foto'}</span>
            </button>

            {avatarUrl && (
              <button
                type="button"
                onClick={handleEliminar}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all"
              >
                <Trash2 className="size-3.5 sm:size-4" />
                <span>Eliminar</span>
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 leading-relaxed max-w-md">
            Podés cargar una foto en formato JPG, PNG o WebP. Al subirla tendrás una herramienta interactiva para ajustar el tamaño, centrarla y recortarla en círculo a tu gusto.
          </p>
        </div>
      </div>

      {/* Modal Interactivo de Ajuste y Recorte de Foto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden animate-enter-from-below">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">Ajustar foto de perfil</h3>
                <p className="text-xs text-gray-500">
                  Arrastrá la foto para centrarla y deslizá el zoom para ajustar el tamaño.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="size-8 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Ventana de Recorte Circular */}
            <div className="p-6 flex flex-col items-center">
              <div
                className="relative size-[260px] rounded-full overflow-hidden shadow-inner cursor-grab active:cursor-grabbing border-4 border-emerald-500 select-none bg-neutral-900 touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {selectedImageSrc && (
                  <div
                    className="absolute top-1/2 left-1/2 pointer-events-none origin-center transition-transform duration-75"
                    style={{
                      transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px)) rotate(${rotation}deg)`,
                      width: `${displayWidth}px`,
                      height: `${displayHeight}px`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImageSrc}
                      alt="Previsualización"
                      className="size-full object-contain pointer-events-none select-none max-w-none max-h-none"
                      draggable={false}
                    />
                  </div>
                )}

                {/* Guía visual sutil */}
                <div className="pointer-events-none absolute inset-0 border border-white/20 rounded-full" />
              </div>

              {/* Controles de Zoom */}
              <div className="w-full max-w-xs mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="size-3.5 text-gray-400" />
                    <span>Tamaño / Zoom</span>
                  </span>
                  <span className="font-mono text-emerald-700">{Math.round(zoom * 100)}%</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.max(0.8, Number((z - 0.1).toFixed(2))))}
                    className="size-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                    title="Reducir tamaño"
                  >
                    <ZoomOut className="size-3.5" />
                  </button>

                  <input
                    type="range"
                    min="0.8"
                    max="3.0"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-emerald-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                    className="size-7 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center"
                    title="Aumentar tamaño"
                  >
                    <ZoomIn className="size-3.5" />
                  </button>
                </div>

                {/* Botones de Rotación y Restablecer */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCw className="size-3 text-gray-500" />
                    <span>Rotar 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <RotateCcw className="size-3 text-gray-500" />
                    <span>Restablecer</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleGuardarRecorte}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-sm transition-all"
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="size-4" />
                    <span>Guardar foto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
