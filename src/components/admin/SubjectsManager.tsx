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
  Minus
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

// Centralized ordering for grades to sort chronologically
const GRADE_ORDER: Record<string, number> = {
  k4: 1, k5: 2, k6: 3,
  '1': 4, '2': 5, '3': 6, '4': 7, '5': 8, '6': 9, '7': 10, '8': 11, '9': 12,
  '10g': 13, '11g': 14, '10t': 15, '11t': 16, '12t': 17
};

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [form, setForm] = useState({
    name: '',
    description: '',
    gradeIds: [] as string[], // Supports multiple grades!
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    weeklyHours: 4,
    type: 'MINED' as 'MINED' | 'INSTITUCIONAL',
    parentSubjectId: '',
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [subs, grds] = await Promise.all([getAllSubjects(), getAllGrades()]);
      // Sort grades chronologically
      const sortedGrades = [...grds].sort((a, b) => (GRADE_ORDER[a.id] || 99) - (GRADE_ORDER[b.id] || 99));
      setSubjects(subs);
      setGrades(sortedGrades);
    } finally { setLoading(false); }
  };

  const getGradeName = (id?: string) => grades.find(g => g.id === id)?.name || id || '—';

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      gradeIds: [],
      status: 'ACTIVO',
      weeklyHours: 4,
      type: 'MINED',
      parentSubjectId: '',
    });
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
    if (form.type === 'INSTITUCIONAL' && !form.parentSubjectId) {
      toast.error('Debes seleccionar la materia base MINED a la que pertenece');
      return;
    }

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
        parentSubjectId: form.type === 'INSTITUCIONAL' ? form.parentSubjectId : null,
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

  const toggleSelect = (id: string) => {
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  // Filter logic supporting multi-grade subjects
  const filtered = subjects.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        (s.description && s.description.toLowerCase().includes(search.toLowerCase()));

    const matchType = !selectedType || (s.type || 'MINED') === selectedType;

    // Direct check in s.gradeId or s.gradeIds list
    let matchGrade = true;
    if (selectedGradeId) {
      const subjectGradeIds = (s as any).gradeIds && Array.isArray((s as any).gradeIds)
        ? (s as any).gradeIds
        : s.gradeId
        ? [s.gradeId]
        : [];

      matchGrade = subjectGradeIds.includes(selectedGradeId) || subjectGradeIds.length === 0;
    }

    return matchSearch && matchType && matchGrade;
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
      <div className="w-8 h-8 border border-slate-300 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-slate-100 border border-slate-200">
            <BookMarked className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Plan de Materias</h1>
            <p className="module-subtitle">Configuración oficial MINED y asignaciones institucionales integradas</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }} className="btn-primary shrink-0">
          <Plus className="w-4 h-4" /> Nueva Materia
        </button>
      </div>

      {/* Button-Pills-Only Grayscale Filtering Dashboard (Ultra Clean) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-3xs space-y-4">

        {/* Search & Type Select */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Grayscale Pills: Type Select */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setSelectedType('')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                selectedType === ''
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Todos los Tipos
            </button>
            <button
              onClick={() => setSelectedType('MINED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                selectedType === 'MINED'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Oficiales MINED
            </button>
            <button
              onClick={() => setSelectedType('INSTITUCIONAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                selectedType === 'INSTITUCIONAL'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Institucionales
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar materia..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>

        {/* Grade Pills List - Elegantly Grouped Chronologically by Cycle (Compact & Clean) */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Filtrar por Grado / Nivel:</span>
            {selectedGradeId && (
              <button
                onClick={() => setSelectedGradeId('')}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline border-0 cursor-pointer bg-transparent"
              >
                Limpiar filtro de grado
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {/* General Switch */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSelectedGradeId('')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  selectedGradeId === ''
                    ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-600'
                }`}
              >
                Todos los Grados
              </button>
            </div>

            {/* Cycles horizontal alignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.keys(CYCLE_NAMES) as Cycle[]).map(cycleKey => {
                const cycleGrades = gradesByCycle[cycleKey] || [];
                if (cycleGrades.length === 0) return null;
                return (
                  <div key={cycleKey} className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-200/50 space-y-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block border-b border-slate-200/60 pb-1">
                      {CYCLE_NAMES[cycleKey]}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {cycleGrades.map(g => (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGradeId(g.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                            selectedGradeId === g.id
                              ? 'bg-slate-800 text-white border-slate-800 shadow-3xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                          }`}
                        >
                          {g.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bulk action buttons & view selector */}
        { (selected.size > 0 || viewMode) && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              {selected.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl"
                >
                  <span className="text-xs text-slate-700 font-bold">{selected.size} seleccionada(s)</span>
                  <button onClick={handleBulkDelete} className="p-1 hover:bg-slate-200 rounded-lg border-0 cursor-pointer bg-transparent">
                    <Trash className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <button onClick={() => setSelected(new Set())} className="p-1 hover:bg-slate-200 rounded-lg border-0 cursor-pointer bg-transparent">
                    <X className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </motion.div>
              )}
            </div>

            <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode('card')}
                className={`p-2 transition-colors border-0 cursor-pointer ${
                  viewMode === 'card' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors border-0 cursor-pointer ${
                  viewMode === 'list' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hierarchy Info Box */}
      <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs text-slate-600 leading-relaxed shadow-3xs">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 block mb-0.5">Jerarquía Educativa: Materias MINED vs. Especialidades Institucionales</span>
          Para cumplir con las normas del MINED de El Salvador, las materias oficiales (como Ciencia y Tecnología) son evaluadas unitariamente.
          Aquí puedes registrar materias <span className="font-bold text-slate-800">Oficiales MINED</span> y anidar asignaturas <span className="font-bold text-slate-700">Institucionales Internas</span> (como Física, Química o Biología) dentro de ellas para llevar un desglose interno con distintos docentes.
        </div>
      </div>

      {/* Add/Edit Modal (Grayscale & Multi-Grade Compatible Layout) */}
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
                  {editingId ? 'Editar Materia' : 'Nueva Materia o Sub-materia'}
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

                {/* Subject Name */}
                <div className="space-y-1">
                  <label className="form-label text-slate-700">Nombre de la Asignatura *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ej: Ciencias Naturales"
                    className="input"
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
                    className="input h-16 resize-none"
                  />
                </div>

                {/* Classification Toggle */}
                <div className="space-y-1">
                  <label className="form-label text-slate-700">Clasificación Curricular</label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'MINED', parentSubjectId: '' }))}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                        form.type === 'MINED'
                          ? 'bg-slate-800 border-slate-800 text-white shadow-3xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Oficial MINED (Asignatura Base)
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: 'INSTITUCIONAL' }))}
                      className={`py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                        form.type === 'INSTITUCIONAL'
                          ? 'bg-slate-800 border-slate-800 text-white shadow-3xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Institucional (Sub-materia Especial)
                    </button>
                  </div>
                </div>

                {/* Parent Subject Grid Selector (Only if Institutional) */}
                {form.type === 'INSTITUCIONAL' && (
                  <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <label className="form-label text-slate-700">Materia Base MINED a la que pertenece *</label>
                    <div className="grid grid-cols-1 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {minedSubjects.map(m => {
                        const isSelected = form.parentSubjectId === m.id;
                        return (
                          <button
                            type="button"
                            key={m.id}
                            onClick={() => setForm(p => ({ ...p, parentSubjectId: m.id }))}
                            className={`p-2 rounded-lg border text-left text-xs font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-slate-800 border-slate-800 text-white shadow-xs'
                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            {m.name} {m.gradeId ? `(${getGradeName(m.gradeId)})` : ''}
                          </button>
                        );
                      })}
                      {minedSubjects.length === 0 && (
                        <span className="text-xs text-slate-400 italic col-span-2">No hay materias oficiales creadas todavía.</span>
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
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800 underline border-0 bg-transparent cursor-pointer"
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
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">
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
                                      ? 'bg-slate-800 border-slate-800 text-white shadow-3xs'
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
                    <span className="text-[10px] text-slate-400 italic block mt-1">
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
                      <span className="text-[10px] font-bold text-slate-500 block mt-1">
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
                            ? 'bg-slate-800 text-white shadow-3xs font-extrabold'
                            : 'text-slate-500 hover:bg-slate-200/30'
                        }`}
                      >
                        Activo
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, status: 'INACTIVO' }))}
                        className={`py-1.5 rounded-lg border-0 cursor-pointer transition-all ${
                          form.status === 'INACTIVO'
                            ? 'bg-slate-800 text-white shadow-3xs font-extrabold'
                            : 'text-slate-500 hover:bg-slate-200/30'
                        }`}
                      >
                        Inactivo
                      </button>
                    </div>
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
                  <button type="submit" className="btn-primary bg-slate-800 hover:bg-slate-900 border-slate-800">
                    <Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear Materia'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid view */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between hover:shadow-md transition-all min-h-[280px] relative ${
                  selected.has(s.id)
                    ? 'ring-2 ring-primary border-primary'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSelect(s.id)}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                          selected.has(s.id) ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300 hover:border-slate-800'
                        }`}
                      >
                        {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                      </button>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1" title={s.name}>
                        {s.name}
                      </h3>
                    </div>

                    <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded-md shrink-0 uppercase bg-slate-100 text-slate-800 border border-slate-200">
                      {s.type || 'MINED'}
                    </span>
                  </div>

                  {s.description ? (
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{s.description}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic mt-1">Sin descripción registrada.</p>
                  )}

                  <div className="mt-4 space-y-1.5">
                    {isMined && subSubjects.length > 0 ? (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sub-materias ({subSubjects.length}):</span>
                        <div className="flex flex-wrap gap-1">
                          {subSubjects.map(sub => (
                            <span key={sub.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                              {sub.name} ({sub.weeklyHours}h)
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : parentSubject ? (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asociada a:</span>
                        <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {parentSubject.name}
                        </span>
                      </div>
                    ) : isMined ? (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Materia Única / Autónoma</span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100 pr-1">
                    {subjectGradeIds.length > 0 ? (
                      subjectGradeIds.map(gid => (
                        <span key={gid} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                          <GraduationCap className="w-2.5 h-2.5" />
                          {getGradeName(gid)}
                        </span>
                      ))
                    ) : s.cycle ? (
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {CYCLE_NAMES[s.cycle]}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Cualquier Grado
                      </span>
                    )}

                    {s.weeklyHours && (
                      <span className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-bold px-1.5 py-0.5 rounded">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
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
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List Mode */
        <div className="card overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-3xs p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer border-slate-300 ${
                      selected.size === filtered.length && filtered.length > 0 ? 'bg-slate-800 border-slate-800 text-white' : ''
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
                            selected.has(s.id) ? 'bg-slate-800 border-slate-800 text-white' : 'border-slate-300'
                          }`}
                        >
                          {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{s.name}</span>
                          {parentSubject && (
                            <span className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60">
                              Sub-materia de: {parentSubject.name}
                            </span>
                          )}
                        </div>
                        {s.description && <div className="text-xs text-slate-400 mt-0.5 line-clamp-1">{s.description}</div>}
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
                          s.status === 'INACTIVO' ? 'bg-slate-100 text-slate-500' : 'bg-slate-100 text-slate-800'
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
                            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border-0 bg-transparent"
                          >
                            <Trash2 className="w-4 h-4 text-slate-500" />
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Especialidades Institucionales Vinculadas:
                            </span>
                            {subSubjects.map(sub => (
                              <div key={sub.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200/80 max-w-2xl shadow-3xs">
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
                                      className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer border-0 bg-transparent"
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
