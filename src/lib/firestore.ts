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
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { User, Grade, Section, Subject, Teacher, Student, BaccalaureateTypeDoc, Building, ComputerLab, RoleConfig, UserRole } from '../types';
import {
  validateUser,
  validateGrade,
  validateSection,
  validateTeacher,
  validateStudent,
  validateBuilding,
  validateSubject,
  validateBaccalaureateType,
  validateComputerLab,
  validateRoleConfig,
  validate
} from './validation';

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
const SCHOOL_YEAR_COLLECTION = 'school_year_status';
const ROLES_COLLECTION = 'roles';

// ==================== USERS ====================

export async function createUser(userData: Omit<User, 'createdAt'>): Promise<void> {
  // Validate input data
  validate(userData, validateUser);
  
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

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(userRef, { role });
}

export async function getAllUsers(): Promise<User[]> {
  const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User));
}

// ==================== ROLES & PERMISSIONS ====================

export async function createRole(data: Omit<RoleConfig, 'createdAt'>): Promise<void> {
  // Validate input data
  validate(data, validateRoleConfig);
  
  const ref = doc(db, ROLES_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getRole(id: string): Promise<RoleConfig | null> {
  const ref = doc(db, ROLES_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as RoleConfig;
}

export async function updateRole(id: string, data: Partial<RoleConfig>): Promise<void> {
  const ref = doc(db, ROLES_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function deleteRole(id: string): Promise<void> {
  const ref = doc(db, ROLES_COLLECTION, id);
  await deleteDoc(ref);
}

export async function getAllRoles(): Promise<RoleConfig[]> {
  const q = query(collection(db, ROLES_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as RoleConfig));
}

// ==================== GRADES ====================

export async function createGrade(data: Omit<Grade, 'createdAt'>): Promise<void> {
  // Validate input data
  validate(data, validateGrade);
  
  const ref = doc(db, GRADES_COLLECTION, data.id);
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await setDoc(ref, { ...cleanData, createdAt: serverTimestamp() });
}

export async function getGrade(id: string): Promise<Grade | null> {
  const ref = doc(db, GRADES_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Grade;
}

export async function updateGrade(id: string, data: Partial<Grade>): Promise<void> {
  const ref = doc(db, GRADES_COLLECTION, id);
  const cleanData = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined)
  );
  await updateDoc(ref, cleanData);
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
  // Validate input data
  validate(data, validateBaccalaureateType);
  
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
  // Validate input data
  validate(data, validateBuilding);
  
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
  // Validate input data
  validate(data, validateComputerLab);
  
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
  // Validate input data
  validate(data, validateSection);
  
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
  // Validate input data
  validate(data, validateSubject);
  
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
  // Validate input data
  validate(data, validateTeacher);
  
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

export async function createStudent(data: Omit<Student, 'createdAt' | 'updatedAt'>): Promise<void> {
  // Validate input data
  validate(data, validateStudent);
  
  const ref = doc(db, STUDENTS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function createStudentWithTimestamps(data: Omit<Student, 'createdAt' | 'updatedAt'>, createdAt: Timestamp, updatedAt: Timestamp): Promise<void> {
  const ref = doc(db, STUDENTS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt, updatedAt });
}

export async function getStudent(id: string): Promise<Student | null> {
  const ref = doc(db, STUDENTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Student;
}

export async function updateStudent(id: string, data: Partial<Student>): Promise<void> {
  const ref = doc(db, STUDENTS_COLLECTION, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
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

// ==================== GRADE/SECTION TOGGLE ====================

export async function toggleGradeStatus(id: string, currentStatus?: string): Promise<void> {
  const ref = doc(db, GRADES_COLLECTION, id);
  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
}

export async function toggleSectionStatus(id: string, currentStatus?: string): Promise<void> {
  const ref = doc(db, SECTIONS_COLLECTION, id);
  const newStatus = currentStatus === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
  await updateDoc(ref, { status: newStatus, updatedAt: serverTimestamp() });
}

export async function resetTestData(): Promise<void> {
  await logActivity('reset_test_data', { timestamp: new Date().toISOString() });
  const gradesSnap = await getDocs(collection(db, GRADES_COLLECTION));
  const sectionsSnap = await getDocs(collection(db, SECTIONS_COLLECTION));
  const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));

  const gradeUpdates = gradesSnap.docs.map(d => {
    const data = d.data() as Record<string, unknown>;
    return updateDoc(d.ref, {
      schoolYear: null,
      status: (data.defaultStatus as string) || 'ACTIVO',
      updatedAt: serverTimestamp()
    });
  });

  const sectionUpdates = sectionsSnap.docs.map(d => {
    const data = d.data() as Record<string, unknown>;
    return updateDoc(d.ref, {
      schoolYear: null,
      status: (data.defaultStatus as string) || 'ACTIVO',
      updatedAt: serverTimestamp()
    });
  });

  const studentUpdates: Promise<void>[] = [];

  studentsSnap.docs.forEach((d) => {
    const data = d.data() as Student;
    const ref = d.ref;
    const history = data.enrollmentHistory || [];

    if (history.length === 0) return;

    const uniqueHistory = history.filter((record, index, self) =>
      index === self.findIndex(r => r.year === record.year)
    );

    const first = uniqueHistory[0];
    const rest = uniqueHistory.slice(1).map(record => ({ ...record, status: 'FINALIZADO' as const }));

    studentUpdates.push(
      updateDoc(ref, {
        gradeId: first.gradeId,
        sectionId: first.sectionId,
        enrollmentYear: first.year,
        enrollmentHistory: [first, ...rest],
        status: 'ACTIVO',
        updatedAt: serverTimestamp()
      })
    );
  });

  await Promise.all([...gradeUpdates, ...sectionUpdates, ...studentUpdates]);

  const yearStatusRef = doc(db, SCHOOL_YEAR_COLLECTION, 'current');
  await deleteDoc(yearStatusRef).catch(() => {});
}

export async function getCurrentSchoolYear(): Promise<number | null> {
  const yearStatusRef = doc(db, SCHOOL_YEAR_COLLECTION, 'current');
  const snap = await getDoc(yearStatusRef);
  if (!snap.exists()) return null;
  return (snap.data() as Record<string, unknown>).year as number ?? null;
}

export async function fixAllStudentHistories(): Promise<void> {
  await logActivity('fix_all_student_histories', { timestamp: new Date().toISOString() });
  const currentStatus = await getCurrentSchoolYear();
  const currentYear = currentStatus ?? new Date().getFullYear();

  const gradesSnap = await getDocs(collection(db, GRADES_COLLECTION));
  const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));

  const gradeMap = new Map<string, Record<string, unknown>>();
  gradesSnap.docs.forEach(d => gradeMap.set(d.id, d.data()));

  const updates: Promise<void>[] = [];

  studentsSnap.docs.forEach((d) => {
    const data = d.data() as Student;
    const ref = d.ref;
    const carnet = String(data.carnet || '');

    // Obtener año de ingreso de s.enrollmentYear o del carnet (primeros 4 caracteres)
    let entryYear = data.enrollmentYear || parseInt(carnet.slice(0, 4), 10);
    if (!Number.isFinite(entryYear) || entryYear < 1900 || entryYear > currentYear) {
      entryYear = currentYear;
    }

    const currentGradeId = String(data.gradeId || '');
    const numStr = currentGradeId.replace(/[^0-9]/g, '');
    const suffix = currentGradeId.toLowerCase().includes('t') ? 't' : currentGradeId.toLowerCase().includes('g') ? 'g' : '';

    let currentGradeNum: number;
    if (currentGradeId === 'k4') {
      currentGradeNum = -1;
    } else if (currentGradeId === 'k5') {
      currentGradeNum = 0;
    } else if (currentGradeId === 'k6') {
      currentGradeNum = 0; // En la progresión simplificada, tratamos K5/K6 equivalentemente
    } else {
      currentGradeNum = parseInt(numStr, 10);
    }

    if (Number.isNaN(currentGradeNum)) return;

    const sectionId = data.sectionId || 'A';

    const newHistory: Record<string, unknown>[] = [];

    for (let year = entryYear; year <= currentYear; year++) {
      const diffYears = currentYear - year;
      const targetGradeNum = currentGradeNum - diffYears;

      let gradeForYear = '';
      if (targetGradeNum === -1) {
        gradeForYear = 'k4';
      } else if (targetGradeNum === 0) {
        gradeForYear = 'k5';
      } else if (targetGradeNum < -1) {
        gradeForYear = 'k4'; // límite inferior
      } else {
        gradeForYear = targetGradeNum <= 9 ? String(targetGradeNum) : `${targetGradeNum}${suffix}`;
      }

      const gradeData = gradeMap.get(gradeForYear);

      // La sección para el año en curso conserva la actual; para los años anteriores usa la letra actual o la 'A' por defecto
      let histSectionId = 'A';
      if (year === currentYear) {
        histSectionId = sectionId;
      } else {
        // Extraer la letra de la sección actual si tiene un guion (ej. "2026-10g-a" -> "a")
        const sectionLetter = sectionId.includes('-')
          ? sectionId.split('-').pop()?.toUpperCase() || 'A'
          : sectionId.toUpperCase();

        histSectionId = `${year}-${gradeForYear}-${sectionLetter.toLowerCase()}`;
      }

      newHistory.push({
        year,
        gradeId: gradeForYear,
        gradeName: gradeData?.name || `${gradeForYear}° Grado`,
        sectionId: histSectionId,
        status: year === currentYear ? 'EN_CURSO' : 'FINALIZADO'
      });
    }

    // Obtener los datos del grado y la sección correspondientes al año en curso para sincronizar la tabla
    const latestRecord = newHistory.find(r => r.year === currentYear);
    const updatedGradeId = latestRecord ? latestRecord.gradeId as string : currentGradeId;
    const updatedSectionId = latestRecord ? latestRecord.sectionId as string : sectionId;

    updates.push(
      updateDoc(ref, {
        enrollmentHistory: newHistory,
        gradeId: updatedGradeId,
        sectionId: updatedSectionId,
        enrollmentYear: entryYear,
        status: 'ACTIVO',
        updatedAt: serverTimestamp()
      })
    );
  });

  await Promise.all(updates);
}

export async function startSchoolYear(year: number): Promise<void> {
  await logActivity('start_school_year', { year });
  const yearStatusRef = doc(db, SCHOOL_YEAR_COLLECTION, 'current');
  const yearStatusSnap = await getDoc(yearStatusRef);
  const currentStatus = yearStatusSnap.exists() ? (yearStatusSnap.data() as Record<string, unknown>).year : null;
  if (currentStatus === year) {
    throw new Error(`El año escolar ${year} ya fue iniciado.`);
  }

  const previousYear = (currentStatus as number) || year - 1;
  const gradesSnap = await getDocs(collection(db, GRADES_COLLECTION));
  const sectionsSnap = await getDocs(collection(db, SECTIONS_COLLECTION));
  const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
  const studentUpdates: Promise<void>[] = [];

  // 1. Clona/Crea secciones específicas para el nuevo año escolar
  // Las secciones anteriores quedan INTACTAS con su schoolYear original, garantizando la inmutabilidad histórica.
  const clonedSections: Record<string, string> = {}; // Mapea { idAnterior: nuevoId }
  const sectionPromises: Promise<void>[] = [];

  sectionsSnap.docs.forEach((d) => {
    const secData = d.data() as Section;
    const isSectionActiveAndMatchesYear = secData.status !== 'INACTIVO' && (secData.schoolYear === previousYear || !secData.schoolYear);

    if (isSectionActiveAndMatchesYear) {
      const newSecId = `${year}-${secData.gradeId}-${secData.name.trim().toLowerCase()}`;
      clonedSections[d.id] = newSecId;

      const newSecRef = doc(db, SECTIONS_COLLECTION, newSecId);
      sectionPromises.push(
        setDoc(newSecRef, {
          ...secData,
          id: newSecId,
          schoolYear: year,
          status: 'ACTIVO',
          createdAt: serverTimestamp()
        })
      );
    }
  });
  await Promise.all(sectionPromises);

  // 2. Promueve a los alumnos y actualiza su historial de matrícula (enrollmentHistory)
  studentsSnap.docs.forEach((d) => {
    const data = d.data() as Student;
    const ref = d.ref;
    const history = data.enrollmentHistory || [];

    if (data.status === 'ACTIVO') {
      const lastYear = history.length > 0 ? history[history.length - 1].year : previousYear;
      const updatedHistory = history.map(record =>
        record.year === lastYear ? { ...record, status: 'FINALIZADO' as const } : record
      );

      const numStr = String(data.gradeId).replace(/[^0-9]/g, '');
      const suffix = String(data.gradeId).replace(/[0-9]/g, '');
      const num = parseInt(numStr, 10);
      const nextNum = Number.isNaN(num) ? num : num + 1;
      const nextGradeId = !Number.isNaN(num) ? `${nextNum}${suffix}` : data.gradeId;

      // Obtiene el ID de la nueva sección correspondiente al nuevo año escolar
      let assignedSectionId = '';
      if (data.sectionId) {
        // Si fue clonada, usamos el nuevo ID clonado.
        if (clonedSections[data.sectionId]) {
          assignedSectionId = clonedSections[data.sectionId];
        } else {
          // Si no está en la caché de clonación, inferimos el ID por letra/patrón
          const prevSecDoc = sectionsSnap.docs.find(sd => sd.id === data.sectionId);
          const secName = prevSecDoc ? (prevSecDoc.data() as Section).name : 'A';
          assignedSectionId = `${year}-${nextGradeId}-${secName.toLowerCase()}`;
        }
      }

      const newRecord = {
        year,
        gradeId: nextGradeId,
        sectionId: assignedSectionId,
        status: 'EN_CURSO' as const
      };

      const fullHistory = [...updatedHistory, newRecord];
      if (fullHistory.filter(r => r.year === year).length > 1) return;

      studentUpdates.push(
        updateDoc(ref, {
          enrollmentHistory: fullHistory,
          gradeId: nextGradeId,
          sectionId: assignedSectionId,
          status: 'ACTIVO',
          updatedAt: serverTimestamp()
        })
      );
    }
  });

  await Promise.all(studentUpdates);

  // 3. Actualiza el año lectivo de los grados
  const gradeUpdates = gradesSnap.docs.map(d => updateDoc(d.ref, { schoolYear: year, status: 'ACTIVO', updatedAt: serverTimestamp() }));
  await Promise.all(gradeUpdates);

  // Guardar el estado de inicio de año
  await setDoc(yearStatusRef, { year, startedAt: serverTimestamp() });
}

// ==================== SEED DATA ====================

export async function seedInitialData(): Promise<void> {
  const grades = await getAllGrades();
  if (grades.length > 0) return;

  // Roles
  const rolesData: Omit<RoleConfig, 'createdAt'>[] = [
    { id: 'admin', name: 'Administrador', description: 'Control total del sistema', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'], isSystem: true },
    { id: 'docente', name: 'Docente', description: 'Profesor de aula', permissions: ['formacion', 'proyectos'], isSystem: true },
    { id: 'alumno', name: 'Alumno', description: 'Estudiante del colegio', permissions: ['formacion', 'proyectos'], isSystem: true },
    { id: 'coordinacion', name: 'Coordinación', description: 'Coordinación académica general', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'], isSystem: true },
    { id: 'coordinacion_academica', name: 'Coord. Académica', description: 'Coordinación de áreas académicas y horarios', permissions: ['notas', 'horario', 'clase'], isSystem: true },
    { id: 'coordinacion_convivencia', name: 'Coord. Convivencia', description: 'Coordinación de formación y disciplina', permissions: ['formacion', 'notas'], isSystem: true },
    { id: 'coordinacion_primaria', name: 'Coord. Primaria', description: 'Coordinación de grados 1° - 6°', permissions: ['formacion', 'notas', 'horario'], isSystem: true },
    { id: 'coordinacion_parvularia', name: 'Coord. Parvularia', description: 'Coordinación de grados K4 - K6', permissions: ['formacion'], isSystem: true },
    { id: 'registro_academico', name: 'Registro Académico', description: 'Gestión de registros y matrícula', permissions: ['notas', 'horario'], isSystem: true },
    { id: 'enfermeria', name: 'Enfermería', description: 'Control de salud estudiantil', permissions: ['formacion', 'avisos'], isSystem: true },
    { id: 'psicopedagogico', name: 'Psicopedagógico', description: 'Apoyo psicológico y pedagógico', permissions: ['formacion', 'notas', 'avisos'], isSystem: true },
  ];
  for (const r of rolesData) await createRole(r);

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

  const currentYear = new Date().getFullYear();
  const gradesData = [
    { id: 'k4', name: 'Kinder 4', cycle: 'parvularia' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: 'k5', name: 'Kinder 5', cycle: 'parvularia' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: 'k6', name: 'Preparatoria', cycle: 'parvularia' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '1', name: '1° Grado', cycle: '1' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '2', name: '2° Grado', cycle: '1' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '3', name: '3° Grado', cycle: '1' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '4', name: '4° Grado', cycle: '2' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '5', name: '5° Grado', cycle: '2' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '6', name: '6° Grado', cycle: '2' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '7', name: '7° Grado', cycle: '3' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '8', name: '8° Grado', cycle: '3' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '9', name: '9° Grado', cycle: '3' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '10g', name: '10° Bachillerato General', cycle: '4' as const, baccalaureateType: 'general' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '11g', name: '11° Bachillerato General', cycle: '4' as const, baccalaureateType: 'general' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '10t', name: '10° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '11t', name: '11° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '12t', name: '12° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const, status: 'ACTIVO' as const, schoolYear: currentYear }
  ];
  for (const g of gradesData) await createGrade(g);

  // Sections
  const sectionsData = [
    { id: '1a', name: 'A', gradeId: '1', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '1b', name: 'B', gradeId: '1', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '2a', name: 'A', gradeId: '2', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '2b', name: 'B', gradeId: '2', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '3a', name: 'A', gradeId: '3', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '3b', name: 'B', gradeId: '3', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '4a', name: 'A', gradeId: '4', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '4b', name: 'B', gradeId: '4', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '5a', name: 'A', gradeId: '5', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '5b', name: 'B', gradeId: '5', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '6a', name: 'A', gradeId: '6', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '6b', name: 'B', gradeId: '6', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '7a', name: 'A', gradeId: '7', capacity: 45, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '7b', name: 'B', gradeId: '7', capacity: 42, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '8a', name: 'A', gradeId: '8', capacity: 40, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '8b', name: 'B', gradeId: '8', capacity: 38, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '9a', name: 'A', gradeId: '9', capacity: 40, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '9b', name: 'B', gradeId: '9', capacity: 38, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '10ga', name: 'A', gradeId: '10g', capacity: 35, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '10gb', name: 'B', gradeId: '10g', capacity: 35, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '11ga', name: 'A', gradeId: '11g', capacity: 35, buildingId: 'b2', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '10ta', name: 'A', gradeId: '10t', capacity: 35, buildingId: 'b3', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '10tb', name: 'B', gradeId: '10t', capacity: 35, buildingId: 'b3', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '11ta', name: 'A', gradeId: '11t', capacity: 35, buildingId: 'b3', status: 'ACTIVO' as const, schoolYear: currentYear },
    { id: '12ta', name: 'A', gradeId: '12t', capacity: 30, buildingId: 'b3', status: 'ACTIVO' as const, schoolYear: currentYear }
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
    { id: 't2', name: 'Profra. Andrea Melara', email: 'docente2@salesianosanjose.edu.sv', phone: '7012-3457', specialty: 'Español y Literatura', subjects: ['esp', 'lit'], schedule: '06:40 - 12:00', guideGradeId: '1', guideSectionId: '1b', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 't3', name: 'Prof. Carlos Martínez', email: 'docente3@salesianosanjose.edu.sv', phone: '7012-3458', specialty: 'Ciencias Naturales', subjects: ['bio', 'qui'], schedule: '06:40 - 12:00', guideGradeId: '8', guideSectionId: '8a', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 't4', name: 'Profra. María López', email: 'docente4@salesianosanjose.edu.sv', phone: '7012-3459', specialty: 'Ciencias Sociales', subjects: ['his', 'geo', 'civ'], schedule: '06:40 - 12:00', guideGradeId: '7', guideSectionId: '7a', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
    { id: 't5', name: 'Prof. Jesús Ramírez', email: 'docente5@salesianosanjose.edu.sv', phone: '7012-3460', specialty: 'Idiomas', subjects: ['ing'], schedule: '06:40 - 12:00', guideGradeId: '2', guideSectionId: '2b', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 't6', name: 'Profra. Ana García', email: 'docente6@salesianosanjose.edu.sv', phone: '7012-3461', specialty: 'Tecnología', subjects: ['inf'], schedule: '06:40 - 12:00', guideGradeId: '1', guideSectionId: '1a', avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&auto=format&fit=crop&q=80' },
    { id: 't7', name: 'Prof. Miguel Hernández', email: 'docente7@salesianosanjose.edu.sv', phone: '7012-3462', specialty: 'Educación Física', subjects: ['ef'], schedule: '06:40 - 12:00', guideGradeId: '9', guideSectionId: '9b', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
    { id: 't8', name: 'Profra. Patricia Vásquez', email: 'docente8@salesianosanjose.edu.sv', phone: '7012-3463', specialty: 'Arte y Música', subjects: ['mus', 'art'], schedule: '06:40 - 12:00', guideGradeId: '7', guideSectionId: '7b', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
    { id: 't9', name: 'Prof. Fernando Díaz', email: 'docente9@salesianosanjose.edu.sv', phone: '7012-3464', specialty: 'Orientación', subjects: ['rel', 'fil'], schedule: '06:40 - 12:00', guideGradeId: '3', guideSectionId: '3b', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
    { id: 't10', name: 'Profra. Claudia Reyes', email: 'docente10@salesianosanjose.edu.sv', phone: '7012-3465', specialty: 'Filosofía', subjects: ['fil'], schedule: '06:40 - 12:00', avatarUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&auto=format&fit=crop&q=80' }
  ];
  for (const t of teachersData) await createTeacher(t);

  // Students
  const studentsData = [
    { id: 's01', carnet: 'SEED-001', firstName: 'Carlos Daniel', lastName: 'Henríquez', name: 'Carlos Daniel Henríquez', gender: 'M' as const, gradeId: '1', sectionId: '1a', enrollmentYear: 2026 },
    { id: 's02', carnet: 'SEED-002', firstName: 'Gabriela María', lastName: 'Melara', name: 'Gabriela María Melara', gender: 'F' as const, gradeId: '1', sectionId: '1a', enrollmentYear: 2026 },
    { id: 's03', carnet: 'SEED-003', firstName: 'Diego Alejandro', lastName: 'Solís', name: 'Diego Alejandro Solís', gender: 'M' as const, gradeId: '1', sectionId: '1a', enrollmentYear: 2026 },
    { id: 's04', carnet: 'SEED-004', firstName: 'Valeria Sofía', lastName: 'Paz', name: 'Valeria Sofía Paz', gender: 'F' as const, gradeId: '1', sectionId: '1a', enrollmentYear: 2026 },
    { id: 's05', carnet: 'SEED-005', firstName: 'Mateo Sebastián', lastName: 'Castro', name: 'Mateo Sebastián Castro', gender: 'M' as const, gradeId: '1', sectionId: '1a', enrollmentYear: 2026 },
    { id: 's06', carnet: 'SEED-006', firstName: 'Camila Fernanda', lastName: 'Ortiz', name: 'Camila Fernanda Ortiz', gender: 'F' as const, gradeId: '1', sectionId: '1b', enrollmentYear: 2026 },
    { id: 's07', carnet: 'SEED-007', firstName: 'Nicolás Alberto', lastName: 'Durán', name: 'Nicolás Alberto Durán', gender: 'M' as const, gradeId: '1', sectionId: '1b', enrollmentYear: 2026 },
    { id: 's08', carnet: 'SEED-008', firstName: 'Elena Beatriz', lastName: 'Rivas', name: 'Elena Beatriz Rivas', gender: 'F' as const, gradeId: '1', sectionId: '1b', enrollmentYear: 2026 },
    { id: 's09', carnet: 'SEED-009', firstName: 'José Manuel', lastName: 'Amaya', name: 'José Manuel Amaya', gender: 'M' as const, gradeId: '2', sectionId: '2a', enrollmentYear: 2025 },
    { id: 's10', carnet: 'SEED-010', firstName: 'Daniela Alejandra', lastName: 'Gómez', name: 'Daniela Alejandra Gómez', gender: 'F' as const, gradeId: '2', sectionId: '2a', enrollmentYear: 2025 },
    { id: 's11', carnet: 'SEED-011', firstName: 'Andrés Felipe', lastName: 'Martínez', name: 'Andrés Felipe Martínez', gender: 'M' as const, gradeId: '2', sectionId: '2a', enrollmentYear: 2025 },
    { id: 's12', carnet: 'SEED-012', firstName: 'Sofía Gabriela', lastName: 'Rosa', name: 'Sofía Gabriela Rosa', gender: 'F' as const, gradeId: '2', sectionId: '2b', enrollmentYear: 2025 },
    { id: 's13', carnet: 'SEED-013', firstName: 'Emilio José', lastName: 'Contreras', name: 'Emilio José Contreras', gender: 'M' as const, gradeId: '2', sectionId: '2b', enrollmentYear: 2025 },
    { id: 's14', carnet: 'SEED-014', firstName: 'Isabella María', lastName: 'Guerrero', name: 'Isabella María Guerrero', gender: 'F' as const, gradeId: '2', sectionId: '2b', enrollmentYear: 2025 },
    { id: 's15', carnet: 'SEED-015', firstName: 'Roberto Carlos', lastName: 'Méndez', name: 'Roberto Carlos Méndez', gender: 'M' as const, gradeId: '7', sectionId: '7a', enrollmentYear: 2020 },
    { id: 's16', carnet: 'SEED-016', firstName: 'Ana Lucía', lastName: 'Ponce', name: 'Ana Lucía Ponce', gender: 'F' as const, gradeId: '7', sectionId: '7a', enrollmentYear: 2020 },
    { id: 's17', carnet: 'SEED-017', firstName: 'Fernando Antonio', lastName: 'Salazar', name: 'Fernando Antonio Salazar', gender: 'M' as const, gradeId: '7', sectionId: '7a', enrollmentYear: 2020 },
    { id: 's18', carnet: 'SEED-018', firstName: 'Gabriela Estefanía', lastName: 'Rivas', name: 'Gabriela Estefanía Rivas', gender: 'F' as const, gradeId: '7', sectionId: '7a', enrollmentYear: 2020 },
    { id: 's19', carnet: 'SEED-019', firstName: 'Carlos Eduardo', lastName: 'Peña', name: 'Carlos Eduardo Peña', gender: 'M' as const, gradeId: '7', sectionId: '7b', enrollmentYear: 2020 },
    { id: 's20', carnet: 'SEED-020', firstName: 'Daniela Mishell', lastName: 'Avilés', name: 'Daniela Mishell Avilés', gender: 'F' as const, gradeId: '7', sectionId: '7b', enrollmentYear: 2020 },
    { id: 's21', carnet: 'SEED-021', firstName: 'Rodrigo Andrés', lastName: 'Flores', name: 'Rodrigo Andrés Flores', gender: 'M' as const, gradeId: '10g', sectionId: '10ga', enrollmentYear: 2025 },
    { id: 's22', carnet: 'SEED-022', firstName: 'Mariana Isabel', lastName: 'Chicas', name: 'Mariana Isabel Chicas', gender: 'F' as const, gradeId: '10g', sectionId: '10ga', enrollmentYear: 2025 },
    { id: 's23', carnet: 'SEED-023', firstName: 'Fernando José', lastName: 'Palacios', name: 'Fernando José Palacios', gender: 'M' as const, gradeId: '10g', sectionId: '10ga', enrollmentYear: 2025 },
    { id: 's24', carnet: 'SEED-024', firstName: 'Sofía Alejandra', lastName: 'Quintanilla', name: 'Sofía Alejandra Quintanilla', gender: 'F' as const, gradeId: '10g', sectionId: '10ga', enrollmentYear: 2025 },
    { id: 's25', carnet: 'SEED-025', firstName: 'Daniel Eduardo', lastName: 'Portillo', name: 'Daniel Eduardo Portillo', gender: 'M' as const, gradeId: '10g', sectionId: '10gb', enrollmentYear: 2025 },
    { id: 's26', carnet: 'SEED-026', firstName: 'Lucía Valentina', lastName: 'Merino', name: 'Lucía Valentina Merino', gender: 'F' as const, gradeId: '10g', sectionId: '10gb', enrollmentYear: 2025 },
    { id: 's27', carnet: 'SEED-027', firstName: 'Gerardo Ernesto', lastName: 'Alvarado', name: 'Gerardo Ernesto Alvarado', gender: 'M' as const, gradeId: '10t', sectionId: '10ta', enrollmentYear: 2025 },
    { id: 's28', carnet: 'SEED-028', firstName: 'Natalia Estefanía', lastName: 'Guardado', name: 'Natalia Estefanía Guardado', gender: 'F' as const, gradeId: '10t', sectionId: '10ta', enrollmentYear: 2025 },
    { id: 's29', carnet: 'SEED-029', firstName: 'Josué Daniel', lastName: 'Escalante', name: 'Josué Daniel Escalante', gender: 'M' as const, gradeId: '10t', sectionId: '10ta', enrollmentYear: 2025 },
    { id: 's30', carnet: 'SEED-030', firstName: 'Carolina Michelle', lastName: 'García', name: 'Carolina Michelle García', gender: 'F' as const, gradeId: '10t', sectionId: '10ta', enrollmentYear: 2025 },
    { id: 's31', carnet: 'SEED-031', firstName: 'David Alejandro', lastName: 'Umaña', name: 'David Alejandro Umaña', gender: 'M' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's32', carnet: 'SEED-032', firstName: 'Jessica Tatiana', lastName: 'Martínez', name: 'Jessica Tatiana Martínez', gender: 'F' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's33', carnet: 'SEED-033', firstName: 'Erick Adalberto', lastName: 'Cruz', name: 'Erick Adalberto Cruz', gender: 'M' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's34', carnet: 'SEED-034', firstName: 'Ana Gabriela', lastName: 'Ochoa', name: 'Ana Gabriela Ochoa', gender: 'F' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's35', carnet: 'SEED-035', firstName: 'Bryan Alexander', lastName: 'Interiano', name: 'Bryan Alexander Interiano', gender: 'M' as const, gradeId: '12t', sectionId: '12ta', enrollmentYear: 2023 },
    { id: 's36', carnet: 'SEED-036', firstName: 'Jennifer Vanessa', lastName: 'Guzmán', name: 'Jennifer Vanessa Guzmán', gender: 'F' as const, gradeId: '12t', sectionId: '12ta', enrollmentYear: 2023 }
  ];
  for (const s of studentsData) await createStudent(s);

  console.log('Seed completed: 7 roles, 14 grades, 25 sections, 16 subjects, 10 teachers, 36 students');
}

// ==================== SECURITY & AUDIT LOGS ====================

export async function isEmailPreAuthorized(email: string): Promise<boolean> {
  const superAdmin = 'jose.marquez@salesianosanjose.edu.sv';
  if (email.toLowerCase() === superAdmin.toLowerCase()) return true;

  // Check if a teacher document exists with this email
  const q = query(collection(db, TEACHERS_COLLECTION), where('email', '==', email));
  const snap = await getDocs(q);
  return !snap.empty;
}

export async function logActivity(action: string, details: Record<string, any>): Promise<void> {
  try {
    const currentUser = auth.currentUser;
    const ref = collection(db, 'activity_logs');
    await addDoc(ref, {
      userId: currentUser?.uid || 'anonymous',
      userEmail: currentUser?.email || 'anonymous',
      userName: currentUser?.displayName || 'anonymous',
      action,
      details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Error in logActivity:', err);
  }
}