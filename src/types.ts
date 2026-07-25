import { Timestamp } from 'firebase/firestore';

// ==================== USER & AUTH ====================

export type UserRole =
  | 'admin'
  | 'docente'
  | 'alumno'
  | 'coordinacion'
  | 'registro_academico'
  | 'enfermeria'
  | 'psicopedagogio';

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
  registro_academico: 'Registro Académico',
  enfermeria: 'Enfermería',
  psicopedagogio: 'Psicopedagogía',
};

// ==================== ACADEMIC ENTITIES ====================

export type Cycle = '1' | '2' | '3' | '4';
export type BaccalaureateType = 'general' | 'tecnico';

export const CYCLE_NAMES: Record<Cycle, string> = {
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