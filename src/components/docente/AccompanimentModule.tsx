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
  Info,
  Sparkles,
  Heart,
  BookOpen,
  UserCheck,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  AccompanimentArea,
  AccompanimentPeriod,
  AccompanimentRecord,
  AccompanimentGradeScale,
  AccompanimentStudentScore,
  Student,
  Grade,
  Section,
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

  // Tab activo de dimensión: 'all' o el id del área (ej: 'evangelizacion-catequesis')
  const [activeAreaTab, setActiveAreaTab] = useState<string>('');

  // Matriz de evaluación
  const [evaluations, setEvaluations] = useState<Record<string, AccompanimentStudentScore>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStudents, setLoadingStudents] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [seedingExcel, setSeedingExcel] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // Carga inicial de áreas, grados y secciones
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

        const [gradesData, sectionsData] = await Promise.all([
          getAllGrades(),
          getAllSections(),
        ]);
        setGrades(gradesData);
        setSections(sectionsData);

        // Preseleccionar si el docente tiene grado guía o materias
        let teacher = userProfile?.teacherId ? await getTeacher(userProfile.teacherId) : null;
        if (!teacher && userProfile?.email) {
          teacher = await getTeacherByEmail(userProfile.email);
        }

        let initialGradeId = '';
        let initialSectionId = '';

        if (teacher?.guideGradeId && teacher?.guideSectionId) {
          initialGradeId = teacher.guideGradeId;
          initialSectionId = teacher.guideSectionId;
        } else if (gradesData.length > 0) {
          // BTV default: buscar 11° técnico o 10° técnico si existe
          const btvGrade = gradesData.find(g => g.id === '11t' || g.id === '10t' || g.name.toLowerCase().includes('técnico')) || gradesData[0];
          initialGradeId = btvGrade.id;
          const matchingSections = sectionsData.filter(s => s.gradeId === btvGrade.id);
          initialSectionId = matchingSections.length > 0 ? matchingSections[0].id : (sectionsData[0]?.id || '');
        }

        setSelectedGradeId(initialGradeId);
        setSelectedSectionId(initialSectionId);
      } catch (err) {
        console.error('Error al inicializar acompañamiento:', err);
        setMessage({ type: 'error', text: 'Error al cargar configuración de acompañamiento.' });
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [userProfile]);

  // Secciones filtradas por el grado seleccionado
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

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Header Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
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
              Evaluación organizada por dimensiones: Evangelización, Educativa-Cultural, Asociativa y Vocacional.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleLoadExcelData}
              disabled={seedingExcel || loadingStudents}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-500/50 text-sm font-semibold transition-all shadow-sm hover:shadow-emerald-600/30 disabled:opacity-50"
              title="Cargar las notas que vienen del archivo Excel 2026 para los alumnos"
            >
              <FileSpreadsheet className={`w-4 h-4 ${seedingExcel ? 'animate-spin' : ''}`} />
              {seedingExcel ? 'Cargando Excel...' : 'Cargar Notas de Excel'}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-sm font-medium transition-all shadow-sm"
              title="Imprimir formato"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loadingStudents || students.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
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

      {/* Barra de Filtros: Grado, Sección, Periodo, Año y Búsqueda */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Grado */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Grado
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

          {/* Sección */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Sección
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {availableSections.length > 0 ? (
                availableSections.map(s => (
                  <option key={s.id} value={s.id}>Sección {s.name}</option>
                ))
              ) : (
                <option value="">Sin secciones para este grado</option>
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
            Selecciona una Categoría / Dimensión:
          </span>
          <span className="text-xs text-slate-400">
            Cada pestaña organiza los criterios en una vista limpia y espaciosa
          </span>
        </div>

        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
          {areas.map((area, idx) => {
            const meta = getAreaMeta(area.id);
            const IconComponent = meta.icon;
            const isActive = activeAreaTab === area.id;
            const count = area.indicators?.length || 0;

            return (
              <button
                key={area.id}
                onClick={() => setActiveAreaTab(area.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
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
                  {count} {count === 1 ? 'criterio' : 'criterios'}
                </span>
              </button>
            );
          })}

          {/* Pestaña adicional para ver todas las dimensiones juntas */}
          <button
            onClick={() => setActiveAreaTab('all')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
              activeAreaTab === 'all'
                ? 'bg-slate-900 text-white shadow-md shadow-slate-900/30'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span>Ver Todas (Matriz Completa)</span>
            <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              activeAreaTab === 'all' ? 'bg-white/25 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
            }`}>
              14
            </span>
          </button>
        </div>
      </div>

      {/* Encabezado descriptivo de la pestaña activa */}
      {currentTabArea && activeAreaTab !== 'all' && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${getAreaMeta(currentTabArea.id).badgeColor}`}>
              {React.createElement(getAreaMeta(currentTabArea.id).icon, { className: 'w-4 h-4' })}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Dimensión: {currentTabArea.name}
              </h3>
              <p className="text-xs text-slate-500">
                {currentTabArea.description || 'Evaluación de criterios e indicadores específicos de esta área formativa.'}
              </p>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
            <span>Periodo activo: <strong className="text-indigo-600 dark:text-indigo-400">{selectedPeriod} - {selectedYear}</strong></span>
          </div>
        </div>
      )}

      {/* Matriz / Tabla de Acompañamiento */}
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
                        <div className="truncate max-w-[240px] font-semibold" title={studentFullName}>
                          {studentFullName}
                        </div>
                        {student.carnet && (
                          <div className="text-[11px] text-slate-400 font-mono">
                            Carnet: {student.carnet}
                          </div>
                        )}
                      </td>

                      {/* Celdas de Calificación para cada Indicador */}
                      {displayedIndicators.map((ind) => {
                        const scoreValue = currentScores[ind.id] || '';

                        // Estilos condicionales según el valor
                        let badgeColor = 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
                        if (scoreValue === 'E') badgeColor = 'bg-emerald-500 text-white border-emerald-600 font-bold';
                        else if (scoreValue === 'MB') badgeColor = 'bg-blue-600 text-white border-blue-700 font-bold';
                        else if (scoreValue === 'B') badgeColor = 'bg-amber-500 text-white border-amber-600 font-bold';
                        else if (scoreValue === 'NM') badgeColor = 'bg-rose-500 text-white border-rose-600 font-bold';

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

      {/* Botón flotante inferior para guardar cómodamente */}
      {filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-500">
            Mostrando dimensión: <strong className="text-slate-700 dark:text-slate-300">{activeAreaTab === 'all' ? 'Todas las dimensiones' : currentTabArea?.name}</strong> con {displayedIndicators.length} indicadores.
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
