// src/types/index.ts

export type RolUsuario = 'estudiante' | 'docente' | 'coordinacion' | 'admin'

export type EstadoProyecto =
  | 'borrador'
  | 'registrado'
  | 'en_revision_materia'
  | 'materia_validada'
  | 'reclasificar'
  | 'en_coordinacion'
  | 'aprobado_oficial'
  | 'rechazado_materia'
  | 'rechazado_oficial'

export type AccionHistorial =
  | 'registro'
  | 'envio_validacion'
  | 'aprobacion_materia'
  | 'reclasificacion'
  | 'rechazo_materia'
  | 'aprobacion_coordinacion'
  | 'rechazo_coordinacion'

// ── Perfil de usuario ──────────────────────────────────────────
export interface Perfil {
  id:           string
  nombre:       string
  email:        string
  rol:          RolUsuario
  grado?:       string   // '8°' — para estudiantes
  seccion?:     string   // 'A'  — para estudiantes
  numero_lista?: number  // para estudiantes
  materia_id?:  string   // para docentes
  created_at:   string
}

// ── Materia ────────────────────────────────────────────────────
export interface Materia {
  id:     string   // 'matematicas', 'ciencia', etc.
  nombre: string   // 'Matemáticas', 'Ciencia y Tecnología', etc.
}

export interface SugerenciaOpcion {
  tipo:        'presentacion' | 'dashboard' | 'app'
  titulo:      string
  descripcion: string
  alcance:     string
  herramientas_sugeridas: string[]
}

export interface ComplementoInformatica {
  tipo:        string
  titulo:      string
  descripcion: string
  alcance:     string
  herramientas_sugeridas?: string[]
  es_personalizado:    boolean
  asignado_por?:       string
  asignado_por_nombre?: string
  fecha_asignacion?:   string
}

// ── Proyecto ───────────────────────────────────────────────────
export interface Proyecto {
  id:                   string
  titulo:               string
  descripcion:          string
  grado:                string   // '8°'
  seccion:              string   // 'A'
  materia_id:           string   // slug de materia seleccionada
  materia_nombre:       string   // nombre visible
  materia_validada_id?: string   // materia que confirmó el docente
  representante_id:     string   // uid del representante
  representante_nombre: string
  integrantes:          string[] // array de UIDs (para RLS en Firestore)
  integrantes_detalle:  Integrante[]
  estado:               EstadoProyecto
  observaciones?:       string
  intentos_envio:       number
  fecha_registro:       string
  fecha_envio?:         string
  fecha_aprobacion?:    string
  sugerencias_informatica?: SugerenciaOpcion[]
  sugerencias_generadas_en?: string
  complemento_informatica?: ComplementoInformatica
}

export interface Integrante {
  uid:         string
  nombre:      string
  numero_lista: number
  es_rep:      boolean
}

// ── Historial ──────────────────────────────────────────────────
export interface HistorialItem {
  id:             string
  proyecto_id:    string
  actor_id:       string
  actor_nombre:   string
  rol_actor:      RolUsuario
  accion:         AccionHistorial
  valor_anterior?: Record<string, unknown>
  valor_nuevo?:    Record<string, unknown>
  comentario?:    string
  fecha:          string
}

// ── Validador ─────────────────────────────────────────────────
export interface Validador {
  id:             string
  grado:          string
  materia_id:     string
  materia_nombre: string
  docente_id:     string
  docente_nombre: string
}

// ── Estado info (para UI) ─────────────────────────────────────
export interface EstadoInfo {
  label: string
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'gray'
}

export const ESTADOS: Record<EstadoProyecto, EstadoInfo> = {
  borrador:            { label: 'Borrador',                  color: 'gray'   },
  registrado:          { label: 'Registrado',                color: 'blue'   },
  en_revision_materia: { label: 'En revisión (materia)',     color: 'amber'  },
  materia_validada:    { label: 'Materia validada',          color: 'green'  },
  reclasificar:        { label: 'Reclasificar',              color: 'amber'  },
  en_coordinacion:     { label: 'En coordinación',           color: 'purple' },
  aprobado_oficial:    { label: 'Aprobado oficialmente',     color: 'green'  },
  rechazado_materia:   { label: 'Rechazado (materia)',       color: 'red'    },
  rechazado_oficial:   { label: 'Rechazado (coordinación)',  color: 'red'    },
}

export const MATERIAS: Materia[] = [
  { id: 'matematicas',     nombre: 'Matemáticas'          },
  { id: 'ciencia',         nombre: 'Ciencia y Tecnología' },
  { id: 'lenguaje',        nombre: 'Lenguaje y Literatura'},
  { id: 'ciudadania',      nombre: 'Ciudadanía y Valores' },
  { id: 'multidisciplinar',nombre: 'Multidisciplinar'     },
]

export const GRADOS = ['4°','5°','6°','7°','8°','9°','10°','11°']

export const SECCIONES_POR_GRADO: Record<string, string[]> = {
  '4°': ['A','B'], '5°': ['A','B'],  '6°':  ['A','B'],
  '7°': ['A','B','C'], '8°': ['A','B','C'], '9°': ['A','B','C'],
  '10°':['A','B'], '11°':['A'],
}

export const FECHA_LIMITE_REGISTRO   = '2026-06-17'
export const FECHA_LIMITE_APROBACION = '2026-06-23'

export const ROL_LABELS: Record<RolUsuario, string> = {
  estudiante:   'Estudiante',
  docente:      'Docente',
  coordinacion: 'Coordinación',
  admin:        'Administrador',
}
