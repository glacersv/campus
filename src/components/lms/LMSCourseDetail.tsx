import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  ClipboardCheck,
  Award,
  Layers,
  Clock,
  MapPin,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  HelpCircle,
  Target,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Cpu,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { lmsService } from '../../services/lmsService';
import { LMSModule, LMSActivity, ActionStageKey, MINED_LEVELS, MinedLevel } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import ProgressRing from './shared/ProgressRing';
import ActivityItem from './shared/ActivityItem';
import MDEditor from '@uiw/react-md-editor';

interface LMSCourseDetailProps {
  courseId: string;
  onBack?: () => void;
}

export const LMSCourseDetail: React.FC<LMSCourseDetailProps> = ({
  courseId,
  onBack = () => {},
}) => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isStudent = userProfile?.role === 'alumno';
  const [course, setCourse] = useState<LMSModule | undefined>(undefined);
  const [activities, setActivities] = useState<LMSActivity[]>([]);
  const [activeTab, setActiveTab] = useState<'etapas' | 'proyecto' | 'descriptor' | 'saberes' | 'actividades' | 'calificaciones' | 'jornalizacion'>('etapas');
  const [expandedStage, setExpandedStage] = useState<ActionStageKey | null>('informar');
  const [selectedCohortYear, setSelectedCohortYear] = useState<string>('2026');
  const [generatingProject, setGeneratingProject] = useState(false);

  useEffect(() => {
    const loadCourse = async () => {
      const c = await lmsService.getModuleById(courseId);
      if (c) {
        setCourse(c as any);
        setActivities(lmsService.getActivities(courseId));
        setSelectedCohortYear(lmsService.getAcademicCohortYear());
      }
    };

    loadCourse();
    const unsub = lmsService.subscribe(() => { loadCourse(); });
    return () => unsub();
  }, [courseId]);

  if (!course) {
    return (
      <div className="card-crema p-12 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-slate-800 text-lg">Módulo no encontrado</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          El módulo técnico solicitado no existe en la malla curricular.
        </p>
        <button type="button" onClick={onBack} className="btn-primary">
          Volver al Catálogo
        </button>
      </div>
    );
  }

  const c = course as any;
  const descriptor = c.descriptor;
  const currentProject = descriptor?.currentProject;
  const progressVal = c.progress ?? 0;
  const gradedActivities = activities.filter(
    (a) => a.status === 'calificada' && a.submission?.grade !== undefined
  );

  const handleGenerateNewProject = () => {
    setGeneratingProject(true);
    setTimeout(() => {
      lmsService.generateAndSetAnnualProject(c.id, selectedCohortYear);
      setGeneratingProject(false);
    }, 400);
  };

  const handleSaberAppreciation = (saberId: string, value: 'MUCHO' | 'POCO' | 'NADA') => {
    lmsService.updateSaberPrevioAppreciation(c.id, saberId, value);
    const updated = lmsService.getCourseById(c.id);
    if (updated) setCourse(updated as any);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="card-crema p-6 md:p-8 relative overflow-hidden border border-slate-200 shadow-sm">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: c.color }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white tracking-wide">
                  {c.code}
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    backgroundColor: `${c.color}15`,
                    color: c.color,
                    border: `1px solid ${c.color}35`,
                  }}
                >
                  {c.technicalYear}° Año Técnico • {c.hours} Horas ({c.weeks} {c.weeks === 1 ? 'semana' : 'semanas'})
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  {c.affineArea}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 leading-tight">
                {c.name}
              </h1>

              <p className="text-xs md:text-sm text-slate-600 max-w-3xl leading-relaxed">
                {c.description}
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Docente: <strong>{lmsService.getTeacherName(c.teacherId)}</strong></span>
                </div>
                {c.schedule && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.schedule}</span>
                  </div>
                )}
                {c.classroom && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.classroom}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress & MINED Level */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl shrink-0 self-start lg:self-center">
            <ProgressRing
              progress={progressVal}
              size={64}
              strokeWidth={6}
              color={c.color || '#0D71B9'}
              label="AVANCE"
            />
            <div className="border-l border-slate-200 pl-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Evaluación MINED
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-extrabold text-2xl text-slate-900">
                  {c.minedLevel ? `Nivel ${c.minedLevel}` : 'Nivel 4'}
                </span>
                <span className="text-xs font-semibold text-emerald-600">
                  ({c.averageGrade ? `${c.averageGrade.toFixed(1)}/10` : '8.8/10'})
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {gradedActivities.length} de {activities.length} tareas evaluadas
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('etapas')}
          className={`filter-pill ${activeTab === 'etapas' ? 'filter-pill-active' : ''}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>6 Etapas de Acción Completa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proyecto')}
          className={`filter-pill ${activeTab === 'proyecto' ? 'filter-pill-active' : ''}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Proyecto Anual ({currentProject?.academicYear || '2026'})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('descriptor')}
          className={`filter-pill ${activeTab === 'descriptor' ? 'filter-pill-active' : ''}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Descriptor Técnico MINED</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saberes')}
          className={`filter-pill ${activeTab === 'saberes' ? 'filter-pill-active' : ''}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Saberes Previos y Necesarios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('actividades')}
          className={`filter-pill ${activeTab === 'actividades' ? 'filter-pill-active' : ''}`}
        >
          <ClipboardCheck className="w-3.5 h-3.5" />
          <span>Actividades ({activities.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calificaciones')}
          className={`filter-pill ${activeTab === 'calificaciones' ? 'filter-pill-active' : ''}`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Rúbrica y Notas</span>
        </button>

        {(c.jornalizacion && c.jornalizacion.length > 0) && (
          <button
            type="button"
            onClick={() => setActiveTab('jornalizacion')}
            className={`filter-pill ${activeTab === 'jornalizacion' ? 'filter-pill-active' : ''}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Jornalización</span>
          </button>
        )}
      </div>

      {/* 3. TAB 1: 6 ETAPAS DE LA ACCIÓN COMPLETA */}
      {activeTab === 'etapas' && descriptor && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                <strong>Metodología de Proyecto Orientada a la Acción:</strong> El desarrollo del módulo se divide en 6 etapas secuenciales con distribución horaria normativa.
              </span>
            </div>
            <span className="font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs shrink-0">
              Total: {c.hours} Horas
            </span>
          </div>

          <div className="space-y-3">
            {(['informar', 'planificar', 'decidir', 'ejecutar', 'controlar', 'valorar'] as ActionStageKey[]).map((stageKey, idx) => {
              const stage = descriptor.actionStages?.[stageKey];
              if (!stage) return null;
              const isExpanded = expandedStage === stageKey;
              const stageActs = activities.filter((a) => a.stageKey === stageKey);
              const stageHours = Math.round((c.hours * (stage.hoursPercentage || 10)) / 100);

              const stageColors: Record<ActionStageKey, { bg: string; text: string; badge: string }> = {
                informar: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-50 border-blue-200' },
                planificar: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
                decidir: { bg: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-50 border-purple-200' },
                ejecutar: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' },
                controlar: { bg: 'bg-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-50 border-cyan-200' },
                valorar: { bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 border-rose-200' },
              };

              const colors = stageColors[stageKey] || stageColors.informar;

              return (
                <div
                  key={stageKey}
                  className="card-crema overflow-hidden border border-slate-200 shadow-2xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedStage(isExpanded ? null : stageKey)}
                    className="w-full p-4 md:p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <span className={`w-8 h-8 rounded-xl ${colors.bg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-slate-900 text-base">
                            {stage.title}
                          </h3>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${colors.badge} ${colors.text}`}>
                            {stage.hoursPercentage}% • {stageHours} Horas
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {stage.guidingQuestions?.[0]}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {stageActs.length > 0 && (
                        <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          {stageActs.length} {stageActs.length === 1 ? 'tarea' : 'tareas'}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-5 pb-6 pt-2 border-t border-slate-100 space-y-4"
                      >
                        {/* Preguntas Guía */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                            Preguntas Guías de la Etapa
                          </h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
                            {(stage.guidingQuestions || []).map((q: string, qIdx: number) => (
                              <li key={qIdx} className="flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/60">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Actividades del Alumno y Docente */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                              Actividades del Alumnado
                            </h4>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {(stage.studentTasks || []).map((task: string, tIdx: number) => (
                                <li key={tIdx} className="flex items-start gap-2">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                            <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                              Rol y Acompañamiento del Profesorado
                            </h4>
                            <ul className="space-y-1.5 text-xs text-slate-600">
                              {(stage.teacherTasks || []).map((task: string, tIdx: number) => (
                                <li key={tIdx} className="flex items-start gap-2">
                                  <span className="text-blue-500 font-bold">•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Herramientas sugeridas */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
                          <span className="font-bold text-slate-500">Herramientas sugeridas:</span>
                          {(stage.suggestedTools || []).map((tool: string, toolIdx: number) => (
                            <span key={toolIdx} className="px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[11px]">
                              {tool}
                            </span>
                          ))}
                        </div>

                        {/* Actividades vinculadas a esta etapa */}
                        {stageActs.length > 0 && (
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <h4 className="text-xs font-bold text-slate-700">Entregables de esta etapa:</h4>
                            <div className="space-y-2">
                              {stageActs.map((act) => (
                                <div
                                  key={act.id}
                                  onClick={() => navigate(`/alumno/aula-virtual/actividades/${act.id}`)}
                                  className="p-3 rounded-xl bg-white border border-slate-200 hover:border-[#0D71B9] cursor-pointer flex items-center justify-between gap-3 group transition-all"
                                >
                                  <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-[#0D71B9]" />
                                    <div>
                                      <h5 className="font-bold text-xs text-slate-900 group-hover:text-[#0D71B9]">
                                        {act.title}
                                      </h5>
                                      <span className="text-[10px] text-slate-400">
                                        Vence: {new Date(act.dueDate).toLocaleDateString('es-SV')}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-bold text-[#0D71B9]">Abrir entrega →</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: PROYECTO ANUAL ASIGNADO */}
      {activeTab === 'proyecto' && currentProject && (
        <div className="space-y-6">
          <div className="card-crema p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl border border-indigo-700 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                    Ciclo Lectivo {currentProject.academicYear}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                    Proyecto Integrador
                  </span>
                </div>

                {!isStudent ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedCohortYear}
                      onChange={(e) => setSelectedCohortYear(e.target.value)}
                      className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    >
                      <option value="2025" className="text-slate-900">Cohorte 2025</option>
                      <option value="2026" className="text-slate-900">Cohorte 2026 (Actual)</option>
                      <option value="2027" className="text-slate-900">Cohorte 2027 (Próximo)</option>
                    </select>

                    <button
                      type="button"
                      disabled={generatingProject}
                      onClick={handleGenerateNewProject}
                      className="px-3 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generatingProject ? 'animate-spin' : ''}`} />
                      <span>{generatingProject ? 'Generando...' : 'Generar Nuevo Proyecto'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-blue-200 bg-white/10 px-3 py-1 rounded-xl border border-white/15">
                      Asignado por el Docente
                    </span>
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  {currentProject.theme}
                </span>
                <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white mt-1">
                  {currentProject.title}
                </h2>
                <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-3xl">
                  <strong>Cliente / Contraparte Real:</strong> {currentProject.targetClient}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-crema p-6 space-y-3 border border-slate-200">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-600" />
                Situación Problemática a Resolver
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentProject.problemStatement}
              </p>
            </div>

            <div className="card-crema p-6 space-y-3 border border-slate-200">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Brief Creativo y Enfoque Visual
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentProject.creativeBrief}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="card-crema p-5 space-y-2 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Entregables Requeridos
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(currentProject?.deliverables || []).map((item: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-crema p-5 space-y-2 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-600" />
                Software Especializado
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(currentProject?.suggestedSoftware || []).map((sw: string, idx: number) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs">
                    {sw}
                  </span>
                ))}
              </div>
            </div>

            <div className="card-crema p-5 space-y-2 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                Materiales e Insumos
              </h4>
              <ul className="space-y-1 text-xs text-slate-600">
                {(currentProject?.materialsRequired || []).map((mat: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{mat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: DESCRIPTOR TÉCNICO MINED */}
      {activeTab === 'descriptor' && descriptor && (
        <div className="space-y-6" data-color-mode="light">
          {/* If teacher has set a markdown descriptor, show it prominently */}
          {descriptor.markdownContent && (
            <div className="card-crema p-6 border border-[#0D71B9]/20 bg-gradient-to-br from-blue-50/60 to-white space-y-3 rounded-3xl shadow-sm">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-5 h-5 text-[#0D71B9]" />
                <h3 className="font-display font-bold text-slate-900 text-lg">Descriptor del Módulo</h3>
                <span className="ml-auto text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-medium">Editado por el docente</span>
              </div>
              <div className="wmde-markdown-var prose prose-sm max-w-none text-slate-700">
                <MDEditor.Markdown source={descriptor.markdownContent} />
              </div>
            </div>
          )}
          <div className="card-crema p-6 border border-slate-200 space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0D71B9]" />
              Generalidades del Módulo (MINED)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-bold">Código Oficial:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{descriptor.code || c.code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-bold">Carga Horaria:</span>
                <span className="font-bold text-slate-900 text-sm">{descriptor.hours || c.hours} Horas ({descriptor.weeks || c.weeks} sem.)</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-bold">Prerrequisito:</span>
                <span className="font-bold text-slate-900 text-sm">{descriptor.prerequisite || 'Noveno grado'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-bold">Criterio Promoción:</span>
                <span className="font-bold text-emerald-700 text-sm">{descriptor.promotionCriteria || 'Nivel 4 (7.0 Mínimo)'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase">Unidad de Competencia:</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {descriptor.competenceGeneral || 'Aplicar procesos técnicos de la especialidad.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase">Objetivo del Módulo:</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  {descriptor.moduleObjective || descriptor.objective || 'Desarrollar competencias en la especialidad técnica.'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-crema p-6 border border-slate-200 space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Los 4 Ejes de Desarrollo de la Competencia (MINED)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1.5">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wide block">
                  A. Desarrollo Técnico y Tecnológico (35%)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {descriptor.developmentAxes?.desarrolloTecnico || 'Dominio de herramientas técnicas.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1.5">
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                  B. Desarrollo Emprendedor y Productivo (25%)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {descriptor.developmentAxes?.desarrolloEmprendedor || 'Gestión de proyectos y modelos de negocio.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1.5">
                <span className="text-xs font-bold text-purple-800 uppercase tracking-wide block">
                  C. Desarrollo Humano y Social (20%)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {descriptor.developmentAxes?.desarrolloHumanoSocial || 'Valores cooperativos y ética profesional.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1.5">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide block">
                  D. Desarrollo Académico Aplicado (20%)
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {descriptor.developmentAxes?.desarrolloAcademicoAplicado || 'Racional técnico y comunicación.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-crema p-6 space-y-3 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Criterios de Evaluación Normativos
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                {(descriptor.evaluationCriteria || []).map((crit: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-crema p-6 space-y-3 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Fuentes de Información y Consulta
              </h4>
              <div className="space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-700">Libros de Investigación:</p>
                <ul className="space-y-1 pl-2">
                  {(descriptor.bibliography?.books || []).map((b: string, idx: number) => (
                    <li key={idx}>• {b}</li>
                  ))}
                </ul>
                {(descriptor.bibliography?.websites || []).length > 0 && (
                  <>
                    <p className="font-semibold text-slate-700 pt-2">Sitios Web Recomendados:</p>
                    <ul className="space-y-1 pl-2">
                      {descriptor.bibliography.websites.map((w: string, idx: number) => (
                        <li key={idx} className="text-blue-600 font-mono text-[11px]">• {w}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5b. TAB: JORNALIZACIÓN */}
      {activeTab === 'jornalizacion' && c.jornalizacion && (
        <div className="space-y-6">
          <div className="card-crema p-6 border border-slate-200 space-y-4 rounded-3xl shadow-sm">
            <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0D71B9]" />
              Jornalización del Módulo
            </h3>
            <div className="space-y-4">
              {c.jornalizacion.map((stage: any, idx: number) => {
                const isLast = idx === c.jornalizacion.length - 1;
                return (
                  <div key={idx} className={`p-5 rounded-2xl border flex gap-4 items-start ${
                    isLast ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-slate-50/60'
                  }`}>
                    <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isLast ? 'bg-amber-400 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{stage.name || stage.stage}</h4>
                        {isLast && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Entrega Final</span>
                        )}
                      </div>
                      {stage.description && <p className="text-xs text-slate-600">{stage.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                        {stage.startDate && <span>📅 Inicio: <strong className="text-slate-700">{new Date(stage.startDate + 'T00:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>}
                        {stage.endDate && <span>🏁 Fin: <strong className="text-slate-700">{new Date(stage.endDate + 'T00:00:00').toLocaleDateString('es-SV', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>}
                        {stage.hours > 0 && <span>⏱️ <strong className="text-slate-700">{stage.hours}h</strong></span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 mt-2">
              <span className="text-amber-500 text-lg">⚠️</span>
              <p className="text-xs text-amber-800">La entrega del proyecto final se realiza <strong>4 días hábiles (8 horas) antes</strong> de la fecha de cierre del módulo. Verifica con tu docente la fecha exacta.</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: SABERES PREVIOS Y NECESARIOS */}
      {activeTab === 'saberes' && descriptor && (
        <div className="space-y-6">
          <div className="card-crema p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg">
                  Cuestionario Diagnóstico de Saberes Previos
                </h3>
                <p className="text-xs text-slate-500">
                  Autoevaluación de conocimientos de entrada para construir el contrato de aprendizaje
                </p>
              </div>
              <span className="text-xs font-bold text-[#0D71B9] bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                Etapa 1: Informarse
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Saber Previo a Evaluar</th>
                    <th className="py-2.5 px-3 text-center">MUCHO</th>
                    <th className="py-2.5 px-3 text-center">POCO</th>
                    <th className="py-2.5 px-3 text-center">NADA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(descriptor.saberesPrevios || []).map((saber: any, sIdx: number) => (
                    <tr key={saber.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-bold text-slate-400">{sIdx + 1}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium">{saber.description}</td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaberAppreciation(saber.id, 'MUCHO')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            saber.appreciation === 'MUCHO'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Mucho
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaberAppreciation(saber.id, 'POCO')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            saber.appreciation === 'POCO'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Poco
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleSaberAppreciation(saber.id, 'NADA')}
                          className={`px-3 py-1 rounded-lg font-bold transition-all ${
                            saber.appreciation === 'NADA'
                              ? 'bg-rose-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Nada
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card-crema p-6 border border-slate-200 space-y-3">
            <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Saberes Necesarios Acordados para el Proyecto
            </h3>
            <p className="text-xs text-slate-500">
              Resultantes de los saberes evaluados en &quot;Poco&quot; y &quot;Nada&quot; más los aportes en plenaria.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {(descriptor.saberesNecesarios || []).map((item: any, idx: number) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{item.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: ACTIVIDADES */}
      {activeTab === 'actividades' && (
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="card-crema p-10 text-center border border-slate-200">
              <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No hay actividades asignadas aún.</p>
            </div>
          ) : (
            activities.map((activity, idx) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                index={idx}
                onSelect={() => navigate(`/alumno/aula-virtual/actividades/${activity.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* 8. TAB 6: CALIFICACIONES Y RÚBRICA MINED */}
      {activeTab === 'calificaciones' && (
        <div className="card-crema p-6 border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-display font-bold text-slate-900 text-lg">
                Rúbrica de Evaluación por Competencias MINED
              </h3>
              <p className="text-xs text-slate-500">
                Escala oficial del 1 al 5. Nivel mínimo aprobatorio: 4 (Realiza por sí mismo(a)).
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              Nivel Actual: {c.minedLevel || 4} ({c.averageGrade || 8.8} pts)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((lvl) => {
              const def = MINED_LEVELS[lvl as MinedLevel];
              const isCurrent = (c.minedLevel || 4) === lvl;
              return (
                <div
                  key={lvl}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-500">Nivel {lvl}</span>
                  <p className="font-extrabold text-sm text-slate-900 mt-0.5">
                    {typeof def.gradeRange === 'string' ? def.gradeRange : def.gradeRange ? `${def.gradeRange.min} - ${def.gradeRange.max}` : ''}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-2 leading-tight">{def.description}</p>
                  <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${def.approved ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {def.approved ? 'Aprobado' : 'Reprobado'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LMSCourseDetail;
