import React, { useState, useEffect } from 'react';
import {
  Compass,
  Calendar,
  Layers,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users,
  Search,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  Heart,
  BookOpen,
  UserCheck,
  Target,
  FileSpreadsheet,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Plus,
  Trash2,
  MessageSquare,
  Award,
  ShieldCheck,
  User,
  LayoutGrid,
  Maximize2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  AccompanimentArea,
  AccompanimentPeriod,
  AccompanimentRecord,
  AccompanimentGradeScale,
  AccompanimentStudentScore,
  StudentSubjectConductNote,
  Student,
  Grade,
  Section,
  BehaviorIndicator,
  StudentConductIncident,
} from '../../types';
import {
  getAllAccompanimentAreas,
  getAccompanimentRecord,
  saveAccompanimentRecord,
  seedAccompanimentDefaultAreas,
  seedAccompanimentScoresFromExcel,
  getAllGrades,
  getAllSections,
  getAllStudents,
  getTeacher,
  getTeacherByEmail,
  getAllBehaviorIndicators,
  addStudentConductIncident,
  getSectionConductIncidents,
  deleteStudentConductIncident,
} from '../../lib/firestore';

export default function AccompanimentModule() {
  const { userProfile } = useAuth();

  // Estados de datos base
  const [areas, setAreas] = useState<AccompanimentArea[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Filtros seleccionados
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<AccompanimentPeriod>('PI');
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Tab activo de dimensión: id del área o 'all'
  const [activeAreaTab, setActiveAreaTab] = useState<string>('');

  // Modo de visualización: 'card' (enfoque individual 360°) o 'table' (matriz general)
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState<number>(0);

  // Matriz de evaluación
  const [evaluations, setEvaluations] = useState<Record<string, AccompanimentStudentScore>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [seedingExcel, setSeedingExcel] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal para agregar mérito / positivo / negativo por materia con catálogo de códigos
  const [showAddConductModal, setShowAddConductModal] = useState<boolean>(false);
  const [behaviorIndicators, setBehaviorIndicators] = useState<BehaviorIndicator[]>([]);
  const [selectedIndicatorCode, setSelectedIndicatorCode] = useState<string>('');
  const [newConductSubject, setNewConductSubject] = useState<string>('');
  const [newConductType, setNewConductType] = useState<'positivo' | 'negativo' | 'observacion'>('positivo');
  const [newConductValue, setNewConductValue] = useState<number>(0);
  const [newConductDesc, setNewConductDesc] = useState<string>('');
  const [conductIncidents, setConductIncidents] = useState<StudentConductIncident[]>([]);


  // Iconos e info visual para las dimensiones salesianas
  const getAreaMeta = (areaId: string) => {
    switch (areaId) {
      case 'evangelizacion-catequesis':
        return {
          icon: Heart,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          activeTabClass: 'bg-rose-600 text-white shadow-md shadow-rose-600/25',
          chipColor: 'bg-rose-500/10 text-rose-600 border-rose-200',
        };
      case 'educativa-cultural':
        return {
          icon: BookOpen,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          activeTabClass: 'bg-blue-600 text-white shadow-md shadow-blue-600/25',
          chipColor: 'bg-blue-500/10 text-blue-600 border-blue-200',
        };
      case 'asociativa':
        return {
          icon: UserCheck,
          badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          activeTabClass: 'bg-amber-600 text-white shadow-md shadow-amber-600/25',
          chipColor: 'bg-amber-500/10 text-amber-600 border-amber-200',
        };
      case 'vocacional':
        return {
          icon: Target,
          badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          activeTabClass: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25',
          chipColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        };
      default:
        return {
          icon: Layers,
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800',
          activeTabClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25',
          chipColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
        };
    }
  };

  // Carga inicial de áreas, grados y secciones con restricción estricta de Grado Guía
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        let areasData = await getAllAccompanimentAreas();
        if (areasData.length === 0) {
          try {
            await seedAccompanimentDefaultAreas();
            areasData = await getAllAccompanimentAreas();
          } catch (seedErr) {
            console.warn('Could not auto-seed accompaniment areas to Firestore:', seedErr);
          }
        }
        const activeAreas = areasData.filter(a => a.status === 'ACTIVO');
        setAreas(activeAreas);
        if (activeAreas.length > 0 && !activeAreaTab) {
          setActiveAreaTab(activeAreas[0].id);
        }

        const [gradesData, rawSectionsData] = await Promise.all([
          getAllGrades(),
          getAllSections(),
        ]);

        // Deduplicar secciones por nombre normalizado (ej: 'A', 'B') por cada grado
        const cleanedSections: Section[] = [];
        const seenSectionKeys = new Set<string>();

        rawSectionsData.forEach(s => {
          const normName = s.name.trim().toUpperCase();
          const key = `${s.gradeId}_${normName}`;
          if (!seenSectionKeys.has(key)) {
            seenSectionKeys.add(key);
            cleanedSections.push({
              ...s,
              name: normName,
            });
          }
        });

        // Buscar información del docente actual
        let teacher = userProfile?.teacherId ? await getTeacher(userProfile.teacherId) : null;
        if (!teacher && userProfile?.email) {
          teacher = await getTeacherByEmail(userProfile.email);
        }

        const isSuperAdmin = userProfile?.role === 'admin' || userProfile?.email === 'admin@salesianosanjose.edu.sv';

        // Grados a los que tiene acceso el docente:
        // 1. Su Grado Guía (si tiene)
        // 2. Grados correspondientes a las Materias que imparte
        let availableGrades = gradesData;
        if (!isSuperAdmin) {
          const allowedGradeIds = new Set<string>();
          if (teacher?.guideGradeId) {
            allowedGradeIds.add(teacher.guideGradeId);
          }

          // Cargar materias para incluir los grados donde imparte clases
          try {
            const { getAllSubjects } = await import('../../lib/firestore');
            const allSubjects = await getAllSubjects();
            const teacherSubjectIds = teacher?.subjects || [];
            allSubjects.forEach(sub => {
              if (
                teacherSubjectIds.includes(sub.id) ||
                sub.teacherId === teacher?.id ||
                (userProfile?.email && sub.teacherName?.toLowerCase().includes('marquez'))
              ) {
                if (sub.gradeId) allowedGradeIds.add(sub.gradeId);
              }
            });
          } catch (e) {
            console.warn('Could not load subjects for grade filter:', e);
          }

          if (allowedGradeIds.size > 0) {
            availableGrades = gradesData.filter(g => allowedGradeIds.has(g.id) || allowedGradeIds.has(g.id.toLowerCase()));
          }
        }

        setGrades(availableGrades.length > 0 ? availableGrades : gradesData);
        setSections(cleanedSections);

        let initialGradeId = '';
        let initialSectionId = '';

        if (teacher?.guideGradeId) {
          initialGradeId = teacher.guideGradeId;
          const matchingSec = cleanedSections.filter(s => s.gradeId === teacher.guideGradeId);
          initialSectionId = matchingSec.length > 0 ? matchingSec[0].id : (teacher.guideSectionId || '');
        } else if (availableGrades.length > 0) {
          const btvGrade = availableGrades.find(g => g.id === '11t' || g.name.toLowerCase().includes('técnico')) || availableGrades[0];
          initialGradeId = btvGrade.id;
          const matchingSec = cleanedSections.filter(s => s.gradeId === btvGrade.id);
          initialSectionId = matchingSec.length > 0 ? matchingSec[0].id : (cleanedSections[0]?.id || '');
        }

        setSelectedGradeId(initialGradeId);
        setSelectedSectionId(initialSectionId);

        // Cargar catálogo de indicadores de conducta desde Firebase
        try {
          const inds = await getAllBehaviorIndicators();
          setBehaviorIndicators(inds.filter(i => i.status === 'ACTIVO'));
        } catch (indErr) {
          console.warn('Could not load behavior indicators from Firebase:', indErr);
        }
      } catch (err) {
        console.error('Error al inicializar acompañamiento:', err);
        setMessage({ type: 'error', text: 'Error al cargar configuración de acompañamiento.' });
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [userProfile]);

  // Secciones filtradas y deduplicadas para el grado seleccionado
  const availableSections = sections.filter(s => s.gradeId === selectedGradeId);

  // Manejador de cambio de grado con actualización de sección automática
  const handleGradeChange = (gradeId: string) => {
    setSelectedGradeId(gradeId);
    const matchingSections = sections.filter(s => s.gradeId === gradeId);
    if (matchingSections.length > 0) {
      setSelectedSectionId(matchingSections[0].id);
    } else {
      setSelectedSectionId('');
    }
    setSelectedStudentIndex(0);
  };

  // Función para recargar estudiantes y récord
  const loadStudentsAndRecord = async () => {
    if (!selectedGradeId) return;
    setLoadingStudents(true);
    try {
      const all = await getAllStudents();
      const selectedSec = sections.find(sec => sec.id === selectedSectionId);

      const studentsList = all.filter(s => {
        if (s.gradeId !== selectedGradeId) return false;
        if (!selectedSectionId) return true;
        // Coincidencia por ID directo
        if (s.sectionId === selectedSectionId) return true;
        // Coincidencia por nombre de sección (ej: "A")
        if (selectedSec) {
          const studentSec = sections.find(sec => sec.id === s.sectionId);
          if (studentSec?.name.trim().toUpperCase() === selectedSec.name.trim().toUpperCase()) return true;
          const letter = selectedSec.name.trim().toUpperCase();
          if (s.sectionId?.toUpperCase().endsWith(letter.toLowerCase()) || s.sectionId?.toUpperCase().endsWith(letter)) return true;
        }
        return false;
      });

      // Ordenar alfabéticamente por apellido / nombre
      studentsList.sort((a, b) => {
        const nameA = (a.lastName || a.name || '').toLowerCase();
        const nameB = (b.lastName || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
      setStudents(studentsList);
      setSelectedStudentIndex(0);

      // Cargar récord de notas de acompañamiento
      const existingRecord = await getAccompanimentRecord(
        selectedGradeId,
        selectedSectionId || 'all',
        selectedPeriod,
        selectedYear
      );

      if (existingRecord?.evaluations) {
        setEvaluations(existingRecord.evaluations);
      } else {
        setEvaluations({});
      }
    } catch (err) {
      console.error('Error loading students or accompaniment record:', err);
      setMessage({ type: 'error', text: 'Error al cargar los alumnos del grado.' });
    } finally {
      setLoadingStudents(false);
    }
  };

  // Cargar estudiantes y calificaciones cada vez que cambia grado, sección o periodo
  useEffect(() => {
    loadStudentsAndRecord();
  }, [selectedGradeId, selectedSectionId, selectedPeriod, selectedYear, sections]);

  // Manejar cambio de valor de un indicador
  const handleScoreChange = (studentId: string, studentName: string, indicatorId: string, value: AccompanimentGradeScale) => {
    setEvaluations(prev => {
      const studentEval = prev[studentId] || {
        studentId,
        studentName,
        scores: {},
      };

      const updatedScores = {
        ...studentEval.scores,
        [indicatorId]: value,
      };

      return {
        ...prev,
        [studentId]: {
          ...studentEval,
          studentName,
          scores: updatedScores,
        },
      };
    });
  };

  // Agregar nota de conducta/positivos/negativos por materia al alumno actual
  const handleAddConductNote = (studentId: string, studentName: string) => {
    if (!newConductDesc.trim()) return;

    let formattedDesc = newConductDesc.trim();
    if (selectedIndicatorCode) {
      const sign = newConductValue > 0 ? `+${newConductValue}` : `${newConductValue}`;
      formattedDesc = `[${selectedIndicatorCode}] (${sign}) ${formattedDesc}`;
    }

    const newNote: StudentSubjectConductNote = {
      id: `c_${Date.now()}`,
      subjectName: newConductSubject.trim() || 'General / Convivencia',
      type: newConductType,
      description: formattedDesc,
      date: new Date().toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' }),
      teacherName: userProfile?.displayName || 'Docente Guía',
    };

    setEvaluations(prev => {
      const studentEval = prev[studentId] || {
        studentId,
        studentName,
        scores: {},
      };

      const existingNotes = studentEval.conductNotes || [];
      return {
        ...prev,
        [studentId]: {
          ...studentEval,
          studentName,
          conductNotes: [newNote, ...existingNotes],
        },
      };
    });

    // Guardar también en la colección individual de incidencias de Firestore si hay grado y sección
    if (selectedGradeId && selectedSectionId) {
      try {
        const curGrade = grades.find(g => g.id === selectedGradeId);
        const curSec = sections.find(s => s.id === selectedSectionId);
        addStudentConductIncident({
          studentId,
          studentName,
          gradeId: selectedGradeId,
          gradeName: curGrade?.name || '',
          sectionId: selectedSectionId,
          sectionName: curSec?.name || '',
          period: selectedPeriod,
          year: selectedYear,
          date: new Date().toISOString().split('T')[0],
          subjectName: newConductSubject.trim() || 'General / Convivencia',
          code: selectedIndicatorCode || 'OBS',
          indicatorName: newConductDesc.trim(),
          description: newConductDesc.trim(),
          value: newConductValue,
          type: newConductType === 'negativo' ? 'negativo' : 'positivo',
          teacherName: userProfile?.displayName || 'Docente Guía',
        }).catch(e => console.warn('Could not save conduct incident document:', e));
      } catch (err) {
        console.warn('Incident doc creation skipped:', err);
      }
    }

    setNewConductDesc('');
    setNewConductSubject('');
    setSelectedIndicatorCode('');
    setNewConductValue(0);
    setShowAddConductModal(false);
    setMessage({ type: 'success', text: `Nota registrada para ${studentName} en Firebase.` });
  };

  // Eliminar nota de conducta
  const handleDeleteConductNote = (studentId: string, noteId: string) => {
    setEvaluations(prev => {
      const studentEval = prev[studentId];
      if (!studentEval) return prev;
      return {
        ...prev,
        [studentId]: {
          ...studentEval,
          conductNotes: (studentEval.conductNotes || []).filter(n => n.id !== noteId),
        },
      };
    });
  };

  // Guardar en Firestore
  const handleSave = async () => {
    if (!selectedGradeId || !selectedSectionId) {
      setMessage({ type: 'error', text: 'Selecciona grado y sección antes de guardar.' });
      return;
    }

    setSaving(true);
    try {
      const currentGrade = grades.find(g => g.id === selectedGradeId);
      const currentSection = sections.find(s => s.id === selectedSectionId);

      const record: AccompanimentRecord = {
        id: `${selectedGradeId}_${selectedSectionId}_${selectedPeriod}_${selectedYear}`,
        gradeId: selectedGradeId,
        gradeName: currentGrade?.name || '',
        sectionId: selectedSectionId,
        sectionName: currentSection?.name || '',
        period: selectedPeriod,
        year: selectedYear,
        teacherId: userProfile?.teacherId || userProfile?.uid,
        teacherName: userProfile?.displayName,
        evaluations,
      };

      await saveAccompanimentRecord(record);
      setMessage({ type: 'success', text: `Cuadro de acompañamiento (${selectedPeriod}) guardado exitosamente.` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al guardar el cuadro de acompañamiento.' });
    } finally {
      setSaving(false);
    }
  };

  // Acción para cargar los datos del Excel 2026 directamente a los alumnos
  const handleLoadExcelData = async () => {
    if (!selectedGradeId || !selectedSectionId) {
      setMessage({ type: 'error', text: 'Por favor selecciona el grado y la sección.' });
      return;
    }

    const confirm = window.confirm(
      '¿Deseas precargar las calificaciones del archivo oficial "Cuadro de acompañamiento 2026.xlsx" para los 8 alumnos de Bachillerato Técnico? Se cargarán los 4 periodos (PI a PIV).'
    );
    if (!confirm) return;

    setSeedingExcel(true);
    try {
      await seedAccompanimentScoresFromExcel(selectedGradeId, selectedSectionId);
      await loadStudentsAndRecord();
      setMessage({
        type: 'success',
        text: '¡Calificaciones del Excel 2026 cargadas exitosamente para los alumnos!',
      });
    } catch (err) {
      console.error('Error al cargar datos de Excel:', err);
      setMessage({ type: 'error', text: 'Error al importar las calificaciones del Excel.' });
    } finally {
      setSeedingExcel(false);
    }
  };

  // Filtrado de alumnos por buscador
  const filteredStudents = students.filter(s => {
    const fullName = `${s.lastName || ''} ${s.firstName || s.name || ''}`.toLowerCase();
    const carnet = (s.carnet || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || carnet.includes(query);
  });

  // Alumno actualmente seleccionado en modo tarjeta
  const currentStudent = filteredStudents[selectedStudentIndex] || filteredStudents[0];
  const currentStudentFullName = currentStudent
    ? (currentStudent.lastName ? `${currentStudent.lastName}, ${currentStudent.firstName || currentStudent.name}` : currentStudent.name)
    : '';

  // Helper para obtener foto institucional del estudiante (por foto en perfil, por carnet en public/students, o avatar dinámico)
  const getStudentPhoto = (student?: Student | null) => {
    if (!student) return '';
    if (student.photoUrl) return student.photoUrl;
    if (student.carnet) return `/students/${student.carnet}.png`;
    const fullName = student.lastName ? `${student.lastName}, ${student.firstName || student.name}` : student.name;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=256&bold=true`;
  };

  const getStudentAvatarFallback = (student?: Student | null) => {
    if (!student) return '';
    const fullName = student.lastName ? `${student.lastName}, ${student.firstName || student.name}` : student.name;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=4F46E5&color=fff&size=256&bold=true`;
  };

  // Indicadores a mostrar según la pestaña activa
  const displayedAreas = activeAreaTab === 'all'
    ? areas
    : areas.filter(a => a.id === activeAreaTab);

  const displayedIndicators = displayedAreas.flatMap(area =>
    (area.indicators || []).map(ind => ({
      ...ind,
      areaId: area.id,
      areaName: area.name,
    }))
  );

  const currentTabArea = areas.find(a => a.id === activeAreaTab);

  // Notas de conducta del alumno actual
  const currentStudentConductNotes = (currentStudent && evaluations[currentStudent.id]?.conductNotes) || [];
  const positivosCount = currentStudentConductNotes.filter(n => n.type === 'positivo').length;
  const negativosCount = currentStudentConductNotes.filter(n => n.type === 'negativo').length;
  const observacionesCount = currentStudentConductNotes.filter(n => n.type === 'observacion').length;

  return (
    <div className="p-4 sm:p-6 max-w-[1700px] mx-auto space-y-6">
      {/* Header Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Compass className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass className="w-3.5 h-3.5" />
              Seguimiento Formativo Salesiano
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Cuadro de Acompañamiento 2026
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Ficha integral 360° por estudiante: foto, dimensiones salesianas, méritos, positivos/negativos por materia y conducta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle de Modo: Ficha Individual vs Matriz Tabla */}
            <div className="inline-flex p-1 bg-slate-800/90 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'card'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Ficha por Alumno
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Matriz Completa
              </button>
            </div>

            <button
              onClick={handleLoadExcelData}
              disabled={seedingExcel || loadingStudents}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-500/50 text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
              title="Cargar las notas que vienen del archivo Excel 2026 para los alumnos"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${seedingExcel ? 'animate-spin' : ''}`} />
              {seedingExcel ? 'Cargando...' : 'Cargar Excel'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all shadow-sm"
              title="Imprimir formato"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingStudents || students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Guardando...' : 'Guardar Notas'}
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de notificación */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border transition-all ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-xs underline opacity-70 hover:opacity-100">
            Cerrar
          </button>
        </div>
      )}

      {/* Barra de Filtros: Grado, Sección (Deduplicada), Periodo, Año y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Grado Guía */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Grado Guía
            </label>
            <select
              value={selectedGradeId}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Sección (Limpia y sin duplicados) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Sección
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setSelectedStudentIndex(0);
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {availableSections.length > 0 ? (
                availableSections.map(s => (
                  <option key={s.id} value={s.id}>Sección {s.name}</option>
                ))
              ) : (
                <option value="">Sección Única</option>
              )}
            </select>
          </div>

          {/* Periodo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Periodo
            </label>
            <div className="grid grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['PI', 'PII', 'PIII', 'PIV'] as AccompanimentPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`py-1 text-xs font-bold rounded-lg transition-all ${
                    selectedPeriod === p
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Año */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Año Escolar
            </label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Buscador de alumnos */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Buscar Estudiante
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Nombre o carnet..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedStudentIndex(0);
                }}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Leyenda de escala rápida */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Escala de Valoración:</span>
            <span className="inline-flex items-center gap-1"><strong className="text-emerald-600 font-bold">E:</strong> Excelente</span>
            <span className="inline-flex items-center gap-1"><strong className="text-blue-600 font-bold">MB:</strong> Muy Bueno</span>
            <span className="inline-flex items-center gap-1"><strong className="text-amber-600 font-bold">B:</strong> Bueno</span>
            <span className="inline-flex items-center gap-1"><strong className="text-rose-600 font-bold">NM:</strong> Necesita Mejorar</span>
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <Users className="w-4 h-4" />
            <span>Alumnos en lista: <strong>{filteredStudents.length}</strong></span>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas / Tabs por Categoría / Dimensión */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            Dimensión Salesiana:
          </span>
          <span className="text-xs text-slate-400">
            Navega entre las dimensiones para ver o calificar los criterios correspondientes
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          {areas.map((area) => {
            const meta = getAreaMeta(area.id);
            const IconComponent = meta.icon;
            const isActive = activeAreaTab === area.id;
            const count = area.indicators?.length || 0;

            return (
              <button
                key={area.id}
                onClick={() => setActiveAreaTab(area.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                  isActive
                    ? meta.activeTabClass
                    : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{area.name}</span>
                <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveAreaTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeAreaTab === 'all'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Todas (14 criterios)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISTA 1: FICHA INDIVIDUAL 360° (FOTO + ACOMPAÑAMIENTO + CONDUCTA/MATERIAS) */}
      {/* ========================================================================= */}
      {viewMode === 'card' && (
        <div className="space-y-4">
          {/* Barra de Navegación Rápida entre Alumnos con Flechas y Selector de Lista */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
                disabled={selectedStudentIndex <= 0}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Alumno anterior"
              >
                <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>

              <div className="text-center sm:text-left">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Alumno {filteredStudents.length > 0 ? selectedStudentIndex + 1 : 0} de {filteredStudents.length}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {currentStudentFullName || 'Sin alumnos'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedStudentIndex(prev => Math.min(filteredStudents.length - 1, prev + 1))}
                disabled={selectedStudentIndex >= filteredStudents.length - 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                title="Siguiente alumno"
              >
                <ChevronRight className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              </button>
            </div>

            {/* Selector rápido tipo pastillas de lista de números de alumnos */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
              {filteredStudents.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStudentIndex(idx)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all shrink-0 ${
                    selectedStudentIndex === idx
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title={`${st.lastName || st.name}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {loading || loadingStudents ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-slate-500 font-medium">Cargando expediente de acompañamiento...</p>
            </div>
          ) : !currentStudent ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No hay estudiantes seleccionados</h3>
              <p className="text-xs text-slate-500 mt-1">Verifica los filtros de grado y sección.</p>
            </div>
          ) : (
            /* Layout Principal de 3 Columnas */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda (3 cols): Perfil, Foto Institucional y Datos del Alumno */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm text-center relative overflow-hidden">
                  <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden border-4 border-indigo-100 dark:border-indigo-900/50 shadow-md mb-4 bg-slate-100 dark:bg-slate-800 relative group">
                    <img
                      src={getStudentPhoto(currentStudent)}
                      alt={currentStudentFullName}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const fallback = getStudentAvatarFallback(currentStudent);
                        if (target.src !== fallback) {
                          target.src = fallback;
                        }
                      }}
                    />
                    <div className="absolute bottom-1 right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900" title="Activo"></div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {currentStudentFullName}
                  </h3>
                  <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    Carnet: {currentStudent.carnet || currentStudent.id}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Grado:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {grades.find(g => g.id === currentStudent.gradeId)?.name || currentStudent.gradeId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sección:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {sections.find(s => s.id === currentStudent.sectionId)?.name || 'A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Año / Cohorte:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {currentStudent.enrollmentYear || selectedYear}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Estado:</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
                        {currentStudent.status || 'ACTIVO'}
                      </span>
                    </div>
                  </div>

                  {/* Resumen de Conducta y Méritos */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40">
                      <ThumbsUp className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                      <div className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                        {positivosCount}
                      </div>
                      <div className="text-[10px] font-bold text-emerald-600/80 uppercase">Positivos</div>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                      <ThumbsDown className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                      <div className="text-base font-extrabold text-rose-700 dark:text-rose-300">
                        {negativosCount}
                      </div>
                      <div className="text-[10px] font-bold text-rose-600/80 uppercase">Negativos</div>
                    </div>
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/40">
                      <Award className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
                      <div className="text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                        {observacionesCount}
                      </div>
                      <div className="text-[10px] font-bold text-indigo-600/80 uppercase">Notas</div>
                    </div>
                  </div>
                </div>

                {/* Accesos rápidos de navegación */}
                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIndex(prev => Math.max(0, prev - 1))}
                    disabled={selectedStudentIndex <= 0}
                    className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 transition-all text-center"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStudentIndex(prev => Math.min(filteredStudents.length - 1, prev + 1))}
                    disabled={selectedStudentIndex >= filteredStudents.length - 1}
                    className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm disabled:opacity-40 transition-all text-center"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>

              {/* Columna Central (5 cols): Calificación de Criterios con Botones Toggles */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Compass className="w-4 h-4 text-indigo-600" />
                        Criterios de Acompañamiento
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {activeAreaTab === 'all' ? 'Todas las dimensiones' : currentTabArea?.name} ({selectedPeriod} - {selectedYear})
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {displayedIndicators.length} criterios
                    </span>
                  </div>

                  {/* Lista de Criterios con Botones Toggles E | MB | B | NM */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                    {displayedIndicators.map((ind) => {
                      const studentScores = evaluations[currentStudent.id]?.scores || {};
                      const scoreValue = studentScores[ind.id] || '';

                      return (
                        <div
                          key={ind.id}
                          className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {ind.name}
                            </div>
                            {ind.areaName && activeAreaTab === 'all' && (
                              <div className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">
                                {ind.areaName}
                              </div>
                            )}
                          </div>

                          {/* Botones Toggle Segmentados */}
                          <div className="inline-flex items-center p-0.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 gap-1 shadow-xs shrink-0">
                            {(['E', 'MB', 'B', 'NM'] as AccompanimentGradeScale[]).map((gradeOpt) => {
                              const isSelected = scoreValue === gradeOpt;

                              let activeClass = '';
                              if (gradeOpt === 'E') {
                                activeClass = 'bg-emerald-500 text-white font-extrabold shadow-sm shadow-emerald-500/40 ring-1 ring-emerald-600 scale-105';
                              } else if (gradeOpt === 'MB') {
                                activeClass = 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/40 ring-1 ring-blue-700 scale-105';
                              } else if (gradeOpt === 'B') {
                                activeClass = 'bg-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/40 ring-1 ring-amber-600 scale-105';
                              } else if (gradeOpt === 'NM') {
                                activeClass = 'bg-rose-500 text-white font-extrabold shadow-sm shadow-rose-500/40 ring-1 ring-rose-600 scale-105';
                              }

                              const inactiveClass = scoreValue
                                ? 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white';

                              return (
                                <button
                                  key={gradeOpt}
                                  type="button"
                                  onClick={() =>
                                    handleScoreChange(
                                      currentStudent.id,
                                      currentStudentFullName,
                                      ind.id,
                                      isSelected ? ('' as any) : gradeOpt
                                    )
                                  }
                                  title={`${gradeOpt} - ${
                                    gradeOpt === 'E'
                                      ? 'Excelente'
                                      : gradeOpt === 'MB'
                                      ? 'Muy Bueno'
                                      : gradeOpt === 'B'
                                      ? 'Bueno'
                                      : 'Necesita Mejorar'
                                  }${isSelected ? ' (Clic para desmarcar)' : ''}`}
                                  className={`px-2.5 py-1 text-xs rounded-lg transition-all cursor-pointer font-bold select-none leading-none min-w-[28px] ${
                                    isSelected ? activeClass : inactiveClass
                                  }`}
                                >
                                  {gradeOpt}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Columna Derecha (4 cols): Positivos, Negativos por Materia y Registro de Conducta */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Historial de Conducta y Materias
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Méritos, positivos y llamados de atención
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddConductModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-800 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>

                  {/* Listado de Notas de Conducta */}
                  {currentStudentConductNotes.length === 0 ? (
                    <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Sin incidencias ni positivos registrados
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Haz clic en &quot;Agregar&quot; para registrar un positivo o negativo por materia.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                      {currentStudentConductNotes.map((note) => {
                        let noteBadgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800';
                        let NoteIcon = MessageSquare;

                        if (note.type === 'positivo') {
                          noteBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
                          NoteIcon = ThumbsUp;
                        } else if (note.type === 'negativo') {
                          noteBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
                          NoteIcon = ThumbsDown;
                        }

                        return (
                          <div
                            key={note.id}
                            className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-1.5 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${noteBadgeClass}`}>
                                <NoteIcon className="w-3 h-3" />
                                {note.type}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{note.date}</span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteConductNote(currentStudent.id, note.id)}
                                  className="text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Eliminar registro"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              Materia: <span className="text-indigo-600 dark:text-indigo-400">{note.subjectName}</span>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {note.description}
                            </p>

                            {note.teacherName && (
                              <div className="text-[10px] text-slate-400 text-right italic">
                                Registrado por: {note.teacherName}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VISTA 2: MATRIZ COMPLETA / TABLA (VISUALIZACIÓN MULTI-ALUMNO POR TABS) */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {loading || loadingStudents ? (
            <div className="flex flex-col justify-center items-center py-24 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-slate-500 font-medium">Cargando nómina y registro de acompañamiento...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">No se encontraron estudiantes</h3>
              <p className="text-xs text-slate-500 mt-1">Verifica si el grado y sección seleccionados tienen estudiantes registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                {/* Encabezado Fila 1: Dimensiones */}
                <thead>
                  <tr className="bg-slate-900 text-white border-b border-slate-800">
                    <th className="p-3 text-center w-12 font-bold sticky left-0 z-20 bg-slate-900">#</th>
                    <th className="p-3 min-w-[240px] font-bold sticky left-12 z-20 bg-slate-900">ESTUDIANTE</th>
                    {displayedAreas.map(area => (
                      <th
                        key={area.id}
                        colSpan={area.indicators?.length || 1}
                        className="p-3 text-center font-bold tracking-wide border-l border-slate-800 uppercase text-xs bg-slate-950/80"
                      >
                        {area.name}
                      </th>
                    ))}
                  </tr>

                  {/* Encabezado Fila 2: Indicadores / Criterios */}
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-xs">
                    <th className="p-2.5 text-center sticky left-0 z-20 bg-slate-100 dark:bg-slate-800 font-bold">Nº</th>
                    <th className="p-2.5 sticky left-12 z-20 bg-slate-100 dark:bg-slate-800 uppercase font-bold text-slate-800 dark:text-slate-200">
                      Apellidos y Nombres
                    </th>
                    {displayedIndicators.map((ind) => (
                      <th
                        key={ind.id}
                        className="p-3 text-center min-w-[140px] font-semibold border-l border-slate-200 dark:border-slate-700 leading-tight"
                        title={ind.name}
                      >
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{ind.name}</div>
                        {ind.areaName && activeAreaTab === 'all' && (
                          <div className="text-[10px] text-slate-400 font-normal uppercase mt-0.5">{ind.areaName}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Cuerpo de la Tabla */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.map((student, index) => {
                    const studentFullName = student.lastName 
                      ? `${student.lastName}, ${student.firstName || student.name || ''}` 
                      : student.name;
                    const currentScores = evaluations[student.id]?.scores || {};

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Número correlativo */}
                        <td className="p-3 text-center font-bold text-slate-500 sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40">
                          {index + 1}
                        </td>

                        {/* Nombre del Alumno */}
                        <td className="p-3 font-medium text-slate-900 dark:text-white sticky left-12 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={getStudentPhoto(student)}
                              alt={studentFullName}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100 dark:bg-slate-800"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fallback = getStudentAvatarFallback(student);
                                if (target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                            />
                            <div className="min-w-0">
                              <div className="truncate max-w-[220px] font-semibold text-xs sm:text-sm" title={studentFullName}>
                                {studentFullName}
                              </div>
                              {student.carnet && (
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {student.carnet}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Celdas de Calificación para cada Indicador */}
                        {displayedIndicators.map((ind) => {
                          const scoreValue = currentScores[ind.id] || '';

                          return (
                            <td
                              key={ind.id}
                              className="p-1.5 text-center border-l border-slate-100 dark:border-slate-800/60"
                            >
                              <div className="inline-flex items-center justify-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/80 dark:border-slate-700/80 gap-0.5 shadow-inner">
                                {(['E', 'MB', 'B', 'NM'] as AccompanimentGradeScale[]).map((gradeOpt) => {
                                  const isSelected = scoreValue === gradeOpt;

                                  let activeClass = '';
                                  if (gradeOpt === 'E') {
                                    activeClass = 'bg-emerald-500 text-white font-extrabold shadow-sm shadow-emerald-500/40 ring-1 ring-emerald-600';
                                  } else if (gradeOpt === 'MB') {
                                    activeClass = 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-600/40 ring-1 ring-blue-700';
                                  } else if (gradeOpt === 'B') {
                                    activeClass = 'bg-amber-500 text-white font-extrabold shadow-sm shadow-amber-500/40 ring-1 ring-amber-600';
                                  } else if (gradeOpt === 'NM') {
                                    activeClass = 'bg-rose-500 text-white font-extrabold shadow-sm shadow-rose-500/40 ring-1 ring-rose-600';
                                  }

                                  const inactiveClass = scoreValue
                                    ? 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 opacity-60 hover:opacity-100'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white';

                                  return (
                                    <button
                                      key={gradeOpt}
                                      type="button"
                                      onClick={() =>
                                        handleScoreChange(
                                          student.id,
                                          studentFullName,
                                          ind.id,
                                          isSelected ? ('' as any) : gradeOpt
                                        )
                                      }
                                      title={`${gradeOpt} - ${
                                        gradeOpt === 'E'
                                          ? 'Excelente'
                                          : gradeOpt === 'MB'
                                          ? 'Muy Bueno'
                                          : gradeOpt === 'B'
                                          ? 'Bueno'
                                          : 'Necesita Mejorar'
                                      }${isSelected ? ' (Clic para desmarcar)' : ''}`}
                                      className={`px-1.5 py-1 text-[11px] rounded-lg transition-all cursor-pointer font-bold select-none leading-none min-w-[24px] ${
                                        isSelected ? activeClass : inactiveClass
                                      }`}
                                    >
                                      {gradeOpt}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal para Registrar Mérito / Positivo / Negativo */}
      {showAddConductModal && currentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                Registrar Nota de Conducta
              </h3>
              <button
                type="button"
                onClick={() => setShowAddConductModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Alumno: <strong className="text-slate-800 dark:text-slate-200">{currentStudentFullName}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo de Registro
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewConductType('positivo')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newConductType === 'positivo'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Positivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewConductType('negativo')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newConductType === 'negativo'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Negativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewConductType('observacion')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      newConductType === 'observacion'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Nota
                  </button>
                </div>
              </div>

              {/* Selector de Indicador del Catálogo de Firebase */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Código de Indicador de Conducta (Catálogo Oficial)
                </label>
                <select
                  value={selectedIndicatorCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setSelectedIndicatorCode(code);
                    const found = behaviorIndicators.find(b => b.code === code);
                    if (found) {
                      setNewConductType(found.type);
                      setNewConductValue(found.value);
                      if (!newConductDesc) {
                        setNewConductDesc(found.name);
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="">-- Seleccionar código o ingresar manual --</option>
                  {behaviorIndicators.map(ind => (
                    <option key={ind.id} value={ind.code}>
                      [{ind.code}] {ind.name} ({ind.value > 0 ? `+${ind.value}` : ind.value}) - {ind.categoryLabel || ind.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Materia / Asignatura
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Informática / BTV, Matemáticas..."
                    value={newConductSubject}
                    onChange={(e) => setNewConductSubject(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Impacto en Nota Base (8.5)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      value={newConductValue}
                      onChange={(e) => setNewConductValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <span className={`text-xs font-extrabold shrink-0 ${newConductValue > 0 ? 'text-emerald-600' : newConductValue < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {newConductValue > 0 ? `+${newConductValue}` : newConductValue}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del hecho o motivo
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe el detalle del mérito o la situación conductual..."
                  value={newConductDesc}
                  onChange={(e) => setNewConductDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddConductModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleAddConductNote(currentStudent.id, currentStudentFullName)}
                disabled={!newConductDesc.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                Guardar Nota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante inferior para guardar cómodamente */}
      {filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500">
            {viewMode === 'card' && currentStudent ? (
              <span>Ficha activa: <strong>{currentStudentFullName}</strong> ({selectedStudentIndex + 1} de {filteredStudents.length})</span>
            ) : (
              <span>Mostrando dimensión: <strong className="text-slate-700 dark:text-slate-300">{activeAreaTab === 'all' ? 'Todas las dimensiones' : currentTabArea?.name}</strong> con {displayedIndicators.length} indicadores.</span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving || loadingStudents}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Guardando...' : `Guardar Evaluaciones (${selectedPeriod} - ${selectedYear})`}
          </button>
        </div>
      )}
    </div>
  );
}
