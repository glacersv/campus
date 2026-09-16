import React, { useState, useEffect } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { lmsService } from '../../services/lmsService';
import { getModuleDescriptorData, GENERATE_ANNUAL_PROJECT } from '../../services/btvCurriculumData';
import { LMSModule, ActionStageKey, ProjectBrief } from '../../types';
import {
  calculateStageJornalizacion,
  calculateProjectDeliveryDate,
  formatDateSpanish,
  StageJornalizacionItem,
} from '../../utils/jornalizacionHelper';
import {
  ArrowLeft,
  Save,
  FileText,
  Calendar,
  Layers,
  Sparkles,
  HelpCircle,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  BookOpen,
  FolderOpen,
  Cpu,
  Target,
  UserCheck,
  GraduationCap,
  Check,
} from 'lucide-react';
import MDEditor from '@uiw/react-md-editor';
import { toast } from 'sonner';

interface LMSModuleEditorProps {
  module: LMSModule;
  onBack: () => void;
  onSaved: () => void;
}

type TabType = 'descriptor' | 'etapas' | 'proyecto' | 'saberes' | 'jornalizacion';

export default function LMSModuleEditor({ module, onBack, onSaved }: LMSModuleEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>('descriptor');
  const [saving, setSaving] = useState(false);

  // Fallback initial descriptor
  const initialDescriptor: any = module.descriptor && Object.keys(module.descriptor).length > 0
    ? module.descriptor
    : getModuleDescriptorData(module.code);

  // State for basic info
  const [code, setCode] = useState(module.code || '');
  const [name, setName] = useState(module.name || '');
  const [description, setDescription] = useState(module.description || '');
  const [hours, setHours] = useState<number>(module.hours || 72);
  const [weeks, setWeeks] = useState<number>(module.weeks || 4);
  const [technicalYear, setTechnicalYear] = useState<'1' | '2' | '3'>(module.technicalYear || '1');
  const [affineArea, setAffineArea] = useState(module.affineArea || 'Especialidad Gráfica');
  const [schedule, setSchedule] = useState(module.schedule || 'Lunes a Viernes 7:00 AM - 12:00 PM');
  const [classroom, setClassroom] = useState(module.classroom || 'Laboratorio de Diseño');
  const [color, setColor] = useState(module.color || '#0D71B9');

  // State for MINED Generalities
  const [prerequisite, setPrerequisite] = useState(initialDescriptor?.prerequisite || 'Noveno grado');
  const [promotionCriteria, setPromotionCriteria] = useState(initialDescriptor?.promotionCriteria || 'Nivel 4 (7.0 Mínimo)');
  const [competenceGeneral, setCompetenceGeneral] = useState(initialDescriptor?.competenceGeneral || '');
  const [moduleObjective, setModuleObjective] = useState(initialDescriptor?.moduleObjective || initialDescriptor?.objective || '');

  // State for 4 Axes
  const [desarrolloTecnico, setDesarrolloTecnico] = useState(
    initialDescriptor?.developmentAxes?.desarrolloTecnico || 'Dominio de herramientas técnicas y procesos de diseño.'
  );
  const [desarrolloEmprendedor, setDesarrolloEmprendedor] = useState(
    initialDescriptor?.developmentAxes?.desarrolloEmprendedor || 'Gestión de proyectos, optimización de insumos y modelos de negocio.'
  );
  const [desarrolloHumanoSocial, setDesarrolloHumanoSocial] = useState(
    initialDescriptor?.developmentAxes?.desarrolloHumanoSocial || 'Valores cooperativos, liderazgo participativo y ética profesional.'
  );
  const [desarrolloAcademicoAplicado, setDesarrolloAcademicoAplicado] = useState(
    initialDescriptor?.developmentAxes?.desarrolloAcademicoAplicado || 'Racional técnico, semiótica, comunicación visual y cálculo aplicado.'
  );

  // State for Evaluation Criteria & Bibliography
  const [evaluationCriteria, setEvaluationCriteria] = useState<string[]>(
    initialDescriptor?.evaluationCriteria || [
      'Aplica herramientas y procesos técnicos con destreza.',
      'Ejecuta proyectos en las 6 etapas de la acción completa.',
      'Cumple normas de calidad y especificaciones del cliente.',
    ]
  );
  const [books, setBooks] = useState<string[]>(
    initialDescriptor?.bibliography?.books || ['Manual de Diseño MINED / Ricaldone']
  );
  const [websites, setWebsites] = useState<string[]>(
    initialDescriptor?.bibliography?.websites || ['https://www.mined.gob.sv']
  );
  const [markdownContent, setMarkdownContent] = useState(initialDescriptor?.markdownContent || '');

  // State for 6 Action Stages
  const [actionStages, setActionStages] = useState<Record<string, any>>(
    initialDescriptor?.actionStages || {}
  );
  const [activeStageKey, setActiveStageKey] = useState<ActionStageKey>('informar');

  // State for Annual Project
  const defaultProject = initialDescriptor?.currentProject || GENERATE_ANNUAL_PROJECT(module.code, '2026');
  const [projectAcademicYear, setProjectAcademicYear] = useState(defaultProject?.academicYear || '2026');
  const [projectTheme, setProjectTheme] = useState(defaultProject?.theme || 'DISEÑO GRÁFICO');
  const [projectTitle, setProjectTitle] = useState(defaultProject?.title || 'Proyecto Integrador');
  const [projectClient, setProjectClient] = useState(defaultProject?.targetClient || 'Cliente o contraparte local');
  const [projectProblem, setProjectProblem] = useState(defaultProject?.problemStatement || '');
  const [projectBrief, setProjectBrief] = useState(defaultProject?.creativeBrief || '');
  const [projectDeliverables, setProjectDeliverables] = useState<string[]>(defaultProject?.deliverables || ['Arte final impreso y digital']);
  const [projectSoftware, setProjectSoftware] = useState<string[]>(defaultProject?.suggestedSoftware || ['Adobe Illustrator', 'Adobe Photoshop']);
  const [projectMaterials, setProjectMaterials] = useState<string[]>(defaultProject?.materialsRequired || ['Papel bond / couché', 'Bitácora']);

  // State for Saberes
  const [saberesPrevios, setSaberesPrevios] = useState<Array<{ id: string; description: string; appreciation?: 'MUCHO' | 'POCO' | 'NADA' }>>(
    (initialDescriptor?.saberesPrevios && initialDescriptor.saberesPrevios.length > 0)
      ? initialDescriptor.saberesPrevios.map((sp: any) => ({
          id: sp.id || `sp-${Date.now()}`,
          description: sp.description || '',
          appreciation: (sp.appreciation as any) || 'POCO',
        }))
      : [
          { id: 'sp-1', description: 'Conceptos fundamentales y terminología del módulo.', appreciation: 'POCO' },
          { id: 'sp-2', description: 'Manejo básico de software y herramientas del área.', appreciation: 'POCO' },
        ]
  );
  const [saberesNecesarios, setSaberesNecesarios] = useState<Array<{ id: string; description: string }>>(
    (initialDescriptor?.saberesNecesarios && initialDescriptor.saberesNecesarios.length > 0)
      ? initialDescriptor.saberesNecesarios.map((sn: any) => ({
          id: sn.id || `sn-${Date.now()}`,
          description: sn.description || '',
        }))
      : [
          { id: 'sn-1', description: 'Especificaciones técnicas de producción y arte final.' },
          { id: 'sn-2', description: 'Aplicación de metodología en las 6 etapas orientadas a la acción.' },
        ]
  );

  // State for Jornalizacion / Dates
  const [startDate, setStartDate] = useState<string>(
    module.jornalizacion?.[0]?.startDate || '2026-01-19'
  );
  const [endDate, setEndDate] = useState<string>(
    module.jornalizacion?.[module.jornalizacion.length - 1]?.endDate || '2026-02-13'
  );
  const [jornalizacion, setJornalizacion] = useState<StageJornalizacionItem[]>(
    (module.jornalizacion as StageJornalizacionItem[]) ||
      calculateStageJornalizacion(name, hours, startDate, endDate)
  );

  // Auto-calculated project delivery date (4 business days before module end)
  const projectDeliveryDate = calculateProjectDeliveryDate(endDate);

  // Auto-update hours when weeks changes or vice versa
  const handleWeeksChange = (w: number) => {
    setWeeks(w);
    const newHours = w * 18;
    setHours(newHours);
  };

  // Recalculate stages when user requests it or on date update
  const handleRecalculateJornalizacion = () => {
    const calculated = calculateStageJornalizacion(name, hours, startDate, endDate);
    setJornalizacion(calculated);
    toast.success('Jornalización recalculada con base en las fechas y etapas.');
  };

  // Generate new project brief suggestion
  const handleGenerateProjectSuggestion = () => {
    const suggestion = GENERATE_ANNUAL_PROJECT(code, projectAcademicYear);
    setProjectTheme(suggestion.theme);
    setProjectTitle(suggestion.title);
    setProjectClient(suggestion.targetClient);
    setProjectProblem(suggestion.problemStatement);
    setProjectBrief(suggestion.creativeBrief);
    setProjectDeliverables(suggestion.deliverables);
    setProjectSoftware(suggestion.suggestedSoftware);
    setProjectMaterials(suggestion.materialsRequired);
    toast.success('Sugerencia de proyecto generada para el módulo.');
  };

  // Save handler
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const updatedProject: ProjectBrief = {
        id: `proj-${code.toLowerCase().replace(/\s+/g, '-')}-${projectAcademicYear}`,
        academicYear: projectAcademicYear,
        theme: projectTheme,
        title: projectTitle,
        targetClient: projectClient,
        problemStatement: projectProblem,
        creativeBrief: projectBrief,
        deliverables: projectDeliverables.filter((d) => d.trim().length > 0),
        suggestedSoftware: projectSoftware.filter((s) => s.trim().length > 0),
        materialsRequired: projectMaterials.filter((m) => m.trim().length > 0),
        status: 'active',
      };

      const updatedDescriptor = {
        code,
        name,
        hours,
        weeks,
        technicalYear,
        prerequisite,
        promotionCriteria,
        competenceGeneral,
        moduleObjective,
        objective: moduleObjective,
        developmentAxes: {
          desarrolloTecnico,
          desarrolloEmprendedor,
          desarrolloHumanoSocial,
          desarrolloAcademicoAplicado,
        },
        evaluationCriteria: evaluationCriteria.filter((c) => c.trim().length > 0),
        bibliography: {
          books: books.filter((b) => b.trim().length > 0),
          websites: websites.filter((w) => w.trim().length > 0),
        },
        actionStages,
        currentProject: updatedProject,
        saberesPrevios,
        saberesNecesarios,
        markdownContent,
      };

      const updatedModuleData: Partial<LMSModule> = {
        code,
        name,
        description,
        hours,
        weeks,
        technicalYear,
        affineArea,
        schedule,
        classroom,
        color,
        descriptor: updatedDescriptor as any,
        jornalizacion: jornalizacion,
        updatedAt: new Date().toISOString(),
      };

      // 1. Update Firestore
      const moduleRef = doc(db, 'lms_modules', module.id);
      await updateDoc(moduleRef, updatedModuleData);

      // 2. Update LMSService memory state and notify listeners
      await lmsService.updateModule(module.id, updatedModuleData);

      toast.success('Módulo y contenido curricular guardados exitosamente');
      onSaved();
    } catch (error) {
      console.error('Error saving module:', error);
      toast.error('Ocurrió un error al guardar el módulo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-200" data-color-mode="light">
      {/* 1. Header Banner */}
      <div className="card-crema p-6 md:p-8 bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-10 pointer-events-none"
          style={{ backgroundColor: color }}
        />

        <div className="flex items-start gap-4 relative z-10">
          <button
            type="button"
            onClick={onBack}
            className="p-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
            title="Volver"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg text-white"
                style={{ backgroundColor: color }}
              >
                {code || 'MOD'}
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {technicalYear}° Año Técnico • {hours} Horas ({weeks} {weeks === 1 ? 'semana' : 'semanas'})
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {affineArea}
              </span>
            </div>

            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 leading-tight">
              {name || 'Edición del Módulo'}
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              Configura todo el contenido que los alumnos visualizarán en su Aula Virtual (Descriptor, 6 Etapas, Proyecto de Módulo, Saberes y Jornalización).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-6 py-3 bg-[#0D71B9] hover:bg-[#0b5c96] text-white font-bold rounded-2xl text-sm flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
            <span>{saving ? 'Guardando...' : 'Guardar Todos los Cambios'}</span>
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('descriptor')}
          className={`filter-pill ${activeTab === 'descriptor' ? 'filter-pill-active' : ''}`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Descriptor MINED y Generalidades</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('etapas')}
          className={`filter-pill ${activeTab === 'etapas' ? 'filter-pill-active' : ''}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2. 6 Etapas de Acción Completa</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proyecto')}
          className={`filter-pill ${activeTab === 'proyecto' ? 'filter-pill-active' : ''}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>3. Proyecto de Módulo ({projectAcademicYear})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saberes')}
          className={`filter-pill ${activeTab === 'saberes' ? 'filter-pill-active' : ''}`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>4. Saberes Previos y Necesarios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('jornalizacion')}
          className={`filter-pill ${activeTab === 'jornalizacion' ? 'filter-pill-active' : ''}`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>5. Jornalización y Fechas</span>
        </button>
      </div>

      {/* 3. TAB 1: DESCRIPTOR TÉCNICO MINED & GENERALIDADES */}
      {activeTab === 'descriptor' && (
        <div className="space-y-6">
          {/* Generalidades */}
          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <FileText className="w-5 h-5 text-[#0D71B9]" />
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Generalidades del Módulo (MINED)</h3>
                <p className="text-xs text-slate-500">Datos identificadores, carga horaria y objetivos oficiales</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Código Oficial:</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  placeholder="ej: BTVDG2.0"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre Oficial del Módulo:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  placeholder="Nombre del módulo"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Año Técnico:</label>
                <select
                  value={technicalYear}
                  onChange={(e) => setTechnicalYear(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                >
                  <option value="1">1° Año Técnico</option>
                  <option value="2">2° Año Técnico</option>
                  <option value="3">3° Año Técnico</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Semanas Lectivas:</label>
                <input
                  type="number"
                  value={weeks}
                  onChange={(e) => handleWeeksChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Carga Horaria (Horas):</label>
                <input
                  type="number"
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  min={1}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Prerrequisito:</label>
                <input
                  type="text"
                  value={prerequisite}
                  onChange={(e) => setPrerequisite(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  placeholder="ej: Noveno grado"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Criterio Promoción:</label>
                <input
                  type="text"
                  value={promotionCriteria}
                  onChange={(e) => setPromotionCriteria(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-emerald-700 font-bold text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  placeholder="ej: Nivel 4 (7.0 Mínimo)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Área Afín / Especialidad:</label>
                <input
                  type="text"
                  value={affineArea}
                  onChange={(e) => setAffineArea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0D71B9] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horario de Clases:</label>
                <input
                  type="text"
                  value={schedule}
                  onChange={(e) => setSchedule(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0D71B9] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Aula / Taller:</label>
                <input
                  type="text"
                  value={classroom}
                  onChange={(e) => setClassroom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-xs focus:ring-2 focus:ring-[#0D71B9] outline-none"
                />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Unidad de Competencia:</label>
                <textarea
                  rows={2}
                  value={competenceGeneral}
                  onChange={(e) => setCompetenceGeneral(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  placeholder="Redacte la unidad de competencia..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Objetivo del Módulo:</label>
                <textarea
                  rows={2}
                  value={moduleObjective}
                  onChange={(e) => setModuleObjective(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-[#0D71B9] outline-none"
                  placeholder="Redacte el objetivo general del módulo..."
                />
              </div>
            </div>
          </div>

          {/* Los 4 Ejes de Desarrollo de la Competencia */}
          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Award className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900">Los 4 Ejes de Desarrollo de la Competencia (MINED)</h3>
                <p className="text-xs text-slate-500">Ponderaciones y descriptores por cada dimensión formativa</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-2">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wide block">
                  A. Desarrollo Técnico y Tecnológico (35%)
                </span>
                <textarea
                  rows={3}
                  value={desarrolloTecnico}
                  onChange={(e) => setDesarrolloTecnico(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-blue-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wide block">
                  B. Desarrollo Emprendedor y Productivo (25%)
                </span>
                <textarea
                  rows={3}
                  value={desarrolloEmprendedor}
                  onChange={(e) => setDesarrolloEmprendedor(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-amber-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-2">
                <span className="text-xs font-bold text-purple-900 uppercase tracking-wide block">
                  C. Desarrollo Humano y Social (20%)
                </span>
                <textarea
                  rows={3}
                  value={desarrolloHumanoSocial}
                  onChange={(e) => setDesarrolloHumanoSocial(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide block">
                  D. Desarrollo Académico Aplicado (20%)
                </span>
                <textarea
                  rows={3}
                  value={desarrolloAcademicoAplicado}
                  onChange={(e) => setDesarrolloAcademicoAplicado(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-emerald-200 bg-white text-xs text-slate-800 leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Criterios y Fuentes de Consulta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-crema p-6 border border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Criterios de Evaluación Normativos
                </h4>
                <button
                  type="button"
                  onClick={() => setEvaluationCriteria([...evaluationCriteria, ''])}
                  className="text-xs font-bold text-[#0D71B9] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Agregar
                </button>
              </div>

              <div className="space-y-2">
                {evaluationCriteria.map((crit, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={crit}
                      onChange={(e) => {
                        const updated = [...evaluationCriteria];
                        updated[idx] = e.target.value;
                        setEvaluationCriteria(updated);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Criterio de evaluación..."
                    />
                    <button
                      type="button"
                      onClick={() => setEvaluationCriteria(evaluationCriteria.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-crema p-6 border border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Fuentes de Información y Consulta
                </h4>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">Libros de Investigación:</span>
                    <button
                      type="button"
                      onClick={() => setBooks([...books, ''])}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {books.map((b, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={b}
                          onChange={(e) => {
                            const updated = [...books];
                            updated[idx] = e.target.value;
                            setBooks(updated);
                          }}
                          className="flex-1 px-3 py-1 rounded-lg border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Título del libro o autor..."
                        />
                        <button
                          type="button"
                          onClick={() => setBooks(books.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-700">Sitios Web Recomendados:</span>
                    <button
                      type="button"
                      onClick={() => setWebsites([...websites, ''])}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {websites.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={w}
                          onChange={(e) => {
                            const updated = [...websites];
                            updated[idx] = e.target.value;
                            setWebsites(updated);
                          }}
                          className="flex-1 px-3 py-1 rounded-lg border border-slate-300 text-xs text-blue-600 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="https://..."
                        />
                        <button
                          type="button"
                          onClick={() => setWebsites(websites.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Descriptor Extendido Markdown */}
          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-slate-900">Descriptor Extendido (Markdown / WYSIWYG)</h3>
                <p className="text-xs text-slate-500">Agrega notas curriculares, rúbricas adicionales o contenido con formato enriquecido</p>
              </div>
            </div>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <MDEditor
                value={markdownContent}
                onChange={(val) => setMarkdownContent(val || '')}
                height={350}
                preview="edit"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: 6 ETAPAS DE LA ACCIÓN COMPLETA */}
      {activeTab === 'etapas' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-[#0D71B9] shrink-0" />
              <span>
                <strong>Metodología de Proyecto Orientada a la Acción:</strong> Configura las preguntas guías, actividades de los alumnos, rol docente y herramientas de cada etapa.
              </span>
            </div>
            <span className="font-bold text-[#0D71B9] bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-xs self-start sm:self-auto">
              Total Módulo: {hours} Horas
            </span>
          </div>

          {/* Selector de Etapa Activa */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {(['informar', 'planificar', 'decidir', 'ejecutar', 'controlar', 'valorar'] as ActionStageKey[]).map((stageKey, idx) => {
              const stageLabels: Record<ActionStageKey, { name: string; pct: number }> = {
                informar: { name: '1. Informar', pct: 10 },
                planificar: { name: '2. Planificar', pct: 10 },
                decidir: { name: '3. Decidir', pct: 10 },
                ejecutar: { name: '4. Ejecutar', pct: 25 },
                controlar: { name: '5. Controlar', pct: 25 },
                valorar: { name: '6. Valorar', pct: 20 },
              };
              const meta = stageLabels[stageKey];
              const isSelected = activeStageKey === stageKey;

              return (
                <button
                  key={stageKey}
                  type="button"
                  onClick={() => setActiveStageKey(stageKey)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-[#0D71B9] text-white border-[#0D71B9] shadow-md font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="text-[10px] uppercase opacity-80">{meta.pct}% ({Math.round(hours * (meta.pct / 100))}h)</div>
                  <div className="text-xs font-bold truncate mt-0.5">{meta.name}</div>
                </button>
              );
            })}
          </div>

          {/* Editor de la Etapa Seleccionada */}
          {(() => {
            const stage = actionStages[activeStageKey] || {
              key: activeStageKey,
              title: `Etapa de ${activeStageKey}`,
              hoursPercentage: activeStageKey === 'ejecutar' || activeStageKey === 'controlar' ? 25 : activeStageKey === 'valorar' ? 20 : 10,
              guidingQuestions: [
                `¿Qué debemos saber sobre ${name}?`,
                '¿Cuáles son las especificaciones técnicas?',
              ],
              studentTasks: ['Investigación documental y práctica en taller.'],
              teacherTasks: ['Acompañamiento técnico y mediación pedagógica.'],
              suggestedTools: ['METAPLAN', 'Bitácora de Diseño'],
            };

            const stageHours = Math.round(hours * ((stage.hoursPercentage || 10) / 100));

            return (
              <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg text-slate-900 capitalize">
                      {stage.title || `Etapa de ${activeStageKey}`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Asignación horaria: <strong>{stage.hoursPercentage}% ({stageHours} Horas)</strong>
                    </p>
                  </div>
                </div>

                {/* Preguntas Guía */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                      Preguntas Guía de la Etapa:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = { ...actionStages };
                        const curr = updated[activeStageKey] || { ...stage };
                        curr.guidingQuestions = [...(curr.guidingQuestions || []), ''];
                        updated[activeStageKey] = curr;
                        setActionStages(updated);
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Añadir Pregunta
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(stage.guidingQuestions || []).map((q: string, qIdx: number) => (
                      <div key={qIdx} className="flex items-center gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => {
                            const updated = { ...actionStages };
                            const curr = updated[activeStageKey] || { ...stage };
                            const newQs = [...(curr.guidingQuestions || [])];
                            newQs[qIdx] = e.target.value;
                            curr.guidingQuestions = newQs;
                            updated[activeStageKey] = curr;
                            setActionStages(updated);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Escriba la pregunta guía..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...actionStages };
                            const curr = updated[activeStageKey] || { ...stage };
                            curr.guidingQuestions = curr.guidingQuestions.filter((_: any, i: number) => i !== qIdx);
                            updated[activeStageKey] = curr;
                            setActionStages(updated);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actividades del Alumnado y Rol Docente */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        Actividades del Alumnado:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...actionStages };
                          const curr = updated[activeStageKey] || { ...stage };
                          curr.studentTasks = [...(curr.studentTasks || []), ''];
                          updated[activeStageKey] = curr;
                          setActionStages(updated);
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Añadir
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(stage.studentTasks || []).map((t: string, tIdx: number) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <input
                            type="text"
                            value={t}
                            onChange={(e) => {
                              const updated = { ...actionStages };
                              const curr = updated[activeStageKey] || { ...stage };
                              const newTs = [...(curr.studentTasks || [])];
                              newTs[tIdx] = e.target.value;
                              curr.studentTasks = newTs;
                              updated[activeStageKey] = curr;
                              setActionStages(updated);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Tarea del alumno..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...actionStages };
                              const curr = updated[activeStageKey] || { ...stage };
                              curr.studentTasks = curr.studentTasks.filter((_: any, i: number) => i !== tIdx);
                              updated[activeStageKey] = curr;
                              setActionStages(updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-blue-800 uppercase flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-blue-600" />
                        Rol y Acompañamiento Docente:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = { ...actionStages };
                          const curr = updated[activeStageKey] || { ...stage };
                          curr.teacherTasks = [...(curr.teacherTasks || []), ''];
                          updated[activeStageKey] = curr;
                          setActionStages(updated);
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" /> Añadir
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(stage.teacherTasks || []).map((t: string, tIdx: number) => (
                        <div key={tIdx} className="flex items-center gap-2">
                          <span className="text-blue-500 font-bold">•</span>
                          <input
                            type="text"
                            value={t}
                            onChange={(e) => {
                              const updated = { ...actionStages };
                              const curr = updated[activeStageKey] || { ...stage };
                              const newTs = [...(curr.teacherTasks || [])];
                              newTs[tIdx] = e.target.value;
                              curr.teacherTasks = newTs;
                              updated[activeStageKey] = curr;
                              setActionStages(updated);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Rol del docente..."
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...actionStages };
                              const curr = updated[activeStageKey] || { ...stage };
                              curr.teacherTasks = curr.teacherTasks.filter((_: any, i: number) => i !== tIdx);
                              updated[activeStageKey] = curr;
                              setActionStages(updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Herramientas sugeridas */}
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-slate-700 block">Herramientas Sugeridas (separadas por coma o agregadas):</label>
                  <input
                    type="text"
                    value={(stage.suggestedTools || []).join(', ')}
                    onChange={(e) => {
                      const toolsArr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      const updated = { ...actionStages };
                      const curr = updated[activeStageKey] || { ...stage };
                      curr.suggestedTools = toolsArr;
                      updated[activeStageKey] = curr;
                      setActionStages(updated);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-[#0D71B9] outline-none"
                    placeholder="ej: METAPLAN, Diagrama de Gantt, Adobe Illustrator"
                  />
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 5. TAB 3: PROYECTO ANUAL INTEGRADOR */}
      {activeTab === 'proyecto' && (
        <div className="space-y-6">
          <div className="card-crema p-6 md:p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-3xl border border-indigo-700 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
                    Ciclo Lectivo {projectAcademicYear}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                    Proyecto Integrador
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={projectAcademicYear}
                    onChange={(e) => setProjectAcademicYear(e.target.value)}
                    className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="2025" className="text-slate-900">Cohorte 2025</option>
                    <option value="2026" className="text-slate-900">Cohorte 2026 (Actual)</option>
                    <option value="2027" className="text-slate-900">Cohorte 2027</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleGenerateProjectSuggestion}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sugerir con Plantilla BTV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1">Área Temática:</label>
                  <input
                    type="text"
                    value={projectTheme}
                    onChange={(e) => setProjectTheme(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-300 mb-1">Título del Proyecto:</label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-300 mb-1">Cliente / Contraparte Real:</label>
                <input
                  type="text"
                  value={projectClient}
                  onChange={(e) => setProjectClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs focus:outline-none"
                  placeholder="ej: Emprendimiento local de Santa Ana, Fundación Salesiana..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-crema p-6 space-y-3 border border-slate-200 bg-white rounded-3xl shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                <Target className="w-4 h-4 text-rose-600" />
                Situación Problemática a Resolver
              </h3>
              <textarea
                rows={4}
                value={projectProblem}
                onChange={(e) => setProjectProblem(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-700 leading-relaxed focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="Describa el problema gráfico o técnico real que el alumno debe solucionar..."
              />
            </div>

            <div className="card-crema p-6 space-y-3 border border-slate-200 bg-white rounded-3xl shadow-sm">
              <h3 className="font-display font-bold text-slate-900 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Brief Creativo y Enfoque Visual
              </h3>
              <textarea
                rows={4}
                value={projectBrief}
                onChange={(e) => setProjectBrief(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-700 leading-relaxed focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Instrucciones visuales, tono de comunicación, paleta y conceptos clave..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Entregables */}
            <div className="card-crema p-5 space-y-3 border border-slate-200 bg-white rounded-3xl shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Entregables Requeridos
                </h4>
                <button
                  type="button"
                  onClick={() => setProjectDeliverables([...projectDeliverables, ''])}
                  className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Añadir
                </button>
              </div>
              <div className="space-y-1.5">
                {projectDeliverables.map((deliv, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={deliv}
                      onChange={(e) => {
                        const updated = [...projectDeliverables];
                        updated[idx] = e.target.value;
                        setProjectDeliverables(updated);
                      }}
                      className="flex-1 px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="ej: Dummy escala 1:1"
                    />
                    <button
                      type="button"
                      onClick={() => setProjectDeliverables(projectDeliverables.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Software */}
            <div className="card-crema p-5 space-y-3 border border-slate-200 bg-white rounded-3xl shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  Software Especializado
                </h4>
                <button
                  type="button"
                  onClick={() => setProjectSoftware([...projectSoftware, ''])}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Añadir
                </button>
              </div>
              <div className="space-y-1.5">
                {projectSoftware.map((sw, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={sw}
                      onChange={(e) => {
                        const updated = [...projectSoftware];
                        updated[idx] = e.target.value;
                        setProjectSoftware(updated);
                      }}
                      className="flex-1 px-3 py-1 rounded-lg border border-slate-200 text-xs text-blue-700 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="ej: Adobe Illustrator"
                    />
                    <button
                      type="button"
                      onClick={() => setProjectSoftware(projectSoftware.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Materiales */}
            <div className="card-crema p-5 space-y-3 border border-slate-200 bg-white rounded-3xl shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  Materiales e Insumos
                </h4>
                <button
                  type="button"
                  onClick={() => setProjectMaterials([...projectMaterials, ''])}
                  className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Añadir
                </button>
              </div>
              <div className="space-y-1.5">
                {projectMaterials.map((mat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={mat}
                      onChange={(e) => {
                        const updated = [...projectMaterials];
                        updated[idx] = e.target.value;
                        setProjectMaterials(updated);
                      }}
                      className="flex-1 px-3 py-1 rounded-lg border border-slate-200 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="ej: Papel Couche 250g"
                    />
                    <button
                      type="button"
                      onClick={() => setProjectMaterials(projectMaterials.filter((_, i) => i !== idx))}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: SABERES PREVIOS Y NECESARIOS */}
      {activeTab === 'saberes' && (
        <div className="space-y-6">
          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg">
                  Cuestionario Diagnóstico de Saberes Previos
                </h3>
                <p className="text-xs text-slate-500">
                  Preguntas diagnósticas que los alumnos responden al inicio del módulo (Mucho, Poco, Nada)
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSaberesPrevios([
                    ...saberesPrevios,
                    { id: `sp-${Date.now()}`, description: '', appreciation: 'POCO' },
                  ])
                }
                className="px-3.5 py-1.5 bg-blue-50 text-[#0D71B9] border border-blue-200 rounded-xl text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Saber Previo
              </button>
            </div>

            <div className="space-y-2.5">
              {saberesPrevios.map((saber, idx) => (
                <div key={saber.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={saber.description}
                    onChange={(e) => {
                      const updated = [...saberesPrevios];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setSaberesPrevios(updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-[#0D71B9] outline-none"
                    placeholder="Descripción del saber previo diagnóstico..."
                  />
                  <button
                    type="button"
                    onClick={() => setSaberesPrevios(saberesPrevios.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Saberes Necesarios Acordados para el Proyecto
                </h3>
                <p className="text-xs text-slate-500">
                  Competencias teóricas y prácticas que se reforzarán para desarrollar exitosamente el proyecto
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSaberesNecesarios([
                    ...saberesNecesarios,
                    { id: `sn-${Date.now()}`, description: '' },
                  ])
                }
                className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Saber Necesario
              </button>
            </div>

            <div className="space-y-2.5">
              {saberesNecesarios.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => {
                      const updated = [...saberesNecesarios];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setSaberesNecesarios(updated);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Competencia o contenido necesario a adquirir..."
                  />
                  <button
                    type="button"
                    onClick={() => setSaberesNecesarios(saberesNecesarios.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: JORNALIZACIÓN Y FECHAS */}
      {activeTab === 'jornalizacion' && (
        <div className="space-y-6">
          {/* Sincronizador de fechas de inicio / fin */}
          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0D71B9]" />
                  Temporización y Fechas del Módulo
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sincroniza las fechas del módulo con el Calendario Institucional y calcula la secuencia de las 6 etapas.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRecalculateJornalizacion}
                className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 transition-all shadow-sm shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Autocalcular Etapas con Calendario</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Inicio:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {formatDateSpanish(startDate)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de Cierre:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-[#0D71B9] outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {formatDateSpanish(endDate)}
                </span>
              </div>

              <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
                  ⭐ Hito Crítico: Entrega de Proyecto
                </span>
                <div className="text-sm font-black text-amber-900">
                  {projectDeliveryDate ? formatDateSpanish(projectDeliveryDate) : '4 días antes del cierre'}
                </div>
                <p className="text-[11px] text-amber-700 leading-tight">
                  Programada normativamente 4 días hábiles u 8 horas lectivas antes de concluir el módulo.
                </p>
              </div>
            </div>
          </div>

          {/* Desglose de las 6 Etapas */}
          <div className="card-crema p-6 md:p-8 border border-slate-200 bg-white rounded-3xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900">
                Secuencia Cronológica de las 6 Etapas
              </h3>
              <button
                type="button"
                onClick={() =>
                  setJornalizacion([
                    ...jornalizacion,
                    {
                      stage: `Etapa ${jornalizacion.length + 1}`,
                      name: `Nueva Etapa`,
                      startDate: '',
                      endDate: '',
                      hours: 0,
                    },
                  ])
                }
                className="text-xs font-bold text-[#0D71B9] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar Etapa Manual
              </button>
            </div>

            <div className="space-y-3">
              {jornalizacion.map((st, idx) => {
                const isLast = idx === jornalizacion.length - 1;
                const isControlar = idx === 4;

                return (
                  <div
                    key={idx}
                    className={`p-4 md:p-5 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${
                      isLast
                        ? 'border-rose-200 bg-rose-50/40'
                        : isControlar
                        ? 'border-amber-300 bg-amber-50/40'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center text-white shadow-xs ${
                          isLast ? 'bg-rose-500' : isControlar ? 'bg-amber-500' : 'bg-[#0D71B9]'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div>
                        <input
                          type="text"
                          value={st.name || st.stage}
                          onChange={(e) => {
                            const updated = [...jornalizacion];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setJornalizacion(updated);
                          }}
                          className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-[#0D71B9] outline-none"
                        />
                        {isControlar && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full ml-2 uppercase">
                            Entrega de Proyecto
                          </span>
                        )}
                        {isLast && (
                          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full ml-2 uppercase">
                            Evaluación Final y Rúbrica
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto justify-start md:justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Inicio:</span>
                        <input
                          type="date"
                          value={st.startDate}
                          onChange={(e) => {
                            const updated = [...jornalizacion];
                            updated[idx] = { ...updated[idx], startDate: e.target.value };
                            setJornalizacion(updated);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-[#0D71B9]"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Fin:</span>
                        <input
                          type="date"
                          value={st.endDate}
                          onChange={(e) => {
                            const updated = [...jornalizacion];
                            updated[idx] = { ...updated[idx], endDate: e.target.value };
                            setJornalizacion(updated);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-semibold text-slate-900 text-xs focus:ring-1 focus:ring-[#0D71B9]"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Horas:</span>
                        <input
                          type="number"
                          value={st.hours}
                          onChange={(e) => {
                            const updated = [...jornalizacion];
                            updated[idx] = { ...updated[idx], hours: Number(e.target.value) };
                            setJornalizacion(updated);
                          }}
                          className="w-16 px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-slate-900 text-xs text-center focus:ring-1 focus:ring-[#0D71B9]"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => setJornalizacion(jornalizacion.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
