import { Timestamp } from 'firebase/firestore';

// ==================== USER & AUTH ====================

export type UserRole = 'admin' | 'docente' | 'alumno' | (string & {});

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole | null;
  status: UserStatus;
  teacherId?: string;
  studentId?: string;
  studentName?: string;
  gradeId?: string;
  sectionId?: string;
  requestedRole?: UserRole;
  rejectionReason?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  microsoftId?: string;
}

// ==================== APPROVAL & ONBOARDING ====================

export interface ApprovalRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  requestedRole: UserRole | null;
  studentId?: string;
  studentName?: string;
  gradeId?: string;
  sectionId?: string;
  teacherId?: string;
  teacherName?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
  createdAt: Timestamp;
}

export interface NewUserNotification {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  studentId?: string;
  studentName?: string;
  gradeName?: string;
  sectionName?: string;
  teacherId?: string;
  teacherName?: string;
  password: string;
  status: 'new' | 'notified';
  createdAt: Timestamp;
  notifiedAt?: Timestamp;
}

export interface CredentialShareOptions {
  email: boolean;
  pdf: boolean;
  clipboard: boolean;
}

// ==================== ROLES & PERMISSIONS ====================

export type SystemModuleId =
  | 'formacion'
  | 'notas'
  | 'clase'
  | 'horario'
  | 'eventos'
  | 'avisos'
  | 'proyectos'
  | 'semana-juventud'
  | 'semana-juventud-admin'
  | 'lms';

export const SYSTEM_MODULES: { id: SystemModuleId; label: string; desc: string }[] = [
  { id: 'formacion', label: 'Formación Buenos Días', desc: 'Registro de asistencia y disciplina' },
  { id: 'notas', label: 'Notas', desc: 'Calificaciones y evaluaciones' },
  { id: 'clase', label: 'Clase', desc: 'Control de clases del día' },
  { id: 'horario', label: 'Horario', desc: 'Horarios de clases' },
  { id: 'eventos', label: 'Eventos', desc: 'Eventos del colegio' },
  { id: 'avisos', label: 'Avisos', desc: 'Comunicados y anuncios' },
  { id: 'proyectos', label: 'Semana de la Juventud', desc: 'Gestión de proyectos estudiantiles' },
  { id: 'semana-juventud', label: 'Mi Proyecto', desc: 'Ver estado de mi proyecto' },
  { id: 'semana-juventud-admin', label: 'Semana de la Juventud', desc: 'Administrar proyectos estudiantiles' },
  { id: 'lms', label: 'Mi Aula Virtual', desc: 'Cursos, actividades, rúbricas y calificaciones' },
];

export interface RoleConfig {
  id: string;
  name: string;
  description?: string;
  permissions: SystemModuleId[];
  isSystem?: boolean;
  createdAt?: Timestamp;
}

export const ROLE_LABELS_BASE: Record<string, string> = {
  admin: 'Administrador',
};

export let ROLE_LABELS: Record<string, string> = { ...ROLE_LABELS_BASE };

export function updateRoleLabelsFromFirestore(roles: RoleConfig[]) {
  const dynamicLabels: Record<string, string> = {};
  for (const role of roles) {
    dynamicLabels[role.id] = role.name;
  }
  ROLE_LABELS = { ...ROLE_LABELS_BASE, ...dynamicLabels };
}

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
  code?: string;
  cycle?: Cycle;
  gradeId: string;
  gradeName?: string;
  status: 'ACTIVO' | 'INACTIVO';
  type: 'BASICA' | 'MINED' | 'INSTITUCIONAL';
  weeklyHours?: number;
  parentSubjectId?: string;
  teacherId?: string;
  teacherName?: string;
  hours?: number;
  weeks?: number;
  isTechnicalModule?: boolean;
  createdAt?: string;
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

// ==================== ATTENDANCE REPORTS (HISTORIAL) ====================

export interface AttendanceReportData {
  colegio: string;
  fecha: string;
  grado: string;
  gradoId: string;
  tutor: string;
  tutorId: string;
  modalidad: string;
  estadisticas: {
    totalEstudiantes: number;
    presentes: number;
    llegadasTarde: number;
    ausentes: number;
    disciplina: {
      cabelloLargo: number;
      unasPintadas: number;
      uniformeIncorrecto: number;
    };
  };
  detalles: Array<{
    id: string;
    nombre: string;
    genero: 'M' | 'F';
    asistencia: string;
    horaLlegada: string | null;
    disciplina: {
      cabelloLargo: boolean;
      unasPintadas: boolean;
      uniformeIncorrecto: boolean;
    };
  }>;
}

export interface AttendanceReport extends AttendanceReportData {
  id: string;
  createdAt: Timestamp;
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
  | 'rechazo_coordinacion'
  | 'eliminado';

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

// ==================== EVALUACIÓN DE PROYECTOS ====================

export type TipoActividad = 'investigacion' | 'experimento' | 'presentacion' | 'codigo' | 'sitio_web' | 'excel' | 'escrito' | 'expo_feria' | 'arduino' | 'poo' | 'otro';

export const TIPOS_ACTIVIDAD: Record<TipoActividad, { label: string; icon: string; materias: string[] }> = {
  investigacion: { label: 'Investigación',   icon: '🔬', materias: ['ciencia', 'ciudadania', 'lenguaje'] },
  experimento:   { label: 'Experimento',     icon: '🧪', materias: ['ciencia', 'matematicas'] },
  presentacion:  { label: 'Presentación',    icon: '📽️', materias: ['todas'] },
  codigo:        { label: 'Código',          icon: '💻', materias: ['matematicas', 'ciencia'] },
  sitio_web:     { label: 'Sitio Web',       icon: '🌐', materias: ['todas'] },
  excel:         { label: 'Excel/Datos',     icon: '📊', materias: ['matematicas', 'ciencia'] },
  escrito:       { label: 'Reporte Escrito', icon: '📝', materias: ['lenguaje', 'ciudadania'] },
  expo_feria:    { label: 'Exposición Feria', icon: '🎤', materias: ['todas'] },
  arduino:       { label: 'Arduino/Robótica', icon: '🔧', materias: ['ciencia', 'matematicas', 'todas'] },
  poo:           { label: 'Prog. Orientada a Objetos', icon: '🧊', materias: ['todas'] },
  otro:          { label: 'Otro',            icon: '📋', materias: ['todas'] },
};

export interface CriterioRubrica {
  id: string;
  descripcion: string;
  peso: number; // Puntos que vale este criterio (deben sumar 100)
  descripcion_nivel1?: string; // Qué significa获得1 punto
  descripcion_nivel2?: string; // Qué significa获得2 puntos
  descripcion_nivel3?: string; // Qué significa获得3 puntos
  descripcion_nivel4?: string; // Qué significa获得4 puntos
  descripcion_nivel5?: string; // Qué significa获得5 puntos
}

export interface CalificacionCriterio {
  criterio_id: string;
  puntuacion: number; // 1-5
}

export const ESCALA_CALIFICACION: Record<number, { label: string; color: string }> = {
  1: { label: 'Deficiente', color: 'text-red-600 bg-red-50' },
  2: { label: 'En desarrollo', color: 'text-orange-600 bg-orange-50' },
  3: { label: 'Cumple parcialmente', color: 'text-amber-600 bg-amber-50' },
  4: { label: 'Cumple', color: 'text-emerald-600 bg-emerald-50' },
  5: { label: 'Superó expectativas', color: 'text-green-600 bg-green-50' },
};

export interface ActividadEvaluada {
  id: string;
  proyecto_id: string;
  materia_id: string;
  materia_nombre: string;
  docente_id: string;
  docente_nombre: string;
  tipo_actividad: TipoActividad;
  titulo: string;
  descripcion: string;
  instrucciones?: string;
  herramientas_requeridas: string[];
  rubrica: CriterioRubrica[];
  herramientas_sugeridas_ia?: string[]; // Herramientas sugeridas por IA
  url_entrega?: string; // URL del trabajo del alumno
  fecha_asignacion: string;
  fecha_limite?: string;
  estado: 'borrador' | 'publicada' | 'entregada' | 'calificada';
  calificaciones_criterios?: CalificacionCriterio[]; // Puntuaciones por criterio (1-5)
  calificacion_total?: number; // Suma ponderada (0-100)
  calificacion_nota?: number; // Nota final (0-10)
  observaciones_calificacion?: string;
  fecha_calificacion?: string;
  created_at: string;
  updated_at: string;
}

// Mantener compatibilidad con nombre anterior
export type TipoEvaluacionInformatica = TipoActividad;
export const TIPOS_EVALUACION_INFO = TIPOS_ACTIVIDAD;
export type EvaluacionProyecto = ActividadEvaluada;

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
  materias_secundarias?: string[];
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
  evaluacion_informatica?: EvaluacionProyecto;
  actividades_evaluadas?: ActividadEvaluada[];
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

// ==================== LMS TYPES ====================

export type TechnicalYear = '1' | '2' | '3';
export type ActionStageKey = 'informar' | 'planificar' | 'decidir' | 'ejecutar' | 'controlar' | 'valorar';
export type MinedLevel = 1 | 2 | 3 | 4 | 5;
export type ActivityStatus = 'pendiente' | 'entregada' | 'calificada' | 'vencida';

export interface LMSCourse {
  id: string;
  name: string;
  code: string;
  description: string;
  teacherId: string;
  teacherName: string;
  gradeId: string;
  gradeName: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive' | 'upcoming';
  schedule: string;
  classroom: string;
  progress: number;
  averageGrade?: number;
  minedLevel?: MinedLevel;
  technicalYear: TechnicalYear;
  hours: number;
  weeks: number;
  affineArea: string;
  unitsCount: number;
  activitiesCount: number;
  createdAt?: string;
  descriptor?: CourseDescriptor;
}

export interface CourseDescriptor {
  code: string;
  name?: string;
  objective?: string;
  units?: ModuleUnit[];
  methodology?: string;
  evaluationCriteria?: string[];
  bibliography?: {
    books: string[];
    websites: string[];
  };
  saberesPrevios?: SaberPrevio[];
  actionStages?: Record<string, unknown> | ActionStageKey[];
  hours?: number;
  weeks?: number;
  year?: string;
  prerequisite?: string;
  competenceGeneral?: string;
  moduleObjective?: string;
  developmentAxes?: Record<string, string>;
  saberesNecesarios?: Array<{ id: string; description: string }>;
  currentProject?: ProjectBrief;
  availableProjects?: ProjectBrief[];
  resources?: unknown;
  [key: string]: unknown;
}

export interface ModuleUnit {
  id: string;
  title: string;
  description: string;
  hours: number;
  stageKey: ActionStageKey;
}

export interface SaberPrevio {
  id: string;
  question?: string;
  description?: string;
  options?: string[];
  appreciation?: 'MUCHO' | 'POCO' | 'NADA';
  [key: string]: unknown;
}

export interface ProjectBrief {
  id: string;
  courseId?: string;
  courseCode?: string;
  academicYear: string;
  topic?: string;
  title?: string;
  theme?: string;
  targetClient?: string;
  problemStatement?: string;
  problematicSituation?: string;
  creativeBrief?: string;
  generalObjective?: string;
  specificObjectives?: string[];
  suggestedSoftware?: string[];
  materialsRequired?: string[];
  deliverables: string[];
  evaluationRubric?: string;
  status: 'active' | 'archived' | 'upcoming';
  createdAt?: string;
}

export interface LMSCourseModule {
  id: string;
  courseId: string;
  stageKey: ActionStageKey;
  title: string;
  description: string;
  order: number;
  locked: boolean;
  hours: number;
  completed?: boolean;
  resourcesCount: number;
  activitiesCount: number;
}

export interface LMSActivity {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  courseColor: string;
  moduleId: string;
  moduleTitle: string;
  stageKey: ActionStageKey;
  title: string;
  type: 'delivery' | 'evaluated' | 'rubric' | 'self_evaluation';
  rubricId?: string;
  rubric?: Rubric;
  maxScore: number;
  dueDate: string;
  instructions: string;
  status: ActivityStatus;
  submission?: LMSSubmission;
  attachments?: { name: string; size: string; url?: string }[];
}

export interface LMSSubmission {
  id: string;
  activityId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  content: string;
  attachments: { name: string; size: string; url?: string }[];
  grade?: number;
  minedLevel?: MinedLevel;
  feedback?: string;
  gradedAt?: string;
  criterionScores?: Record<string, number>;
  selfEvaluation?: {
    learned: string;
    difficulties: string;
    reflection: string;
  };
  axisLevels?: {
    tecnico: MinedLevel;
    emprendedor: MinedLevel;
    humanoSocial: MinedLevel;
    academico: MinedLevel;
  };
  axesScores?: {
    scoreTecnico: number;
    scoreEmprendedor: number;
    scoreHumanoSocial: number;
    scoreAcademicoAplicado: number;
  };
}

export interface Rubric {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  axes?: RubricAxis[];
  criteria?: RubricCriteria[];
  minLevel?: MinedLevel;
  gradeRange?: { min: number; max: number };
  approved?: boolean;
  [key: string]: unknown;
}

export interface RubricAxis {
  id: string;
  name: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricCriteria {
  id: string;
  title: string;
  axis: string;
  weight: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  level?: MinedLevel;
  score?: number;
  label?: string;
  description: string;
  gradeRange?: { min: number; max: number };
  approved?: boolean;
  criteria?: string[];
  [key: string]: unknown;
}

export interface LMSStudentSummary {
  enrolledCoursesCount: number;
  pendingActivitiesCount: number;
  completedActivitiesCount: number;
  overallAverage: number;
  overallMinedLevel: MinedLevel;
  progressPercentage: number;
  totalTechnicalHours: number;
  currentYear: TechnicalYear;
}

export const MINED_LEVELS: Record<MinedLevel, { label: string; color: string; desc: string; gradeRange?: { min: number; max: number }; description?: string; approved?: boolean }> = {
  1: { label: 'Nivel 1', color: 'text-red-600 bg-red-50', desc: 'Insatisfactorio' },
  2: { label: 'Nivel 2', color: 'text-orange-600 bg-orange-50', desc: 'En desarrollo' },
  3: { label: 'Nivel 3', color: 'text-yellow-600 bg-yellow-50', desc: 'Satisfactorio básico' },
  4: { label: 'Nivel 4', color: 'text-blue-600 bg-blue-50', desc: 'Satisfactorio avanzado' },
  5: { label: 'Nivel 5', color: 'text-emerald-600 bg-emerald-50', desc: 'Destacado' },
};

// ==================== LMS MODULE STRUCTURE (ADMIN) ====================

export interface LMSModule {
  id: string;
  name: string;
  code: string;
  subjectId: string;
  teacherId: string;
  teacherName: string;
  gradeId: string;
  gradeName: string;
  technicalYear: TechnicalYear;
  hours: number;
  weeks: number;
  status: 'active' | 'inactive';
  description?: string;
  icon?: string;
  color?: string;
  affineArea?: string;
  schedule?: string;
  classroom?: string;
  sectionId?: string;
  sectionName?: string;
  progress?: number;
  averageGrade?: number;
  minedLevel?: number;
  descriptor: {
    objective?: string;
    units: ModuleUnit[];
    methodology?: string;
    evaluationCriteria: string[];
    bibliography: {
      books: string[];
      websites: string[];
    };
    saberesPrevios: SaberPrevio[];
    developmentAxes: {
      desarrolloTecnico: string;
      desarrolloEmprendedor: string;
      desarrolloHumanoSocial: string;
      desarrolloAcademicoAplicado: string;
    };
    competenceGeneral?: string;
    moduleObjective?: string;
    actionStages?: Record<string, {
      title: string;
      hoursPercentage: number;
      guidingQuestions: string[];
      studentTasks: string[];
      teacherTasks: string[];
      suggestedTools: string[];
    }>;
    saberesNecesarios?: Array<{ id: string; description: string }>;
    currentProject?: ProjectBrief;
    availableProjects?: ProjectBrief[];
    problematicSituation?: {
      cause: string;
      situation: string;
      effect: string;
      summary: string;
    };
    resources?: {
      materials: string[];
      equipment: string[];
      furniture: string[];
      safety: string[];
    };
    prerequisite?: string;
    promotionCriteria?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface LMSModuleContent {
  moduleId: string;
  theory: LMSContentItem[];
  examples: LMSExample[];
  exercises: LMSExercise[];
  updatedBy: string;
  updatedAt: string;
}

export interface LMSContentItem {
  id: string;
  title: string;
  body: string;
  videoUrl?: string;
  attachments: LMSAttachment[];
  order: number;
}

export interface LMSExample {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  solutionUrl?: string;
  order: number;
}

export interface LMSExercise {
  id: string;
  title: string;
  instructions: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solution?: string;
  order: number;
}

export interface LMSAttachment {
  name: string;
  url: string;
  type: 'pdf' | 'image' | 'video' | 'link';
}

export interface LMSCalendarEvent {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  date: string;
  type: 'class' | 'exam' | 'delivery' | 'event';
  createdAt: string;
}

// ==================== CALENDARIO INSTITUCIONAL ====================

export type SuspensionCategory = 'pausa' | 'feriado' | 'institucional' | 'suspension' | 'evaluacion';

export interface SuspensionEvent {
  id: string;
  dia: string;
  mes: string;
  actividad: string;
  tipo: SuspensionCategory;
  diasHabilesAfectados?: number;
}

export interface MonthStats {
  month: string;
  name: string;
  semanas: number;
  dias: number;
  feriadosDesc: string;
  eventos?: SuspensionEvent[];
}

export interface AcademicPeriodActivity {
  nombre: string;
  fechas?: string;
  fechaInicio?: string;
  fechaCierre?: string;
  ingresoTBox?: string;
  porcentaje?: string;
  tipo?: 'formativa' | 'objetiva' | 'diagnostica' | 'refuerzo' | 'recuperacion' | 'boletas' | 'temario';
}

export interface AcademicPeriod {
  nombre: string;
  inicio: string;
  fin: string;
  tipo: 'Bimestre' | 'Trimestre';
  ingresoTBoxFinal?: string;
  entregaBoletas?: string;
  entregaTemarios?: string;
  recuperacionOrdinaria?: string;
  pruebaExtraordinaria?: string;
  actividades: AcademicPeriodActivity[];
}

export interface DidacticEvaluationActivity {
  no: number;
  etapa?: string;
  tiempo?: string;
  fase?: string;
  actividad: string;
  evidencia?: string;
  ponderacion: string;
  fecha: string;
}

export interface DidacticPlan {
  trimestrePeriodo?: string;
  competenciasUnidad?: string;
  conceptuales: string[];
  procedimentales: string[];
  actitudinales: string[];
  metodologia?: string;
  indicadoresTexto?: string;
  actividades: DidacticEvaluationActivity[];
  recursos: string;
  tic: string;
  bibliografia: string[];
}

export interface ModuleDescriptor {
  codigo: string;
  nombre: string;
  duracionHoras?: number;
  semanas: number;
  horasSemanales: number;
  desarrolloTecnico?: number;
  desarrolloEmprendedor?: number;
  desarrolloHumanoSocial?: number;
  desarrolloAcademicoAplicado?: number;
  totalIndicadores?: number;
  horasPorUnidad?: {
    u1: number;
    u2?: number;
    u3?: number;
    u4?: number;
  };
  bimestres?: {
    b1: number;
    b2: number;
    b3: number;
    b4: number;
  };
  totalHoras: number;
  fechaInicio: string;
  fechaFin: string;
  mesInicio: string;
  diaInicio: number;
  mesFin: string;
  diaFin: number;
  campo?: string;
  especialidad?: string;
  prerrequisito?: string;
  competencias?: string;
  competenciaGeneral?: string;
  objetivoModulo?: string;
  situacionProblematica?: string;
  criteriosEvaluacion?: string[];
  unidades?: number;
  planDidactico?: DidacticPlan;
}

export interface InstitutionalHeader {
  institucion: string;
  tituloDocumento: string;
  docente: string;
  gradoSeccion: string;
  anoLectivo: string;
  horasSemanalesModulo: number;
  notaEvaluativa: string;
  anoNivel: '10' | '11' | '12';
}

export interface GuionEvaluacionRow {
  no: number;
  actividad: string;
  ponderacion: string;
  fechaRealizacion: string;
}

export interface GuionDeClase {
  id: string;
  sesionNumero: number;
  totalSesiones?: number;
  moduloCodigo: string;
  moduloNombre: string;
  docente: string;
  gradoSeccion: string;
  trimestre?: string;
  semanaModulo: string;
  semanaNumero?: number;
  fecha: string;
  unidad: string;
  contenido: string;
  tiempo: string;
  horas: number;
  etapaAccionCompleta?: string;
  etapaNumero?: number;
  faseEvaluacion?: string;
  objetivoClase: string;
  indicadorLogro: string;
  competenciasEspecificas: string;
  ejeTransversal: string;
  inicioSituacion: string;
  inicioEvaluacion: string;
  desarrolloSituacion: string;
  desarrolloEvaluacion: string;
  cierreSituacion: string;
  cierreEvaluacion: string;
  adaptacionesCurriculares: string;
  actividadesEvaluacion: GuionEvaluacionRow[];
  tarea: string;
  bibliografia: string;
  recursosClase: string;
  tics: string;
}
