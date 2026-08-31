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
  addDoc,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { BTV_GRAPHIC_DESIGN_COURSES, getModuleDescriptorData, GENERATE_ANNUAL_PROJECT } from '../services/btvCurriculumData';

const FIREBASE_API_KEY = 'AIzaSyATVsRNPWADga7le5h8bxogza_HVmQr_Z8';

async function createAuthAccount(email: string, password: string, displayName: string): Promise<{ uid: string; email: string }> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        displayName,
        returnSecureToken: true,
      }),
    }
  );
  const data = await response.json();
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      throw new Error('EMAIL_EXISTS');
    }
    throw new Error(data.error.message);
  }
  return { uid: data.localId, email: data.email };
}

export async function ensureAdminAccount(): Promise<void> {
  const adminEmail = 'admin@salesianosanjose.edu.sv';
  
  // Check if admin already exists in Firestore
  try {
    const users = await getAllUsers();
    if (users.some(u => u.email === adminEmail && u.role === 'admin')) return;
  } catch { return; }
  
  // Only create if missing
  try {
    const result = await createAuthAccount(adminEmail, '123456', 'Administrador');
    if (result.uid) {
      await createUser({
        uid: result.uid,
        email: adminEmail,
        displayName: 'Administrador',
        role: 'admin',
        status: 'approved',
      });
    }
  } catch { /* Auth account already exists or will be created manually */ }
}
import { User, Grade, Section, Subject, Teacher, Student, BaccalaureateTypeDoc, Building, ComputerLab, RoleConfig, UserRole, UserStatus, ApprovalRequest, NewUserNotification, Proyecto, ActividadEvaluada, EvaluacionProyecto, LMSModule } from '../types';
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
import { getNextGradeId, distributeStudents, isActiveStudent, uniqueNames } from './migration';

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
const APPROVAL_REQUESTS_COLLECTION = 'approval_requests';
const NEW_USER_NOTIFICATIONS_COLLECTION = 'new_user_notifications';

export function sanitizePayload<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

// ==================== USERS ====================

export async function createUser(userData: Omit<User, 'createdAt'>): Promise<void> {
  // Validate input data
  validate(userData, validateUser);
  
  const userRef = doc(db, USERS_COLLECTION, userData.uid);
  const cleanData = sanitizePayload(userData);
  await setDoc(userRef, { ...cleanData, createdAt: serverTimestamp() });
}

export async function getUser(uid: string): Promise<User | null> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return { uid: userSnap.id, ...userSnap.data() } as User;
}

export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, uid);
  const cleanData: Record<string, unknown> = {};
  for (const key of Object.keys(data)) {
    const value = (data as any)[key];
    if (value !== undefined) {
      cleanData[key] = value;
    }
  }
  await updateDoc(userRef, cleanData);
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

export async function getUserByStudentId(studentId: string): Promise<User | null> {
  const q = query(collection(db, USERS_COLLECTION), where('studentId', '==', studentId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { uid: d.id, ...d.data() } as User;
}

// ==================== ROLES & PERMISSIONS ====================

export async function createRole(data: Omit<RoleConfig, 'createdAt'>): Promise<void> {
  // Validate input data
  validate(data, validateRoleConfig);
  
  const ref = doc(db, ROLES_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

// Correct module IDs in existing roles to match the code
const CORRECT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'],
  docente: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'],
  alumno: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'semana-juventud', 'lms'],
  coordinacion: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'],
  coordinacion_academica: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'],
  coordinacion_convivencia: ['formacion', 'avisos'],
  coordinacion_primaria: ['formacion', 'notas', 'clase', 'horario'],
  coordinacion_parvularia: ['formacion', 'notas', 'clase', 'horario'],
  registro_academico: ['notas', 'horario'],
  enfermeria: ['formacion', 'avisos'],
  psicopedagogico: ['formacion', 'notas', 'avisos'],
};

export async function fixRolesPermissions(): Promise<void> {
  const snapshot = await getDocs(collection(db, ROLES_COLLECTION));
  for (const d of snapshot.docs) {
    const current = d.data().permissions || [];
    const correct = CORRECT_ROLE_PERMISSIONS[d.id];

    // No sobrescribir permisos que el admin ya configuró manualmente
    // Solo corregir roles que tengan permisos vacíos (nunca configurados)
    if (current.length === 0 && correct) {
      await updateDoc(doc(db, ROLES_COLLECTION, d.id), { permissions: correct });
    }
  }
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

export async function ensureTechnicalGrades(): Promise<void> {
  const currentYear = new Date().getFullYear();
  const ALL_GRADES = [
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
    { id: '12t', name: '12° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const, status: 'ACTIVO' as const, schoolYear: currentYear },
  ];
  for (const g of ALL_GRADES) {
    try {
      await setDoc(doc(db, GRADES_COLLECTION, g.id), { ...g, createdAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      console.error(`Error creando grado ${g.id}:`, e);
    }
  }
}

export async function cleanupDuplicateGrades(): Promise<number> {
  const snap = await getDocs(collection(db, GRADES_COLLECTION));
  let deleted = 0;
  const VALID_IDS = new Set([
    'k4', 'k5', 'k6', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    '10g', '11g', '10t', '11t', '12t'
  ]);
  for (const d of snap.docs) {
    if (!VALID_IDS.has(d.id)) {
      try {
        await deleteDoc(doc(db, GRADES_COLLECTION, d.id));
        deleted++;
      } catch (e) {
        console.error(`Error eliminando grado duplicado ${d.id}:`, e);
      }
    }
  }
  return deleted;
}

// ==================== BTV CURRICULUM MIGRATION ====================

export async function seedBTVCurriculumToFirestore(): Promise<number> {
  const lmsModulesRef = collection(db, 'lms_modules');
  const existingSnap = await getDocs(lmsModulesRef);
  const existingCodes = new Set(existingSnap.docs.map(d => (d.data() as any).code));

  const btvGrades: Record<string, { gradeId: string; gradeName: string }> = {
    '1': { gradeId: '11t', gradeName: '11° Bachillerato Técnico' },
    '2': { gradeId: '11t', gradeName: '11° Bachillerato Técnico' },
    '3': { gradeId: '11t', gradeName: '11° Bachillerato Técnico' },
  };

  let created = 0;
  for (const course of BTV_GRAPHIC_DESIGN_COURSES) {
    if (existingCodes.has(course.code)) continue;

    const gradeInfo = btvGrades[course.technicalYear] || btvGrades['1'];
    const descriptor = getModuleDescriptorData(course.code);
    const project = GENERATE_ANNUAL_PROJECT(course.code, '2026');

    const moduleData = {
      name: course.name,
      code: course.code,
      subjectId: course.subjectId || course.code.toLowerCase().replace(/\s+/g, '-'),
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      gradeId: gradeInfo.gradeId,
      gradeName: gradeInfo.gradeName,
      technicalYear: course.technicalYear,
      hours: course.hours,
      weeks: course.weeks,
      status: course.status === 'upcoming' ? 'inactive' : 'active',
      description: course.description,
      icon: course.icon,
      color: course.color,
      affineArea: course.affineArea,
      schedule: course.schedule,
      classroom: course.classroom,
      sectionId: course.sectionId || '',
      sectionName: course.sectionName || '',
      progress: course.progress || 0,
      averageGrade: course.averageGrade || 0,
      minedLevel: course.minedLevel || 4,
      unitsCount: (course as any).unitsCount || 6,
      activitiesCount: (course as any).activitiesCount || 3,
      descriptor: {
        objective: descriptor.moduleObjective || descriptor.competenceGeneral || '',
        units: descriptor.units || [],
        methodology: descriptor.methodology || '',
        evaluationCriteria: descriptor.evaluationCriteria || [],
        bibliography: descriptor.bibliography || { books: [], websites: [] },
        saberesPrevios: descriptor.saberesPrevios || [],
        developmentAxes: descriptor.developmentAxes || {
          desarrolloTecnico: '',
          desarrolloEmprendedor: '',
          desarrolloHumanoSocial: '',
          desarrolloAcademicoAplicado: '',
        },
        competenceGeneral: descriptor.competenceGeneral || '',
        moduleObjective: descriptor.moduleObjective || '',
        actionStages: descriptor.actionStages || {},
        saberesNecesarios: descriptor.saberesNecesarios || [],
        currentProject: project || descriptor.currentProject,
        availableProjects: descriptor.availableProjects || [],
        problematicSituation: descriptor.problematicSituation,
        resources: descriptor.resources,
        prerequisite: descriptor.prerequisite || '',
        promotionCriteria: descriptor.promotionCriteria || '',
      },
    };

    const docId = `lms-mod-${course.id}`;
    await setDoc(doc(db, 'lms_modules', docId), {
      ...moduleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    created++;
  }

  console.log(`BTV Migration: ${created} modules created, ${existingCodes.size} already existed`);
  return created;
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
  try {
    const q = query(collection(db, SUBJECTS_COLLECTION), orderBy('name', 'asc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Subject));
    }
  } catch (e) {
    console.error('Error al cargar materias de Firestore:', e);
  }

  // Materias básicas por defecto si la colección en Firestore está vacía
  const defaultSubjects: Subject[] = [
    { id: 'mat', name: 'Matemáticas', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 5 },
    { id: 'fis', name: 'Física', gradeId: '10', status: 'ACTIVO', type: 'BASICA', weeklyHours: 4 },
    { id: 'qui', name: 'Química', gradeId: '10', status: 'ACTIVO', type: 'BASICA', weeklyHours: 4 },
    { id: 'bio', name: 'Biología', gradeId: '7', status: 'ACTIVO', type: 'BASICA', weeklyHours: 4 },
    { id: 'esp', name: 'Español', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 5 },
    { id: 'lit', name: 'Literatura', gradeId: '7', status: 'ACTIVO', type: 'BASICA', weeklyHours: 4 },
    { id: 'ing', name: 'Inglés', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 3 },
    { id: 'his', name: 'Historia', gradeId: '7', status: 'ACTIVO', type: 'BASICA', weeklyHours: 3 },
    { id: 'geo', name: 'Geografía', gradeId: '7', status: 'ACTIVO', type: 'BASICA', weeklyHours: 3 },
    { id: 'civ', name: 'Cívica', gradeId: '7', status: 'ACTIVO', type: 'BASICA', weeklyHours: 2 },
    { id: 'inf', name: 'Informática', gradeId: '1', status: 'ACTIVO', type: 'INSTITUCIONAL', weeklyHours: 2 },
    { id: 'ef', name: 'Educación Física', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 2 },
    { id: 'mus', name: 'Música', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 2 },
    { id: 'art', name: 'Arte', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 2 },
    { id: 'rel', name: 'Religión', gradeId: '1', status: 'ACTIVO', type: 'BASICA', weeklyHours: 2 },
    { id: 'fil', name: 'Filosofía', gradeId: '11', status: 'ACTIVO', type: 'BASICA', weeklyHours: 3 }
  ];

  // Poblar Firestore en segundo plano
  Promise.all(
    defaultSubjects.map(sub =>
      setDoc(doc(db, SUBJECTS_COLLECTION, sub.id), { ...sub, createdAt: serverTimestamp() })
    )
  ).catch(err => console.error('Error guardando materias básicas iniciales:', err));

  return defaultSubjects;
}

// ==================== LMS MODULES ====================

export async function createLMSModule(data: Omit<LMSModule, 'createdAt' | 'updatedAt'>): Promise<void> {
  const ref = doc(db, 'lms_modules', data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function getLMSModule(id: string): Promise<LMSModule | null> {
  const ref = doc(db, 'lms_modules', id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as LMSModule;
}

export async function updateLMSModule(id: string, data: Partial<LMSModule>): Promise<void> {
  const ref = doc(db, 'lms_modules', id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteLMSModule(id: string): Promise<void> {
  const ref = doc(db, 'lms_modules', id);
  await deleteDoc(ref);
}

export async function getAllLMSModules(): Promise<LMSModule[]> {
  try {
    const q = query(collection(db, 'lms_modules'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule));
    }
  } catch (e) {
    console.error('Error al cargar módulos LMS de Firestore:', e);
  }

  // Cargar grados reales de Firestore para resolver nombres correctos
  let gradesMap: Record<string, string> = {
    '11t': '11° Bachillerato Técnico',
  };
  let sectionsMap: Record<string, string> = {
    '11ta': 'A',
  };
  try {
    const gradesSnap = await getDocs(collection(db, 'grades'));
    gradesSnap.forEach(d => {
      const g = d.data();
      if (g.baccalaureateType === 'tecnico') {
        gradesMap[d.id] = g.name;
      }
    });
    const sectionsSnap = await getDocs(collection(db, 'sections'));
    sectionsSnap.forEach(d => {
      const s = d.data();
      if (gradesMap[s.gradeId]) {
        sectionsMap[d.id] = s.name;
      }
    });
  } catch (e) {
    console.warn('No se pudieron cargar grados/secciones de Firestore, usando nombres por defecto:', e);
  }

  // Mapeo de gradeId del currículum BTV a los IDs reales del sistema Firestore
  // btvCurriculumData usa '10','11','12' pero Firestore usa '10t','11t','12t' para técnico
  const btv2FirestoreGradeId = (year: string): string => {
    return '11t';
  };
  const btv2SectionId = (year: string): string => {
    return '11ta';
  };

  // Si no hay módulos en Firestore, cargar los 27 módulos BTV oficiales (1.º, 2.º y 3.er Año Técnico)
  const seedModules: LMSModule[] = BTV_GRAPHIC_DESIGN_COURSES.map(course => {
    const techYear = (course.technicalYear as string) || '1';
    const firestoreGradeId = btv2FirestoreGradeId(techYear);
    const firestoreSectionId = btv2SectionId(techYear);
    return {
      id: `lms-mod-${course.id}`,
      name: course.name,
      code: course.code,
      subjectId: course.subjectId,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      gradeId: firestoreGradeId,
      gradeName: gradesMap[firestoreGradeId] || `${techYear}° Bachillerato Técnico`,
      sectionId: firestoreSectionId,
      sectionName: sectionsMap[firestoreSectionId] || 'A',
      technicalYear: (techYear as '1' | '2' | '3'),
      hours: course.hours,
      weeks: course.weeks,
      status: (course.status as 'active' | 'inactive') || 'active',
      descriptor: course.descriptor || {
        objective: '',
        units: [],
        methodology: '',
        evaluationCriteria: [],
        bibliography: { books: [], websites: [] },
        saberesPrevios: [],
        developmentAxes: {
          desarrolloTecnico: '',
          desarrolloEmprendedor: '',
          desarrolloHumanoSocial: '',
          desarrolloAcademicoAplicado: '',
        },
      },
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Poblar Firestore en segundo plano para que persistan
  Promise.all(
    seedModules.map(mod =>
      setDoc(doc(db, 'lms_modules', mod.id), { ...mod, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    )
  ).catch(err => console.error('Error al poblar lms_modules en Firestore:', err));

  return seedModules;
}

/** 
 * Fuerza la re-sincronización de todos los módulos BTV oficiales en Firestore
 * corrigiendo gradeId a los IDs técnicos reales ('10t','11t','12t').
 * Usar desde Admin cuando los módulos muestren datos incorrectos.
 */
export async function reseedLMSModules(): Promise<LMSModule[]> {
  // Borrar módulos con prefijo 'lms-mod-' (los del seed anterior)
  try {
    const q = query(collection(db, 'lms_modules'));
    const snap = await getDocs(q);
    const deletions = snap.docs
      .filter(d => d.id.startsWith('lms-mod-'))
      .map(d => deleteDoc(doc(db, 'lms_modules', d.id)));
    await Promise.all(deletions);
  } catch (e) {
    console.warn('Error limpiando módulos anteriores:', e);
  }

  // Re-generar con gradeId correcto
  // Resolver nombres de grado desde Firestore
  let gradesMap: Record<string, string> = {
    '11t': '11° Bachillerato Técnico',
  };
  let sectionsMap: Record<string, string> = { '11ta': 'A' };
  try {
    const gradesSnap = await getDocs(collection(db, 'grades'));
    gradesSnap.forEach(d => {
      const g = d.data();
      if (g.baccalaureateType === 'tecnico') gradesMap[d.id] = g.name;
    });
    const sectionsSnap = await getDocs(collection(db, 'sections'));
    sectionsSnap.forEach(d => {
      const s = d.data();
      if (gradesMap[s.gradeId]) sectionsMap[d.id] = s.name;
    });
  } catch (e) {
    console.warn('Error cargando grados/secciones para reseed:', e);
  }

  const btv2Id = (year: string) => '11t';
  const btv2Sec = (year: string) => year === '1' ? '10ta' : year === '2' ? '11ta' : '12ta';

  const modules: LMSModule[] = BTV_GRAPHIC_DESIGN_COURSES.map(course => {
    const y = (course.technicalYear as string) || '1';
    const gid = btv2Id(y); const sid = btv2Sec(y);
    return {
      id: `lms-mod-${course.id}`,
      name: course.name,
      code: course.code,
      subjectId: course.subjectId,
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      gradeId: gid,
      gradeName: gradesMap[gid] || `${y}° Bachillerato Técnico`,
      sectionId: sid,
      sectionName: sectionsMap[sid] || 'A',
      technicalYear: y as '1' | '2' | '3',
      hours: course.hours,
      weeks: course.weeks,
      status: (course.status as 'active' | 'inactive') || 'active',
      description: course.description || '',
      icon: course.icon || 'BookOpen',
      color: course.color || '#0D71B9',
      affineArea: course.affineArea || '',
      schedule: course.schedule || '',
      classroom: course.classroom || '',
      progress: course.progress || 0,
      averageGrade: course.averageGrade || 0,
      minedLevel: course.minedLevel || 4,
      unitsCount: (course as any).unitsCount || 6,
      activitiesCount: (course as any).activitiesCount || 3,
      descriptor: course.descriptor || { objective: '', units: [], methodology: '', evaluationCriteria: [], bibliography: { books: [], websites: [] }, saberesPrevios: [], developmentAxes: { desarrolloTecnico: '', desarrolloEmprendedor: '', desarrolloHumanoSocial: '', desarrolloAcademicoAplicado: '' } },
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  try {
    await Promise.all(
      modules.map(mod =>
        setDoc(doc(db, 'lms_modules', mod.id), { ...mod, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      )
    );
  } catch (e) {
    console.error('Error al guardar módulos en Firestore:', e);
    throw new Error('No se pudieron guardar los módulos en Firestore. Verifique que las reglas estén desplegadas y que tenga permisos de administrador.');
  }

  return modules;
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

  // Auto-create approval request for pre-registered students
  const carnet = data.carnet || data.id;
  const email = carnet.includes('@') ? carnet : `${carnet}@salesianosanjose.edu.sv`;
  
  try {
    await createApprovalRequest({
      id: `approval_${Date.now()}_${data.id}`,
      userId: `temp_${Date.now()}`,
      email,
      displayName: data.name,
      requestedRole: 'alumno',
      studentId: data.id,
      studentName: data.name,
      gradeId: data.gradeId,
      sectionId: data.sectionId,
      status: 'pending',
    });
  } catch (error) {
    console.error('Error creating approval request for student:', error);
  }
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

export async function deleteUser(uid: string): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, uid);
  await deleteDoc(ref);
}

export async function getAllStudents(): Promise<Student[]> {
  const q = query(collection(db, STUDENTS_COLLECTION), orderBy('name', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
}

export async function getAvailableStudentsBySection(
  grade: string,
  section: string,
  excludeProjectId?: string
): Promise<Student[]> {
  // Get all students and filter by grade/section
  // The grade format from the form is "11°" but student gradeId is "11t" or "11"
  // The section format from the form is "A" but student sectionId is "11ta" (ends with letter)
  const allStudents = await getAllStudents();
  
  const cleanGrade = grade.replace('°', '');
  
  const students = allStudents.filter(s => {
    // Match grade: student gradeId should contain the grade number
    const studentGradeNum = s.gradeId.replace(/[^0-9]/g, '');
    if (studentGradeNum !== cleanGrade) return false;
    
    // Match section: student sectionId should end with the section letter
    const studentSectionLetter = s.sectionId?.slice(-1)?.toUpperCase();
    if (studentSectionLetter !== section.toUpperCase()) return false;
    
    return true;
  });

  // Get all active projects to exclude students already in a project
  const proyectosRef = collection(db, 'proyectos');
  const proyectosSnap = await getDocs(proyectosRef);
  const activeStudentUids = new Set<string>();
  
  for (const doc of proyectosSnap.docs) {
    const proyecto = doc.data();
    // Only exclude students from active projects (not rejected ones)
    if (!proyecto.estado?.startsWith('rechazado') && doc.id !== excludeProjectId) {
      const integrantes = proyecto.integrantes || [];
      integrantes.forEach((uid: string) => activeStudentUids.add(uid));
    }
  }

  // Filter out students who are already in active projects
  return students.filter(s => !activeStudentUids.has(s.id));
}

export async function getStudentsWithoutAccounts(): Promise<Student[]> {
  const [students, users] = await Promise.all([getAllStudents(), getAllUsers()]);
  const userIds = new Set(users.map(u => u.studentId).filter(Boolean));
  return students.filter(s => !userIds.has(s.id));
}

export async function activateStudent(student: Student, password: string): Promise<{ email: string; password: string }> {
  const carnet = student.carnet || student.id;
  const email = carnet.includes('@') ? carnet : `${carnet.toLowerCase()}@salesianosanjose.edu.sv`;
  
  // Crear cuenta de Firebase Auth via REST API
  let authUid: string;
  try {
    const authResult = await createAuthAccount(email, password, student.name);
    authUid = authResult.uid;
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      throw new Error(`El email ${email} ya tiene una cuenta activa. El alumno puede iniciar sesión directamente.`);
    }
    throw err;
  }

  // Crear documento de usuario en Firestore con el UID de Auth
  await createUser({
    uid: authUid,
    email,
    displayName: student.name,
    role: 'alumno',
    status: 'approved',
    studentId: student.id,
  });

  // Crear approval request
  await createApprovalRequest({
    id: authUid,
    userId: authUid,
    email,
    displayName: student.name,
    requestedRole: 'alumno',
    status: 'approved',
    studentId: student.id,
    studentName: student.name,
    gradeId: student.gradeId,
    sectionId: student.sectionId,
  });

  return { email, password };
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

    // Ajustar año de ingreso para evitar repeticiones de K4 si el carnet indica el año de nacimiento
    const logicalMinYear = currentYear - (currentGradeNum - (-1));
    if (entryYear < logicalMinYear) {
      entryYear = logicalMinYear;
    }

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

      // La sección para el año en curso o anteriores usa la sección lógica correspondiente
      // Extraer la letra de la sección actual de manera segura
      const sectionLetter = sectionId.includes('-')
        ? sectionId.split('-').pop()?.toUpperCase() || 'A'
        : sectionId.toUpperCase();
      const cleanLetter = sectionLetter.replace(/[0-9]/g, '').replace('G', '').replace('T', '').toLowerCase();

      const histSectionId = `${year}-${gradeForYear}-${cleanLetter}`;

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

export interface YearSectionConfig {
  gradeId: string;
  sectionNames: string[];
}

export async function startSchoolYear(year: number, sectionConfig?: YearSectionConfig[]): Promise<void> {
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
  const grades = gradesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Grade));
  const sections = sectionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Section));
  const baccalaureateTypes = await getAllBaccalaureateTypes();

  // Config de secciones por grado: si no se provee, conserva las letras del año anterior
  const configByGrade = new Map<string, string[]>();
  if (sectionConfig && sectionConfig.length > 0) {
    sectionConfig.forEach(c => configByGrade.set(c.gradeId, c.sectionNames));
  } else {
    grades.forEach(g => {
      const prevSections = sections.filter(s => s.gradeId === g.id && (s.schoolYear === previousYear || !s.schoolYear));
      const names = uniqueNames(prevSections);
      if (names.length > 0) configByGrade.set(g.id, names);
    });
  }

  // 1. Crea las secciones del nuevo año según la configuración
  const sectionPromises: Promise<void>[] = [];
  configByGrade.forEach((names, gradeId) => {
    names.forEach(name => {
      const cleanName = name.trim().toUpperCase();
      const newSecId = `${year}-${gradeId}-${cleanName.toLowerCase()}`;
      const prevSection = sections.find(s =>
        s.gradeId === gradeId &&
        s.name.trim().toUpperCase() === cleanName &&
        (s.schoolYear === previousYear || !s.schoolYear)
      );
      const newSecRef = doc(db, SECTIONS_COLLECTION, newSecId);
      sectionPromises.push(
        setDoc(newSecRef, {
          id: newSecId,
          name: cleanName,
          gradeId,
          schoolYear: year,
          status: 'ACTIVO',
          ...(prevSection?.capacity ? { capacity: prevSection.capacity } : {}),
          ...(prevSection?.buildingId ? { buildingId: prevSection.buildingId } : {}),
          ...(prevSection?.computerLabId ? { computerLabId: prevSection.computerLabId } : {}),
          createdAt: serverTimestamp()
        })
      );
    });
  });
  await Promise.all(sectionPromises);

  // 2. Promueve a los alumnos y actualiza su historial
  const students = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Student));
  const activeStudents = students.filter(s => isActiveStudent(s));

  // Agrupa por grado de destino para distribuir de forma consistente con la vista previa
  const destinationGroups: Record<string, Student[]> = {};
  activeStudents.forEach(s => {
    const dest = getNextGradeId(s.gradeId, grades, baccalaureateTypes);
    if (!dest) return;
    (destinationGroups[dest] = destinationGroups[dest] || []).push(s);
  });

  const assignedSection: Record<string, string> = {};
  Object.entries(destinationGroups).forEach(([dest, group]) => {
    const names = configByGrade.get(dest) || [];
    const dist = distributeStudents(group, names);
    group.forEach(s => {
      const letter = dist.assigned[s.id];
      assignedSection[s.id] = letter ? `${year}-${dest}-${letter.toLowerCase()}` : '';
    });
  });

  const studentUpdates: Promise<void>[] = [];
  activeStudents.forEach(s => {
    const ref = doc(db, STUDENTS_COLLECTION, s.id);
    const history = s.enrollmentHistory || [];
    const dest = getNextGradeId(s.gradeId, grades, baccalaureateTypes);
    const updatedHistory = history.map(record =>
      record.year === previousYear ? { ...record, status: 'FINALIZADO' as const } : record
    );

    // Graduación: el alumno egresa y no continúa al siguiente grado
    if (!dest) {
      studentUpdates.push(
        updateDoc(ref, {
          enrollmentHistory: updatedHistory,
          status: 'GRADUADO',
          updatedAt: serverTimestamp()
        })
      );
      return;
    }

    const newRecord = {
      year,
      gradeId: dest,
      sectionId: assignedSection[s.id] || `${year}-${dest}-a`,
      status: 'EN_CURSO' as const
    };

    const fullHistory = [...updatedHistory, newRecord];
    if (fullHistory.filter(r => r.year === year).length > 1) return;

    studentUpdates.push(
      updateDoc(ref, {
        enrollmentHistory: fullHistory,
        gradeId: dest,
        sectionId: newRecord.sectionId,
        status: 'ACTIVO',
        updatedAt: serverTimestamp()
      })
    );
  });
  await Promise.all(studentUpdates);

  // 3. Actualiza el año lectivo de los grados
  const gradeUpdates = gradesSnap.docs.map(d => updateDoc(d.ref, { schoolYear: year, status: 'ACTIVO', updatedAt: serverTimestamp() }));
  await Promise.all(gradeUpdates);

  // 4. Guarda el estado de inicio de año
  await setDoc(yearStatusRef, { year, startedAt: serverTimestamp() });
}

// ==================== SEED DATA ====================

export async function migrateRolesToLowerCase(): Promise<void> {
  const roles = await getAllRoles();
  const users = await getAllUsers();
  
  for (const role of roles) {
    if (role.id !== role.id.toLowerCase()) {
      const lowerId = role.id.toLowerCase();
      console.log(`[Migration] Migrando rol "${role.id}" → "${lowerId}"`);
      
      // Crear nuevo rol con ID minúscula
      await createRole({
        id: lowerId,
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isSystem: role.isSystem,
      });
      
      // Actualizar usuarios con este rol
      const affectedUsers = users.filter(u => u.role === role.id);
      for (const user of affectedUsers) {
        await updateUserRole(user.uid, lowerId);
        console.log(`[Migration] Usuario ${user.email}: rol "${role.id}" → "${lowerId}"`);
      }
      
      // Eliminar rol con ID en mayúsculas
      await deleteRole(role.id);
    }
  }
}

export async function seedInitialData(): Promise<void> {
  const grades = await getAllGrades();
  if (grades.length === 0) {
    // Roles
    const rolesData: Omit<RoleConfig, 'createdAt'>[] = [
      { id: 'admin', name: 'Administrador', description: 'Control total del sistema', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'], isSystem: true },
      { id: 'docente', name: 'Docente', description: 'Profesor del colegio', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'], isSystem: true },
      { id: 'alumno', name: 'Alumno', description: 'Estudiante del colegio', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'semana-juventud', 'lms'], isSystem: true },
      { id: 'coordinacion', name: 'Coordinación', description: 'Coordinación académica', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'], isSystem: true },
      { id: 'coordinacion_academica', name: 'Coordinación Académica', description: 'Coordinación académica', permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'], isSystem: true },
      { id: 'registro_academico', name: 'Registro Académico', description: 'Registro académico', permissions: ['notas', 'horario'], isSystem: true },
      { id: 'enfermeria', name: 'Enfermería', description: 'Enfermería del colegio', permissions: ['formacion', 'avisos'], isSystem: true },
      { id: 'psicopedagogico', name: 'Psicopedagogía', description: 'Psicopedagogía del colegio', permissions: ['formacion', 'notas', 'avisos'], isSystem: true },
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
    { id: '11t', name: '11° Bachillerato Técnico', cycle: '4' as const, baccalaureateType: 'tecnico' as const, status: 'ACTIVO' as const, schoolYear: currentYear }
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
    { id: '11ta', name: 'A', gradeId: '11t', capacity: 35, buildingId: 'b3', status: 'ACTIVO' as const, schoolYear: currentYear }
  ];
  for (const s of sectionsData) await createSection(s);

  // Subjects
  const subjectsData: Array<{ id: string; name: string; gradeId: string; status: 'ACTIVO' | 'INACTIVO'; type: 'BASICA' | 'MINED' | 'INSTITUCIONAL' }> = [
    { id: 'mat', name: 'Matemáticas', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'fis', name: 'Física', gradeId: '10', status: 'ACTIVO', type: 'BASICA' },
    { id: 'qui', name: 'Química', gradeId: '10', status: 'ACTIVO', type: 'BASICA' },
    { id: 'bio', name: 'Biología', gradeId: '7', status: 'ACTIVO', type: 'BASICA' },
    { id: 'esp', name: 'Español', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'lit', name: 'Literatura', gradeId: '7', status: 'ACTIVO', type: 'BASICA' },
    { id: 'ing', name: 'Inglés', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'his', name: 'Historia', gradeId: '7', status: 'ACTIVO', type: 'BASICA' },
    { id: 'geo', name: 'Geografía', gradeId: '7', status: 'ACTIVO', type: 'BASICA' },
    { id: 'civ', name: 'Cívica', gradeId: '7', status: 'ACTIVO', type: 'BASICA' },
    { id: 'inf', name: 'Informática', gradeId: '1', status: 'ACTIVO', type: 'INSTITUCIONAL' },
    { id: 'ef', name: 'Educación Física', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'mus', name: 'Música', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'art', name: 'Arte', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'rel', name: 'Religión', gradeId: '1', status: 'ACTIVO', type: 'BASICA' },
    { id: 'fil', name: 'Filosofía', gradeId: '11', status: 'ACTIVO', type: 'BASICA' }
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
    { id: 's31', carnet: 'SEED-031', firstName: 'David Alejandro', lastName: 'Umaña', name: 'David Alejandro Umaña', gender: 'M' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's32', carnet: 'SEED-032', firstName: 'Jessica Tatiana', lastName: 'Martínez', name: 'Jessica Tatiana Martínez', gender: 'F' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's33', carnet: 'SEED-033', firstName: 'Erick Adalberto', lastName: 'Cruz', name: 'Erick Adalberto Cruz', gender: 'M' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 },
    { id: 's34', carnet: 'SEED-034', firstName: 'Ana Gabriela', lastName: 'Ochoa', name: 'Ana Gabriela Ochoa', gender: 'F' as const, gradeId: '11t', sectionId: '11ta', enrollmentYear: 2024 }
  ];
  for (const s of studentsData) await createStudent(s);

  console.log('Seed completed: 7 roles, 12 grades, 22 sections, 16 subjects, 10 teachers, 30 students');
  }
  
  // Migrar roles existentes a minúsculas
  await migrateRolesToLowerCase();
}

// ==================== SECURITY & AUDIT LOGS ====================

export async function getTeacherByEmail(email: string): Promise<Teacher | null> {
  const q = query(collection(db, TEACHERS_COLLECTION), where('email', '==', email));
  const snap = await getDocs(q);
  if (snap.empty) {
    const all = await getDocs(collection(db, TEACHERS_COLLECTION));
    const found = all.docs.find(d => (d.data().email || '').toLowerCase() === email.toLowerCase());
    return found ? { id: found.id, ...found.data() } as Teacher : null;
  }
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Teacher;
}

export async function getStudentByCarnet(carnet: string): Promise<Student | null> {
  const q = query(collection(db, STUDENTS_COLLECTION), where('carnet', '==', carnet.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) {
    const all = await getDocs(collection(db, STUDENTS_COLLECTION));
    const found = all.docs.find(d => (d.data().carnet || '').toUpperCase() === carnet.toUpperCase());
    return found ? { id: found.id, ...found.data() } as Student : null;
  }
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Student;
}

export async function isEmailPreAuthorized(email: string): Promise<boolean> {
  const superAdmins = ['admin@salesianosanjose.edu.sv', 'jose.marquez@salesianosanjose.edu.sv'];
  if (superAdmins.includes(email.toLowerCase())) return true;

  // Check teachers
  const teacher = await getTeacherByEmail(email);
  if (teacher) return true;

  // Check students
  const prefix = email.split('@')[0];
  const student = await getStudentByCarnet(prefix);
  if (student) return true;

  return false;
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

// ==================== APPROVAL REQUESTS ====================

export async function createApprovalRequest(data: Omit<ApprovalRequest, 'createdAt'>): Promise<void> {
  const ref = doc(db, APPROVAL_REQUESTS_COLLECTION, data.id);
  const cleanData: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) cleanData[key] = value;
  }
  await setDoc(ref, { ...cleanData, createdAt: serverTimestamp() });
}

export async function getPendingApprovalRequests(): Promise<ApprovalRequest[]> {
  const q = query(collection(db, APPROVAL_REQUESTS_COLLECTION), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest));
  return items.sort((a, b) => {
    const tA = a.createdAt?.toMillis() || 0;
    const tB = b.createdAt?.toMillis() || 0;
    return tA - tB;
  });
}

export async function getAllApprovalRequests(): Promise<ApprovalRequest[]> {
  const q = query(collection(db, APPROVAL_REQUESTS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ApprovalRequest));
}

export async function updateApprovalRequest(id: string, data: Partial<ApprovalRequest>): Promise<void> {
  const ref = doc(db, APPROVAL_REQUESTS_COLLECTION, id);
  await updateDoc(ref, data);
}

export async function updateApprovalRequestByUserId(userId: string, data: Partial<ApprovalRequest>): Promise<void> {
  const q = query(collection(db, APPROVAL_REQUESTS_COLLECTION), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    const ref = doc(db, APPROVAL_REQUESTS_COLLECTION, userId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, data);
    }
    return;
  }
  const ref = doc(db, APPROVAL_REQUESTS_COLLECTION, snapshot.docs[0].id);
  await updateDoc(ref, data);
}

export async function deleteApprovalRequest(id: string): Promise<void> {
  const ref = doc(db, APPROVAL_REQUESTS_COLLECTION, id);
  await deleteDoc(ref);
}

export async function deleteAllPendingApprovalRequests(): Promise<number> {
  const q = query(collection(db, APPROVAL_REQUESTS_COLLECTION), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  let count = 0;
  for (const d of snapshot.docs) {
    await deleteDoc(d.ref);
    count++;
  }
  return count;
}

// ==================== NEW USER NOTIFICATIONS ====================

export async function createNewUserNotification(data: Omit<NewUserNotification, 'createdAt'>): Promise<void> {
  const ref = doc(db, NEW_USER_NOTIFICATIONS_COLLECTION, data.id);
  await setDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function getNewUserNotifications(): Promise<NewUserNotification[]> {
  const q = query(collection(db, NEW_USER_NOTIFICATIONS_COLLECTION), where('status', '==', 'new'));
  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewUserNotification));
  return items.sort((a, b) => {
    const tA = a.createdAt?.toMillis() || 0;
    const tB = b.createdAt?.toMillis() || 0;
    return tB - tA;
  });
}

export async function getAllNewUserNotifications(): Promise<NewUserNotification[]> {
  const q = query(collection(db, NEW_USER_NOTIFICATIONS_COLLECTION), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as NewUserNotification));
}

export async function markNotificationAsNotified(notificationId: string): Promise<void> {
  const ref = doc(db, NEW_USER_NOTIFICATIONS_COLLECTION, notificationId);
  await updateDoc(ref, { status: 'notified', notifiedAt: serverTimestamp() });
}

// ==================== AUTO-PROVISIONING ====================

export async function createUserForTeacher(uid: string, email: string, displayName: string, teacherId?: string): Promise<void> {
  if (!teacherId) {
    // Si no se proporciona teacherId, buscar por email
    const teacher = await getTeacherByEmail(email);
    if (teacher) {
      teacherId = teacher.id;
    } else {
      // Crear perfil de docente básico
      const newTeacherId = `t_${Date.now()}`;
      await createTeacher({
        id: newTeacherId,
        name: displayName,
        email,
        subjects: [],
        status: 'ACTIVO',
      });
      await updateUser(uid, { teacherId: newTeacherId });
      return;
    }
  }

  // Actualizar el usuario con el teacherId
  await updateUser(uid, { teacherId });
}

export async function createUserForStudent(uid: string, email: string, displayName: string, studentId?: string): Promise<void> {
  if (!studentId) {
    // Si no se proporciona studentId, buscar por carnet
    const carnet = email.split('@')[0];
    const student = await getStudentByCarnet(carnet);
    if (student) {
      studentId = student.id;
    } else {
      // No se puede crear alumno sin datos mínimos
      console.warn('No se encontró alumno para el carnet:', carnet);
      return;
    }
  }

  // Actualizar el usuario con el studentId
  await updateUser(uid, { studentId });
}

// ==================== USER REACTIVATION ====================

export async function detectUserRole(email: string): Promise<{ role: UserRole | null; teacherId?: string; teacherName?: string; studentId?: string; studentName?: string; gradeId?: string; sectionId?: string }> {
  const lowerEmail = email.toLowerCase();

  // Check super admin
  if (lowerEmail === 'admin@salesianosanjose.edu.sv' || lowerEmail === 'jose.marquez@salesianosanjose.edu.sv') {
    return { role: 'admin' };
  }

  // Check teacher
  const teacher = await getTeacherByEmail(lowerEmail);
  if (teacher) {
    return { role: 'docente', teacherId: teacher.id, teacherName: teacher.name };
  }

  // Check student by carnet
  const carnet = lowerEmail.split('@')[0];
  const student = await getStudentByCarnet(carnet);
  if (student) {
    return { role: 'alumno', studentId: student.id, studentName: student.name, gradeId: student.gradeId, sectionId: student.sectionId };
  }

  return { role: null };
}

export async function reactivateUser(email: string, role: UserRole, extra?: { teacherId?: string; studentId?: string }): Promise<User> {
  const existing = await getUserByEmail(email);
  if (existing) {
    // User exists in Firestore — just update status to approved
    await updateUser(existing.uid, { status: 'approved', role, updatedAt: new Date() as any });
    return { ...existing, status: 'approved', role };
  }

  // User doesn't exist in Firestore — we can't know the Auth UID from client
  // Throw an error with instructions
  throw new Error('NO_AUTH_UID');
}

// ==================== USER HELPERS ====================

export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(collection(db, USERS_COLLECTION), where('email', '==', email.toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const d = snapshot.docs[0];
  return { uid: d.id, ...d.data() } as User;
}

export async function getUsersByRole(role: UserRole): Promise<User[]> {
  const q = query(collection(db, USERS_COLLECTION), where('role', '==', role), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User));
}

export async function getUsersByStatus(status: UserStatus): Promise<User[]> {
  const q = query(collection(db, USERS_COLLECTION), where('status', '==', status), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() } as User));
}

// ==================== USER APPROVAL ACTIONS ====================

export async function approveUser(uid: string, role: UserRole): Promise<void> {
  const user = await getUser(uid);
  if (!user) throw new Error('Usuario no encontrado');

  // Auto-provisionar según rol
  if (role === 'docente') {
    const teacher = await getTeacherByEmail(user.email);
    if (teacher) {
      await createUserForTeacher(uid, user.email, user.displayName, teacher.id);
    } else {
      await createUserForTeacher(uid, user.email, user.displayName);
    }
  } else if (role === 'alumno') {
    const carnet = user.email.split('@')[0];
    const student = await getStudentByCarnet(carnet);
    if (student) {
      await createUserForStudent(uid, user.email, user.displayName, student.id);
    } else {
      await createUserForStudent(uid, user.email, user.displayName);
    }
  }

  // Actualizar usuario
  await updateUser(uid, {
    role,
    status: 'approved',
    requestedRole: undefined,
    updatedAt: new Date() as any,
  });

  // Actualizar solicitud de aprobación
  await updateApprovalRequestByUserId(uid, {
    status: 'approved',
    reviewedBy: 'admin',
    reviewedAt: new Date() as any,
  });

  // Crear notificación para el admin
  const userAfterUpdate = await getUser(uid);
  if (userAfterUpdate?.teacherId) {
    const teacher = await getTeacher(userAfterUpdate.teacherId);
    await createNewUserNotification({
      id: `notif_${Date.now()}_${uid}`,
      userId: uid,
      email: user.email,
      displayName: user.displayName,
      role,
      teacherId: userAfterUpdate.teacherId,
      teacherName: teacher?.name,
      password: '***',
      status: 'new',
    });
  } else if (userAfterUpdate?.studentId) {
    const student = await getStudent(userAfterUpdate.studentId);
    await createNewUserNotification({
      id: `notif_${Date.now()}_${uid}`,
      userId: uid,
      email: user.email,
      displayName: user.displayName,
      role,
      studentId: userAfterUpdate.studentId,
      studentName: student?.name,
      gradeName: student?.gradeId,
      sectionName: student?.sectionId,
      password: '***',
      status: 'new',
    });
  }
}

export async function createPendingApprovalForStudent(studentId: string): Promise<void> {
  const student = await getStudent(studentId);
  if (!student) return;

  const carnet = student.carnet || student.id;
  const email = carnet.includes('@') ? carnet : `${carnet}@salesianosanjose.edu.sv`;

  await createApprovalRequest({
    id: studentId,
    userId: studentId,
    email,
    displayName: student.name,
    requestedRole: 'alumno',
    studentId: student.id,
    studentName: student.name,
    gradeId: student.gradeId,
    sectionId: student.sectionId,
    status: 'pending',
  });
}

export async function rejectUser(uid: string, reason?: string): Promise<void> {
  await updateUser(uid, {
    status: 'rejected',
    rejectionReason: reason,
    updatedAt: new Date() as any,
  });

  await updateApprovalRequestByUserId(uid, {
    status: 'rejected',
    reviewedBy: 'admin',
    reviewedAt: new Date() as any,
    rejectionReason: reason,
  });
}

// ==================== ADMIN SEED: PROYECTO CULTIVO BACTERIAS ====================

export async function seedProyectoCultivoBacterias(): Promise<void> {
  const studentsSnap = await getDocs(query(collection(db, STUDENTS_COLLECTION), orderBy('name', 'asc')));

  // Buscar a Fátima
  const fatimaDoc = studentsSnap.docs.find(d => {
    const name = (d.data().name || '').toLowerCase();
    return name.includes('zavaleta');
  });

  if (!fatimaDoc) {
    console.error('❌ No se encontró a Fátima Zavaleta en students');
    return;
  }

  const fatima = fatimaDoc.data();
  console.log('✅ Fátima encontrada:', fatimaDoc.id, fatima.name, fatima.gradeId, fatima.sectionId);

  // Activar cuenta de usuario
  const usersSnap = await getDocs(query(collection(db, USERS_COLLECTION), where('studentId', '==', fatimaDoc.id)));
  if (!usersSnap.empty) {
    const userDoc = usersSnap.docs[0];
    const ud = userDoc.data();
    if (ud.status !== 'approved' || ud.role !== 'alumno') {
      await updateDoc(doc(db, USERS_COLLECTION, userDoc.id), {
        role: 'alumno',
        status: 'approved',
        updatedAt: new Date(),
      });
      console.log('✅ Cuenta de Fátima activada');
    } else {
      console.log('✅ Cuenta de Fátima ya está activa');
    }
  } else {
    console.log('⚠️ No se encontró cuenta de usuario para Fátima. Créala desde el admin.');
  }

  // Crear proyecto
  const integrantes = [
    { nombre: 'Eswin Alejandro Ramírez', numero_lista: 1, es_rep: false, uid: '' },
    { nombre: 'Ernesto Josué Reina Salazar', numero_lista: 2, es_rep: false, uid: '' },
    { nombre: 'Fátima Daniela Zavaleta González', numero_lista: 3, es_rep: true, uid: fatimaDoc.id },
    { nombre: 'Kevin Alexander Rivera Guevara', numero_lista: 4, es_rep: false, uid: '' },
    { nombre: 'Nataly Stephany Cea Rivas', numero_lista: 5, es_rep: false, uid: '' },
    { nombre: 'Wilfredo José Carrillo Zaldaña', numero_lista: 6, es_rep: false, uid: '' },
  ];

  const hoy = new Date().toISOString().slice(0, 10);

  const docRef = await addDoc(collection(db, 'proyectos'), {
    titulo: 'Cultivo de bacterias y efectos antibacteriales',
    descripcion: 'Con este experimento analizaremos el crecimiento de bacterias en superficies del uso cotidiano, como celulares, manos y fruta. Además evaluar el efecto de diferentes sustancias antibacteriales para determinar cuáles son más eficientes para visualizar el efecto bacteriano.',
    grado: '11°',
    seccion: 'A',
    materia_id: 'ciencia',
    materia_nombre: 'Ciencia y Tecnología',
    materias_secundarias: [],
    representante_id: fatimaDoc.id,
    representante_nombre: fatima.name,
    integrantes: integrantes.map(i => i.uid || i.nombre),
    integrantes_detalle: integrantes,
    estado: 'borrador',
    intentos_envio: 0,
    observaciones: null,
    fecha_registro: hoy,
    fecha_envio: null,
    fecha_aprobacion: null,
  });

  console.log('✅ Proyecto creado:', docRef.id);

  await addDoc(collection(db, 'historial'), {
    proyecto_id: docRef.id,
    actor_id: fatimaDoc.id,
    actor_nombre: fatima.name,
    rol_actor: 'alumno',
    accion: 'registro',
    valor_anterior: null,
    valor_nuevo: { estado: 'borrador' },
    comentario: null,
    fecha: new Date().toISOString(),
  });

  console.log('🎉 ¡Listo! Proyecto "Cultivo de bacterias y efectos antibacteriales" creado en estado borrador');
}

// ==================== EVALUACIÓN DE PROYECTOS ====================

export async function getProyectosAprobados(materiaId?: string): Promise<Proyecto[]> {
  let q;
  if (materiaId) {
    q = query(
      collection(db, 'proyectos'),
      where('estado', '==', 'aprobado_oficial'),
      where('materia_id', '==', materiaId),
      orderBy('fecha_registro', 'desc')
    );
  } else {
    q = query(
      collection(db, 'proyectos'),
      where('estado', '==', 'aprobado_oficial'),
      orderBy('fecha_registro', 'desc')
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data() as Record<string, unknown>;
    return { id: d.id, ...data } as Proyecto;
  });
}

export async function getProyectosAprobadosByDocente(docenteId: string): Promise<Proyecto[]> {
  const q = query(
    collection(db, 'proyectos'),
    where('estado', '==', 'aprobado_oficial'),
    orderBy('fecha_registro', 'desc')
  );
  const snapshot = await getDocs(q);
  const proyectos = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));
  
  // Filtrar proyectos donde el docente tiene materias asignadas
  const teacher = await getTeacher(docenteId);
  if (!teacher?.subjects || teacher.subjects.length === 0) {
    return proyectos;
  }
  
  return proyectos.filter(p => 
    teacher.subjects.includes(p.materia_id) ||
    p.materias_secundarias?.some(m => teacher.subjects.includes(m))
  );
}

export async function deleteProyecto(proyectoId: string): Promise<void> {
  // 1. Eliminar actividades_evaluadas asociadas
  const actQuery = query(collection(db, 'actividades_evaluadas'), where('proyecto_id', '==', proyectoId));
  const actSnap = await getDocs(actQuery);
  for (const d of actSnap.docs) {
    await deleteDoc(d.ref);
  }

  // 2. Eliminar historial asociado
  const histQuery = query(collection(db, 'historial'), where('proyecto_id', '==', proyectoId));
  const histSnap = await getDocs(histQuery);
  for (const d of histSnap.docs) {
    await deleteDoc(d.ref);
  }

  // 3. Eliminar el proyecto
  await deleteDoc(doc(db, 'proyectos', proyectoId));
}

export async function createActividadEvaluada(
  proyectoId: string,
  actividad: Omit<ActividadEvaluada, 'id' | 'created_at' | 'updated_at'>
): Promise<string> {
  const now = new Date().toISOString();
  
  // Filtrar valores undefined/undefined para Firestore
  const filterUndefined = (obj: Record<string, any>): Record<string, any> => {
    const filtered: Record<string, any> = {};
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filtered[key] = value;
      }
    });
    return filtered;
  };

  const actividadData = filterUndefined({
    proyecto_id: actividad.proyecto_id,
    materia_id: actividad.materia_id,
    materia_nombre: actividad.materia_nombre,
    docente_id: actividad.docente_id,
    docente_nombre: actividad.docente_nombre,
    tipo_actividad: actividad.tipo_actividad,
    titulo: actividad.titulo,
    descripcion: actividad.descripcion,
    instrucciones: actividad.instrucciones,
    herramientas_requeridas: actividad.herramientas_requeridas,
    rubrica: actividad.rubrica,
    url_entrega: actividad.url_entrega,
    fecha_asignacion: actividad.fecha_asignacion,
    fecha_limite: actividad.fecha_limite,
    estado: actividad.estado,
    calificacion_total: actividad.calificacion_total,
    calificacion_nota: actividad.calificacion_nota,
    observaciones_calificacion: actividad.observaciones_calificacion,
    fecha_calificacion: actividad.fecha_calificacion,
    herramientas_sugeridas_ia: actividad.herramientas_sugeridas_ia,
  });

  const docRef = await addDoc(collection(db, 'actividades_evaluadas'), {
    ...actividadData,
    created_at: now,
    updated_at: now,
  });

  // Actualizar el proyecto con la referencia a la actividad
  await updateDoc(doc(db, 'proyectos', proyectoId), {
    actividades_evaluadas: arrayUnion({ ...actividadData, id: docRef.id, created_at: now, updated_at: now }),
  });

  return docRef.id;
}

export async function getActividadesByProyecto(proyectoId: string): Promise<ActividadEvaluada[]> {
  const q = query(
    collection(db, 'actividades_evaluadas'),
    where('proyecto_id', '==', proyectoId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ActividadEvaluada));
}

export async function getActividadesByDocente(docenteId: string): Promise<ActividadEvaluada[]> {
  const q = query(
    collection(db, 'actividades_evaluadas'),
    where('docente_id', '==', docenteId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() } as ActividadEvaluada))
    .sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''));
}

export async function updateActividadEvaluada(
  actividadId: string,
  proyectoId: string,
  updates: Partial<ActividadEvaluada>
): Promise<void> {
  const now = new Date().toISOString();
  
  // Filtrar valores undefined/undefined para Firestore
  const filteredUpdates: Record<string, any> = {};
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      filteredUpdates[key] = value;
    }
  });

  await updateDoc(doc(db, 'actividades_evaluadas', actividadId), {
    ...filteredUpdates,
    updated_at: now,
  });

  // Actualizar en el array del proyecto
  const proyectoDoc = await getDoc(doc(db, 'proyectos', proyectoId));
  if (proyectoDoc.exists()) {
    const proyecto = proyectoDoc.data() as Proyecto;
    const actividades = proyecto.actividades_evaluadas ?? [];
    const idx = actividades.findIndex(a => a.id === actividadId);
    if (idx >= 0) {
      actividades[idx] = { ...actividades[idx], ...updates, updated_at: now };
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        actividades_evaluadas: actividades,
      });
    }
  }
}

export async function calificarActividad(
  actividadId: string,
  proyectoId: string,
  calificacionTotal: number,
  calificacionNota: number,
  observaciones?: string,
  calificacionesCriterios?: { criterio_id: string; puntuacion: number }[]
): Promise<void> {
  const hoy = new Date().toISOString().slice(0, 10);

  await updateDoc(doc(db, 'actividades_evaluadas', actividadId), {
    estado: 'calificada',
    calificacion_total: calificacionTotal,
    calificacion_nota: calificacionNota,
    calificaciones_criterios: calificacionesCriterios ?? null,
    observaciones_calificacion: observaciones ?? null,
    fecha_calificacion: hoy,
    updated_at: new Date().toISOString(),
  });

  // Actualizar en el array del proyecto
  const proyectoDoc = await getDoc(doc(db, 'proyectos', proyectoId));
  if (proyectoDoc.exists()) {
    const proyecto = proyectoDoc.data() as Proyecto;
    const actividades = proyecto.actividades_evaluadas ?? [];
    const idx = actividades.findIndex(a => a.id === actividadId);
    if (idx >= 0) {
      actividades[idx] = {
        ...actividades[idx],
        estado: 'calificada',
        calificacion_total: calificacionTotal,
        calificacion_nota: calificacionNota,
        calificaciones_criterios: calificacionesCriterios ?? null,
        observaciones_calificacion: observaciones ?? null,
        fecha_calificacion: hoy,
      };
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        actividades_evaluadas: actividades,
      });
    }
  }
}

// Función simple para que el alumno guarde solo la URL (sin sync al proyecto)
export async function updateUrlEntrega(
  actividadId: string,
  urlEntrega: string
): Promise<void> {
  const now = new Date().toISOString();
  await updateDoc(doc(db, 'actividades_evaluadas', actividadId), {
    url_entrega: urlEntrega,
    updated_at: now,
  });
}

export async function resetCalificacion(
  actividadId: string,
  proyectoId: string
): Promise<void> {
  const hoy = new Date().toISOString().slice(0, 10);

  await updateDoc(doc(db, 'actividades_evaluadas', actividadId), {
    estado: 'publicada',
    calificacion_total: null,
    calificacion_nota: null,
    calificaciones_criterios: null,
    observaciones_calificacion: null,
    fecha_calificacion: null,
    updated_at: hoy,
  });

  const proyectoDoc = await getDoc(doc(db, 'proyectos', proyectoId));
  if (proyectoDoc.exists()) {
    const proyecto = proyectoDoc.data() as Proyecto;
    const actividades = proyecto.actividades_evaluadas ?? [];
    const idx = actividades.findIndex(a => a.id === actividadId);
    if (idx >= 0) {
      actividades[idx] = {
        ...actividades[idx],
        estado: 'publicada',
        calificacion_total: null,
        calificacion_nota: null,
        calificaciones_criterios: null,
        observaciones_calificacion: null,
        fecha_calificacion: null,
      };
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        actividades_evaluadas: actividades,
      });
    }
  }
}

// Mantener compatibilidad con funciones anteriores
export const createEvaluacion = createActividadEvaluada;
export const getEvaluacionesByProyecto = getActividadesByProyecto;
export const calificarEvaluacion = calificarActividad;