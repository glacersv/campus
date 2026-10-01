import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookMarked,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  LayoutGrid,
  List,
  Check,
  Trash,
  GraduationCap,
  Clock,
  HelpCircle,
  Minus,
  RefreshCw,
  Compass,
  Languages,
  Sparkles,
  Palette,
  PenTool,
  Brush,
  Feather,
  Briefcase,
  Layout,
  Radio,
  Image,
  Globe,
  Megaphone,
  BookOpen,
  Box,
  TrendingUp,
  Printer,
  Camera,
  Award,
  Target,
  Video,
  Coins,
  Presentation,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAllGrades,
  createLMSModule,
  updateLMSModule,
  deleteLMSModule,
  getAllLMSModules,
  reseedLMSModules,
  getAllTeachers,
  ensureTechnicalGrades,
  cleanupDuplicateGrades,
  seedBTVCurriculumToFirestore,
  getAllBuildings,
  getAllComputerLabs,
} from '../../lib/firestore';
import { Subject, Grade, CYCLE_NAMES, Cycle, LMSModule, Teacher, Building, ComputerLab } from '../../types';
import { BTV_GRAPHIC_DESIGN_COURSES } from '../../services/btvCurriculumData';

// Iconos disponibles para módulos
const ICON_OPTIONS = [
  { name: 'Compass', icon: Compass },
  { name: 'Languages', icon: Languages },
  { name: 'Search', icon: Search },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Palette', icon: Palette },
  { name: 'PenTool', icon: PenTool },
  { name: 'Brush', icon: Brush },
  { name: 'Feather', icon: Feather },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Layout', icon: Layout },
  { name: 'Radio', icon: Radio },
  { name: 'Image', icon: Image },
  { name: 'Globe', icon: Globe },
  { name: 'Megaphone', icon: Megaphone },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Box', icon: Box },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Printer', icon: Printer },
  { name: 'Camera', icon: Camera },
  { name: 'Award', icon: Award },
  { name: 'Target', icon: Target },
  { name: 'Video', icon: Video },
  { name: 'Coins', icon: Coins },
  { name: 'Presentation', icon: Presentation },
];

// Centralized ordering for grades to sort chronologically
const GRADE_ORDER: Record<string, number> = {
  k4: 1, k5: 2, k6: 3,
  '1': 4, '2': 5, '3': 6, '4': 7, '5': 8, '6': 9, '7': 10, '8': 11, '9': 12,
  '10g': 13, '11g': 14, '11t': 15
};

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [lmsModules, setLmsModules] = useState<LMSModule[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [computerLabs, setComputerLabs] = useState<ComputerLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModuleTab, setIsModuleTab] = useState(false);

  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'mined' | 'institutional' | 'technical'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCycle, setSelectedCycle] = useState<Cycle | 'all'>('all');

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: '',
    description: '',
    gradeIds: [] as string[],
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    weeklyHours: 4,
    type: 'MINED' as 'BASICA' | 'MINED' | 'INSTITUCIONAL',
    parentSubjectId: '',
  });

  // Módulo técnico form state
  const [moduleForm, setModuleForm] = useState({
    name: '',
    code: '',
    subjectId: '',
    teacherId: '',
    teacherName: '',
    gradeId: '',
    gradeName: '',
    technicalYear: '1' as '1' | '2' | '3',
    hours: 72,
    weeks: 4,
    status: 'active' as 'active' | 'inactive' | 'completed',
    description: '',
    affineArea: '',
    icon: 'BookOpen',
    color: '#0D71B9',
    classroom: '',
    sectionId: '',
    sectionName: '',
    unitsCount: 6,
    activitiesCount: 3,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      await ensureTechnicalGrades();
      await cleanupDuplicateGrades();
      await seedBTVCurriculumToFirestore();
      const [subs, grds, modules, tchs, blds, labs] = await Promise.all([
        getAllSubjects(),
        getAllGrades(),
        getAllLMSModules(),
        getAllTeachers(),
        getAllBuildings(),
        getAllComputerLabs(),
      ]);
      // Sort grades chronologically
      const sortedGrades = [...grds].sort((a, b) => (GRADE_ORDER[a.id] || 99) - (GRADE_ORDER[b.id] || 99));
      setSubjects(subs);
      setGrades(sortedGrades);
      setLmsModules(modules);
      setTeachers(tchs);
      setBuildings(blds);
      setComputerLabs(labs);
    } finally { setLoading(false); }
  };

  const getGradeName = (id?: string) => {
    if (!id) return '—';
    const found = grades.find(g => g.id === id);
    if (found) return found.name;
    const fallback: Record<string, string> = {
      '11t': '11° Bachillerato Técnico',
      '10g': '10° Bachillerato General', '11g': '11° Bachillerato General',
    };
    return fallback[id] || id;
  };

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      gradeIds: [],
      status: 'ACTIVO',
      weeklyHours: 4,
      type: 'MINED',
      parentSubjectId: '',
    } as { name: string; description: string; gradeIds: string[]; status: 'ACTIVO' | 'INACTIVO'; weeklyHours: number; type: 'BASICA' | 'MINED' | 'INSTITUCIONAL'; parentSubjectId: string });
    setEditingId(null);
  };

  const sanitizePayload = (obj: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
        sanitized[key] = obj[key];
      }
    });
    return sanitized;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }

    try {
      // Derive primary cycle and primary gradeId from the first selected grade
      let derivedCycle: Cycle | undefined = undefined;
      const primaryGradeId = form.gradeIds.length > 0 ? form.gradeIds[0] : null;
      if (primaryGradeId) {
        const foundGrade = grades.find(g => g.id === primaryGradeId);
        if (foundGrade) {
          derivedCycle = foundGrade.cycle;
        }
      }

      // Validate that sub-subjects hours don't exceed parent subject's weeklyHours budget
      if (form.type === 'INSTITUCIONAL') {
        const parent = subjects.find(s => s.id === form.parentSubjectId);
        if (parent) {
          const siblingHours = subjects
            .filter(s => s.parentSubjectId === form.parentSubjectId && s.id !== editingId && s.status !== 'INACTIVO')
            .reduce((sum, s) => sum + (s.weeklyHours || 0), 0);

          const proposedTotal = siblingHours + form.weeklyHours;
          const budget = parent.weeklyHours || 0;

          if (proposedTotal > budget) {
            toast.error(`Las horas de esta sub-materia (${form.weeklyHours}h) combinadas con las demás sub-materias (${siblingHours}h) superan el presupuesto asignado a la materia oficial "${parent.name}" (${budget}h). Ajusta las horas.`);
            return;
          }
        }
      }

      const rawData = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        cycle: derivedCycle || null,
        gradeId: primaryGradeId, // backward-compatibility
        gradeIds: form.gradeIds.length > 0 ? form.gradeIds : null, // multi-grade support
        status: form.status,
        weeklyHours: form.weeklyHours,
        type: form.type,
        parentSubjectId: (form.type === 'INSTITUCIONAL' && form.parentSubjectId) ? form.parentSubjectId : null,
      };

      const sanitizedData = sanitizePayload(rawData);

      if (editingId) {
        await updateSubject(editingId, sanitizedData);
        toast.success('Materia actualizada correctamente');
      } else {
        const idSuffix = primaryGradeId || 'general';
        const id = `${form.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${idSuffix}`;
        await createSubject({ id, ...sanitizedData } as Subject);
        toast.success('Materia creada correctamente');
      }

      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar materia';
      toast.error(msg);
      console.error(err);
    }
  };

  const handleEdit = (s: Subject) => {
    setEditingId(s.id);

    // Resolve gradeIds for backward-compatibility
    let initialGradeIds: string[] = [];
    if ((s as any).gradeIds && Array.isArray((s as any).gradeIds)) {
      initialGradeIds = (s as any).gradeIds;
    } else if (s.gradeId) {
      initialGradeIds = [s.gradeId];
    }

    setForm({
      name: s.name,
      description: s.description || '',
      gradeIds: initialGradeIds,
      status: s.status || 'ACTIVO',
      weeklyHours: s.weeklyHours || 4,
      type: s.type || 'MINED',
      parentSubjectId: s.parentSubjectId || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta materia? Se verificará que no esté en uso.')) {
      try {
        await deleteSubject(id);
        toast.success('Materia eliminada');
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        loadData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar materia';
        toast.error(msg);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} materia(s)?`)) {
      let deleted = 0;
      let errors = 0;

      for (const id of selected) {
        try {
          await deleteSubject(id);
          deleted++;
        } catch {
          errors++;
        }
      }
      if (deleted > 0) toast.success(`${deleted} materia(s) eliminada(s)`);
      if (errors > 0) toast.error(`${errors} materia(s) no se pudieron eliminar (en uso)`);

      setSelected(new Set());
      loadData();
    }
  };

  // ==================== LMS MODULES CRUD ====================

  const resetModuleForm = () => {
    setModuleForm({
      name: '',
      code: '',
      subjectId: '',
      teacherId: '',
      teacherName: '',
      gradeId: '',
      gradeName: '',
      technicalYear: '1',
      hours: 72,
      weeks: 4,
      status: 'active',
      description: '',
      affineArea: '',
      icon: 'BookOpen',
      color: '#0D71B9',
      classroom: '',
      sectionId: '',
      sectionName: '',
      unitsCount: 6,
      activitiesCount: 3,
    });
    setEditingId(null);
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.name.trim() || !moduleForm.code.trim()) {
      toast.error('Nombre y código son obligatorios');
      return;
    }

    try {
      const grade = grades.find(g => g.id === moduleForm.gradeId);
      const teacher = teachers.find(t => t.id === moduleForm.teacherId);
      const payload = {
        name: moduleForm.name.trim(),
        code: moduleForm.code.trim(),
        subjectId: moduleForm.subjectId || moduleForm.code.toLowerCase().replace(/\s+/g, '-'),
        teacherId: moduleForm.teacherId || 't1786176116597',
        teacherName: teacher?.name || moduleForm.teacherName || 'Giovanni Marquez',
        gradeId: moduleForm.gradeId,
        gradeName: grade?.name || moduleForm.gradeName || '',
        technicalYear: moduleForm.technicalYear,
        hours: Number(moduleForm.hours) || 72,
        weeks: Number(moduleForm.weeks) || 4,
        status: moduleForm.status,
        description: moduleForm.description,
        affineArea: moduleForm.affineArea,
        icon: moduleForm.icon,
        color: moduleForm.color,
        schedule: `Semana 1 • ${Number(moduleForm.hours) || 72} Horas • ${Number(moduleForm.weeks) || 4} ${Number(moduleForm.weeks) === 1 ? 'semana' : 'semanas'}`,
        classroom: moduleForm.classroom,
        sectionId: moduleForm.sectionId,
        sectionName: moduleForm.sectionName,
        unitsCount: Number(moduleForm.unitsCount) || 6,
        activitiesCount: Number(moduleForm.activitiesCount) || 3,
        descriptor: {
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
      };

      if (editingId) {
        await updateLMSModule(editingId, payload);
        toast.success('Módulo actualizado correctamente');
      } else {
        const id = `lms-mod-${Date.now()}`;
        await createLMSModule({ id, ...payload });
        toast.success('Módulo creado correctamente');
      }

      setShowForm(false);
      resetModuleForm();
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar módulo';
      toast.error(msg);
      console.error(err);
    }
  };

  const handleEditModule = (mod: LMSModule) => {
    setEditingId(mod.id);

    // Buscar datos hardcodeados por código para poblar campos vacíos
    const hardcoded = BTV_GRAPHIC_DESIGN_COURSES.find(c => c.code === mod.code);

    setModuleForm({
      name: mod.name,
      code: mod.code,
      subjectId: mod.subjectId,
      teacherId: mod.teacherId,
      teacherName: mod.teacherName,
      gradeId: mod.gradeId,
      gradeName: mod.gradeName,
      technicalYear: mod.technicalYear,
      hours: mod.hours,
      weeks: mod.weeks,
      status: mod.status,
      description: mod.description || hardcoded?.description || '',
      affineArea: mod.affineArea || hardcoded?.affineArea || '',
      icon: mod.icon || hardcoded?.icon || 'BookOpen',
      color: mod.color || hardcoded?.color || '#0D71B9',
      classroom: mod.classroom || hardcoded?.classroom || '',
      sectionId: mod.sectionId || hardcoded?.sectionId || '',
      sectionName: mod.sectionName || hardcoded?.sectionName || '',
      unitsCount: mod.unitsCount || (hardcoded as any)?.unitsCount || 6,
      activitiesCount: mod.activitiesCount || (hardcoded as any)?.activitiesCount || 3,
    });
    setShowForm(true);
  };

  const handleDeleteModule = async (id: string) => {
    if (confirm('¿Eliminar este módulo técnico?')) {
      try {
        await deleteLMSModule(id);
        toast.success('Módulo eliminado');
        loadData();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al eliminar módulo';
        toast.error(msg);
      }
    }
  };

  const handleReseedModules = async () => {
    if (!confirm('Esto eliminará y recargará los 27 módulos técnicos oficiales desde el plan BTV, corrigiendo los grados asignados. ¿Continuar?')) return;
    try {
      toast.info('Sincronizando módulos técnicos BTV...');
      const modules = await reseedLMSModules();
      setLmsModules(modules);
      toast.success(`${modules.length} módulos técnicos sincronizados correctamente`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al sincronizar módulos';
      toast.error(msg);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  // Filter logic supporting multi-grade subjects
  const filtered = subjects.filter(s => {
    const isMinedOrBasica = (s.type === 'MINED' || s.type === 'BASICA' || !s.type);

    const matchType = !selectedType || 
      (selectedType === 'MINED' && isMinedOrBasica) ||
      (selectedType === 'INSTITUCIONAL' && s.type === 'INSTITUCIONAL');

    const matchTab = activeTab === 'all' || 
      (activeTab === 'mined' && isMinedOrBasica) ||
      (activeTab === 'institutional' && s.type === 'INSTITUCIONAL');

    const matchSearch = !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    // Direct check in s.gradeId or s.gradeIds list
    let matchGrade = true;
    if (selectedGradeId) {
      const subjectGradeIds = (s as any).gradeIds && Array.isArray((s as any).gradeIds)
        ? (s as any).gradeIds
        : s.gradeId
        ? [s.gradeId]
        : [];

      matchGrade = subjectGradeIds.includes(selectedGradeId) || subjectGradeIds.length === 0;
    } else if (selectedCycle !== 'all') {
      const gradesInCycle = grades.filter(g => g.cycle === selectedCycle).map(g => g.id);
      const subjectGradeIds = (s as any).gradeIds && Array.isArray((s as any).gradeIds)
        ? (s as any).gradeIds
        : s.gradeId
        ? [s.gradeId]
        : [];
      matchGrade = subjectGradeIds.length === 0 || subjectGradeIds.some(gid => gradesInCycle.includes(gid));
    }

    return matchType && matchGrade && matchTab && matchSearch;
  });

  const filteredModules = lmsModules.filter(m => {
    const matchSearch = !searchQuery.trim() ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.code && m.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.teacherName && m.teacherName.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchGrade = true;
    if (selectedGradeId) {
      const selectedGrade = grades.find(g => g.id === selectedGradeId);
      const gradeName = selectedGrade?.name || '';
      const matchGradeId = m.gradeId === selectedGradeId;
      const matchTechYear = m.technicalYear === selectedGradeId || gradeName.includes(`${m.technicalYear}°`);
      matchGrade = matchGradeId || matchTechYear;
    } else if (selectedCycle !== 'all') {
      matchGrade = selectedCycle === '4'; // Los módulos técnicos pertenecen al ciclo de bachillerato (ciclo 4)
    }

    return matchGrade && matchSearch;
  });

  const getSubSubjects = (parentId: string) => {
    return subjects.filter(s => s.parentSubjectId === parentId && s.status !== 'INACTIVO');
  };

  const minedSubjects = subjects.filter(s => (s.type || 'MINED') === 'MINED' && s.status === 'ACTIVO');

  // Group grades by cycles for organized navigation lists (Parvularia, Primer Ciclo, etc.)
  const gradesByCycle = grades.reduce((acc, g) => {
    const cycle = g.cycle || 'parvularia';
    if (!acc[cycle]) acc[cycle] = [];
    acc[cycle].push(g);
    return acc;
  }, {} as Record<Cycle, Grade[]>);

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero Banner Estilo Calendario Institucional */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                <BookMarked className="w-3.5 h-3.5 text-blue-400" />
                <span>MALLA CURRICULAR Y ESPECIALIDADES 2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
                {isModuleTab ? 'Módulos Técnicos BTV' : 'Plan de Materias Académicas'}
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Gestión curricular de <strong>Colegio Salesiano San José</strong>. Plan de asignaturas oficiales MINED,
                especialidades institucionales internas y módulos del Bachillerato Técnico Vocacional.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {isModuleTab && (
                <button
                  onClick={handleReseedModules}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-amber-400/40 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-bold text-xs transition-all shadow-sm cursor-pointer"
                  title="Re-sincronizar los 26 módulos BTV oficiales con grados técnicos"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-300" />
                  <span>Sincronizar BTV</span>
                </button>
              )}
              <button
                onClick={() => { setShowForm(true); isModuleTab ? resetModuleForm() : resetForm(); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isModuleTab ? 'Nuevo Módulo' : 'Nueva Materia'}</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas en Tiempo Real */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <span className="text-slate-400 block text-[11px] font-semibold">Oficiales MINED:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="text-xl text-emerald-400 font-black font-display">
                  {subjects.filter(s => (s.type || 'MINED') === 'MINED').length}
                </strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Asignaturas</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <span className="text-slate-400 block text-[11px] font-semibold">Sub-materias Internas:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="text-xl text-sky-400 font-black font-display">
                  {subjects.filter(s => s.type === 'INSTITUCIONAL').length}
                </strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Especialidades</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <span className="text-slate-400 block text-[11px] font-semibold">Módulos Técnicos BTV:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="text-xl text-indigo-400 font-black font-display">
                  {lmsModules.length}
                </strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">En 3 Años</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-inner">
              <span className="text-slate-400 block text-[11px] font-semibold">Total Carga Horaria:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <strong className="text-xl text-amber-400 font-black font-display">
                  {subjects.reduce((sum, s) => sum + (s.weeklyHours || 0), 0)}h
                </strong>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">Horas / Sem</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Panel de Filtros y Navegación Segmentada */}
      <div className="card-crema p-5 space-y-4 border border-slate-200/80 shadow-sm bg-white dark:bg-slate-900">
        {/* Pestañas Principales Segmentadas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 max-w-xl">
            <button
              onClick={() => { setActiveTab('all'); setIsModuleTab(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                activeTab === 'all' && !isModuleTab
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Todo ({subjects.length})
            </button>
            <button
              onClick={() => { setActiveTab('mined'); setIsModuleTab(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                activeTab === 'mined' && !isModuleTab
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              📘 Materias MINED
            </button>
            <button
              onClick={() => { setActiveTab('institutional'); setIsModuleTab(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                activeTab === 'institutional' && !isModuleTab
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              🏛️ Sub-materias
            </button>
            <button
              onClick={() => { setActiveTab('technical'); setIsModuleTab(true); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-0 ${
                isModuleTab
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              🎓 Módulos BTV ({lmsModules.length})
            </button>
          </div>

          {/* Selector de Modo de Vista (Tarjetas / Lista) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shrink-0 bg-slate-50 dark:bg-slate-800 p-0.5">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-colors border-0 cursor-pointer ${
                  viewMode === 'card' ? 'bg-white dark:bg-slate-900 text-primary shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors border-0 cursor-pointer ${
                  viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-primary shadow-xs font-bold' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Vista en Tabla"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Buscador Rápido y Filtro por Ciclo Educativo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Buscador */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar materia o código..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-0 bg-transparent cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Carrusel de Ciclos Educativos */}
          <div className="md:col-span-2 flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Ciclo:
            </span>
            <button
              onClick={() => { setSelectedCycle('all'); setSelectedGradeId(''); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                selectedCycle === 'all' && !selectedGradeId
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              Todos los Ciclos
            </button>
            {(Object.keys(CYCLE_NAMES) as Cycle[]).map(cKey => (
              <button
                key={cKey}
                onClick={() => { setSelectedCycle(cKey); setSelectedGradeId(''); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap cursor-pointer ${
                  selectedCycle === cKey && !selectedGradeId
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {CYCLE_NAMES[cKey]}
              </button>
            ))}
          </div>
        </div>

        {/* Desglose de Grados si se selecciona un ciclo específico */}
        {selectedCycle !== 'all' && gradesByCycle[selectedCycle] && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap"
          >
            <span className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Grados de {CYCLE_NAMES[selectedCycle]}:
            </span>
            <button
              onClick={() => setSelectedGradeId('')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                selectedGradeId === ''
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-extrabold dark:bg-blue-900/40 dark:text-blue-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
              }`}
            >
              Ver Todo el Ciclo
            </button>
            {gradesByCycle[selectedCycle].map(g => (
              <button
                key={g.id}
                onClick={() => setSelectedGradeId(g.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                  selectedGradeId === g.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {g.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Notificación de resultados y acciones en lote */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="text-slate-500 font-medium">
            Mostrando <strong className="text-slate-900 dark:text-white font-bold">{isModuleTab ? filteredModules.length : filtered.length}</strong> {isModuleTab ? 'módulos técnicos' : 'materias'}
            {selectedGradeId && (
              <span> en <strong className="text-blue-600 font-semibold">{getGradeName(selectedGradeId)}</strong></span>
            )}
            {searchQuery && (
              <span> para "<strong className="text-slate-800 dark:text-slate-200">{searchQuery}</strong>"</span>
            )}
          </div>

          {selected.size > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-800 px-3 py-1 rounded-xl text-xs font-bold"
            >
              <span>{selected.size} seleccionada(s)</span>
              <button
                onClick={handleBulkDelete}
                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] transition-colors border-0 cursor-pointer"
              >
                Eliminar
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-red-500 hover:text-red-700 border-0 bg-transparent cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Hierarchy Info Box */}
      <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 leading-relaxed shadow-sm">
        <HelpCircle className="w-5 h-5 text-tertiary shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 block mb-0.5">Jerarquía Educativa: Materias MINED vs. Especialidades Institucionales</span>
          Para cumplir con las normas del MINED de El Salvador, las materias oficiales (como Ciencia y Tecnología) son evaluadas unitariamente.
          Aquí puedes registrar materias <span className="font-bold text-slate-800">Oficiales MINED</span> y anidar asignaturas <span className="font-bold text-slate-700">Institucionales Internas</span> (como Física, Química o Biología) dentro de ellas para llevar un desglose interno con distintos docentes.
        </div>
      </div>

      {/* Add/Edit Modal (Grayscale & Multi-Grade Compatible Layout) */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="modal-container max-w-2xl"
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {isModuleTab
                    ? (editingId ? 'Editar Módulo Técnico' : 'Nuevo Módulo Técnico')
                    : (editingId ? 'Editar Materia' : 'Nueva Materia o Sub-materia')
                  }
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); isModuleTab ? resetModuleForm() : resetForm(); }}
                  className="modal-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isModuleTab ? (
                <form onSubmit={handleModuleSubmit} className="modal-body space-y-4">
                  {/* Code & Name */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1 col-span-1">
                      <label className="form-label text-slate-700">Código *</label>
                      <input
                        type="text"
                        value={moduleForm.code}
                        onChange={e => setModuleForm(p => ({ ...p, code: e.target.value }))}
                        placeholder="Ej: BTV-DG-1.1"
                        className="input-crema font-mono font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <label className="form-label text-slate-700">Nombre del Módulo Técnico *</label>
                      <input
                        type="text"
                        value={moduleForm.name}
                        onChange={e => setModuleForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Ej: Ilustración Vectorial y Diagramación Digital"
                        className="input-crema font-semibold"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Año Técnico MINED */}
                  <div className="space-y-1.5">
                    <label className="form-label text-slate-700">Año Técnico MINED *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1', '2', '3'] as const).map(yr => (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => setModuleForm(p => ({ ...p, technicalYear: yr }))}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            moduleForm.technicalYear === yr
                              ? 'bg-primary border-primary text-white shadow-sm'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {yr === '1' ? '1.º Año' : yr === '2' ? '2.º Año' : '3.er Año'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grado / Nivel Institucional */}
                  <div className="space-y-1.5">
                    <label className="form-label text-slate-700">Grado / Nivel Institucional</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setModuleForm(p => ({ ...p, gradeId: '', gradeName: '' }))}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          !moduleForm.gradeId
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                        }`}
                      >
                        Sin grado
                      </button>
                      {grades.filter(g => g.id.endsWith('t')).map(g => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => setModuleForm(p => ({ ...p, gradeId: g.id, gradeName: g.name }))}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            moduleForm.gradeId === g.id
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Docente Encargado */}
                  <div className="space-y-1.5">
                    <label className="form-label text-slate-700">Docente Encargado del Módulo</label>
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setModuleForm(p => ({ ...p, teacherId: '', teacherName: '' }))}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          !moduleForm.teacherId
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                        }`}
                      >
                        Sin docente
                      </button>
                      {teachers.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setModuleForm(p => ({ ...p, teacherId: t.id, teacherName: t.name }))}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            moduleForm.teacherId === t.id
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hours & Weeks */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="form-label text-slate-700">Horas Totales</label>
                      <input
                        type="number"
                        min={1}
                        max={300}
                        value={moduleForm.hours}
                        onChange={e => setModuleForm(p => ({ ...p, hours: Number(e.target.value) }))}
                        className="input-crema font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="form-label text-slate-700">Duración (Semanas)</label>
                      <input
                        type="number"
                        min={1}
                        max={40}
                        value={moduleForm.weeks}
                        onChange={e => setModuleForm(p => ({ ...p, weeks: Number(e.target.value) }))}
                        className="input-crema font-bold"
                      />
                    </div>
                  </div>

                  {/* Estado */}
                  <div className="space-y-1.5">
                    <label className="form-label text-slate-700">Estado Operativo</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setModuleForm(p => ({ ...p, status: 'active' }))}
                        className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all text-[11px] font-bold ${
                          moduleForm.status === 'active'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        onClick={() => setModuleForm(p => ({ ...p, status: 'inactive' }))}
                        className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all text-[11px] font-bold ${
                          moduleForm.status === 'inactive'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200/50'
                        }`}
                      >
                        Inactivo
                      </button>
                    </div>
                  </div>

                  {/* Campos Extendidos */}
                  <div className="border-t border-slate-200 pt-4 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campos Extendidos del Módulo</span>

                    {/* Descripción */}
                    <div className="space-y-1">
                      <label className="form-label text-slate-700">Descripción del Módulo</label>
                      <textarea
                        value={moduleForm.description}
                        onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))}
                        placeholder="Descripción detallada del módulo técnico..."
                        className="input-crema h-16 resize-none text-xs"
                      />
                    </div>

                    {/* Área Afín + Aula */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="form-label text-slate-700">Área Afín</label>
                        <input
                          type="text"
                          value={moduleForm.affineArea}
                          onChange={e => setModuleForm(p => ({ ...p, affineArea: e.target.value }))}
                          placeholder="Ej: Diseño y diagramación"
                          className="input-crema text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label text-slate-700">Aula / Taller</label>
                        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                          <button
                            type="button"
                            onClick={() => setModuleForm(p => ({ ...p, classroom: '' }))}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                              !moduleForm.classroom
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            Sin asignar
                          </button>
                          {buildings.map(b => (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setModuleForm(p => ({ ...p, classroom: b.name }))}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                                moduleForm.classroom === b.name
                                  ? 'bg-primary border-primary text-white shadow-xs'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {b.name}
                            </button>
                          ))}
                          {computerLabs.map(l => (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => setModuleForm(p => ({ ...p, classroom: l.name }))}
                              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                                moduleForm.classroom === l.name
                                  ? 'bg-primary border-primary text-white shadow-xs'
                                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              {l.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Selector de Ícono Visual */}
                    <div className="space-y-1.5">
                      <label className="form-label text-slate-700">Ícono del Módulo</label>
                      <div className="grid grid-cols-8 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/60 max-h-[120px] overflow-y-auto">
                        {ICON_OPTIONS.map(opt => {
                          const IconComp = opt.icon;
                          return (
                            <button
                              key={opt.name}
                              type="button"
                              onClick={() => setModuleForm(p => ({ ...p, icon: opt.name }))}
                              title={opt.name}
                              className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-center ${
                                moduleForm.icon === opt.name
                                  ? 'bg-primary text-white border-primary shadow-sm'
                                  : 'bg-white text-slate-500 border-slate-200 hover:border-primary hover:text-primary'
                              }`}
                            >
                              <IconComp className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-slate-400">Seleccionado: {moduleForm.icon}</span>
                    </div>

                    {/* Color */}
                    <div className="space-y-1">
                      <label className="form-label text-slate-700">Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={moduleForm.color}
                          onChange={e => setModuleForm(p => ({ ...p, color: e.target.value }))}
                          className="w-8 h-8 rounded border border-slate-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={moduleForm.color}
                          onChange={e => setModuleForm(p => ({ ...p, color: e.target.value }))}
                          className="input-crema text-xs flex-1 font-mono"
                        />
                      </div>
                    </div>

                    {/* Unidades + Actividades */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="form-label text-slate-700">Unidades</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={moduleForm.unitsCount}
                          onChange={e => setModuleForm(p => ({ ...p, unitsCount: Number(e.target.value) }))}
                          className="input-crema text-xs font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="form-label text-slate-700">Actividades</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={moduleForm.activitiesCount}
                          onChange={e => setModuleForm(p => ({ ...p, activitiesCount: Number(e.target.value) }))}
                          className="input-crema text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); resetModuleForm(); }}
                      className="btn-secondary"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary">
                      <Save className="w-4 h-4" /> {editingId ? 'Actualizar Módulo' : 'Crear Módulo'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit} className="modal-body space-y-4">

                {/* Subject Name */}
                <div className="space-y-1">
                  <label className="form-label text-slate-700">Nombre de la Asignatura *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Ciencias Naturales"
                    className="input-crema"
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="form-label text-slate-700">Descripción o Notas Curriculares</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Ej: Materias Institucionales derivadas: Física, Química, Biología..."
                    className="input-crema h-16 resize-none"
                  />
                </div>

                {/* Classification Toggle */}
                <div className="space-y-1">
                  <label className="form-label text-slate-700">Clasificación Curricular</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'BASICA', parentSubjectId: '' }))}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                        form.type === 'BASICA'
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Básica (1°-11°)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'MINED', parentSubjectId: '' }))}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                        form.type === 'MINED'
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      MINED / Técnico
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'INSTITUCIONAL' }))}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                        form.type === 'INSTITUCIONAL'
                          ? 'bg-primary border-primary text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Institucional
                    </button>
                  </div>
                </div>

                {/* Parent Subject Grid Selector (Only if Institutional) */}
                {form.type === 'INSTITUCIONAL' && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="form-label text-slate-700">Materia Base MINED a la que pertenece (Opcional)</label>
                    <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, parentSubjectId: '' }))}
                        className={`px-2.5 py-1 rounded-lg border text-left text-[11px] font-semibold cursor-pointer transition-all ${
                          !form.parentSubjectId
                            ? 'bg-primary border-primary text-white shadow-xs'
                            : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        Ninguna
                      </button>
                      {minedSubjects.map(m => {
                        const isSelected = form.parentSubjectId === m.id;
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setForm(p => ({ ...p, parentSubjectId: m.id }))}
                            className={`px-2.5 py-1 rounded-lg border text-left text-[11px] font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-primary border-primary text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {m.name} {m.gradeId ? `(${getGradeName(m.gradeId)})` : ''}
                          </button>
                        );
                      })}
                      {minedSubjects.length === 0 && (
                        <span className="text-[11px] text-tertiary italic">No hay materias oficiales creadas todavía.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Multi-Grade Toggle Grid (Small, Compact, Organized by Cycles) */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="form-label text-slate-700">Asignar a Grados / Niveles *</label>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, gradeIds: [] }))}
                      className="text-[10px] font-bold text-secondary hover:text-slate-800 underline border-0 bg-transparent cursor-pointer"
                    >
                      Limpiar selección (Materia General)
                    </button>
                  </div>

                  {/* Compact Scrollable Area grouped by Cycle */}
                  <div className="bg-slate-50 border border-slate-200/60 p-3 rounded-xl max-h-[180px] overflow-y-auto space-y-3">
                    {(Object.keys(CYCLE_NAMES) as Cycle[]).map(cycleKey => {
                      const cycleGrades = gradesByCycle[cycleKey] || [];
                      if (cycleGrades.length === 0) return null;
                      return (
                        <div key={cycleKey} className="space-y-1">
                          <span className="text-[9px] font-black text-tertiary uppercase tracking-wider block">
                            {CYCLE_NAMES[cycleKey]}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cycleGrades.map(g => {
                              const isSelected = form.gradeIds.includes(g.id);
                              return (
                                <button
                                  type="button"
                                  key={g.id}
                                  onClick={() => {
                                    setForm(p => {
                                      const updated = p.gradeIds.includes(g.id)
                                        ? p.gradeIds.filter(id => id !== g.id)
                                        : [...p.gradeIds, g.id];
                                      return { ...p, gradeIds: updated };
                                    });
                                  }}
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer border ${
                                    isSelected
                                      ? 'bg-primary border-primary text-white shadow-sm'
                                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  {g.name}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {form.gradeIds.length === 0 && (
                    <span className="text-[10px] text-tertiary italic block mt-1">
                      * Al no seleccionar ningún grado, la materia será clasificada como "General" (Aplica para todo el colegio).
                    </span>
                  )}
                </div>

                {/* Hours and Status Side by Side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Weekly hours counter */}
                  <div className="space-y-1">
                    <label className="form-label text-slate-700">Horas Semanales</label>
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 max-w-[140px]">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, weeklyHours: Math.max(1, p.weeklyHours - 1) }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-600 border-0 cursor-pointer bg-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="flex-1 text-center font-bold text-slate-800 text-xs">
                        {form.weeklyHours}h
                      </span>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, weeklyHours: Math.min(40, p.weeklyHours + 1) }))}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 text-slate-600 border-0 cursor-pointer bg-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {form.type === 'MINED' && editingId && getSubSubjects(editingId).length > 0 && (
                      <span className="text-[10px] font-bold text-secondary block mt-1">
                        Suma de sub-materias: {getSubSubjects(editingId).reduce((sum, s) => sum + (s.weeklyHours || 0), 0)}h asignadas
                      </span>
                    )}
                  </div>

                  {/* Status Toggle Segment (Grayscale) */}
                  <div className="space-y-1">
                    <label className="form-label text-slate-700">Estado Operativo</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/60 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, status: 'ACTIVO' }))}
                        className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                          form.status === 'ACTIVO'
                            ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                            : 'text-secondary hover:bg-slate-200/30'
                        }`}
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, status: 'INACTIVO' }))}
                        className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                          form.status === 'INACTIVO'
                            ? 'bg-slate-800 text-white shadow-sm font-extrabold'
                            : 'text-secondary hover:bg-slate-200/30'
                        }`}
                      >
                        Inactivo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    <Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear Materia'}
                  </button>
                </div>
              </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content: Módulos Técnicos vs Plan de Materias */}
      {isModuleTab ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredModules.map((mod, i) => (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="card-crema p-5 flex flex-col justify-between relative border border-slate-200 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200/60 flex items-center justify-center shrink-0 text-indigo-600">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white tracking-wide">
                          {mod.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1 mt-1" title={mod.name}>
                          {mod.name}
                        </h3>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      mod.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {mod.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-semibold">{mod.technicalYear}° Año Técnico</span>
                      {mod.gradeId && <span className="text-slate-400">({getGradeName(mod.gradeId)})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{mod.hours} horas • {mod.weeks} semanas</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      <span>Docente: <strong className="text-slate-700">{mod.teacherName || 'Sin asignar'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Salón: <strong className="text-slate-700">{mod.classroom || 'Sin salón asignado'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleEditModule(mod)}
                    className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteModule(mod.id)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer border-0 bg-transparent"
                    title="Eliminar Módulo"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="card-crema overflow-hidden p-0">
            <table className="table-crema">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Código</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Nombre Módulo Técnico</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Año / Grado</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Horas / Semanas</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Docente</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Salón / Aula</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredModules.map((mod) => (
                  <tr key={mod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-xs text-slate-800">{mod.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-800 text-sm">{mod.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-bold">{mod.technicalYear}° Año {mod.gradeId ? `(${getGradeName(mod.gradeId)})` : ''}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-medium">{mod.hours}h / {mod.weeks} sem</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-semibold">{mod.teacherName || 'Sin Asignar'}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 font-medium">{mod.classroom || 'Sin asignar'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mod.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {mod.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEditModule(mod)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                          title="Editar módulo"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteModule(mod.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                          title="Eliminar módulo"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((s, i) => {
              const subSubjects = getSubSubjects(s.id);
              const parentSubject = s.parentSubjectId ? subjects.find(p => p.id === s.parentSubjectId) : null;
              const isMined = (s.type || 'MINED') === 'MINED';

              // Resolve list of assigned grades
              const subjectGradeIds = (s as any).gradeIds && Array.isArray((s as any).gradeIds)
                ? (s as any).gradeIds
                : s.gradeId
                ? [s.gradeId]
                : [];

              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className={`card-crema p-5 flex flex-col justify-between relative ${
                    selected.has(s.id)
                      ? 'ring-2 ring-primary border-primary'
                      : ''
                  }`}
                >
                  <div>
                    {/* Header with icon and title */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                          <BookMarked className="w-5 h-5 text-slate-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1" title={s.name}>
                              {s.name}
                            </h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              s.status === 'INACTIVO' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {s.status === 'INACTIVO' ? 'Inactivo' : 'Activo'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">{s.type || 'MINED'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSelect(s.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-slate-800'
                        }`}
                      >
                        {selected.has(s.id) && <Check className="w-3 h-3" />}
                      </button>
                    </div>

                    {/* Description */}
                    {s.description ? (
                      <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">{s.description}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic mb-4">Sin descripción registrada.</p>
                    )}

                    {/* Sub-materias or Parent info */}
                    {isMined && subSubjects.length > 0 ? (
                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Sub-materias ({subSubjects.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {subSubjects.map(sub => (
                            <span key={sub.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {sub.name} ({sub.weeklyHours}h)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : parentSubject ? (
                      <div className="mb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Asociada a</span>
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {parentSubject.name}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* Stats row at bottom */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <span className="text-xl font-black text-emerald-600 font-display">{s.weeklyHours || '—'}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Horas/Sem</p>
                    </div>
                    <div className="text-center">
                      <span className="text-xl font-black text-blue-600 font-display">{subjectGradeIds.length || '—'}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Grados</p>
                    </div>
                    <div className="text-center">
                      <span className="text-xl font-black text-purple-600 font-display">{isMined ? subSubjects.length : '—'}</span>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Sub-mat</p>
                    </div>
                  </div>

                  {/* Grade pills */}
                  {subjectGradeIds.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-slate-100">
                      {subjectGradeIds.slice(0, 4).map(gid => (
                        <span key={gid} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          <GraduationCap className="w-2.5 h-2.5" />
                          {getGradeName(gid)}
                        </span>
                      ))}
                      {subjectGradeIds.length > 4 && (
                        <span className="text-[9px] text-slate-400 font-bold">+{subjectGradeIds.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(s)}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* List Mode */
          <div className="card-crema overflow-hidden p-0">
            <table className="table-crema">
              <thead>
                <tr>
                  <th className="w-10 px-4 py-3">
                    <button
                      onClick={toggleSelectAll}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer border-slate-300 ${
                        selected.size === filtered.length && filtered.length > 0 ? 'bg-primary border-primary text-white' : ''
                      }`}
                    >
                      {selected.size === filtered.length && filtered.length > 0 && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Nombre Asignatura</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Clasificación</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Grado / Nivel</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Horas Semanales</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider">Estado</th>
                  <th className="px-4 py-3 text-[11px] font-bold text-secondary uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s, i) => {
                  const isMined = (s.type || 'MINED') === 'MINED';
                  const parentSubject = s.parentSubjectId ? subjects.find(p => p.id === s.parentSubjectId) : null;
                  const subSubjects = getSubSubjects(s.id);

                  // Resolve list of assigned grades
                  const subjectGradeIds = (s as any).gradeIds && Array.isArray((s as any).gradeIds)
                    ? (s as any).gradeIds
                    : s.gradeId
                    ? [s.gradeId]
                    : [];

                  return (
                    <React.Fragment key={s.id}>
                      <tr className={`hover:bg-slate-50/80 transition-colors ${selected.has(s.id) ? 'bg-slate-100/30' : ''}`}>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleSelect(s.id)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                              selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-slate-300'
                            }`}
                          >
                            {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                            {parentSubject ? (
                              <span className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                                Sub-materia de: {parentSubject.name}
                              </span>
                            ) : !isMined ? (
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                                Institucional Independiente
                              </span>
                            ) : null}
                          </div>
                          {s.description && <div className="text-xs text-tertiary mt-0.5 line-clamp-1">{s.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase bg-slate-50 text-slate-800 border border-slate-200">
                            {s.type || 'MINED'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-bold">
                          {subjectGradeIds.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {subjectGradeIds.map(gid => (
                                <span key={gid} className="bg-slate-50 border border-slate-200/80 px-1 py-0.2 rounded text-[9px]">
                                  {getGradeName(gid)}
                                </span>
                              ))}
                            </div>
                          ) : s.cycle ? (
                            CYCLE_NAMES[s.cycle]
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                          {s.weeklyHours || '—'} horas
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            s.status === 'INACTIVO' ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}>
                            {s.status === 'INACTIVO' ? 'Inactivo' : 'Activo'}
                          </span>
                        </td>
                         <td className="px-4 py-3 text-right">
                           <div className="flex justify-end gap-1">
                             <button
                               onClick={() => handleEdit(s)}
                               className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                             >
                               <Edit2 className="w-4 h-4 text-slate-500" />
                             </button>
                             <button
                               onClick={() => handleDelete(s.id)}
                               className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                             >
                               <Trash2 className="w-4 h-4 text-red-500" />
                             </button>
                           </div>
                         </td>
                      </tr>

                      {/* Sub-row for Institutional components nested inside MINED bases */}
                      {isMined && subSubjects.length > 0 && (
                        <tr className="bg-slate-50/40">
                          <td />
                          <td colSpan={6} className="px-6 py-2.5">
                            <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-slate-200">
                              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider block">
                                Especialidades Institucionales Vinculadas:
                              </span>
                              {subSubjects.map(sub => (
                                <div key={sub.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/80 max-w-2xl shadow-sm">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700">{sub.name}</span>
                                    <span className="text-[10px] font-medium bg-slate-50 text-slate-700 px-2 py-0.2 rounded-md border border-slate-200/60">
                                      Sub-materia
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-slate-500 text-[11px]">{sub.weeklyHours} horas/semana</span>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleEdit(sub)}
                                        className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer border-0 bg-transparent"
                                        title="Editar sub-materia"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(sub.id)}
                                        className="p-1 hover:bg-red-50 rounded text-red-500 cursor-pointer border-0 bg-transparent"
                                        title="Eliminar sub-materia"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {((isModuleTab && filteredModules.length === 0) || (!isModuleTab && filtered.length === 0)) && (
        <div className="text-center py-12 text-tertiary">
          <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">
            {isModuleTab ? 'No se encontraron módulos técnicos registrados' : 'No se encontraron materias en este nivel o grupo'}
          </p>
        </div>
      )}
    </div>
  );
}
