import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore & Auth
export const db = getFirestore(app);
export const auth = getAuth(app);

// Operation types for standard error tracking (per skill instructions)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

export async function saveAttendanceReport(reportData: AttendanceReportData): Promise<string | undefined> {
  const collectionPath = 'attendance_reports';
  try {
    const docRef = await addDoc(collection(db, collectionPath), {
      ...reportData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collectionPath);
  }
}
