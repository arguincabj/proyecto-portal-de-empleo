'use client'

import { useState } from 'react'
import {
  GraduationCap,
  Play,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Sparkles,
  Search,
  X,
  Building2,
  Phone,
  Mail,
} from 'lucide-react'

type VideoItem = {
  id: string
  titulo: string
  descripcion: string
  duracion: string
  categoria: string
  thumbnailUrl: string
  videoUrl?: string
  destacado?: boolean
}

type CursoItem = {
  id: string
  titulo: string
  descripcion: string
  modalidad: 'Presencial' | 'Virtual' | 'Híbrida'
  lugar?: string
  duracion: string
  fechaInicio: string
  cupos: string
  estado: 'Inscripciones abiertas' | 'Próximamente' | 'En curso'
  temas: string[]
}

const VIDEOS: VideoItem[] = [
  {
    id: 'cv-1',
    titulo: 'Cómo armar un Currículum Vitae de alto impacto',
    descripcion: 'Aprendé a estructurar tu experiencia, evitar los errores más comunes y destacar tus competencias clave para que los reclutadores elijan tu perfil.',
    duracion: '12 min',
    categoria: 'Currículum',
    thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=600&auto=format&fit=crop&q=80',
    destacado: true,
  },
  {
    id: 'entrevista-1',
    titulo: 'Las 5 preguntas clave en una entrevista laboral y cómo responderlas',
    descripcion: 'Respuestas estratégicas para "¿Cuáles son tus debilidades?", "¿Por qué querés trabajar acá?" y el método STAR para contar tus logros con solidez.',
    duracion: '15 min',
    categoria: 'Entrevistas',
    thumbnailUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop&q=80',
    destacado: true,
  },
  {
    id: 'lenguaje-1',
    titulo: 'Lenguaje corporal y comunicación no verbal en entrevistas',
    descripcion: 'La postura, el contacto visual, los gestos y la respiración. Consejos prácticos para transmitir seguridad y profesionalismo tanto presencial como online.',
    duracion: '10 min',
    categoria: 'Entrevistas',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'funes-1',
    titulo: 'Estrategias de búsqueda laboral en Funes y la región',
    descripcion: 'Conocé los sectores productivos con mayor demanda en nuestra ciudad: logística, gastronomía, comercio minorista y servicios profesionales.',
    duracion: '8 min',
    categoria: 'Orientación',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 'blandas-1',
    titulo: 'Habilidades blandas: trabajo en equipo y adaptabilidad',
    descripcion: 'Qué valoran los comercios y empresas hoy: puntualidad, actitud proactiva, resolución pacífica de conflictos y predisposición para aprender.',
    duracion: '14 min',
    categoria: 'Habilidades',
    thumbnailUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
  },
]

const CURSOS: CursoItem[] = [
  {
    id: 'cit',
    titulo: 'Curso de Introducción al Trabajo (CIT)',
    descripcion: 'Programa oficial de la Dirección de Empleo de Funes diseñado para mejorar las oportunidades de inserción laboral de los vecinos. Aborda proyecto formativo, derechos laborales, salud ocupacional y alfabetización digital.',
    modalidad: 'Presencial',
    lugar: 'Punto Digital Funes (Av. Pedro A. Ríos 1500)',
    duracion: '4 semanas (2 encuentros semanales)',
    fechaInicio: 'Inicia los primeros lunes de cada mes',
    cupos: 'Cupos limitados por cohorte',
    estado: 'Inscripciones abiertas',
    temas: [
      'Construcción del perfil ocupacional y proyecto laboral',
      'Derechos y obligaciones laborales en Argentina',
      'Salud, seguridad e higiene en el ambiente de trabajo',
      'Herramientas informáticas y comunicación en el trabajo',
    ],
  },
  {
    id: 'taller-cv',
    titulo: 'Taller Intensivo: Optimización de CV y Carta de Presentación',
    descripcion: 'Traé tu currículum impreso o digital y salí del taller con un CV moderno, claro y adaptado a lo que buscan las empresas del Gran Rosario y Funes.',
    modalidad: 'Híbrida',
    lugar: 'Oficina Municipal de Empleo / Streaming',
    duracion: '1 jornada de 3 horas',
    fechaInicio: 'Todos los jueves de 14:00 a 17:00 hs',
    cupos: 'Con inscripción previa',
    estado: 'Inscripciones abiertas',
    temas: [
      'Formatos modernos compatibles con escaneo de selección',
      'Redacción de logros con métricas y ejemplos claros',
      'Cómo postularte a través del Portal Municipal de Empleo',
    ],
  },
  {
    id: 'digitales',
    titulo: 'Herramientas Digitales y Ofimática para el Trabajo',
    descripcion: 'Manejo práctico de planillas de cálculo (Excel / Google Sheets), procesadores de texto, redacción de correos formales y gestión de archivos en la nube.',
    modalidad: 'Presencial',
    lugar: 'Punto Digital Funes',
    duracion: '6 semanas',
    fechaInicio: 'Próxima cohorte: segundo martes del mes',
    cupos: '25 vacantes',
    estado: 'Inscripciones abiertas',
    temas: [
      'Fórmulas y funciones esenciales en Excel',
      'Redacción de emails profesionales y etiquetas laborales',
      'Uso seguro de herramientas colaborativas y WhatsApp Business',
    ],
  },
  {
    id: 'atencion',
    titulo: 'Atención al Cliente, Ventas y Fidelización en Comercios',
    descripcion: 'Capacitación orientada a los rubros comercial, gastronómico y hotelero de Funes. Buenas prácticas de comunicación, empatía y resolución de quejas.',
    modalidad: 'Presencial',
    lugar: 'Centro de Capacitación Municipal',
    duracion: '3 semanas',
    fechaInicio: 'Próximamente',
    cupos: 'Inscripción abierta próximamente',
    estado: 'Próximamente',
    temas: [
      'Psicología del cliente y escucha activa',
      'Manejo de situaciones difíciles y objeciones',
      'Técnicas de venta cruzada y cobro con medios digitales',
    ],
  },
]

type Props = {
  haAlcanzadoTresRechazos: boolean
  totalRechazados: number
  citAsignado: boolean
}

export function CursosVideosClient({ haAlcanzadoTresRechazos }: Props) {
  const [seccionActiva, setSeccionActiva] = useState<'todos' | 'cursos' | 'videos'>('todos')
  const [categoriaVideo, setCategoriaVideo] = useState<string>('todas')
  const [videoModal, setVideoModal] = useState<VideoItem | null>(null)
  const [busqueda, setBusqueda] = useState('')

  const videosFiltrados = VIDEOS.filter((v) => {
    if (categoriaVideo !== 'todas' && v.categoria !== categoriaVideo) return false
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      return v.titulo.toLowerCase().includes(q) || v.descripcion.toLowerCase().includes(q)
    }
    return true
  })

  const cursosFiltrados = CURSOS.filter((c) => {
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      return c.titulo.toLowerCase().includes(q) || c.descripcion.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Banner de derivación para postulantes con 3 rechazos */}
      {haAlcanzadoTresRechazos && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-500/30 relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 size-60 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-400/30">
                <Sparkles className="size-3.5" />
                <span>Programa de Acompañamiento Formativo Municipal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                ¡Tu camino hacia el empleo continúa acá!
              </h2>
              <p className="text-sm text-emerald-100/90 leading-relaxed">
                Has sido derivado por la Oficina Municipal de Empleo para acceder a este espacio de capacitación y fortalecimiento laboral. En el mercado actual, cada proceso de selección es un aprendizaje. Ponemos a tu disposición estos cursos y videos formativos para que puedas optimizar tu CV, practicar entrevistas y aumentar tus posibilidades de contratación.
              </p>
            </div>
            <div className="shrink-0 bg-white/10 backdrop-blur-xs px-5 py-4 rounded-2xl border border-white/20 text-center">
              <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block mb-1">
                Acceso Formativo
              </span>
              <span className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <GraduationCap className="size-5 text-emerald-300" />
                <span>Habilitado</span>
              </span>
              <span className="text-[11px] block text-emerald-200/80 mt-1">Dirección de Empleo</span>
            </div>
          </div>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSeccionActiva('todos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              seccionActiva === 'todos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Ver Todo
          </button>
          <button
            onClick={() => setSeccionActiva('cursos')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              seccionActiva === 'cursos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="size-3.5" />
            <span>Cursos y Talleres ({CURSOS.length})</span>
          </button>
          <button
            onClick={() => setSeccionActiva('videos')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              seccionActiva === 'videos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Play className="size-3.5" />
            <span>Videos y Tutoriales ({VIDEOS.length})</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar talleres, videos o temas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>
      </div>

      {/* SECCIÓN 1: VIDEOS EDUCATIVOS Y FORMATIVOS */}
      {(seccionActiva === 'todos' || seccionActiva === 'videos') && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Play className="size-4 fill-emerald-800" />
                </span>
                <h2 className="text-xl font-extrabold text-gray-900">Videos y Micro-Cápsulas</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Consejos ágiles y explicaciones prácticas para mejorar tus entrevistas y tu currículum.
              </p>
            </div>

            {/* Categorías de video */}
            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {['todas', 'Currículum', 'Entrevistas', 'Orientación', 'Habilidades'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaVideo(cat)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    categoriaVideo === cat
                      ? 'bg-gray-900 text-white font-bold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat === 'todas' ? 'Todas' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videosFiltrados.map((video) => (
              <div
                key={video.id}
                onClick={() => setVideoModal(video)}
                className="group cursor-pointer bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col"
              >
                {/* Thumbnail con botón de reproducción */}
                <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.titulo}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="size-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-emerald-500 transition-all">
                      <Play className="size-5 fill-white ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>{video.duracion}</span>
                  </div>
                  <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-xs text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {video.categoria}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {video.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 line-clamp-3 leading-relaxed">
                      {video.descripcion}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-600 font-bold">
                    <span>Ver video formativo</span>
                    <Play className="size-3 fill-emerald-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN 2: CURSOS Y TALLERES MUNICIPALES */}
      {(seccionActiva === 'todos' || seccionActiva === 'cursos') && (
        <section className="space-y-4 pt-4">
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-teal-100 text-teal-800">
                <BookOpen className="size-4" />
              </span>
              <h2 className="text-xl font-extrabold text-gray-900">Cursos y Talleres Municipales</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Formaciones dictadas por la Municipalidad de Funes en el Punto Digital y sedes comunitarias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {cursosFiltrados.map((curso) => (
              <div
                key={curso.id}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs hover:border-teal-300 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        curso.estado === 'Inscripciones abiertas'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {curso.estado}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-lg border border-gray-200">
                      {curso.modalidad}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                      {curso.titulo}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                      {curso.descripcion}
                    </p>
                  </div>

                  {curso.lugar && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <MapPin className="size-3.5 text-teal-600 shrink-0" />
                      <span>{curso.lugar}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5 text-gray-400" />
                      {curso.duracion}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5 text-gray-400" />
                      {curso.fechaInicio}
                    </span>
                  </div>

                  {/* Temas clave */}
                  <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                    <span className="text-[11px] font-bold text-gray-700 block mb-1.5">
                      Contenidos destacados:
                    </span>
                    <ul className="space-y-1">
                      {curso.temas.map((tema, idx) => (
                        <li key={idx} className="text-xs text-gray-600 flex items-start gap-1.5">
                          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{tema}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{curso.cupos}</span>
                  <a
                    href="mailto:empleo@funes.gob.ar?subject=Consulta%20Inscripci%C3%B3n%20a%20Capacitaci%C3%B3n"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-xs"
                  >
                    <span>Consultar inscripción</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN 3: CONTACTO CON OFICINA DE EMPLEO */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-800 font-bold text-sm">
            <Building2 className="size-4" />
            <span>Oficina Municipal de Empleo de Funes</span>
          </div>
          <p className="text-xs text-gray-600 max-w-2xl leading-relaxed">
            ¿Tenés dudas sobre cómo mejorar tu CV o querés orientación personalizada con nuestros tutores? Acercate o comunicate con el equipo municipal.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="size-3 text-gray-400" />
              Pedro A. Ríos 1500, Funes
            </span>
            <span className="flex items-center gap-1">
              <Phone className="size-3 text-gray-400" />
              (0341) 4936000
            </span>
            <span className="flex items-center gap-1">
              <Mail className="size-3 text-gray-400" />
              empleo@funes.gob.ar
            </span>
          </div>
        </div>

        <a
          href="mailto:empleo@funes.gob.ar"
          className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 transition-colors"
        >
          Enviar mensaje a la Oficina
        </a>
      </div>

      {/* MODAL PARA REPRODUCIR VIDEO */}
      {videoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                <span className="size-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Play className="size-3.5 fill-emerald-800" />
                </span>
                <h3 className="font-bold text-sm text-gray-900 truncate">
                  {videoModal.titulo}
                </h3>
              </div>
              <button
                onClick={() => setVideoModal(null)}
                className="size-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Simulación / Contenedor de Video */}
            <div className="relative aspect-video w-full bg-gray-900 flex items-center justify-center text-white">
              <img
                src={videoModal.thumbnailUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative z-10 text-center space-y-3 p-6">
                <div className="size-16 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xl">
                  <Play className="size-7 fill-white ml-1" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold">Cápsula Formativa Oficial</p>
                  <p className="text-xs text-gray-300">Dirección Municipal de Empleo de Funes</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {videoModal.categoria}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  Duración: {videoModal.duracion}
                </span>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">
                {videoModal.descripcion}
              </p>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setVideoModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                Cerrar video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
