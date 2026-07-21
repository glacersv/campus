import { Timestamp } from 'firebase/firestore';

// ==================== USER & AUTH ====================

export type UserRole = 'admin' | 'teacher';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teacherId?: string;
  createdAt?: Timestamp;
  microsoftId?: string;
}

// ==================== ACADEMIC ENTITIES ====================

export interface Teacher {
  id: string;
  name: string;
  email: string;
  gradeId: string;
  avatarUrl?: string;
  createdAt?: Timestamp;
}

export interface Grade {
  id: string;
  name: string;
  teacherId: string;
  createdAt?: Timestamp;
}

export interface Student {
  id: string;
  name: string;
  gender: 'M' | 'F';
  gradeId: string;
  createdAt?: Timestamp;
}

// ==================== ATTENDANCE ====================

export type AttendanceStatus = 'Presente' | 'Tarde' | 'Ausente';

export interface DisciplineRecord {
  cabelloLargo: boolean; // Only for males
  unasPintadas: boolean; // Only for females
  uniformeIncorrecto: boolean; // For both
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
  civicAct: boolean;
  records: Record<string, StudentSessionState>;
}
