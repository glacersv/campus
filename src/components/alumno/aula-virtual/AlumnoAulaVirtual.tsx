import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  Layers,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import { lmsService } from '../../../services/lmsService';
import { LMSCourse, LMSActivity, LMSStudentSummary, TechnicalYear, MINED_LEVELS } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { getStudentTechnicalYearAccess } from '../../../utils/studentYearAccess';
import WelcomeBanner from '../../shared/WelcomeBanner';
import CourseCard from '../../lms/shared/CourseCard';
import ActivityItem from '../../lms/shared/ActivityItem';

export default function AlumnoAulaVirtual() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const studentName = userProfile?.displayName || 'Estudiante Salesiano';
  const [selectedYear, setSelectedYear] = useState<TechnicalYear>(lmsService.getActiveTechnicalYear());
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [activities, setActivities] = useState<LMSActivity[]>([]);
  const [summary, setSummary] = useState<LMSStudentSummary>({
    enrolledCoursesCount: 0,
    pendingActivitiesCount: 0,
    completedActivitiesCount: 0,
    overallAverage: 0,
    overallMinedLevel: 4,
    progressPercentage: 0,
    totalTechnicalHours: 720,
    currentYear: '1',
  });

  const yearAccess = getStudentTechnicalYearAccess(userProfile);
  const allowedYears = yearAccess.allowedYears; // e.g. ['1'] or ['1', '2'] or ['1', '2', '3']

  useEffect(() => {
    const loadData = () => {
      let activeY = lmsService.getActiveTechnicalYear();
      // Ensure the active year is in the allowed list for the student
      if (allowedYears.length > 0 && !allowedYears.includes(activeY)) {
        activeY = (yearAccess.currentYear.toString() as TechnicalYear) || allowedYears[allowedYears.length - 1];
        lmsService.setActiveTechnicalYear(activeY);
      }
      setSelectedYear(activeY);
      setCourses(lmsService.getCourses(activeY));
      setActivities(lmsService.getActivities(undefined, activeY));
      setSummary(lmsService.getStudentSummary(activeY));
    };

    loadData();
    const unsubscribe = lmsService.subscribe(loadData);
    return () => unsubscribe();
  }, [userProfile?.gradeId, userProfile?.studentId]);

  const handleYearChange = (year: TechnicalYear) => {
    if (allowedYears.length > 0 && !allowedYears.includes(year)) {
      return; // Not allowed to access future year
    }
    setSelectedYear(year);
    lmsService.setActiveTechnicalYear(year);
    setCourses(lmsService.getCourses(year));
    setActivities(lmsService.getActivities(undefined, year));
    setSummary(lmsService.getStudentSummary(year));
  };

  const pendingActivities = activities.filter((a) => a.status === 'pendiente');
  const activeCohort = lmsService.getAcademicCohortYear();
  const currentMinedLevelDef = MINED_LEVELS[summary.overallMinedLevel || 4];

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <WelcomeBanner
        name={studentName}
        role="alumno"
        area="lms"
        title={`Bachillerato Técnico en Diseño Gráfico • ${selectedYear}° Año`}
        subtitle={`Plan de Estudio Oficial MINED • ${summary.totalTechnicalHours} Horas Técnicas • Formación orientada a la acción y proyectos reales para el ciclo lectivo ${activeCohort}.`}
        badge={`Cohorte ${activeCohort} • MINED Ricaldone`}
        ctaLabel="Explorar Módulos"
        onCta={() => navigate('/alumno/aula-virtual/cursos')}
      />

      {/* 2. Selector de Año Técnico (1°, 2° y 3° Año) */}
      <div className="card-crema p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D71B9]/10 text-[#0D71B9] flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm md:text-base text-slate-900">
              Nivel de Formación Técnica
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona el año lectivo para visualizar los módulos y proyectos asignados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          {allowedYears.includes('1') && (
            <button
              type="button"
              onClick={() => handleYearChange('1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedYear === '1'
                  ? 'bg-white text-[#0D71B9] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>1° Año</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">720h</span>
            </button>
          )}

          {allowedYears.includes('2') && (
            <button
              type="button"
              onClick={() => handleYearChange('2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedYear === '2'
                  ? 'bg-white text-[#0D71B9] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>2° Año</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-mono">720h</span>
            </button>
          )}

          {allowedYears.includes('3') && (
            <button
              type="button"
              onClick={() => handleYearChange('3')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedYear === '3'
                  ? 'bg-white text-[#0D71B9] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>3° Año</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 font-mono">1,200h</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Top Metric Stat Cards (Escala MINED 1-5 y Horas) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          onClick={() => navigate('/alumno/aula-virtual/cursos')}
          className="card-crema card-interactive p-6 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#0D71B9]/10 text-[#0D71B9] border border-[#0D71B9]/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Módulos del {selectedYear}° Año
              </span>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 mt-0.5">
                {summary.enrolledCoursesCount}{' '}
                <span className="text-xs font-semibold text-slate-500">Módulos ({summary.totalTechnicalHours}h)</span>
              </h3>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#0D71B9] group-hover:translate-x-1 transition-all" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => navigate('/alumno/aula-virtual/progreso')}
          className="card-crema card-interactive p-6 flex items-center justify-between group border-l-4 border-l-emerald-500 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Nivel MINED (Escala 1 al 5)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900">
                  Nivel {summary.overallMinedLevel}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {summary.overallMinedLevel >= 4 ? 'Aprobado' : 'En refuerzo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                {currentMinedLevelDef?.label}
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={() => navigate('/alumno/aula-virtual/progreso')}
          className="card-crema card-interactive p-6 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#25855A]/10 text-[#25855A] border border-[#25855A]/20 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Calificación Numérica
              </span>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 mt-0.5">
                {summary.overallAverage.toFixed(1)}{' '}
                <span className="text-xs font-semibold text-emerald-600">/ 10.0 pts (Mín. 7.0)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {summary.completedActivitiesCount} de {summary.completedActivitiesCount + summary.pendingActivitiesCount} tareas evaluadas
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#25855A] group-hover:translate-x-1 transition-all" />
        </motion.div>
      </div>

      {/* 4. Metodología de las 6 Etapas de la Acción Completa Infographic */}
      <div className="card-crema p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">
                  Metodología Pedagógica Oficial
                </span>
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-white">
                  Las 6 Etapas de la Acción Completa por Proyecto
                </h3>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Método Aprender Haciendo • 100% Criterial
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { num: '1', name: 'Informar', pct: '10%', desc: 'Saberes previos y marco teórico' },
              { num: '2', name: 'Planificar', pct: '10%', desc: 'Ruta crítica y marco lógico' },
              { num: '3', name: 'Decidir', pct: '10%', desc: 'Matriz Delphi y consenso' },
              { num: '4', name: 'Ejecutar', pct: '25%', desc: 'Bocetería, software y dummies' },
              { num: '5', name: 'Controlar', pct: '25%', desc: 'FODA, listas de cotejo y calidad' },
              { num: '6', name: 'Valorar', pct: '20%', desc: 'Rúbrica MINED (1-5) y feria' },
            ].map((st) => (
              <div
                key={st.num}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                    {st.num}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-blue-300">{st.pct}</span>
                </div>
                <h4 className="font-bold text-sm text-white">{st.name}</h4>
                <p className="text-[10px] text-slate-300 mt-1 leading-snug">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Main Dashboard Layout (Modules + Sidebar) */}
      <div className="flex flex-col xl:flex-row gap-8">
        {/* Left Column: Módulos del Año + Actividades */}
        <div className="flex-1 space-y-8 min-w-0">
          {/* Header de Módulos */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
                  <span>Malla Curricular de {selectedYear}° Año</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#0D71B9]/10 text-[#0D71B9] border border-[#0D71B9]/20">
                    {courses.length} Módulos Técnicos
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Descriptores oficiales, proyectos anuales asignados y rúbricas MINED
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/alumno/aula-virtual/cursos')}
                className="btn-secondary !py-1.5 !px-3.5 text-xs gap-1.5 self-start sm:self-auto"
              >
                <span>Ver catálogo completo ({courses.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid de Cursos del Año Seleccionado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {courses.map((course, idx) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  index={idx}
                  onClick={() => navigate(`/alumno/aula-virtual/cursos/${course.id}`)}
                />
              ))}
            </div>
          </div>

          {/* Pending Activities Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-bold text-xl text-slate-900">
                  Entregas y Fases de Proyecto Pendientes
                </h2>
                {pendingActivities.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    {pendingActivities.length} por entregar
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => navigate('/alumno/aula-virtual/actividades')}
                className="btn-secondary !py-1.5 !px-3.5 text-xs gap-1.5"
              >
                <span>Ver todas las actividades</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {pendingActivities.length === 0 ? (
              <div className="card-crema p-8 text-center border border-slate-200">
                <Sparkles className="w-8 h-8 text-[#25855A] mx-auto mb-2" />
                <h4 className="font-display font-bold text-slate-800">
                  ¡Excelente trabajo! Todo al día
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  No tienes fases de proyecto pendientes de entrega para el {selectedYear}° Año.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingActivities.slice(0, 4).map((activity, idx) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    index={idx}
                    onSelect={() => navigate(`/alumno/aula-virtual/actividades/${activity.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
