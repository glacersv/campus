import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { User, Teacher, Grade, Student } from '../types';

// ==================== COLLECTIONS ====================

const USERS_COLLECTION = 'users';
const TEACHERS_COLLECTION = 'teachers';
const GRADES_COLLECTION = 'grades';
const STUDENTS_COLLECTION = 'students';

// ==================== USERS ====================

export async function createUser(userData: Omit<User, 'createdAt'>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userData.uid);
  await setDoc(userRef, {
    ...userData,
    createdAt: serverTimestamp()
  });
}

export async function getUser(uid: string): Promise<User | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return { uid: userSnap.id, ...userSnap.data() } as User;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, data);
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
}

export async function getUsersByRole(role: string): Promise<User[]> {
  const q = query(collection(db, USERS_COLLECTION), where('role', '==', role));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
}

// ==================== TEACHERS ====================

export async function createTeacher(teacherData: Omit<Teacher, 'createdAt'>): Promise<void> {
  const teacherRef = doc(db, TEACHERS_COLLECTION, teacherData.id);
  await setDoc(teacherRef, {
    ...teacherData,
    createdAt: serverTimestamp()
  });
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  const teacherSnap = await getDoc(teacherRef);
  if (!teacherSnap.exists()) return null;
  return { id: teacherSnap.id, ...teacherSnap.data() } as Teacher;
}

export async function getTeacherByGrade(gradeId: string): Promise<Teacher | null> {
  const q = query(collection(db, TEACHERS_COLLECTION), where('gradeId', '==', gradeId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Teacher;
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<void> {
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  await updateDoc(teacherRef, data);
}

export async function deleteTeacher(id: string): Promise<void> {
  const teacherRef = doc(db, TEACHERS_COLLECTION, id);
  await deleteDoc(teacherRef);
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const q = query(collection(db, TEACHERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
}

// ==================== GRADES ====================

export async function createGrade(gradeData: Omit<Grade, 'createdAt'>): Promise<void> {
  const gradeRef = doc(db, GRADES_COLLECTION, gradeData.id);
  await setDoc(gradeRef, {
    ...gradeData,
    createdAt: serverTimestamp()
  });
}

export async function getGrade(id: string): Promise<Grade | null> {
  const gradeRef = doc(db, GRADES_COLLECTION, id);
  const gradeSnap = await getDoc(gradeRef);
  if (!gradeSnap.exists()) return null;
  return { id: gradeSnap.id, ...gradeSnap.data() } as Grade;
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<void> {
  const gradeRef = doc(db, GRADES_COLLECTION, id);
  await updateDoc(gradeRef, data);
}

export async function deleteGrade(id: string): Promise<void> {
  const gradeRef = doc(db, GRADES_COLLECTION, id);
  await deleteDoc(gradeRef);
}

export async function getAllGrades(): Promise<Grade[]> {
  const q = query(collection(db, GRADES_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
}

export async function getGradesByTeacher(teacherId: string): Promise<Grade[]> {
  const q = query(collection(db, GRADES_COLLECTION), where('teacherId', '==', teacherId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Grade));
}

// ==================== STUDENTS ====================

export async function createStudent(studentData: Omit<Student, 'createdAt'>): Promise<void> {
  const studentRef = doc(db, STUDENTS_COLLECTION, studentData.id);
  await setDoc(studentRef, {
    ...studentData,
    createdAt: serverTimestamp()
  });
}

export async function getStudent(id: string): Promise<Student | null> {
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  const studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) return null;
  return { id: studentSnap.id, ...studentSnap.data() } as Student;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  await updateDoc(studentRef, data);
}

export async function deleteStudent(id: string): Promise<void> {
  const studentRef = doc(db, STUDENTS_COLLECTION, id);
  await deleteDoc(studentRef);
}

export async function getAllStudents(): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

export async function getStudentsByGrade(gradeId: string): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), where('gradeId', '==', gradeId), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
}

// ==================== SEED DATA ====================

export async function seedInitialData(): Promise<void> {
  const teachers = await getAllTeachers();
  if (teachers.length > 0) return; // Already seeded

  // Create grades
  const grades: Omit<Grade, 'createdAt'>[] = [
    { id: '9a', name: '9° Grado "A"', teacherId: 't1' },
    { id: '1ba', name: '1° Año Bachillerato "A"', teacherId: 't2' }
  ];

  for (const grade of grades) {
    await createGrade(grade);
  }

  // Create teachers
  const teachersData: Omit<Teacher, 'createdAt'>[] = [
    {
      id: 't1',
      name: 'Prof. Roberto Henríquez',
      email: 'docente1@salesianosanjose.edu.sv',
      gradeId: '9a',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 't2',
      name: 'Profra. Andrea Melara',
      email: 'docente2@salesianosanjose.edu.sv',
      gradeId: '1ba',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    }
  ];

  for (const teacher of teachersData) {
    await createTeacher(teacher);
  }

  // Create students
  const students: Omit<Student, 'createdAt'>[] = [
    // 9° Grado "A"
    { id: 's01', name: 'Carlos Daniel Henríquez', gender: 'M', gradeId: '9a' },
    { id: 's02', name: 'Gabriela María Melara', gender: 'F', gradeId: '9a' },
    { id: 's03', name: 'Diego Alejandro Solís', gender: 'M', gradeId: '9a' },
    { id: 's04', name: 'Valeria Sofía Paz', gender: 'F', gradeId: '9a' },
    { id: 's05', name: 'Mateo Sebastián Castro', gender: 'M', gradeId: '9a' },
    { id: 's06', name: 'Camila Fernanda Ortiz', gender: 'F', gradeId: '9a' },
    { id: 's07', name: 'Nicolás Alberto Durán', gender: 'M', gradeId: '9a' },
    { id: 's08', name: 'Elena Beatriz Rivas', gender: 'F', gradeId: '9a' },
    { id: 's09', name: 'José Manuel Amaya', gender: 'M', gradeId: '9a' },
    { id: 's10', name: 'Daniela Alejandra Gómez', gender: 'F', gradeId: '9a' },
    // 1° Año Bachillerato "A"
    { id: 's21', name: 'Rodrigo Andrés Flores', gender: 'M', gradeId: '1ba' },
    { id: 's22', name: 'Mariana Isabel Chicas', gender: 'F', gradeId: '1ba' },
    { id: 's23', name: 'Fernando José Palacios', gender: 'M', gradeId: '1ba' },
    { id: 's24', name: 'Sofía Alejandra Quintanilla', gender: 'F', gradeId: '1ba' },
    { id: 's25', name: 'Daniel Eduardo Portillo', gender: 'M', gradeId: '1ba' },
    { id: 's26', name: 'Lucía Valentina Merino', gender: 'F', gradeId: '1ba' },
    { id: 's27', name: 'Gerardo Ernesto Alvarado', gender: 'M', gradeId: '1ba' },
    { id: 's28', name: 'Natalia Estefanía Guardado', gender: 'F', gradeId: '1ba' },
    { id: 's29', name: 'William Alexánder Ramos', gender: 'M', gradeId: '1ba' },
    { id: 's30', name: 'Adriana Gisselle Vásquez', gender: 'F', gradeId: '1ba' }
  ];

  for (const student of students) {
    await createStudent(student);
  }

  console.log('Initial data seeded successfully');
}