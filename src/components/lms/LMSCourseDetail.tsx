import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  Award,
  FileText,
  AlertCircle,
  Layers,
  Target,
  CheckCircle2,
  HelpCircle,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Check,
  Sparkles,
} from 'lucide-react';
import { lmsService } from '../../services/lmsService';
import { LMSModule } from '../../types';

interface LMSCourseDetailProps {
  courseId: string;
  onBack?: () => void;
}

export const LMSCourseDetail: React.FC<LMSCourseDetailProps> = ({
  courseId,
  onBack = () => {},
}) => {
  const [module, setModule] = useState<LMSModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'descriptor' | 'etapas' | 'proyecto' | 'evaluacion'>('info');
  const [expandedStage, setExpandedStage] = useState<string | null>(null);

  useEffect(() => {
    loadModule();
  }, [courseId]);

  const loadModule = async () => {
    try {
      const mod = await lmsService.getModuleById(courseId);
      setModule(mod);
    } catch (e) {
      console.error('Error loading module:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="card-crema p-12 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h3 className="font-display font-bold text-slate-800 text-lg">Módulo no encontrado</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          El módulo técnico solicitado no existe o no está disponible.
        </p>
        <button type="button" onClick={onBack} className="btn-primary">
          Volver
        </button>
      </div>
    );
  }

  const descriptor = module.descriptor;
  const stages = descriptor?.units || [];
  const actionStages = [
    { key: 'informar', label: 'Informar', pct: 10, color: 'blue' },
    { key: 'planificar', label: 'Planificar', pct: 10, color: 'amber' },
    { key: 'decidir', label: 'Decidir', pct: 10, color: 'purple' },
    { key: 'ejecutar', label: 'Ejecutar', pct: 25, color: 'emerald' },
    { key: 'controlar', label: 'Controlar', pct: 25, color: 'cyan' },
    { key: 'valorar', label: 'Valorar', pct: 20, color: 'rose' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-crema p-6 relative overflow-hidden border border-slate-200 shadow-sm">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none bg-primary" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white tracking-wide">
                  {module.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                  {module.technicalYear}° Año Técnico • {module.hours}h ({module.weeks} sem)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  module.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                }`}>
                  {module.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <h1 className="font-display font-extrabold text-xl md:text-2xl text-slate-900 leading-tight">
                {module.name}
              </h1>

              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600 font-medium">
                {module.teacherName && (
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Docente: <strong>{module.teacherName}</strong></span>
                  </div>
                )}
                {module.gradeName && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{module.gradeName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`filter-pill ${activeTab === 'info' ? 'filter-pill-active' : ''}`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Información</span>
        </button>
        {descriptor && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('descriptor')}
              className={`filter-pill ${activeTab === 'descriptor' ? 'filter-pill-active' : ''}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Descriptor</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('etapas')}
              className={`filter-pill ${activeTab === 'etapas' ? 'filter-pill-active' : ''}`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Etapas</span>
            </button>
            {descriptor?.currentProject && (
              <button
                type="button"
                onClick={() => setActiveTab('proyecto')}
                className={`filter-pill ${activeTab === 'proyecto' ? 'filter-pill-active' : ''}`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Proyecto</span>
              </button>
            )}
            {descriptor?.evaluationCriteria && descriptor.evaluationCriteria.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('evaluacion')}
                className={`filter-pill ${activeTab === 'evaluacion' ? 'filter-pill-active' : ''}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Evaluación</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Tab: Info */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-crema p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Carga Horaria</span>
                <span className="font-display font-extrabold text-lg text-slate-900">{module.hours}h</span>
              </div>
            </div>
            <p className="text-xs text-slate-500">{module.weeks} semanas de duración</p>
          </div>

          <div className="card-crema p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Docente</span>
                <span className="font-display font-bold text-sm text-slate-900">{module.teacherName || 'Sin asignar'}</span>
              </div>
            </div>
          </div>

          <div className="card-crema p-5 border border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Grado</span>
                <span className="font-display font-bold text-sm text-slate-900">{module.gradeName || 'General'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Descriptor */}
      {activeTab === 'descriptor' && descriptor && (
        <div className="space-y-6">
          {/* Generalidades */}
          <div className="card-crema p-6 border border-slate-200 space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-lg border-b border-slate-100 pb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Generalidades del Módulo
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-bold">Código:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">{module.code}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-400 block font-bold">Carga Horaria:</span>
                <span className="font-bold text-slate-900 text-sm">{module.hours}h ({module.weeks} sem)</span>
              </div>
              {descriptor.moduleObjective && (
                <div className="col-span-2 p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block font-bold">Objetivo:</span>
                  <p className="text-xs text-slate-700 mt-1">{descriptor.moduleObjective}</p>
                </div>
              )}
            </div>

            {descriptor.developmentAxes && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {Object.entries(descriptor.developmentAxes).map(([key, value]) => {
                  if (!value) return null;
                  const labels: Record<string, string> = {
                    desarrolloTecnico: 'Desarrollo Técnico',
                    desarrolloEmprendedor: 'Desarrollo Emprendedor',
                    desarrolloHumanoSocial: 'Desarrollo Humano y Social',
                    desarrolloAcademicoAplicado: 'Desarrollo Académico Aplicado',
                  };
                  return (
                    <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">{labels[key] || key}</span>
                      <p className="text-xs text-slate-700 mt-1">{value as string}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saberes Previos */}
          {descriptor.saberesPrevios && descriptor.saberesPrevios.length > 0 && (
            <div className="card-crema p-6 border border-slate-200 space-y-3">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                Saberes Previos
              </h3>
              <div className="space-y-2">
                {descriptor.saberesPrevios.map((saber, idx) => (
                  <div key={saber.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-blue-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{saber.description || saber.question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Etapas */}
      {activeTab === 'etapas' && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span><strong>Metodología de Proyecto:</strong> 6 Etapas de la Acción Completa</span>
            </div>
            <span className="font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 shrink-0">
              Total: {module.hours}h
            </span>
          </div>

          {actionStages.map((stage, idx) => {
            const hours = Math.round((module.hours * stage.pct) / 100);
            const isExpanded = expandedStage === stage.key;
            const colorMap: Record<string, { bg: string; text: string; badge: string }> = {
              blue: { bg: 'bg-blue-500', text: 'text-blue-700', badge: 'bg-blue-50 border-blue-200' },
              amber: { bg: 'bg-amber-500', text: 'text-amber-700', badge: 'bg-amber-50 border-amber-200' },
              purple: { bg: 'bg-purple-500', text: 'text-purple-700', badge: 'bg-purple-50 border-purple-200' },
              emerald: { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-50 border-emerald-200' },
              cyan: { bg: 'bg-cyan-500', text: 'text-cyan-700', badge: 'bg-cyan-50 border-cyan-200' },
              rose: { bg: 'bg-rose-500', text: 'text-rose-700', badge: 'bg-rose-50 border-rose-200' },
            };
            const colors = colorMap[stage.color];

            return (
              <div key={stage.key} className="card-crema overflow-hidden border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setExpandedStage(isExpanded ? null : stage.key)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl ${colors.bg} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-slate-900 text-sm">{stage.label}</h3>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${colors.badge} ${colors.text}`}>
                          {stage.pct}% • {hours}h
                        </span>
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100">
                    <p className="text-xs text-slate-500 italic">
                      Contenido de la etapa {stage.label} — el docente puede agregar teoría, ejemplos y ejercicios desde el editor de contenido.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab: Proyecto */}
      {activeTab === 'proyecto' && descriptor?.currentProject && (
        <div className="space-y-6">
          <div className="card-crema p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl border border-indigo-700 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                  Ciclo Lectivo {descriptor.currentProject.academicYear}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                  Proyecto Integrador
                </span>
              </div>
              <div>
                {descriptor.currentProject.theme && (
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">{descriptor.currentProject.theme}</span>
                )}
                <h2 className="font-display font-extrabold text-2xl text-white mt-1">{descriptor.currentProject.title}</h2>
                {descriptor.currentProject.targetClient && (
                  <p className="text-xs text-slate-300 mt-2"><strong>Cliente:</strong> {descriptor.currentProject.targetClient}</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {descriptor.currentProject.problemStatement && (
              <div className="card-crema p-6 space-y-3 border border-slate-200">
                <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-600" />
                  Situación Problemática
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{descriptor.currentProject.problemStatement}</p>
              </div>
            )}
            {descriptor.currentProject.creativeBrief && (
              <div className="card-crema p-6 space-y-3 border border-slate-200">
                <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Brief Creativo
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{descriptor.currentProject.creativeBrief}</p>
              </div>
            )}
          </div>

          {descriptor.currentProject.deliverables && descriptor.currentProject.deliverables.length > 0 && (
            <div className="card-crema p-6 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Entregables Requeridos
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {descriptor.currentProject.deliverables.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {descriptor.currentProject.suggestedSoftware && descriptor.currentProject.suggestedSoftware.length > 0 && (
            <div className="card-crema p-6 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-3">
                Software Especializado
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {descriptor.currentProject.suggestedSoftware.map((sw, idx) => (
                  <span key={idx} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs">{sw}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Evaluación */}
      {activeTab === 'evaluacion' && descriptor && (
        <div className="space-y-6">
          {descriptor.evaluationCriteria && descriptor.evaluationCriteria.length > 0 && (
            <div className="card-crema p-6 border border-slate-200">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Criterios de Evaluación
              </h3>
              <ul className="space-y-2 text-xs text-slate-600">
                {descriptor.evaluationCriteria.map((crit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{crit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {descriptor.bibliography && (
            <div className="card-crema p-6 border border-slate-200">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Fuentes de Información
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                {descriptor.bibliography.books && descriptor.bibliography.books.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Libros:</p>
                    <ul className="space-y-1 pl-2">{descriptor.bibliography.books.map((b, idx) => <li key={idx}>• {b}</li>)}</ul>
                  </div>
                )}
                {descriptor.bibliography.websites && descriptor.bibliography.websites.length > 0 && (
                  <div>
                    <p className="font-semibold text-slate-700 mb-1">Sitios Web:</p>
                    <ul className="space-y-1 pl-2">{descriptor.bibliography.websites.map((w, idx) => <li key={idx} className="text-blue-600 font-mono text-[11px]">• {w}</li>)}</ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {descriptor.saberesNecesarios && descriptor.saberesNecesarios.length > 0 && (
            <div className="card-crema p-6 border border-slate-200">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2 mb-4">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                Saberes Necesarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {descriptor.saberesNecesarios.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5 text-xs text-slate-700">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                    <span>{item.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LMSCourseDetail;
