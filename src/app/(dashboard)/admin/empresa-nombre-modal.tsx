'use client'

import { useState } from 'react'
import {
  Building2,
  X,
  Mail,
  Phone,
  Calendar,
  FileText,
  User,
  CheckCircle2,
  Clock,
  XCircle,
  Tag,
} from 'lucide-react'

export type EmpresaDetalleFicha = {
  id: string
  razonSocial: string
  cuit: string | null
  rubro: string | null
  descripcion: string | null
  email: string | null
  estadoAprobacion: string
  motivoRechazo: string | null
  fechaRegistro: string
  responsable?: {
    nombre: string
    apellido: string
    telefono?: string | null
  } | null
}

type Props = {
  empresa: EmpresaDetalleFicha
}

const BADGES = {
  pendiente: { label: 'Pendiente de aprobación', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  aprobada: { label: 'Aprobada', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rechazada: { label: 'Rechazada', cls: 'bg-red-50 text-red-700 border-red-200' },
}

export function EmpresaNombreModal({ empresa }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const badge = BADGES[empresa.estadoAprobacion as keyof typeof BADGES] ?? BADGES.pendiente

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="font-bold text-base text-gray-900 hover:text-teal-700 hover:underline transition-colors text-left cursor-pointer"
        title="Tocar para ver los datos completos de la empresa"
      >
        {empresa.razonSocial || 'Sin razón social'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-gray-50/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-teal-100/70 text-teal-800">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-gray-900">
                      {empresa.razonSocial || 'Empresa'}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Ficha institucional y datos de contacto registrados en el portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-200/60 transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Bloque: Datos de la Empresa */}
              <div className="bg-teal-50/50 rounded-2xl p-5 border border-teal-100/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">
                  Datos Fiscales y Comerciales
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700">
                  <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">CUIT</p>
                    <p className="font-mono font-medium text-gray-900 mt-0.5">{empresa.cuit || 'Sin CUIT'}</p>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Rubro / Sector</p>
                    <p className="font-medium text-gray-900 mt-0.5">{empresa.rubro || 'Sin rubro especificado'}</p>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Correo de Contacto</p>
                    {empresa.email ? (
                      <a href={`mailto:${empresa.email}`} className="font-mono font-medium text-teal-900 hover:underline mt-0.5 block">
                        {empresa.email}
                      </a>
                    ) : (
                      <p className="italic text-gray-400 mt-0.5">Sin email</p>
                    )}
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-teal-100">
                    <p className="text-[10px] text-gray-400 uppercase font-semibold">Fecha de Registro</p>
                    <p className="font-mono font-medium text-gray-800 mt-0.5">{empresa.fechaRegistro}</p>
                  </div>
                </div>
              </div>

              {/* Bloque: Responsable de la Cuenta */}
              {empresa.responsable && (
                <div className="bg-gray-50/70 rounded-2xl p-5 border border-gray-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-teal-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      Responsable de la Cuenta
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Nombre y Apellido</p>
                      <p className="font-bold text-gray-900 mt-0.5">
                        {empresa.responsable.nombre} {empresa.responsable.apellido}
                      </p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-gray-200">
                      <p className="text-[10px] text-gray-400 uppercase font-semibold">Teléfono del Responsable</p>
                      {empresa.responsable.telefono ? (
                        <a href={`tel:${empresa.responsable.telefono}`} className="font-mono font-medium text-teal-700 hover:underline mt-0.5 block">
                          📞 {empresa.responsable.telefono}
                        </a>
                      ) : (
                        <p className="italic text-gray-400 mt-0.5">Sin teléfono</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bloque: Descripción de la Empresa */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Descripción Institucional
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
                  {empresa.descripcion || 'La empresa aún no ha redactado una descripción institucional.'}
                </div>
              </div>

              {/* Bloque: Motivo de rechazo (si aplica) */}
              {empresa.estadoAprobacion === 'rechazada' && empresa.motivoRechazo && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-1">
                  <p className="text-xs font-bold text-red-900">Motivo de rechazo enviado a la empresa:</p>
                  <p className="text-xs text-red-800">{empresa.motivoRechazo}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
