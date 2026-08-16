import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, where, QueryConstraint, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import firebaseConfig from '../firebase-applet-config.json';
import { AttendanceReport } from './types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore with local persistent cache for robust offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

export const auth = getAuth(app);
export const functions = getFunctions(app);

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
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.error('Firestore Error:', operationType, path, error instanceof Error ? error.message : error);
  throw new Error(JSON.stringify(errInfo));
}

export async function getAttendanceReports(constraints: QueryConstraint[] = []): Promise<AttendanceReport[]> {
  const collectionPath = 'attendance_reports';
  try {
    const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AttendanceReport[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return [];
  }
}

export { deleteDoc, doc };
