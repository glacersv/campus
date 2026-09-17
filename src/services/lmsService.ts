// SERVICIO CENTRAL LMS — BACHILLERATO TÉCNICO VOCACIONAL EN DISEÑO GRÁFICO
// Basado en el Plan y Programa de Estudio Oficial (MINED / Instituto Técnico Ricaldone)
// Enfoque de Competencias Orientadas a la Acción • 6 Etapas • Escala MINED 1-5
// Ahora sincronizado con Firestore + localStorage como fallback

import {
  LMSCourse,
  LMSCourseModule,
  LMSActivity,
  LMSSubmission,
  Rubric,
  LMSStudentSummary,
  TechnicalYear,
  ActionStageKey,
  MinedLevel,
  ProjectBrief,
  LMSModule,
  LMSModuleContent,
  LMSContentItem,
  LMSExample,
  LMSExercise,
  LMSAttachment,
  LMSCalendarEvent,
} from '../types';
import {
  BTV_GRAPHIC_DESIGN_COURSES,
  getModuleDescriptorData,
  DEFAULT_BTV_RUBRICS,
  GENERATE_ANNUAL_PROJECT,
} from './btvCurriculumData';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, orderBy, getDocs, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, auth } from '../firebase';

const STORAGE_KEY = 'campus_lms_btvdg_state_v2';
const ACTIVE_YEAR_KEY = 'campus_lms_active_cohort_year';
const LMS_DOC_REF = doc(db, 'lms_state', 'global');
const LMS_MODULES_COLLECTION = 'lms_modules';
const LMS_MODULE_CONTENT_COLLECTION = 'lms_module_content';
const LMS_CALENDAR_COLLECTION = 'lms_calendar';
const TEACHERS_COLLECTION = 'teachers';

// Genera los 6 módulos de acción completa para un curso
const buildActionStageModules = (courseId: string): LMSCourseModule[] => {
  const stages: { stageKey: ActionStageKey; title: string; desc: string; order: number; locked: boolean }[] = [
    {
      stageKey: 'informar',
      title: 'Etapa 1: Informarse (10% de horas)',
      desc: 'Investigación documental, cuestionario de saberes previos y recopilación de antecedentes teóricos/gráficos.',
      order: 1,
      locked: false,
    },
    {
      stageKey: 'planificar',
      title: 'Etapa 2: Planificar (10% de horas)',
      desc: 'Plan de trabajo, matriz de marco lógico, cronograma de ruta crítica y asignación de roles de equipo.',
      order: 2,
      locked: false,
    },
    {
      stageKey: 'decidir',
      title: 'Etapa 3: Decidir (10% de horas)',
      desc: 'Formulario de decisiones, evaluación de alternativas (pros/contras, Delphi) y consenso de propuesta gráfica.',
      order: 3,
      locked: false,
    },
    {
      stageKey: 'ejecutar',
      title: 'Etapa 4: Ejecutar (25% de horas)',
      desc: 'Bocetería, experimentación de técnicas manuales/digitales, armado de dummies, prototipos y arte final.',
      order: 4,
      locked: false,
    },
    {
      stageKey: 'controlar',
      title: 'Etapa 5: Controlar (25% de horas)',
      desc: 'Monitoreo de avance en cronograma, listas de cotejo, análisis FODA y control de calidad de pruebas de color.',
      order: 5,
      locked: false,
    },
    {
      stageKey: 'valorar',
      title: 'Etapa 6: Valorar y Reflexionar (20% de horas)',
      desc: 'Evaluación por rúbrica MINED (escala 1-5), autoevaluación, coevaluación, defensa oral y feria de proyectos.',
      order: 6,
      locked: false,
    },
  ];

  return stages.map((s) => ({
    id: `mod-${courseId}-${s.stageKey}`,
    courseId,
    stageKey: s.stageKey,
    title: s.title,
    description: s.desc,
    order: s.order,
    locked: s.locked,
    hours: 18,
    resourcesCount: 3,
    activitiesCount: 1,
  }));
};

// Genera actividades oficiales alineadas a las 6 etapas para los módulos
const buildInitialActivities = (courses: LMSCourse[]): LMSActivity[] => {
  const activities: LMSActivity[] = [];

  courses.forEach((c) => {
    // Actividad 1: Saberes Previos e Investigación (Etapa Informar)
    activities.push({
      id: `act-${c.id}-info`,
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      courseColor: c.color,
      moduleId: `mod-${c.id}-informar`,
      moduleTitle: 'Etapa 1: Informarse',
      stageKey: 'informar',
      title: `Diagnóstico de Saberes Previos e Investigación: ${c.name}`,
      type: 'evaluated',
      maxScore: 10,
      dueDate: '2026-03-10T23:59:00Z',
      instructions: `1. Completa el Cuestionario Diagnóstico de Saberes Previos (clasifica en MUCHO, POCO, NADA).\n2. Desarrolla una investigación bibliográfica sobre los fundamentos de ${c.name}.\n3. Elabora un mapa mental o fichas técnicas con los términos clave.`,
      status: c.technicalYear === '1' ? 'calificada' : 'pendiente',
      submission:
        c.technicalYear === '1'
          ? {
              id: `sub-${c.id}-info`,
              activityId: `act-${c.id}-info`,
              studentId: 'student-glacer',
              studentName: 'Estudiante Salesiano',
              submittedAt: '2026-02-18T14:30:00Z',
              content: `Entrega completada con diagnóstico de saberes previos y marco teórico estructurado para ${c.name}.`,
              attachments: [{ name: 'Diagnostico_Saberes_Previos.pdf', size: '1.2 MB' }],
              grade: 9.0,
              minedLevel: 5,
              feedback: 'Excelente investigación y contextualización al marco teórico oficial.',
              gradedAt: '2026-02-20T10:00:00Z',
              axisLevels: {
                tecnico: 5,
                emprendedor: 4,
                humanoSocial: 5,
                academico: 5,
              },
            }
          : undefined,
    });

    // Actividad 2: Plan de Trabajo y Decisiones (Etapas Planificar / Decidir)
    activities.push({
      id: `act-${c.id}-plan`,
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      courseColor: c.color,
      moduleId: `mod-${c.id}-planificar`,
      moduleTitle: 'Etapa 2: Planificar',
      stageKey: 'planificar',
      title: `Plan de Trabajo y Matriz de Decisiones para Proyecto de Módulo`,
      type: 'delivery',
      maxScore: 10,
      dueDate: '2026-03-24T23:59:00Z',
      instructions: `Estructura en equipo el plan de acción bajo marco lógico:\n- Definición del problema y objetivo general.\n- Cronograma de ruta crítica con fechas de entrega.\n- Formulario de Decisiones: asignación de roles (¿Quiénes? ¿Con qué? ¿Dónde? Tiempo).`,
      status: c.technicalYear === '1' ? 'calificada' : 'pendiente',
      submission:
        c.technicalYear === '1'
          ? {
              id: `sub-${c.id}-plan`,
              activityId: `act-${c.id}-plan`,
              studentId: 'student-glacer',
              studentName: 'Estudiante Salesiano',
              submittedAt: '2026-02-25T16:00:00Z',
              content: 'Plan de trabajo y cronograma de ruta crítica validado con el docente técnico.',
              attachments: [{ name: 'Plan_Trabajo_Ruta_Critica.pdf', size: '2.4 MB' }],
              grade: 8.5,
              minedLevel: 4,
              feedback: 'Muy buena distribución de responsabilidades en el equipo cooperativo.',
              gradedAt: '2026-02-28T09:00:00Z',
              axisLevels: {
                tecnico: 4,
                emprendedor: 4,
                humanoSocial: 5,
                academico: 4,
              },
            }
          : undefined,
    });

    // Actividad 3: Proyecto Final con Rúbrica Oficial MINED (Etapas Ejecutar, Controlar, Valorar)
    activities.push({
      id: `act-${c.id}-proj`,
      courseId: c.id,
      courseName: c.name,
      courseCode: c.code,
      courseColor: c.color,
      moduleId: `mod-${c.id}-valorar`,
      moduleTitle: 'Etapa 6: Valorar y Reflexionar',
      stageKey: 'valorar',
      title: `Entrega de Proyecto Integrador y Evaluación por Rúbrica MINED (Escala 1-5)`,
      type: 'rubric',
      rubricId: 'rubric-btv-standard',
      rubric: DEFAULT_BTV_RUBRICS['rubric-btv-standard'],
      maxScore: 10,
      dueDate: '2026-04-15T23:59:00Z',
      instructions: `Presentación final del proyecto anual ante jurado evaluador:\n- Bocetería y justificación en Racional Creativo.\n- Artes finales digitales e impresos a escala real.\n- Evidencias de bitácora y control FODA.\n- Evaluación criterial en los 4 Ejes (Técnico, Emprendedor, Humano-Social, Académico). Nivel mínimo de aprobación: 4 (7.0).`,
      status: c.technicalYear === '1' && c.code === 'BTVDG1.0' ? 'calificada' : 'pendiente',
      submission:
        c.technicalYear === '1' && c.code === 'BTVDG1.0'
          ? {
              id: `sub-${c.id}-proj`,
              activityId: `act-${c.id}-proj`,
              studentId: 'student-glacer',
              studentName: 'Estudiante Salesiano',
              submittedAt: '2026-03-05T11:00:00Z',
              content: 'Entrega final del proyecto integrador con memorias técnicas y artes finales adjuntos.',
              attachments: [
                { name: 'Proyecto_Final_Artes.pdf', size: '14.5 MB' },
                { name: 'Racional_Creativo.pdf', size: '1.8 MB' },
              ],
              grade: 9.5,
              minedLevel: 5,
              feedback: 'Desempeño destacado. Cumplió con creces todos los criterios del Nivel 5.',
              gradedAt: '2026-03-08T15:00:00Z',
              axisLevels: {
                tecnico: 5,
                emprendedor: 5,
                humanoSocial: 5,
                academico: 4,
              },
            }
          : undefined,
    });
  });

  return activities;
};

interface LMSState {
  courses: LMSCourse[];
  modules: LMSCourseModule[];
  activities: LMSActivity[];
  rubrics: Record<string, Rubric>;
  activeYear: TechnicalYear;
  academicCohortYear: string;
}

const DEFAULT_STATE: LMSState = {
  courses: [],
  modules: [],
  activities: [],
  rubrics: DEFAULT_BTV_RUBRICS,
  activeYear: '1',
  academicCohortYear: '2026',
};

class LMSService {
  private state: LMSState = { ...DEFAULT_STATE };
  private listeners: (() => void)[] = [];
  private unsubscribeFirestore?: Unsubscribe;
  private teachersCache: Map<string, string> = new Map(); // teacherId -> teacherName
  private currentUserRole: string | null = null;
  private buildingsCache: Map<string, { name: string; code: string }> = new Map(); // buildingId -> {name, code}
  private sectionsCache: Map<string, { buildingId?: string; gradeId?: string }> = new Map(); // sectionId -> {buildingId, gradeId}

  constructor() {
    this.init();
  }

  public setUserRole(role: string | null) {
    this.currentUserRole = role;
  }

  public canWriteLMS(): boolean {
    const user = auth?.currentUser;
    if (!user) return false;

    const email = (user.email || '').toLowerCase();
    if (
      email === 'admin@salesianosanjose.edu.sv' ||
      email === 'glacersv@gmail.com' ||
      email === 'jose.marquez@salesianosanjose.edu.sv' ||
      email === 'docente@salesianosanjose.edu.sv' ||
      email === 'coord.academica@salesianosanjose.edu.sv'
    ) {
      return true;
    }

    if (this.currentUserRole) {
      return (
        this.currentUserRole === 'admin' ||
        this.currentUserRole === 'docente' ||
        this.currentUserRole.startsWith('coordinacion')
      );
    }

    return false;
  }

  public async reseedAll(): Promise<void> {
    this.seedInitialData();
    if (this.canWriteLMS()) {
      await this.saveToFirestore();
    }
  }

  private async init() {
    // 1. Cargar desde localStorage inicialmente para arranque rápido e inmediato
    this.loadFromLocalStorage();

    // 2. Escuchar cambios de auth para conectar Firestore cuando el usuario esté autenticado
    if (auth) {
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          await this.syncWithFirestore();
        } else {
          this.currentUserRole = null;
          if (this.unsubscribeFirestore) {
            this.unsubscribeFirestore();
            this.unsubscribeFirestore = null;
          }
        }
        this.notify();
      });
    }

    // Si ya existe usuario autenticado
    if (auth?.currentUser) {
      await this.syncWithFirestore();
    }
  }

  private async syncWithFirestore() {
    const user = auth?.currentUser;
    if (!user) return;

    if (!this.currentUserRole) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          this.currentUserRole = userDoc.data()?.role || null;
        }
      } catch {
        // Silencioso en caso de no poder leer users
      }
    }

    try {
      const snap = await getDoc(LMS_DOC_REF);
      if (snap.exists()) {
        const data = snap.data() as LMSState;
        this.state = { ...DEFAULT_STATE, ...data };
      } else if (this.canWriteLMS()) {
        this.seedInitialData();
        await this.saveToFirestore();
      }
    } catch (e: any) {
      console.warn('LMS Firestore sync fallback to local storage:', e.message);
    }

    if (this.unsubscribeFirestore) {
      this.unsubscribeFirestore();
      this.unsubscribeFirestore = null;
    }

    this.unsubscribeFirestore = onSnapshot(
      LMS_DOC_REF,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as LMSState;
          const currentActiveYear = this.state.activeYear;
          this.state = { ...DEFAULT_STATE, ...data };
          this.state.activeYear = data.activeYear || currentActiveYear || '1';
          this.resolveTeacherNames();
          this.notify();
        }
      },
      (error) => {
        console.warn('LMS Firestore snapshot listener warning:', error.message);
      }
    );

      this.loadTeachersFromFirebase();
      this.loadBuildingsAndSections();
      this.syncCoursesFromFirestoreModules();
  }

  private async loadTeachersFromFirebase() {
    try {
      const snap = await getDocs(collection(db, TEACHERS_COLLECTION));
      this.teachersCache.clear();
      snap.docs.forEach((d) => {
        const data = d.data();
        const teacherName = data.name || data.displayName;
        if (teacherName) {
          this.teachersCache.set(d.id, teacherName);
          this.teachersCache.set(d.id.toLowerCase(), teacherName);
          this.teachersCache.set(teacherName.toLowerCase(), teacherName);
          const idParts = d.id.toLowerCase().split('-');
          if (idParts.length > 1) {
            this.teachersCache.set(idParts[idParts.length - 1], teacherName);
          }
          if (data.id) {
            this.teachersCache.set(String(data.id), teacherName);
            this.teachersCache.set(String(data.id).toLowerCase(), teacherName);
            const dataParts = String(data.id).toLowerCase().split('-');
            if (dataParts.length > 1) {
              this.teachersCache.set(dataParts[dataParts.length - 1], teacherName);
            }
          }
          if (data.email) {
            this.teachersCache.set(String(data.email).toLowerCase(), teacherName);
          }
        }
      });

      // También indexar usuarios docentes de la colección users
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'docente')));
        usersSnap.docs.forEach((d) => {
          const uData = d.data();
          const uName = uData.displayName || uData.name;
          if (uName) {
            this.teachersCache.set(d.id, uName);
            this.teachersCache.set(d.id.toLowerCase(), uName);
            this.teachersCache.set(uName.toLowerCase(), uName);
            if (uData.teacherId) {
              this.teachersCache.set(String(uData.teacherId), uName);
              this.teachersCache.set(String(uData.teacherId).toLowerCase(), uName);
            }
            if (uData.email) {
              this.teachersCache.set(String(uData.email).toLowerCase(), uName);
            }
          }
        });
      } catch (_) {}

      console.log('📚 Docentes cargados desde Firebase:', Object.fromEntries(this.teachersCache));
      // Resolver nombres en los cursos existentes y notificar cambio
      this.resolveTeacherNames();
      this.notify();
    } catch (e) {
      console.error('Error loading teachers from Firebase:', e);
    }
  }

  private async loadBuildingsAndSections() {
    try {
      const [buildingsSnap, sectionsSnap] = await Promise.all([
        getDocs(collection(db, 'buildings')),
        getDocs(collection(db, 'sections')),
      ]);

      this.buildingsCache.clear();
      buildingsSnap.docs.forEach((d) => {
        const data = d.data();
        this.buildingsCache.set(d.id, { name: data.name || data.code, code: data.code || d.id });
      });

      this.sectionsCache.clear();
      sectionsSnap.docs.forEach((d) => {
        const data = d.data();
        const secData = { buildingId: data.buildingId, gradeId: data.gradeId };
        this.sectionsCache.set(d.id, secData);
        // También indexar por gradeId para búsqueda directa
        if (data.gradeId) {
          this.sectionsCache.set(data.gradeId, secData);
        }
      });

      console.log('🏢 Edificios cargados:', Object.fromEntries(this.buildingsCache));
    } catch (e) {
      console.warn('No se pudieron cargar edificios/secciones:', e);
    }
  }

  /** Asegurar que los caches de edificios/secciones estén cargados */
  private buildingsLoaded = false;
  private async ensureBuildingsLoaded() {
    if (this.buildingsLoaded && this.buildingsCache.size > 0) return;
    await this.loadBuildingsAndSections();
    this.buildingsLoaded = true;
  }

  /** Mapea gradeId del currículum BTV ('10','11','12') al gradeId real de Firestore ('10t','11t','12t') */
  private mapBtvGradeId(gradeId?: string): string {
    if (!gradeId) return '11t';
    const map: Record<string, string> = { '10': '10t', '11': '11t', '12': '12t' };
    return map[gradeId] || gradeId;
  }

  /** Resuelve el salón/aula según el edificio asignado al grado/sección en el admin */
  public resolveClassroom(gradeId?: string, sectionId?: string, fallback?: string): string {
    if (fallback && fallback.trim() && fallback !== 'Sin salón asignado') return fallback;

    const mappedGradeId = this.mapBtvGradeId(gradeId);

    // 1. Buscar por sectionId directo
    if (sectionId) {
      const sec = this.sectionsCache.get(sectionId);
      if (sec?.buildingId) {
        const building = this.buildingsCache.get(sec.buildingId);
        if (building) return building.name;
      }
    }

    // 2. Buscar por gradeId mapeado (ej: '11t')
    const secByGrade = this.sectionsCache.get(mappedGradeId);
    if (secByGrade?.buildingId) {
      const building = this.buildingsCache.get(secByGrade.buildingId);
      if (building) return building.name;
    }

    // 3. Buscar iterando todas las secciones por gradeId
    for (const [, sec] of this.sectionsCache) {
      if (sec.gradeId === mappedGradeId && sec.buildingId) {
        const building = this.buildingsCache.get(sec.buildingId);
        if (building) return building.name;
      }
    }

    return fallback || 'Sin salón asignado';
  }

  /** Sincroniza los cursos locales con los datos reales de lms_modules en Firestore */
  private async syncCoursesFromFirestoreModules() {
    try {
      const snap = await getDocs(collection(db, LMS_MODULES_COLLECTION));
      if (snap.empty) return;

      const modulesByCode = new Map<string, any>();
      snap.docs.forEach((d) => {
        const data = d.data();
        if (data.code) modulesByCode.set(data.code, data);
        if (data.id) modulesByCode.set(data.id, data);
      });

      let changed = false;
      this.state.courses.forEach((c) => {
        const firestoreModule = modulesByCode.get(c.code) || modulesByCode.get(c.id);
        if (firestoreModule) {
          if (firestoreModule.teacherId && firestoreModule.teacherId !== c.teacherId) {
            c.teacherId = firestoreModule.teacherId;
            changed = true;
          }
          if (firestoreModule.teacherName && firestoreModule.teacherName !== c.teacherName) {
            c.teacherName = firestoreModule.teacherName;
            changed = true;
          }
          if (firestoreModule.classroom && firestoreModule.classroom !== c.classroom) {
            c.classroom = firestoreModule.classroom;
            changed = true;
          }
          if (firestoreModule.gradeId && firestoreModule.gradeId !== c.gradeId) {
            c.gradeId = firestoreModule.gradeId;
            changed = true;
          }
          if (firestoreModule.gradeName && firestoreModule.gradeName !== c.gradeName) {
            c.gradeName = firestoreModule.gradeName;
            changed = true;
          }
          if (firestoreModule.descriptor) {
            c.descriptor = firestoreModule.descriptor as any;
            changed = true;
          }
        }
      });

      if (changed) {
        this.resolveTeacherNames();
        this.saveToLocalStorage();
        this.notify();
      }
    } catch (e) {
      console.warn('No se pudieron sincronizar cursos con lms_modules:', e);
    }
  }

  private resolveTeacherNames() {
    this.state.courses.forEach((c) => {
      const resolved = this.resolveTeacherName(c.teacherId, c.teacherName);
      if (resolved) c.teacherName = resolved;
    });
  }

  /** Obtiene el nombre del docente desde Firebase (siempre fresco) */
  public getTeacherName(teacherId?: string, fallback?: string): string {
    if (teacherId) {
      const fromCache = this.teachersCache.get(teacherId);
      if (fromCache) return fromCache;
      const fromCacheLower = this.teachersCache.get(teacherId.toLowerCase());
      if (fromCacheLower) return fromCacheLower;
      // Fallback: buscar por última parte del ID
      const parts = teacherId.toLowerCase().split('-');
      const lastPart = parts[parts.length - 1];
      const fromPart = this.teachersCache.get(lastPart);
      if (fromPart) return fromPart;
    }
    // Si hay fallback (nombre directo que viene del curso/módulo)
    if (fallback && fallback.trim()) {
      const byName = this.teachersCache.get(fallback.toLowerCase().trim());
      return byName || fallback;
    }
    return 'Sin docente asignado';
  }

  public resolveTeacherName(teacherId?: string, fallback?: string): string | undefined {
    if (teacherId) {
      // 1. Buscar por ID exacto
      const byId = this.teachersCache.get(teacherId);
      if (byId) return byId;
      const byIdLower = this.teachersCache.get(teacherId.toLowerCase());
      if (byIdLower) return byIdLower;
      // 2. Buscar por última parte del ID (ej: 'doc-karla' -> 'karla')
      const parts = teacherId.toLowerCase().split('-');
      const lastPart = parts[parts.length - 1];
      const byPart = this.teachersCache.get(lastPart);
      if (byPart) return byPart;
    }
    // 3. Buscar por nombre exacto en el cache
    if (fallback && fallback.trim()) {
      const byName = this.teachersCache.get(fallback.toLowerCase().trim());
      if (byName) return byName;
      return fallback;
    }
    return fallback;
  }

  private loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedYear = localStorage.getItem(ACTIVE_YEAR_KEY);
    if (savedYear) {
      this.state.academicCohortYear = savedYear;
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = { ...DEFAULT_STATE, ...parsed };
      } catch (e) {
        console.error('Error loading LMS state from localStorage', e);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }
  }

  private seedInitialData() {
    // 1. Inicializar los cursos con sus descriptores completos
    this.state.courses = BTV_GRAPHIC_DESIGN_COURSES.map((c) => {
      const descriptor = getModuleDescriptorData(c.code);
      return {
        ...c,
        descriptor,
      };
    });

    // 2. Construir los módulos de las 6 etapas para cada curso
    this.state.modules = [];
    this.state.courses.forEach((c) => {
      const courseMods = buildActionStageModules(c.id);
      this.state.modules.push(...courseMods);
    });

    // 3. Construir actividades iniciales
    this.state.activities = buildInitialActivities(this.state.courses);

    // 4. Rúbricas oficiales MINED
    this.state.rubrics = DEFAULT_BTV_RUBRICS;
    this.state.activeYear = '1';

    this.saveToLocalStorage();
  }

  private async saveToFirestore() {
    if (!this.canWriteLMS()) {
      return;
    }
    try {
      const sanitized = JSON.parse(JSON.stringify(this.state));
      await setDoc(LMS_DOC_REF, sanitized);

      // Sincronizar módulos/cursos a lms_modules para que el alumno y docente los vean
      const modulesRefs = this.state.courses.map((c) => {
        const ref = doc(db, LMS_MODULES_COLLECTION, c.id);
        const resolvedTeacherName = this.resolveTeacherName(c.teacherId, c.teacherName);
        return setDoc(ref, {
          id: c.id,
          name: c.name,
          code: c.code,
          subjectId: c.subjectId || c.code.toLowerCase().replace(/\s+/g, '-'),
          teacherId: c.teacherId || 't1786176116597',
          teacherName: resolvedTeacherName || c.teacherName || 'Giovanni Marquez',
          gradeId: c.gradeId || '10',
          gradeName: c.gradeName || '1° Año Técnico',
          technicalYear: c.technicalYear || '1',
          hours: c.hours || 72,
          weeks: c.weeks || 4,
          status: c.status || 'active',
          description: c.description || '',
          icon: c.icon || 'BookOpen',
          color: c.color || '#0D71B9',
          affineArea: c.affineArea || '',
          schedule: c.schedule || '',
          classroom: c.classroom || '',
          sectionId: c.sectionId || '',
          sectionName: c.sectionName || '',
          progress: c.progress ?? 0,
          averageGrade: c.averageGrade ?? 0,
          minedLevel: c.minedLevel ?? 4,
          unitsCount: (c as any).unitsCount ?? 6,
          activitiesCount: (c as any).activitiesCount ?? 3,
          descriptor: c.descriptor || getModuleDescriptorData(c.code),
        });
      });

      await Promise.all(modulesRefs);
    } catch (e: any) {
      console.warn('LMS state could not be synced to Firestore:', e?.message || e);
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(this.state)
      );
      localStorage.setItem(ACTIVE_YEAR_KEY, this.state.academicCohortYear);
    } catch (e) {
      console.error('Failed to save LMS state to localStorage', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ==========================================
  // YEAR & COHORT MANAGEMENT
  // ==========================================
  public getActiveTechnicalYear(): TechnicalYear {
    return this.state.activeYear;
  }

  public setActiveTechnicalYear(year: TechnicalYear) {
    this.state.activeYear = year;
    this.saveToLocalStorage();
    // No sincronizar a Firestore: el año activo es preferencia individual del usuario
  }

  public getAcademicCohortYear(): string {
    return this.state.academicCohortYear;
  }

  public setAcademicCohortYear(year: string) {
    this.state.academicCohortYear = year;
    this.saveToLocalStorage();
    this.saveToFirestore();
  }

  // ==========================================
  // COURSES / MÓDULOS TÉCNICOS
  // ==========================================
  public getCourses(yearFilter?: TechnicalYear): LMSCourse[] {
    const courses = yearFilter
      ? this.state.courses.filter((c) => c.technicalYear === yearFilter)
      : this.state.courses;

    // Siempre resolver docente + completar descriptor (proyecto, etapas) desde malla oficial
    return courses.map((c) => {
      const resolved = this.resolveTeacherName(c.teacherId, c.teacherName);
      const course = (resolved && resolved !== c.teacherName) ? { ...c, teacherName: resolved } : { ...c };

      // Completar descriptor si tiene proyecto genérico o incompleto
      if (course.descriptor) {
        const d = course.descriptor as any;
        if (!d.currentProject || !d.currentProject.title || d.currentProject.title === 'Proyecto de Módulo') {
          const official = getModuleDescriptorData(course.code);
          if (official.currentProject) d.currentProject = official.currentProject;
        }
        const hasActionStages = d.actionStages && typeof d.actionStages === 'object' && Object.keys(d.actionStages).length >= 6;
        if (!hasActionStages) {
          const official = getModuleDescriptorData(course.code);
          d.actionStages = official.actionStages;
        }
      } else {
        course.descriptor = getModuleDescriptorData(course.code);
      }

      return course;
    });
  }

  public getCourseById(courseId: string): LMSCourse | undefined {
    const c = this.state.courses.find((x) => x.id === courseId || x.code === courseId);
    if (c) {
      if (!c.descriptor) {
        c.descriptor = getModuleDescriptorData(c.code);
      } else {
        const official = getModuleDescriptorData(c.code);
        const hasActionStages = c.descriptor.actionStages && typeof c.descriptor.actionStages === 'object' && Object.keys(c.descriptor.actionStages).length >= 6;
        if (!hasActionStages) {
          c.descriptor.actionStages = official.actionStages;
        }
        if (!c.descriptor.currentProject || !c.descriptor.currentProject.title) {
          c.descriptor.currentProject = official.currentProject;
        }
      }
    }
    return c;
  }

  public getCourseByCode(code: string): LMSCourse | undefined {
    return this.state.courses.find((x) => x.code.toLowerCase() === code.toLowerCase());
  }

  // ==========================================
  // GESTIÓN Y GENERADOR DE PROYECTOS ANUALES
  // ==========================================
  public generateAndSetAnnualProject(
    courseId: string,
    academicYear: string,
    customTopic?: string
  ): ProjectBrief {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Curso no encontrado');

    const newProject = GENERATE_ANNUAL_PROJECT(course.code, academicYear, customTopic);

    if (!course.descriptor) {
      course.descriptor = getModuleDescriptorData(course.code);
    }

    // Archivar proyecto actual si existía
    if (course.descriptor.currentProject) {
      course.descriptor.availableProjects = course.descriptor.availableProjects || [];
      course.descriptor.availableProjects.push({
        ...course.descriptor.currentProject,
        status: 'archived',
      });
    }

    course.descriptor.currentProject = newProject;
    this.saveToLocalStorage();
    this.saveToFirestore();
    return newProject;
  }

  public updateCourseProject(courseId: string, projectData: Partial<ProjectBrief>): ProjectBrief {
    const course = this.getCourseById(courseId);
    if (!course) throw new Error('Curso no encontrado');
    if (!course.descriptor) {
      course.descriptor = getModuleDescriptorData(course.code);
    }

    course.descriptor.currentProject = {
      ...course.descriptor.currentProject,
      ...projectData,
    };

    this.saveToLocalStorage();
    this.saveToFirestore();
    return course.descriptor.currentProject;
  }

  // Genera proyectos anuales para todos los módulos de un año técnico
  public batchGenerateProjectsForYear(academicYear: string, technicalYear?: TechnicalYear) {
    const targetCourses = technicalYear
      ? this.state.courses.filter((c) => c.technicalYear === technicalYear)
      : this.state.courses;

    targetCourses.forEach((c) => {
      this.generateAndSetAnnualProject(c.id, academicYear);
    });

    this.state.academicCohortYear = academicYear;
    this.saveToLocalStorage();
    this.saveToFirestore();
  }

  // ==========================================
  // MODULES (6 ETAPAS DE ACCIÓN COMPLETA)
  // ==========================================
  public getModulesByCourse(courseId: string): LMSCourseModule[] {
    return this.state.modules
      .filter((m) => m.courseId === courseId)
      .sort((a, b) => a.order - b.order);
  }

  public toggleModuleLock(moduleId: string): LMSCourseModule | undefined {
    const mod = this.state.modules.find((m) => m.id === moduleId);
    if (mod) {
      mod.locked = !mod.locked;
      this.saveToLocalStorage();
      this.saveToFirestore();
    }
    return mod;
  }

  // ==========================================
  // ACTIVITIES & SUBMISSIONS
  // ==========================================
  public getActivities(courseId?: string, yearFilter?: TechnicalYear): LMSActivity[] {
    let list = this.state.activities;
    if (courseId) {
      list = list.filter((a) => a.courseId === courseId);
    } else if (yearFilter) {
      const yearCourseIds = new Set(this.state.courses.filter((c) => c.technicalYear === yearFilter).map((c) => c.id));
      list = list.filter((a) => yearCourseIds.has(a.courseId));
    }
    return list;
  }

  public getActivityById(activityId: string): LMSActivity | undefined {
    return this.state.activities.find((a) => a.id === activityId);
  }

  public submitActivity(
    activityId: string,
    submissionData: {
      content: string;
      attachments: { name: string; size: string; url?: string }[];
      criterionScores?: Record<string, number>;
      selfEvaluation?: {
        learned: string;
        difficulties: string;
        reflection: string;
      };
    }
  ): LMSSubmission {
    const actIdx = this.state.activities.findIndex((a) => a.id === activityId);
    if (actIdx === -1) throw new Error('Actividad no encontrada');

    const currentUser = auth?.currentUser;
    const submission: LMSSubmission = {
      id: `sub-${Date.now()}`,
      activityId,
      studentId: currentUser?.uid || 'student-user',
      studentName: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Estudiante Salesiano',
      submittedAt: new Date().toISOString(),
      content: submissionData.content,
      attachments: submissionData.attachments,
      criterionScores: submissionData.criterionScores,
      selfEvaluation: submissionData.selfEvaluation,
    };

    this.state.activities[actIdx] = {
      ...this.state.activities[actIdx],
      status: 'entregada',
      submission,
    };

    // Recalcular progreso
    this.recalculateCourseProgress(this.state.activities[actIdx].courseId);
    this.saveToLocalStorage();

    // Guardar entrega individual en colección lms_submissions en Firestore
    if (currentUser) {
      setDoc(doc(db, 'lms_submissions', submission.id), {
        ...submission,
        courseId: this.state.activities[actIdx].courseId,
        activityTitle: this.state.activities[actIdx].title,
        studentEmail: currentUser.email || '',
        createdAt: new Date().toISOString(),
      }).catch((err) => {
        console.warn('No se pudo guardar la entrega individual en Firestore:', err);
      });
    }

    if (this.canWriteLMS()) {
      this.saveToFirestore();
    }
    return submission;
  }

  // ==========================================
  // ADMIN CRUD METHODS FOR COURSES, MODULES, ACTIVITIES
  // ==========================================
  public addCourse(courseData: Partial<LMSCourse> & { name: string; code: string }): LMSCourse {
    const newCourse: LMSCourse = {
      id: `course-${Date.now()}`,
      name: courseData.name,
      code: courseData.code,
      description: courseData.description || '',
      teacherId: courseData.teacherId || 't1786176116597',
      teacherName: courseData.teacherName || 'Giovanni Marquez',
      gradeId: courseData.gradeId || '10',
      gradeName: courseData.gradeName || '1° Año Técnico',
      sectionId: courseData.sectionId || 'A',
      sectionName: courseData.sectionName || 'Sección A',
      subjectId: courseData.subjectId || 'diseno-grafico',
      icon: courseData.icon || 'BookOpen',
      color: courseData.color || '#0D71B9',
      status: courseData.status || 'active',
      schedule: courseData.schedule || 'Lunes a Viernes',
      classroom: courseData.classroom || 'Taller de Diseño',
      progress: 0,
      averageGrade: undefined,
      minedLevel: undefined,
      technicalYear: courseData.technicalYear || '1',
      hours: courseData.hours || 72,
      weeks: courseData.weeks || 4,
      affineArea: courseData.affineArea || 'Diseño y diagramación',
      unitsCount: 0,
      activitiesCount: 0,
      descriptor: courseData.descriptor || getModuleDescriptorData(courseData.code),
    };

    this.state.courses.push(newCourse);
    this.saveToLocalStorage();
    this.saveToFirestore();
    return newCourse;
  }

  public deleteCourse(courseId: string): boolean {
    const initialLen = this.state.courses.length;
    this.state.courses = this.state.courses.filter((c) => c.id !== courseId);
    this.state.modules = this.state.modules.filter((m) => m.courseId !== courseId);
    this.state.activities = this.state.activities.filter((a) => a.courseId !== courseId);
    if (this.state.courses.length !== initialLen) {
      this.saveToLocalStorage();
      this.saveToFirestore();
      return true;
    }
    return false;
  }

  public addModule(moduleData: {
    courseId: string;
    title: string;
    description: string;
    order?: number;
    hours?: number;
    stageKey?: ActionStageKey;
  }): LMSCourseModule {
    const existing = this.state.modules.filter((m) => m.courseId === moduleData.courseId);
    const newMod: LMSCourseModule = {
      id: `mod-${Date.now()}`,
      courseId: moduleData.courseId,
      title: moduleData.title,
      description: moduleData.description,
      order: moduleData.order ?? existing.length + 1,
      locked: false,
      hours: moduleData.hours || 18,
      stageKey: moduleData.stageKey || 'ejecutar',
      completed: false,
      resourcesCount: 3,
      activitiesCount: 1,
    };
    this.state.modules.push(newMod);

    const c = this.getCourseById(moduleData.courseId);
    if (c) {
      c.unitsCount = this.state.modules.filter((m) => m.courseId === moduleData.courseId).length;
    }

    this.saveToLocalStorage();
    this.saveToFirestore();
    return newMod;
  }

  public addActivity(activityData: Partial<LMSActivity> & { courseId: string; title: string }): LMSActivity {
    const c = this.getCourseById(activityData.courseId);
    const newAct: LMSActivity = {
      id: `act-${Date.now()}`,
      courseId: activityData.courseId,
      courseCode: c?.code || '',
      courseName: c?.name || 'Módulo Técnico',
      courseColor: c?.color || '#0D71B9',
      moduleId: activityData.moduleId || 'mod-default',
      moduleTitle: activityData.moduleTitle || 'Etapa del Proyecto',
      stageKey: activityData.stageKey || 'ejecutar',
      title: activityData.title,
      type: activityData.type || 'delivery',
      rubricId: activityData.rubricId || 'rubric-btv-standard',
      maxScore: activityData.maxScore || 10,
      dueDate: activityData.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      instructions: activityData.instructions || 'Siga las especificaciones técnicas del brief.',
      status: 'pendiente',
    };
    this.state.activities.push(newAct);

    if (c) {
      c.activitiesCount = this.state.activities.filter((a) => a.courseId === activityData.courseId).length;
    }

    this.saveToLocalStorage();
    this.saveToFirestore();
    return newAct;
  }

  // Basic numeric grade for compatibility
  public gradeActivity(activityId: string, grade: number, feedback?: string): LMSActivity | undefined {
    const act = this.state.activities.find((a) => a.id === activityId);
    if (!act) return undefined;

    const level: MinedLevel =
      grade >= 9.6 ? 5 :
      grade >= 8.5 ? 4 :
      grade >= 7.0 ? 3 :
      grade >= 5.0 ? 2 : 1;

    if (!act.submission) {
      act.submission = {
        id: `sub-${Date.now()}`,
        activityId,
        studentId: 'student-glacer',
        studentName: 'Estudiante Salesiano',
        submittedAt: new Date().toISOString(),
        content: 'Entrega en aula',
        attachments: [],
      };
    }

    act.submission.grade = grade;
    act.submission.minedLevel = level;
    act.submission.feedback = feedback;
    act.submission.gradedAt = new Date().toISOString();
    act.status = 'calificada';

    this.recalculateCourseProgress(act.courseId);
    this.saveToLocalStorage();
    this.saveToFirestore();
    return act;
  }

  // CALIFICACIÓN DOCENTE CON ESCALA MINED (1-5) Y LOS 4 EJES
  public gradeWithMinedScale(
    activityId: string,
    params: {
      scoreTecnico?: number;
      scoreEmprendedor?: number;
      scoreHumanoSocial?: number;
      scoreAcademicoAplicado?: number;
      axisLevels?: {
        tecnico: MinedLevel;
        emprendedor: MinedLevel;
        humanoSocial: MinedLevel;
        academico: MinedLevel;
      };
    },
    feedbackInput?: string
  ): LMSActivity | undefined {
    const act = this.state.activities.find((a) => a.id === activityId);
    if (!act) return undefined;

    let calculatedGrade = 8.5;
    let finalMinedLevel: MinedLevel = 4;

    if (params.scoreTecnico !== undefined && params.scoreEmprendedor !== undefined) {
      const st = params.scoreTecnico ?? 8.5;
      const se = params.scoreEmprendedor ?? 8.5;
      const sh = params.scoreHumanoSocial ?? 8.5;
      const sa = params.scoreAcademicoAplicado ?? 8.5;

      calculatedGrade = +(st * 0.35 + se * 0.25 + sh * 0.20 + sa * 0.20).toFixed(1);
      finalMinedLevel =
        calculatedGrade >= 9.6 ? 5 :
        calculatedGrade >= 8.5 ? 4 :
        calculatedGrade >= 7.0 ? 3 :
        calculatedGrade >= 5.0 ? 2 : 1;
    } else if (params.axisLevels) {
      const weightedLevel =
        params.axisLevels.tecnico * 0.35 +
        params.axisLevels.emprendedor * 0.25 +
        params.axisLevels.humanoSocial * 0.2 +
        params.axisLevels.academico * 0.2;

      finalMinedLevel = Math.max(1, Math.min(5, Math.round(weightedLevel))) as MinedLevel;
      const levelToGradeMap: Record<MinedLevel, number> = {
        1: 3.5,
        2: 5.5,
        3: 6.5,
        4: 8.5,
        5: 10.0,
      };
      calculatedGrade = parseFloat((levelToGradeMap[finalMinedLevel] || 7.0).toFixed(1));
    }

    if (!act.submission) {
      act.submission = {
        id: `sub-${Date.now()}`,
        activityId,
        studentId: 'student-glacer',
        studentName: 'Estudiante Salesiano',
        submittedAt: new Date().toISOString(),
        content: 'Entrega registrada en aula',
        attachments: [],
      };
    }

    act.submission.grade = calculatedGrade;
    act.submission.minedLevel = finalMinedLevel;
    if (params.axisLevels) {
      act.submission.axisLevels = params.axisLevels;
    }
    if (params.scoreTecnico !== undefined) {
      act.submission.axesScores = {
        scoreTecnico: params.scoreTecnico,
        scoreEmprendedor: params.scoreEmprendedor || 8,
        scoreHumanoSocial: params.scoreHumanoSocial || 8,
        scoreAcademicoAplicado: params.scoreAcademicoAplicado || 8,
      };
    }
    act.submission.feedback = feedbackInput || 'Evaluación registrada con rúbrica MINED.';
    act.submission.gradedAt = new Date().toISOString();
    act.status = 'calificada';

    this.recalculateCourseProgress(act.courseId);
    this.saveToLocalStorage();
    this.saveToFirestore();
    return act;
  }

  private recalculateCourseProgress(courseId: string) {
    const courseActs = this.state.activities.filter((a) => a.courseId === courseId);
    if (courseActs.length === 0) return;

    const completed = courseActs.filter(
      (a) => a.status === 'entregada' || a.status === 'calificada'
    ).length;

    const course = this.getCourseById(courseId);
    if (course) {
      course.progress = Math.round((completed / courseActs.length) * 100);

      const graded = courseActs.filter(
        (a) => a.status === 'calificada' && a.submission?.grade !== undefined
      );
      if (graded.length > 0) {
        const total = graded.reduce((sum, a) => sum + (a.submission?.grade || 0), 0);
        course.averageGrade = parseFloat((total / graded.length).toFixed(1));

        // Calcular Mined Level para el curso
        const totalLevels = graded.reduce((sum, a) => sum + (a.submission?.minedLevel || 4), 0);
        course.minedLevel = Math.max(1, Math.min(5, Math.round(totalLevels / graded.length))) as MinedLevel;
      }
    }
  }

  // ==========================================
  // SABERES PREVIOS (ACTUALIZACIÓN ESTUDIANTE)
  // ==========================================
  public updateSaberPrevioAppreciation(
    courseId: string,
    saberId: string,
    appreciation: 'MUCHO' | 'POCO' | 'NADA'
  ) {
    const course = this.getCourseById(courseId);
    if (!course || !course.descriptor) return;

    const item = course.descriptor.saberesPrevios.find((s) => s.id === saberId);
    if (item) {
      item.appreciation = appreciation;
      this.saveToLocalStorage();
      this.saveToFirestore();
    }
  }

  // ==========================================
  // RESÚMENES Y ESTADÍSTICAS GLOBALES
  // ==========================================
  public getStudentSummary(yearFilter?: TechnicalYear): LMSStudentSummary {
    const currentYear = yearFilter || this.state.activeYear;
    const yearCourses = this.state.courses.filter((c) => c.technicalYear === currentYear);
    const yearCourseIds = new Set(yearCourses.map((c) => c.id));
    const yearActs = this.state.activities.filter((a) => yearCourseIds.has(a.courseId));

    const pending = yearActs.filter((a) => a.status === 'pendiente').length;
    const completed = yearActs.filter(
      (a) => a.status === 'entregada' || a.status === 'calificada'
    ).length;

    const gradedActs = yearActs.filter(
      (a) => a.status === 'calificada' && a.submission?.grade !== undefined
    );

    const avg =
      gradedActs.length > 0
        ? parseFloat(
            (
              gradedActs.reduce((acc, a) => acc + (a.submission?.grade || 0), 0) /
              gradedActs.length
            ).toFixed(1)
          )
        : 8.8;

    const totalLevels = gradedActs.reduce((acc, a) => acc + (a.submission?.minedLevel || 4), 0);
    const overallMined = gradedActs.length > 0 ? (Math.round(totalLevels / gradedActs.length) as MinedLevel) : 4;

    const totalHours = currentYear === '3' ? 1200 : 720;
    const progressPct = yearActs.length > 0 ? Math.round((completed / yearActs.length) * 100) : 0;

    return {
      enrolledCoursesCount: yearCourses.length,
      pendingActivitiesCount: pending,
      completedActivitiesCount: completed,
      overallAverage: avg,
      overallMinedLevel: overallMined,
      progressPercentage: progressPct,
      totalTechnicalHours: totalHours,
      currentYear,
    };
  }

  public getRubricById(rubricId: string): Rubric | undefined {
    return this.state.rubrics[rubricId] || DEFAULT_BTV_RUBRICS['rubric-btv-standard'];
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEY);
    this.seedInitialData();
    this.saveToFirestore();
  }

  // ==========================================
  // LMS MODULES (ADMIN STRUCTURE)
  // ==========================================
  public async createModule(data: Partial<LMSModule> & { name: string; code: string; subjectId: string }): Promise<LMSModule> {
    const module: LMSModule = {
      id: `lms-mod-${Date.now()}`,
      name: data.name,
      code: data.code,
      subjectId: data.subjectId,
      teacherId: data.teacherId || 't1786176116597',
      teacherName: data.teacherName || 'Giovanni Marquez',
      gradeId: data.gradeId || '12',
      gradeName: data.gradeName || '12° Grado',
      technicalYear: data.technicalYear || '1',
      hours: data.hours || 72,
      weeks: data.weeks || 4,
      status: data.status || 'active',
      descriptor: data.descriptor || {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, LMS_MODULES_COLLECTION, module.id);
    await setDoc(ref, module);
    this.saveToLocalStorage();
    return module;
  }

  public async getModulesByTeacher(teacherId: string): Promise<LMSModule[]> {
    const q = query(collection(db, LMS_MODULES_COLLECTION), where('teacherId', '==', teacherId));
    const snap = await getDocs(q);
    return snap.docs.map(d => this.enrichModule({ id: d.id, ...d.data() } as LMSModule));
  }

  /** Enriquece un módulo cargado desde Firestore con datos resueltos (docente, salón, descriptor completo) */
  private enrichModule(module: LMSModule): LMSModule {
    // Resolver nombre de docente SOLO si el teacherId existe en el cache
    // Si no, conservar el teacherName que ya viene del módulo en Firestore
    if (module.teacherId) {
      const fromCache = this.teachersCache.get(module.teacherId)
        || this.teachersCache.get(module.teacherId.toLowerCase())
        || this.teachersCache.get((module.teacherId.toLowerCase().split('-').pop() || ''));
      if (fromCache) {
        module.teacherName = fromCache;
      }
    }

    // Resolver salón: SIEMPRE intentar desde edificio del admin, preservar el de Firestore si no hay match
    const resolvedClassroom = this.resolveClassroom(module.gradeId, module.sectionId, '');
    if (resolvedClassroom && resolvedClassroom !== 'Sin salón asignado') {
      module.classroom = resolvedClassroom;
    }

    // Siempre completar el descriptor desde la malla oficial
    const officialDescriptor = getModuleDescriptorData(module.code);
    if (!module.descriptor || Object.keys(module.descriptor).length === 0) {
      module.descriptor = officialDescriptor;
    } else {
      const d = module.descriptor as any;
      const o = officialDescriptor as any;
      for (const key of Object.keys(o)) {
        if (d[key] === undefined || d[key] === null || d[key] === '' || d[key] === 0) {
          d[key] = o[key];
        }
      }
      const hasActionStages = d.actionStages && typeof d.actionStages === 'object' && Object.keys(d.actionStages).length >= 6;
      if (!hasActionStages) {
        d.actionStages = o.actionStages;
      }
      if (!d.currentProject || !d.currentProject.title) {
        d.currentProject = o.currentProject;
      }
      if (!d.saberesPrevios || d.saberesPrevios.length === 0) {
        d.saberesPrevios = o.saberesPrevios;
      }
      if (!d.saberesNecesarios || d.saberesNecesarios.length === 0) {
        d.saberesNecesarios = o.saberesNecesarios;
      }
    }

    return module;
  }

  public async getAllModules(): Promise<LMSModule[]> {
    // Asegurar que edificios y secciones estén cargados para resolver salones
    await this.ensureBuildingsLoaded();

    const snap = await getDocs(collection(db, LMS_MODULES_COLLECTION));
    let modules = snap.docs.map(d => this.enrichModule({ id: d.id, ...d.data() } as LMSModule));

    // Si lms_modules está vacío, sembrar desde BTV_GRAPHIC_DESIGN_COURSES
    if (modules.length === 0) {
      console.log('📦 lms_modules vacío, sembrando desde BTV_GRAPHIC_DESIGN_COURSES...');
      modules = BTV_GRAPHIC_DESIGN_COURSES.map((c) => {
        const module: LMSModule = {
          id: `lms-mod-${c.id}`,
          name: c.name,
          code: c.code,
          subjectId: c.subjectId,
          teacherId: c.teacherId,
          teacherName: c.teacherName,
          gradeId: c.gradeId || '11t',
          gradeName: c.gradeName || '1° Año Bachillerato Técnico',
          sectionId: c.sectionId || '11ta',
          sectionName: c.sectionName || 'A',
          technicalYear: c.technicalYear,
          hours: c.hours,
          weeks: c.weeks,
          status: c.status === 'active' ? 'active' : 'inactive',
          description: c.description || '',
          icon: c.icon,
          color: c.color,
          affineArea: c.affineArea || '',
          schedule: c.schedule || '',
          classroom: c.classroom || '',
          progress: c.progress ?? 0,
          averageGrade: c.averageGrade,
          minedLevel: c.minedLevel,
          descriptor: c.descriptor || getModuleDescriptorData(c.code),
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        return this.enrichModule(module);
      });

      // Guardar en Firestore para que下次 no haga fallback
      try {
        const batch = modules.map((m) => {
          const ref = doc(db, LMS_MODULES_COLLECTION, m.id);
          return setDoc(ref, m);
        });
        await Promise.all(batch);
        console.log('✅ lms_modules sembrado con', modules.length, 'módulos');
      } catch (e) {
        console.warn('No se pudo sembrar lms_modules:', e);
      }
    }

    return modules;
  }

  public async getModuleById(moduleId: string): Promise<LMSModule | null> {
    // Asegurar que edificios y secciones estén cargados para resolver salones
    await this.ensureBuildingsLoaded();

    // 1. Try Firestore first (both direct ID and lms-mod- prefix)
    try {
      let ref = doc(db, LMS_MODULES_COLLECTION, moduleId);
      let snap = await getDoc(ref);
      if (!snap.exists() && !moduleId.startsWith('lms-mod-')) {
        ref = doc(db, LMS_MODULES_COLLECTION, `lms-mod-${moduleId}`);
        snap = await getDoc(ref);
      }

      if (snap.exists()) {
        const module = { id: snap.id, ...snap.data() } as LMSModule;
        // Buscar datos oficiales de respaldo para asegurar campos esenciales
        const fallbackCourse = BTV_GRAPHIC_DESIGN_COURSES.find(
          (c) => c.code === module.code || c.id === moduleId || `lms-mod-${c.id}` === snap.id
        );
        if (fallbackCourse) {
          if (!module.teacherName || module.teacherName === 'Sin docente asignado') module.teacherName = fallbackCourse.teacherName;
          if (!module.teacherId) module.teacherId = fallbackCourse.teacherId;
          if (!module.schedule) module.schedule = fallbackCourse.schedule;
          if (!module.color) module.color = fallbackCourse.color;
          if (!module.gradeName) module.gradeName = fallbackCourse.gradeName;
          if (!module.gradeId) module.gradeId = fallbackCourse.gradeId;
        }
        return this.enrichModule(module);
      }
    } catch (e) {
      console.error('Error loading module from Firestore:', e);
    }

    // 2. Fallback: search local state (courses seeded from btvCurriculumData)
    const course = this.state.courses.find((c) => c.id === moduleId || c.code === moduleId);
    if (course) {
      const module: LMSModule = {
        id: course.id,
        name: course.name,
        code: course.code,
        subjectId: course.subjectId || course.code.toLowerCase().replace(/\s+/g, '-'),
        teacherId: course.teacherId,
        teacherName: course.teacherName,
        gradeId: course.gradeId,
        gradeName: course.gradeName,
        technicalYear: course.technicalYear,
        hours: course.hours,
        weeks: course.weeks,
        status: course.status === 'active' ? 'active' : 'inactive',
        description: course.description,
        icon: course.icon,
        color: course.color,
        affineArea: course.affineArea,
        schedule: course.schedule,
        classroom: course.classroom,
        sectionId: course.sectionId,
        sectionName: course.sectionName,
        progress: course.progress,
        averageGrade: course.averageGrade,
        minedLevel: course.minedLevel,
        descriptor: course.descriptor as any || getModuleDescriptorData(course.code),
        createdAt: course.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as LMSModule;
      return this.enrichModule(module);
    }

    return null;
  }

  public async updateModule(moduleId: string, data: Partial<LMSModule>): Promise<void> {
    const ref = doc(db, LMS_MODULES_COLLECTION, moduleId);
    await updateDoc(ref, { ...data, updatedAt: new Date().toISOString() });
    
    // Sincronizar en memoria con state.courses
    const idx = this.state.courses.findIndex((c) => c.id === moduleId || c.code === moduleId);
    if (idx !== -1) {
      this.state.courses[idx] = {
        ...this.state.courses[idx],
        ...(data as any),
        updatedAt: new Date().toISOString(),
      };
    }
    this.saveToLocalStorage();
    this.notify();
  }

  // ==========================================
  // MODULE CONTENT (DOCENTE)
  // ==========================================
  public async getModuleContent(moduleId: string): Promise<LMSModuleContent | null> {
    const ref = doc(db, LMS_MODULE_CONTENT_COLLECTION, moduleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as Omit<LMSModuleContent, 'moduleId'>;
    return { moduleId, ...data };
  }

  public async saveModuleContent(moduleId: string, content: Partial<LMSModuleContent>, updatedBy: string): Promise<LMSModuleContent> {
    const fullContent: LMSModuleContent = {
      moduleId,
      theory: content.theory || [],
      examples: content.examples || [],
      exercises: content.exercises || [],
      updatedBy,
      updatedAt: new Date().toISOString(),
    };

    const ref = doc(db, LMS_MODULE_CONTENT_COLLECTION, moduleId);
    await setDoc(ref, fullContent);
    return fullContent;
  }

  // ==========================================
  // MODULE CALENDAR (ADMIN)
  // ==========================================
  public async getCalendarForModule(moduleId: string): Promise<LMSCalendarEvent[]> {
    const q = query(collection(db, LMS_CALENDAR_COLLECTION), where('moduleId', '==', moduleId), orderBy('date', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSCalendarEvent));
  }

  public async addCalendarEvent(event: Omit<LMSCalendarEvent, 'id' | 'createdAt'>): Promise<LMSCalendarEvent> {
    const fullEvent: LMSCalendarEvent = {
      ...event,
      id: `cal-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const ref = doc(db, LMS_CALENDAR_COLLECTION, fullEvent.id);
    await setDoc(ref, fullEvent);
    return fullEvent;
  }
}

export const lmsService = new LMSService();
