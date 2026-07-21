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
import { User, Grade, Section, Subject, Teacher, Student, BaccalaureateTypeDoc, Building, ComputerLab } from '../types';

// ==================== COLLECTIONS ====================

const USERS_COLLECTION = 'users';
const GRADES_COLLECTION = 'grades';
const SECTIONS_COLLECTION = 'sections';
const SUBJECTS_COLLECTION = 'subjects';
const TEACHERS_COLLECTION = 'teachers';
const STUDENTS_COLLECTION = 'students';
const BACCALAUREATE_TYPES_COLLECTION = 'baccalaureate_types';
const BUILDINGS_COLLECTION = 'buildings';
const COMPUTER_LABS_COLLECTION = 'computer_labs';

// ==================== USERS ====================

export async function createUser(userData: Omit<User, 'createdAt'>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, userData.uid);
  await setDoc(userRef, { ...userData, createdAt: serverTimestamp() });
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
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User));
}

// ==================== GRADES ====================

export async function createGrade(data: Omit<Grade, 'createdAt'>): Promise<void> {
  const ref = doc(db, GRADES_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getGrade(id: string): Promise<Grade | null> {
  const ref = doc(db, GRADES_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Grade;
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<void> {
  const ref = doc(db, GRADES_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteGrade(id: string): Promise<void> {
  const ref = doc(db, GRADES_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllGrades(): Promise<Grade[]> {
  const q = query(collection(db, GRADES_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Grade));
}

// ==================== BACCALAUREATE TYPES ====================

export async function createBaccalaureateType(data: Omit<BaccalaureateTypeDoc, 'createdAt'>): Promise<void> {
  const ref = doc(db, BACCALAUREATE_TYPES_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getBaccalaureateType(id: string): Promise<BaccalaureateTypeDoc | null> {
  const ref = doc(db, BACCALAUREATE_TYPES_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BaccalaureateTypeDoc;
}

export async function updateBaccalaureateType(id: string, data: Partial<BaccalaureateTypeDoc>): Promise<void> {
  const ref = doc(db, BACCALAUREATE_TYPES_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteBaccalaureateType(id: string): Promise<void> {
  const ref = doc(db, BACCALAUREATE_TYPES_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllBaccalaureateTypes(): Promise<BaccalaureateTypeDoc[]> {
  const q = query(collection(db, BACCALAUREATE_TYPES_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BaccalaureateTypeDoc));
}

// ==================== BUILDINGS ====================

export async function createBuilding(data: Omit<Building, 'createdAt'>): Promise<void> {
  const ref = doc(db, BUILDINGS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getBuilding(id: string): Promise<Building | null> {
  const ref = doc(db, BUILDINGS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Building;
}

export async function updateBuilding(id: string, data: Partial<Building>): Promise<void> {
  const ref = doc(db, BUILDINGS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteBuilding(id: string): Promise<void> {
  const ref = doc(db, BUILDINGS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllBuildings(): Promise<Building[]> {
  const q = query(collection(db, BUILDINGS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Building));
}

// ==================== COMPUTER LABS ====================

export async function createComputerLab(data: Omit<ComputerLab, 'createdAt'>): Promise<void> {
  const ref = doc(db, COMPUTER_LABS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getComputerLab(id: string): Promise<ComputerLab | null> {
  const ref = doc(db, COMPUTER_LABS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ComputerLab;
}

export async function updateComputerLab(id: string, data: Partial<ComputerLab>): Promise<void> {
  const ref = doc(db, COMPUTER_LABS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteComputerLab(id: string): Promise<void> {
  const ref = doc(db, COMPUTER_LABS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllComputerLabs(): Promise<ComputerLab[]> {
  const q = query(collection(db, COMPUTER_LABS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ComputerLab));
}

// ==================== SECTIONS ====================

export async function createSection(data: Omit<Section, 'createdAt'>): Promise<void> {
  const ref = doc(db, SECTIONS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getSection(id: string): Promise<Section | null> {
  const ref = doc(db, SECTIONS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Section;
}

export async function updateSection(id: string, data: Partial<Section>): Promise<void> {
  const ref = doc(db, SECTIONS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteSection(id: string): Promise<void> {
  const ref = doc(db, SECTIONS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllSections(): Promise<Section[]> {
  const q = query(collection(db, SECTIONS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Section));
}

export async function getSectionsByGrade(gradeId: string): Promise<Section[]> {
  const q = query(collection(db, SECTIONS_COLLECTION), where('gradeId', '==', gradeId), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Section));
}

// ==================== SUBJECTS ====================

export async function createSubject(data: Omit<Subject, 'createdAt'>): Promise<void> {
  const ref = doc(db, SUBJECTS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getSubject(id: string): Promise<Subject | null> {
  const ref = doc(db, SUBJECTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Subject;
}

export async function updateSubject(id: string, data: Partial<Subject>): Promise<void> {
  const ref = doc(db, SUBJECTS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteSubject(id: string): Promise<void> {
  const ref = doc(db, SUBJECTS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllSubjects(): Promise<Subject[]> {
  const q = query(collection(db, SUBJECTS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
}

// ==================== TEACHERS ====================

export async function createTeacher(data: Omit<Teacher, 'createdAt'>): Promise<void> {
  const ref = doc(db, TEACHERS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  const ref = doc(db, TEACHERS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Teacher;
}

export async function updateTeacher(id: string, data: Partial<Teacher>): Promise<void> {
  const ref = doc(db, TEACHERS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteTeacher(id: string): Promise<void> {
  const ref = doc(db, TEACHERS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllTeachers(): Promise<Teacher[]> {
  const q = query(collection(db, TEACHERS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Teacher));
}

export async function getTeacherByGrade(gradeId: string): Promise<Teacher | null> {
  const q = query(collection(db, TEACHERS_COLLECTION), where('guideGradeId', '==', gradeId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { id: d.id, ...d.data() } as Teacher;
}

// ==================== STUDENTS ====================

export async function createStudent(data: Omit<Student, 'createdAt'>): Promise<void> {
  const ref = doc(db, STUDENTS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getStudent(id: string): Promise<Student | null> {
  const ref = doc(db, STUDENTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Student;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  const ref = doc(db, STUDENTS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteStudent(id: string): Promise<void> {
  const ref = doc(db, STUDENTS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllStudents(): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
}

export async function getStudentsByGrade(gradeId: string): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), where('gradeId', '==', gradeId), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
}

export async function getStudentsBySection(gradeId: string, sectionId: string): Promise<Student[]> {
  const q = query(
    collection(db, STUDENTS_COLLECTION),
    where('gradeId', '==', gradeId),
    where('sectionId', '==', sectionId),
    orderBy('name', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
}

// ==================== SEED DATA ====================

export async function seedInitialData(): Promise<void> {
  const grades = await getAllGrades();
  if (grades.length > 0) return;

  // Buildings
  const buildingsData = [
    { id: 'b1', name: 'Edificio Principal', code: 'EP', color: '#12562E', description: 'Administración y oficinas' },
    { id: 'b2', name: 'Edificio Académico', code: 'EA', color: '#0D71B9', description: 'Aulas de clases' },
    { id: 'b3', name: 'Edificio Técnico', code: 'ET', color: '#FAB700', description: 'Laboratorios y talleres' },
    { id: 'b4', name: 'Edificio Deportivo', code: 'ED', color: '#D32F2F', description: 'Gimnasio y deportes' }
  ];
  for (const b of buildingsData) await createBuilding(b);

  // Computer Labs
  const computerLabsData = [
    { id: 'cl1', name: 'Lab 1', buildingId: 'b3', capacity: 30, devices: 30 },
    { id: 'cl2', name: 'Lab 2', buildingId: 'b3', capacity: 30, devices: 28 },
    { id: 'cl3', name: 'Lab 3', buildingId: 'b3', capacity: 30, devices: 30 },
    { id: 'cl4', name: 'Lab 4', buildingId: 'b2', capacity: 25, devices: 25 },
    { id: 'cl5', name: 'Lab 5', buildingId: 'b2', capacity: 25, devices: 24 },
    { id: 'cl6', name: 'Lab 6', buildingId: 'b2', capacity: 25, devices: 25 },
    { id: 'cl7', name: 'Lab 7', buildingId: 'b3', capacity: 35, devices: 35 },
    { id: 'cl8', name: 'Lab 8', buildingId: 'b3', capacity: 35, devices: 32 },
    { id: 'cl9', name: 'Lab 9', buildingId: 'b3', capacity: 35, devices: 35 },
    { id: 'cl10', name: 'Lab 10', buildingId: 'b3', capacity: 30, devices: 30 }
  ];
  for (const cl of computerLabsData) await createComputerLab(cl);

  // Baccalaureate Types
  const baccalaureateTypesData = [
    { id: 'general', name: 'Bachillerato General', maxGrade: 11 },
    { id: 'tecnico', name: 'Bachillerato Técnico', maxGrade: 12 }
  ];
  for (const bt of baccalaureateTypesData) await createBaccalaureateType(bt);

  // Grades - Primer Ciclo (1°-3°)
  const gradesData = [
    { id: '1', name: '1° Grado', cycle: '1' as const },
    { id: '2', name: '2° Grado', cycle: '1' as const },
    { id: '3', name: '3° Grado', cycle: '1' as const },
    // Segundo Ciclo (4°-6°)
    { id: '4', name: '4° Grado', cycle: '2' as const },
    { id: '5', name: '5° Grado', cycle: '2' as const },
    { id: '6', name: '6° Grado', cycle: '2' as const },
    // Tercer Ciclo (7°-9°)
    { id: '7', name: '7° Grado', cycle: '3' as const },
    { id: '8', name: '8° Grado', cycle: '3' as const },
    { id: '9', name: '9° Grado', cycle: '3' as const },
    // Bachillerato General (10°-11°)
    { id: '10g', name: '10° Bachillerato General', cycle: '4' as const, baccalaureateType: 'general' as const },
    { id: '11g', name: '11° Bachillerato General', cycle: '4' as const, baccalaureateType: 'general' as const },
    // Bachillerato Técnico (10°-12°)
    { id: '10t', name: '10° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const },
    { id: '11t', name: '11° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const },
    { id: '12t', name: '12° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const }
  ];
  for (const g of gradesData) await createGrade(g);

  // Sections
  const sectionsData = [
    { id: '1a', name: 'A', gradeId: '1', capacity: 45, buildingId: 'b2' },
    { id: '1b', name: 'B', gradeId: '1', capacity: 42, buildingId: 'b2' },
    { id: '2a', name: 'A', gradeId: '2', capacity: 45, buildingId: 'b2' },
    { id: '2b', name: 'B', gradeId: '2', capacity: 42, buildingId: 'b2' },
    { id: '3a', name: 'A', gradeId: '3', capacity: 45, buildingId: 'b2' },
    { id: '3b', name: 'B', gradeId: '3', capacity: 42, buildingId: 'b2' },
    { id: '4a', name: 'A', gradeId: '4', capacity: 45, buildingId: 'b2' },
    { id: '4b', name: 'B', gradeId: '4', capacity: 42, buildingId: 'b2' },
    { id: '5a', name: 'A', gradeId: '5', capacity: 45, buildingId: 'b2' },
    { id: '5b', name: 'B', gradeId: '5', capacity: 42, buildingId: 'b2' },
    { id: '6a', name: 'A', gradeId: '6', capacity: 45, buildingId: 'b2' },
    { id: '6b', name: 'B', gradeId: '6', capacity: 42, buildingId: 'b2' },
    { id: '7a', name: 'A', gradeId: '7', capacity: 45, buildingId: 'b2' },
    { id: '7b', name: 'B', gradeId: '7', capacity: 42, buildingId: 'b2' },
    { id: '8a', name: 'A', gradeId: '8', capacity: 40, buildingId: 'b2' },
    { id: '8b', name: 'B', gradeId: '8', capacity: 38, buildingId: 'b2' },
    { id: '9a', name: 'A', gradeId: '9', capacity: 40, buildingId: 'b2' },
    { id: '9b', name: 'B', gradeId: '9', capacity: 38, buildingId: 'b2' },
    { id: '10ga', name: 'A', gradeId: '10g', capacity: 35, buildingId: 'b2' },
    { id: '10gb', name: 'B', gradeId: '10g', capacity: 35, buildingId: 'b2' },
    { id: '11ga', name: 'A', gradeId: '11g', capacity: 35, buildingId: 'b2' },
    { id: '10ta', name: 'A', gradeId: '10t', capacity: 35, buildingId: 'b3' },
    { id: '10tb', name: 'B', gradeId: '10t', capacity: 35, buildingId: 'b3' },
    { id: '11ta', name: 'A', gradeId: '11t', capacity: 35, buildingId: 'b3' },
    { id: '12ta', name: 'A', gradeId: '12t', capacity: 30, buildingId: 'b3' }
  ];
  for (const s of sectionsData) await createSection(s);

  // Subjects
  const subjectsData = [
    { id: 'mat', name: 'Matemáticas' },
    { id: 'fis', name: 'Física' },
    { id: 'qui', name: 'Química' },
    { id: 'bio', name: 'Biología' },
    { id: 'esp', name: 'Español' },
    { id: 'lit', name: 'Literatura' },
    { id: 'ing', name: 'Inglés' },
    { id: 'his', name: 'Historia' },
    { id: 'geo', name: 'Geografía' },
    { id: 'civ', name: 'Cívica' },
    { id: 'inf', name: 'Informática' },
    { id: 'ef', name: 'Educación Física' },
    { id: 'mus', name: 'Música' },
    { id: 'art', name: 'Arte' },
    { id: 'rel', name: 'Religión' },
    { id: 'fil', name: 'Filosofía' }
  ];
  for (const s of subjectsData) await createSubject(s);

  // Teachers
  const teachersData = [
    { id: 't1', name: 'Prof. Roberto Henríquez', email: 'docente1@salesianosanjose.edu.sv', phone: '7012-3456', specialty: 'Matemáticas y Física', subjects: ['mat', 'fis'], schedule: '06:40 - 12:00', guideGradeId: '9', guideSectionId: '9a', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 't2', name: 'Profra. Andrea Melara', email: 'docente2@salesianosanjose.edu.sv', phone: '7012-3457', specialty: 'Español y Literatura', subjects: ['esp', 'lit'], schedule: '06:40 - 12:00', guideGradeId: '1b', guideSectionId: '1ba', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 't3', name: 'Prof. Carlos Martínez', email: 'docente3@salesianosanjose.edu.sv', phone: '7012-3458', specialty: 'Ciencias Naturales', subjects: ['bio', 'qui'], schedule: '06:40 - 12:00', guideGradeId: '8', guideSectionId: '8a', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 't4', name: 'Profra. María López', email: 'docente4@salesianosanjose.edu.sv', phone: '7012-3459', specialty: 'Ciencias Sociales', subjects: ['his', 'geo', 'civ'], schedule: '06:40 - 12:00', guideGradeId: '7', guideSectionId: '7a', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
    { id: 't5', name: 'Prof. Jesús Ramírez', email: 'docente5@salesianosanjose.edu.sv', phone: '7012-3460', specialty: 'Idiomas', subjects: ['ing'], schedule: '06:40 - 12:00', guideGradeId: '2b', guideSectionId: '2ba', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 't6', name: 'Profra. Ana García', email: 'docente6@salesianosanjose.edu.sv', phone: '7012-3461', specialty: 'Tecnología', subjects: ['inf'], schedule: '06:40 - 12:00', guideGradeId: '1b', guideSectionId: '1bb', avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&auto=format&fit=crop&q=80' },
    { id: 't7', name: 'Prof. Miguel Hernández', email: 'docente7@salesianosanjose.edu.sv', phone: '7012-3462', specialty: 'Educación Física', subjects: ['ef'], schedule: '06:40 - 12:00', guideGradeId: '9', guideSectionId: '9b', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 't8', name: 'Profra. Patricia Vásquez', email: 'docente8@salesianosanjose.edu.sv', phone: '7012-3463', specialty: 'Arte y Música', subjects: ['mus', 'art'], schedule: '06:40 - 12:00', guideGradeId: '7', guideSectionId: '7b', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 't9', name: 'Prof. Fernando Díaz', email: 'docente9@salesianosanjose.edu.sv', phone: '7012-3464', specialty: 'Orientación', subjects: ['rel', 'fil'], schedule: '06:40 - 12:00', guideGradeId: '3b', guideSectionId: '3ba', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 't10', name: 'Profra. Claudia Reyes', email: 'docente10@salesianosanjose.edu.sv', phone: '7012-3465', specialty: 'Filosofía', subjects: ['fil'], schedule: '06:40 - 12:00', guideGradeId: undefined, guideSectionId: undefined, avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&auto=format&fit=crop&q=80' }
  ];
  for (const t of teachersData) await createTeacher(t);

  // Students
  const studentsData = [
    // 1° Grado
    { id: 's01', name: 'Carlos Daniel Henríquez', gender: 'M' as const, gradeId: '1', sectionId: '1a' },
    { id: 's02', name: 'Gabriela María Melara', gender: 'F' as const, gradeId: '1', sectionId: '1a' },
    { id: 's03', name: 'Diego Alejandro Solís', gender: 'M' as const, gradeId: '1', sectionId: '1a' },
    { id: 's04', name: 'Valeria Sofía Paz', gender: 'F' as const, gradeId: '1', sectionId: '1a' },
    { id: 's05', name: 'Mateo Sebastián Castro', gender: 'M' as const, gradeId: '1', sectionId: '1a' },
    { id: 's06', name: 'Camila Fernanda Ortiz', gender: 'F' as const, gradeId: '1', sectionId: '1b' },
    { id: 's07', name: 'Nicolás Alberto Durán', gender: 'M' as const, gradeId: '1', sectionId: '1b' },
    { id: 's08', name: 'Elena Beatriz Rivas', gender: 'F' as const, gradeId: '1', sectionId: '1b' },
    // 2° Grado
    { id: 's09', name: 'José Manuel Amaya', gender: 'M' as const, gradeId: '2', sectionId: '2a' },
    { id: 's10', name: 'Daniela Alejandra Gómez', gender: 'F' as const, gradeId: '2', sectionId: '2a' },
    { id: 's11', name: 'Andrés Felipe Martínez', gender: 'M' as const, gradeId: '2', sectionId: '2a' },
    { id: 's12', name: 'Sofía Gabriela Rosa', gender: 'F' as const, gradeId: '2', sectionId: '2b' },
    { id: 's13', name: 'Emilio José Contreras', gender: 'M' as const, gradeId: '2', sectionId: '2b' },
    { id: 's14', name: 'Isabella María Guerrero', gender: 'F' as const, gradeId: '2', sectionId: '2b' },
    // 7° Grado
    { id: 's15', name: 'Roberto Carlos Méndez', gender: 'M' as const, gradeId: '7', sectionId: '7a' },
    { id: 's16', name: 'Ana Lucía Ponce', gender: 'F' as const, gradeId: '7', sectionId: '7a' },
    { id: 's17', name: 'Fernando Antonio Salazar', gender: 'M' as const, gradeId: '7', sectionId: '7a' },
    { id: 's18', name: 'Gabriela Estefanía Rivas', gender: 'F' as const, gradeId: '7', sectionId: '7a' },
    { id: 's19', name: 'Carlos Eduardo Peña', gender: 'M' as const, gradeId: '7', sectionId: '7b' },
    { id: 's20', name: 'Daniela Mishell Avilés', gender: 'F' as const, gradeId: '7', sectionId: '7b' },
    // 10° Bachillerato General
    { id: 's21', name: 'Rodrigo Andrés Flores', gender: 'M' as const, gradeId: '10g', sectionId: '10ga' },
    { id: 's22', name: 'Mariana Isabel Chicas', gender: 'F' as const, gradeId: '10g', sectionId: '10ga' },
    { id: 's23', name: 'Fernando José Palacios', gender: 'M' as const, gradeId: '10g', sectionId: '10ga' },
    { id: 's24', name: 'Sofía Alejandra Quintanilla', gender: 'F' as const, gradeId: '10g', sectionId: '10ga' },
    { id: 's25', name: 'Daniel Eduardo Portillo', gender: 'M' as const, gradeId: '10g', sectionId: '10gb' },
    { id: 's26', name: 'Lucía Valentina Merino', gender: 'F' as const, gradeId: '10g', sectionId: '10gb' },
    // 10° Bachillerato Técnico
    { id: 's27', name: 'Gerardo Ernesto Alvarado', gender: 'M' as const, gradeId: '10t', sectionId: '10ta' },
    { id: 's28', name: 'Natalia Estefanía Guardado', gender: 'F' as const, gradeId: '10t', sectionId: '10ta' },
    { id: 's29', name: 'Josué Daniel Escalante', gender: 'M' as const, gradeId: '10t', sectionId: '10ta' },
    { id: 's30', name: 'Carolina Michelle García', gender: 'F' as const, gradeId: '10t', sectionId: '10ta' },
    // 11° Bachillerato Técnico
    { id: 's31', name: 'David Alejandro Umaña', gender: 'M' as const, gradeId: '11t', sectionId: '11ta' },
    { id: 's32', name: 'Jessica Tatiana Martínez', gender: 'F' as const, gradeId: '11t', sectionId: '11ta' },
    { id: 's33', name: 'Erick Adalberto Cruz', gender: 'M' as const, gradeId: '11t', sectionId: '11ta' },
    { id: 's34', name: 'Ana Gabriela Ochoa', gender: 'F' as const, gradeId: '11t', sectionId: '11ta' },
    // 12° Bachillerato Técnico
    { id: 's35', name: 'Bryan Alexander Interiano', gender: 'M' as const, gradeId: '12t', sectionId: '12ta' },
    { id: 's36', name: 'Jennifer Vanessa Guzmán', gender: 'F' as const, gradeId: '12t', sectionId: '12ta' }
  ];
  for (const s of studentsData) await createStudent(s);

  console.log('Seed completed: 14 grades, 25 sections, 16 subjects, 10 teachers, 36 students, 2 baccalaureate types, 4 buildings, 10 computer labs');
}
