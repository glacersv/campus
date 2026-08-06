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
  Network,
  Layers,
  ChevronRight,
  Clock,
  Settings,
  HelpCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getAllGrades
} from '../../lib/firestore';
import { Subject, Grade, CYCLE_NAMES, Cycle } from '../../types';

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Advanced UX Search & Filter States
  const [search, setSearch] = useState('');
  const [activeCycleTab, setActiveCycleTab] = useState<'all' | 'parvularia' | 'basica' | 'bachillerato'>('all');
  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'MINED' | 'INSTITUCIONAL'>('all');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: '',
    description: '',
    cycle: '' as Cycle | '',
    gradeId: '',
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    weeklyHours: 4,
    type: 'MINED' as 'MINED' | 'INSTITUCIONAL',
    parentSubjectId: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [subs, grds] = await Promise.all([getAllSubjects(), getAllGrades()]);
      setSubjects(subs);
      setGrades(grds);
    } finally { setLoading(false); }
  };

  const getGradeName = (id?: string) => grades.find(g => g.id === id)?.name || id || '—';

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      cycle: '',
      gradeId: '',
      status: 'ACTIVO',
      weeklyHours: 4,
      type: 'MINED',
      parentSubjectId: '',
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }

    try {
      const data: Partial<Subject> = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        cycle: form.cycle || undefined,
        gradeId: form.gradeId || undefined,
        status: form.status,
        weeklyHours: form.weeklyHours,
        type: form.type,
        parentSubjectId: form.type === 'INSTITUCIONAL' ? form.parentSubjectId || undefined : undefined,
      };

      if (editingId) {
        await updateSubject(editingId, data);
        toast.success('Materia actualizada correctamente');
      } else {
        const id = `${form.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${form.gradeId || 'general'}`;
        await createSubject({ id, ...data } as Subject);
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
    setForm({
      name: s.name,
      description: s.description || '',
      cycle: s.cycle || '',
      gradeId: s.gradeId || '',
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
        try { await deleteSubject(id); deleted++; }
        catch { errors++; }
      }
      if (deleted > 0) toast.success(`${deleted} materia(s) eliminada(s)`);
      if (errors > 0) toast.error(`${errors} materia(s) no se pudieron eliminar (en uso)`);
      setSelected(new Set());
      loadData();
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  // Chronological Cycle Matcher for Level Groups Tabs
  const matchCycleGroup = (subjCycle?: Cycle): 'parvularia' | 'basica' | 'bachillerato' | 'none' => {
    if (!subjCycle) return 'none';
    if (subjCycle === 'parvularia') return 'parvularia';
    if (['1', '2', '3'].includes(subjCycle)) return 'basica';
    if (subjCycle === '4') return 'bachillerato';
    return 'none';
  };

  // Filter logic
  const filtered = subjects.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.description && s.description.toLowerCase().includes(search.toLowerCase()));

    // Level group tab filter
    const subjGroup = matchCycleGroup(s.cycle);
    const matchCycleTab = activeCycleTab === 'all' || subjGroup === activeCycleTab;

    // Type tab filter (MINED vs INSTITUCIONAL)
    const matchTypeTab = activeTypeTab === 'all' || (s.type || 'MINED') === activeTypeTab;

    // Direct Grade ID filter
    const matchGrade = !selectedGradeId || s.gradeId === selectedGradeId;

    return matchSearch && matchCycleTab && matchTypeTab && matchGrade;
  });

  // Helper to resolve children (Institutional sub-subjects under MINED parent)
  const getSubSubjects = (parentId: string) => {
    return subjects.filter(s => s.parentSubjectId === parentId && s.status !== 'INACTIVO');
  };

  // Get active MINED subjects for parent dropdown in Institutional creation
  const minedSubjects = subjects.filter(s => (s.type || 'MINED') === 'MINED' && s.status === 'ACTIVO');

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <BookMarked className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Plan de Materias</h1>
            <p className="module-subtitle">Configuración oficial MINED y materias institucionales integradas</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Nueva Materia
        </button>
      </div>

      {/* Premium UX Filters & Level Groups Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs space-y-4">

        {/* Row 1: Search and Primary Level Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

          {/* Custom Tabs: Educational Levels */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/60 max-w-max">
            <button
              onClick={() => { setActiveCycleTab('all'); setSelectedGradeId(''); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCycleTab === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Todos los Niveles
            </button>
            <button
              onClick={() => { setActiveCycleTab('parvularia'); setSelectedGradeId(''); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCycleTab === 'parvularia'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Parvularia
            </button>
            <button
              onClick={() => { setActiveCycleTab('basica'); setSelectedGradeId(''); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCycleTab === 'basica'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Básica (1° - 9°)
            </button>
            <button
              onClick={() => { setActiveCycleTab('bachillerato'); setSelectedGradeId(''); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                activeCycleTab === 'bachillerato'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Bachillerato (10° - 12°)
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full lg:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar materia o descripción..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Row 2: Secondary Filters (Grade Select, Type Tabs, View Modes) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">

          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter: MINED vs Institutional */}
            <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 text-[11px] font-bold">
              <button
                onClick={() => setActiveTypeTab('all')}
                className={`px-3 py-1 rounded-lg transition-all border-0 cursor-pointer ${
                  activeTypeTab === 'all'
                    ? 'bg-white text-slate-800 shadow-3xs'
                    : 'text-slate-500 hover:bg-slate-200/30'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setActiveTypeTab('MINED')}
                className={`px-3 py-1 rounded-lg transition-all border-0 cursor-pointer ${
                  activeTypeTab === 'MINED'
                    ? 'bg-white text-emerald-700 shadow-3xs'
                    : 'text-slate-500 hover:bg-slate-200/30'
                }`}
              >
                Oficiales MINED
              </button>
              <button
                onClick={() => setActiveTypeTab('INSTITUCIONAL')}
                className={`px-3 py-1 rounded-lg transition-all border-0 cursor-pointer ${
                  activeTypeTab === 'INSTITUCIONAL'
                    ? 'bg-white text-amber-700 shadow-3xs'
                    : 'text-slate-500 hover:bg-slate-200/30'
                }`}
              >
                Institucionales
              </button>
            </div>

            {/* Dynamic Grade Selector (Filtered based on active level tab) */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedGradeId}
                onChange={e => setSelectedGradeId(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer border-0"
              >
                <option value="">Filtrar por Grado específico...</option>
                {grades
                  .filter(g => {
                    if (activeCycleTab === 'all') return true;
                    return matchCycleGroup(g.cycle) === activeCycleTab;
                  })
                  .map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Actions */}
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl"
              >
                <span className="text-xs text-red-700 font-bold">{selected.size} seleccionada(s)</span>
                <button onClick={handleBulkDelete} className="p-1 hover:bg-red-100 rounded-lg border-0 cursor-pointer">
                  <Trash className="w-3.5 h-3.5 text-red-600" />
                </button>
                <button onClick={() => setSelected(new Set())} className="p-1 hover:bg-red-100 rounded-lg border-0 cursor-pointer">
                  <X className="w-3.5 h-3.5 text-red-600" />
                </button>
              </motion.div>
            )}

            {/* View Mode Switcher */}
            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 transition-colors border-0 cursor-pointer ${
                  viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors border-0 cursor-pointer ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Info Card on Multi-evaluation Hierarchy */}
      <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 leading-relaxed shadow-3xs">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 block mb-0.5">Jerarquía Educativa: Materias MINED vs. Especialidades Institucionales</span>
          Para cumplir con las normas del MINED de El Salvador, las materias oficiales (como Ciencia y Tecnología) son evaluadas unitariamente.
          Aquí puedes registrar materias <span className="font-bold text-emerald-700">Oficiales MINED</span> y anidar asignaturas <span className="font-bold text-amber-700">Institucionales Internas</span> (como Física, Química o Biología) dentro de ellas para llevar un desglose interno con distintos docentes.
        </div>
      </div>

      {/* Add/Edit Modal centered with backdrop blur */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-900 text-base">
                  {editingId ? 'Editar Materia / Sub-materia' : 'Nueva Materia o Sub-materia'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-2 gap-4">
                  {/* Subject Name */}
                  <div className="col-span-2">
                    <label className="form-label">Nombre de la Asignatura *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Física General o Ciencias"
                      className="input"
                      autoFocus
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="form-label">Descripción o Notas Curriculares</label>
                    <textarea
                      value={form.description}
                      onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Ej: Impartir 2 horas semanales como desglose de la materia Ciencia y Tecnología del MINED..."
                      className="input h-20 resize-none"
                    />
                  </div>

                  {/* Subject Type Selector */}
                  <div className="col-span-2">
                    <label className="form-label">Clasificación Curricular</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type: 'MINED', parentSubjectId: '' }))}
                        className={`py-2.5 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          form.type === 'MINED'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-3xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Oficial MINED (Asignatura Base)
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type: 'INSTITUCIONAL' }))}
                        className={`py-2.5 px-4 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          form.type === 'INSTITUCIONAL'
                            ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-3xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        Institucional (Sub-materia Especial)
                      </button>
                    </div>
                  </div>

                  {/* Parent Subject Matcher (Only if Institutional) */}
                  {form.type === 'INSTITUCIONAL' && (
                    <div className="col-span-2">
                      <label className="form-label text-amber-700">Materia Base MINED (A la que pertenece) *</label>
                      <select
                        value={form.parentSubjectId}
                        onChange={e => setForm(p => ({ ...p, parentSubjectId: e.target.value }))}
                        className="input border-amber-200 focus:border-amber-500"
                        required
                      >
                        <option value="">Selecciona la materia oficial que la agrupa...</option>
                        {minedSubjects.map(m => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.gradeId ? `(${getGradeName(m.gradeId)})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 italic mt-1">
                        Las notas parciales de esta sub-materia se integrarán para promediar la nota final de la asignatura oficial seleccionada.
                      </p>
                    </div>
                  )}

                  {/* Grade specific selector */}
                  <div>
                    <label className="form-label">Grado Específico (MINED)</label>
                    <select
                      value={form.gradeId}
                      onChange={e => setForm(p => ({ ...p, gradeId: e.target.value }))}
                      className="input"
                    >
                      <option value="">Cualquier grado</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>

                  {/* Cycle specific selector */}
                  <div>
                    <label className="form-label">Ciclo</label>
                    <select
                      value={form.cycle}
                      onChange={e => setForm(p => ({ ...p, cycle: e.target.value as Cycle | '' }))}
                      className="input"
                    >
                      <option value="">Sin ciclo</option>
                      {Object.entries(CYCLE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>

                  {/* Weekly hours */}
                  <div>
                    <label className="form-label">Horas Semanales</label>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={form.weeklyHours}
                      onChange={e => setForm(p => ({ ...p, weeklyHours: parseInt(e.target.value) || 4 }))}
                      className="input"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="form-label">Estado Operativo</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(p => ({ ...p, status: e.target.value as 'ACTIVO' | 'INACTIVO' }))}
                      className="input"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Grid Render */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((s, i) => {
            const subSubjects = getSubSubjects(s.id);
            const parentSubject = s.parentSubjectId ? subjects.find(p => p.id === s.parentSubjectId) : null;
            const isMined = (s.type || 'MINED') === 'MINED';

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition-all h-[280px] relative ${
                  selected.has(s.id)
                    ? 'ring-2 ring-primary border-primary'
                    : isMined
                    ? 'border-emerald-200/80'
                    : 'border-amber-200/80 bg-amber-50/10'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelect(s.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'
                        }`}
                      >
                        {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                      </button>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1" title={s.name}>
                        {s.name}
                      </h3>
                    </div>

                    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md shrink-0 uppercase ${
                      isMined
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {s.type || 'MINED'}
                    </span>
                  </div>

                  {/* Description / Hierarchy Info */}
                  {s.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{s.description}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mt-1">Sin descripción registrada.</p>
                  )}

                  {/* Hierarchical Connections Render (Sub-subjects list inside MINED or parent tag in Institutional) */}
                  <div className="mt-4 space-y-1.5">
                    {isMined && subSubjects.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sub-materias ({subSubjects.length}):</span>
                        <div className="flex flex-wrap gap-1">
                          {subSubjects.map(sub => (
                            <span key={sub.id} className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {sub.name} ({sub.weeklyHours}h)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : parentSubject ? (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asociada a:</span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {parentSubject.name}
                        </span>
                      </div>
                    ) : isMined ? (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Materia Única / Autónoma</span>
                    ) : null}
                  </div>
                </div>

                {/* Card Footer badges & action buttons */}
                <div>
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                    {s.gradeId ? (
                      <span className="inline-flex items-center gap-1 bg-primary/5 border border-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <GraduationCap className="w-3 h-3" />
                        {getGradeName(s.gradeId)}
                      </span>
                    ) : s.cycle ? (
                      <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {CYCLE_NAMES[s.cycle]}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        Cualquier Grado
                      </span>
                    )}

                    {s.weeklyHours && (
                      <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {s.weeklyHours}h/sem
                      </span>
                    )}
                  </div>

                  <div className="flex justify-end gap-1 mt-3">
                    <button
                      onClick={() => handleEdit(s)}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List Mode with Clean nested sub-subjects */
        <div className="card overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-3xs p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
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
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Nombre Asignatura</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clasificación</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grado / Nivel</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horas Semanales</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s, i) => {
                const isMined = (s.type || 'MINED') === 'MINED';
                const parentSubject = s.parentSubjectId ? subjects.find(p => p.id === s.parentSubjectId) : null;
                const subSubjects = getSubSubjects(s.id);

                return (
                  <React.Fragment key={s.id}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${selected.has(s.id) ? 'bg-primary/5' : ''}`}>
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
                          {parentSubject && (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                              Sub-materia de: {parentSubject.name}
                            </span>
                          )}
                        </div>
                        {s.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          isMined
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-100'
                        }`}>
                          {s.type || 'MINED'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-bold">
                        {s.gradeId ? getGradeName(s.gradeId) : s.cycle ? CYCLE_NAMES[s.cycle] : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                        {s.weeklyHours || '—'} horas
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          s.status === 'INACTIVO' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {s.status || 'ACTIVO'}
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
                          <div className="flex flex-col gap-1.5 pl-4 border-l-2 border-amber-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Especialidades Institucionales Vinculadas:
                            </span>
                            {subSubjects.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/80 max-w-2xl shadow-3xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700">{sub.name}</span>
                                  <span className="text-[10px] font-medium bg-amber-50 text-amber-800 px-2 py-0.2 rounded-md">
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
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No se encontraron materias en este nivel o grupo</p>
        </div>
      )}
    </div>
  );
}
