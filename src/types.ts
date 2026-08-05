import { Timestamp } from 'firebase/firestore';

// ==================== USER & AUTH ====================

export type UserRole =
  | 'admin'
  | 'docente'
  | 'alumno'
  | 'coordinacion'
  | 'coordinacion_academica'
  | 'coordinacion_convivencia'
  | 'coordinacion_primaria'
  | 'coordinacion_parvularia'
  | 'registro_academico'
  | 'enfermeria'
  | 'psicopedagogico';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teacherId?: string;
  createdAt?: Timestamp;
  microsoftId?: string;
}

// ==================== ROLES & PERMISSIONS ====================

export type SystemModuleId =
  | 'formacion'
  | 'notas'
  | 'clase'
  | 'horario'
  | 'eventos'
  | 'avisos'
  | 'proyectos';

export const SYSTEM_MODULES: { id: SystemModuleId; label: string; desc: string }[] = [
  { id: 'formacion', label: 'Formación Buenos Días', desc: 'Registro de asistencia y disciplina' },
  { id: 'notas', label: 'Notas', desc: 'Calificaciones y evaluaciones' },
  { id: 'clase', label: 'Clase', desc: 'Control de clases del día' },
  { id: 'horario', label: 'Horario', desc: 'Horarios de clases' },
  { id: 'eventos', label: 'Eventos', desc: 'Eventos del colegio' },
  { id: 'avisos', label: 'Avisos', desc: 'Comunicados y anuncios' },
  { id: 'proyectos', label: 'Semana de la Juventud', desc: 'Gestión de proyectos estudiantiles' },
];

export interface RoleConfig {
  id: string;
  name: string;
  description?: string;
  permissions: SystemModuleId[];
  isSystem?: boolean;
  createdAt?: Timestamp;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  alumno: 'Alumno',
  coordinacion: 'Coordinación',
  coordinacion_academica: 'Coord. Académica',
  coordinacion_convivencia: 'Coord. Convivencia',
  coordinacion_primaria: 'Coord. Primaria',
  coordinacion_parvularia: 'Coord. Parvularia',
  registro_academico: 'Registro Académico',
  enfermeria: 'Enfermería',
  psicopedagogico: 'Psicopedagógico',
};

// ==================== ACADEMIC ENTITIES ====================

export type Cycle = 'parvularia' | '1' | '2' | '3' | '4';
export type BaccalaureateType = 'general' | 'tecnico';

export const CYCLE_NAMES: Record<Cycle, string> = {
  'parvularia': 'Parvularia',
  '1': 'Primer Ciclo',
  '2': 'Segundo Ciclo',
  '3': 'Tercer Ciclo',
  '4': 'Bachillerato'
};

export interface Grade {
  id: string;
  name: string;
  cycle: Cycle;
  baccalaureateType?: BaccalaureateType;
  status?: 'ACTIVO' | 'INACTIVO';
  schoolYear?: number;
  createdAt?: Timestamp;
}

export interface BaccalaureateTypeDoc {
  id: string;
  name: string;
  maxGrade: number;
  createdAt?: Timestamp;
}

export interface Section {
  id: string;
  name: string;
  gradeId: string;
  capacity?: number;
  buildingId?: string;
  computerLabId?: string;
  computerLabIds?: string[];
  status?: 'ACTIVO' | 'INACTIVO';
  schoolYear?: number;
  createdAt?: Timestamp;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  color: string;
  description?: string;
  createdAt?: Timestamp;
}

export interface ComputerLab {
  id: string;
  name: string;
  buildingId?: string;
  capacity?: number;
  devices?: number;
  createdAt?: Timestamp;
}

export interface GradeSectionAssignment {
  id: string;
  gradeId: string;
  sectionId: string;
  computerLabId?: string;
  buildingId?: string;
  createdAt?: Timestamp;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  cycle?: Cycle;
  gradeId?: string;
  status?: 'ACTIVO' | 'INACTIVO';
  weeklyHours?: number;
  createdAt?: Timestamp;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  avatarUrl?: string;
  subjects: string[];
  schedule?: string;
  guideGradeId?: string;
  guideSectionId?: string;
  status?: 'ACTIVO' | 'INACTIVO';
  createdAt?: Timestamp;
}

export interface EnrollmentRecord {
  year: number;
  gradeId: string;
  gradeName?: string;
  sectionId?: string;
  status: 'EN_CURSO' | 'FINALIZADO' | 'RETIRADO';
  startDate?: Timestamp;
  endDate?: Timestamp;
}

export interface Student {
  id: string;
  carnet?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  gender: 'M' | 'F';
  gradeId: string;
  sectionId: string;
  enrollmentYear?: number;
  status?: 'ACTIVO' | 'INACTIVO' | 'GRADUADO';
  enrollmentHistory?: EnrollmentRecord[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// ==================== ATTENDANCE ====================

export type AttendanceStatus = 'Presente' | 'Tarde' | 'Ausente';

export interface DisciplineRecord {
  cabelloLargo: boolean;
  unasPintadas: boolean;
  uniformeIncorrecto: boolean;
}

export interface StudentSessionState {
  studentId: string;
  status: AttendanceStatus;
  discipline: DisciplineRecord;
  arrivalTime?: string;
}

export interface AttendanceSession {
  date: string;
  teacherId: string;
  gradeId: string;
  sectionId: string;
  civicAct: boolean;
  records: Record<string, StudentSessionState>;
}

// ==================== SEMANA DE LA JUVENTUD ====================

export type EstadoProyecto =
  | 'borrador'
  | 'registrado'
  | 'en_revision_materia'
  | 'materia_validada'
  | 'reclasificar'
  | 'en_coordinacion'
  | 'aprobado_oficial'
  | 'rechazado_materia'
  | 'rechazado_oficial';

export type AccionHistorial =
  | 'registro'
  | 'envio_validacion'
  | 'aprobacion_materia'
  | 'reclasificacion'
  | 'rechazo_materia'
  | 'aprobacion_coordinacion'
  | 'rechazo_coordinacion';

export interface SugerenciaOpcion {
  tipo: 'presentacion' | 'dashboard' | 'app';
  titulo: string;
  descripcion: string;
  alcance: string;
  herramientas_sugeridas: string[];
}

export interface ComplementoInformatica {
  tipo: string;
  titulo: string;
  descripcion: string;
  alcance: string;
  herramientas_sugeridas?: string[];
  es_personalizado: boolean;
  asignado_por?: string;
  asignado_por_nombre?: string;
  fecha_asignacion?: string;
}

export interface Integrante {
  uid: string;
  nombre: string;
  numero_lista: number;
  es_rep: boolean;
}

export interface Proyecto {
  id: string;
  titulo: string;
  descripcion: string;
  grado: string;
  seccion: string;
  materia_id: string;
  materia_nombre: string;
  materia_validada_id?: string;
  representante_id: string;
  representante_nombre: string;
  integrantes: string[];
  integrantes_detalle: Integrante[];
  estado: EstadoProyecto;
  observaciones?: string;
  intentos_envio: number;
  fecha_registro: string;
  fecha_envio?: string;
  fecha_aprobacion?: string;
  sugerencias_informatica?: SugerenciaOpcion[];
  sugerencias_generadas_en?: string;
  complemento_informatica?: ComplementoInformatica;
}

export interface HistorialItem {
  id: string;
  proyecto_id: string;
  actor_id: string;
  actor_nombre: string;
  rol_actor: UserRole;
  accion: AccionHistorial;
  valor_anterior?: Record<string, unknown>;
  valor_nuevo?: Record<string, unknown>;
  comentario?: string;
  fecha: string;
}

export interface Validador {
  id: string;
  grado: string;
  materia_id: string;
  materia_nombre: string;
  docente_id: string;
  docente_nombre: string;
}

export interface EstadoInfo {
  label: string;
  color: 'green' | 'blue' | 'amber' | 'purple' | 'red' | 'gray';
}

export const ESTADOS_PROYECTO: Record<EstadoProyecto, EstadoInfo> = {
  borrador:            { label: 'Borrador',                  color: 'gray'   },
  registrado:          { label: 'Registrado',                color: 'blue'   },
  en_revision_materia: { label: 'En revisión (materia)',     color: 'amber'  },
  materia_validada:    { label: 'Materia validada',          color: 'green'  },
  reclasificar:        { label: 'Reclasificar',              color: 'amber'  },
  en_coordinacion:     { label: 'En coordinación',           color: 'purple' },
  aprobado_oficial:    { label: 'Aprobado oficialmente',     color: 'green'  },
  rechazado_materia:   { label: 'Rechazado (materia)',       color: 'red'    },
  rechazado_oficial:   { label: 'Rechazado (coordinación)',  color: 'red'    },
};

export const MATERIAS_PROYECTO = [
  { id: 'matematicas',      nombre: 'Matemáticas'           },
  { id: 'ciencia',          nombre: 'Ciencia y Tecnología'  },
  { id: 'lenguaje',         nombre: 'Lenguaje y Literatura' },
  { id: 'ciudadania',       nombre: 'Ciudadanía y Valores'  },
  { id: 'multidisciplinar', nombre: 'Multidisciplinar'      },
];

export const GRADOS_PROYECTO = ['4°','5°','6°','7°','8°','9°','10°','11°'];

export const SECCIONES_POR_GRADO_PROYECTO: Record<string, string[]> = {
  '4°': ['A','B'], '5°': ['A','B'], '6°': ['A','B'],
  '7°': ['A','B','C'], '8°': ['A','B','C'], '9°': ['A','B','C'],
  '10°': ['A','B'], '11°': ['A'],
};

export const FECHA_LIMITE_REGISTRO   = '2026-06-17';
export const FECHA_LIMITE_APROBACION = '2026-06-23';