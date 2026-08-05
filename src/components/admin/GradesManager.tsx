import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Plus,
  Layers,
  Users,
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
  Building2,
  Baby,
  User,
  UserRound,
  DoorOpen,
  CalendarDays,
  Clock,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  toggleGradeStatus,
  getAllSections,
  getAllBuildings,
  getCurrentSchoolYear,
  getAllStudents
} from '../../lib/firestore';
import { Grade, Section, Building, Cycle, BaccalaureateType, CYCLE_NAMES, Student } from '../../types';

const CYCLE_COLORS: Record<Cycle, string> = {
  'parvularia': 'bg-pink-100 text-pink-700',
  '1': 'bg-emerald-100 text-emerald-700',
  '2': 'bg-blue-100 text-blue-700',
  '3': 'bg-purple-100 text-purple-700',
  '4': 'bg-amber-100 text-amber-700'
};

const BAC_COLOR: Record<BaccalaureateType, string> = {
  general: 'bg-sky-100 text-sky-700',
  tecnico: 'bg-orange-100 text-orange-700'
};

const STATUS_COLOR: Record<Cycle, string> = {
  'parvularia': 'bg-pink-100 text-pink-700',
  '1': 'bg-emerald-100 text-emerald-700',
  '2': 'bg-blue-100 text-blue-700',
  '3': 'bg-purple-100 text-purple-700',
  '4': 'bg-amber-100 text-amber-700'
};

const CYCLE_HEX: Record<Cycle, string> = {
  'parvularia': '#EC4899',
  '1': '#10B981',
  '2': '#3B82F6',
  '3': '#8B5CF6',
  '4': '#F59E0B'
};

const CYCLE_LABEL: Record<Cycle, { label: string; Icon: React.ElementType; size: string }> = {
  'parvularia': { label: 'Parvularia', Icon: Baby, size: 'w-3 h-3' },
  '1': { label: 'Primer Ciclo', Icon: Baby, size: 'w-4 h-4' },
  '2': { label: 'Segundo Ciclo', Icon: User, size: 'w-5 h-5' },
  '3': { label: 'Tercer Ciclo', Icon: UserRound, size: 'w-6 h-6' },
  '4': { label: 'Bachillerato', Icon: GraduationCap, size: 'w-7 h-7' }
};

export default function GradesManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', cycle: '1' as Cycle, baccalaureateType: '' as '' | BaccalaureateType });
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<Cycle | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'ACTIVO' | 'INACTIVO' | 'all'>('all');
  const [onlyActive, setOnlyActive] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [g, s, b, cy, st] = await Promise.all([
        getAllGrades(),
        getAllSections(),
        getAllBuildings(),
        getCurrentSchoolYear(),
        getAllStudents()
      ]);
      const activeYear = cy || new Date().getFullYear();
      const hasYearSections = s.some(sec => sec.schoolYear === activeYear);
      const filteredSecs = s.filter(sec =>
        hasYearSections ? sec.schoolYear === activeYear : !sec.schoolYear
      );
      setGrades(g);
      setSections(filteredSecs);
      setBuildings(b);
      setStudents(st);
    } finally { setLoading(false); }
  };

  const getBuildingName = (id: string) => buildings.find((b) => b.id === id)?.name || '—';

  const getGradeBuildingName = (gradeId: string) => {
    const gradeSections = sections.filter((s) => s.gradeId === gradeId && s.buildingId);
    if (gradeSections.length === 0) return null;
    const buildingIds = Array.from(new Set(gradeSections.map((s) => s.buildingId!)));
    if (buildingIds.length === 1) return getBuildingName(buildingIds[0]);
    return `${getBuildingName(buildingIds[0])} +${buildingIds.length - 1}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const data: Partial<Grade> = {
        name: form.name.trim(),
        cycle: form.cycle,
        baccalaureateType: form.baccalaureateType || undefined
      };
      if (editingId) {
        await updateGrade(editingId, data);
        toast.success('Grado actualizado correctamente');
      } else {
        await createGrade({ id: `${form.cycle}-${form.name.trim().toLowerCase().replace(/\s+/g, '-')}`, name: form.name.trim(), cycle: form.cycle, baccalaureateType: form.baccalaureateType || undefined });
        toast.success('Grado creado correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', cycle: '1', baccalaureateType: '' });
      loadData();
    } catch (err) { toast.error('Error al guardar grado'); console.error(err); }
  };

  const handleEdit = (g: Grade) => {
    setEditingId(g.id);
    setForm({ name: g.name, cycle: g.cycle, baccalaureateType: g.baccalaureateType || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este grado?')) {
      try { await deleteGrade(id); toast.success('Grado eliminado'); loadData(); }
      catch (err) { toast.error('Error al eliminar grado'); }
    }
  };

  const handleToggleStatus = async (id: string, current?: string) => {
    try { await toggleGradeStatus(id, current); toast.success('Estado actualizado'); loadData(); }
    catch (err) { toast.error('Error al cambiar estado'); console.error(err); }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} grado(s)?`)) {
      try {
        for (const id of selected) await deleteGrade(id);
        toast.success(`${selected.size} grado(s) eliminados`);
        setSelected(new Set());
        loadData();
      } catch (err) { toast.error('Error al eliminar grados'); }
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((g) => g.id)));
  };

  const activeGradeIds = new Set(students.map(st => st.gradeId).filter(Boolean));

  const filtered = grades.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase());
    const matchesCycle = cycleFilter === 'all' || g.cycle === cycleFilter;
    const matchesStatus = statusFilter === 'all' || (g.status || 'ACTIVO') === statusFilter;
    const matchesActive = !onlyActive || activeGradeIds.has(g.id);
    return matchesSearch && matchesCycle && matchesStatus && matchesActive;
  });

  const filteredSectionsCount = sections.filter(sec => filtered.some(g => g.id === sec.gradeId)).length;
  const filteredStudentsCount = students.filter(st => filtered.some(g => g.id === st.gradeId)).length;

  const cycleGroups = {
    'parvularia': filtered.filter((g) => g.cycle === 'parvularia').sort((a, b) => extractGradeNumber(a) - extractGradeNumber(b)),
    '1': filtered.filter((g) => g.cycle === '1').sort((a, b) => extractGradeNumber(a) - extractGradeNumber(b)),
    '2': filtered.filter((g) => g.cycle === '2').sort((a, b) => extractGradeNumber(a) - extractGradeNumber(b)),
    '3': filtered.filter((g) => g.cycle === '3').sort((a, b) => extractGradeNumber(a) - extractGradeNumber(b)),
    '4': filtered.filter((g) => g.cycle === '4').sort((a, b) => sortBaccalaureate(a, b))
  } as const;

  function extractGradeNumber(grade: Grade): number {
    const match = grade.name.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  function sortBaccalaureate(a: Grade, b: Grade): number {
    const aType = a.baccalaureateType === 'tecnico' ? 1 : 0;
    const bType = b.baccalaureateType === 'tecnico' ? 1 : 0;
    if (aType !== bType) return aType - bType;
    return extractGradeNumber(a) - extractGradeNumber(b);
  }

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="module-title">Grados</h1>
            <p className="module-subtitle">{filtered.length} grado(s) registrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', cycle: '1', baccalaureateType: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Grado
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar grado..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
            <button onClick={() => setCycleFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${cycleFilter === 'all' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Todos</button>
            {(Object.keys(CYCLE_NAMES) as Cycle[]).map((c) => (
              <button key={c} onClick={() => setCycleFilter(c)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${cycleFilter === c ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>{CYCLE_NAMES[c]}</button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
            <button onClick={() => setStatusFilter('all')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Todos</button>
            <button onClick={() => setStatusFilter('ACTIVO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'ACTIVO' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Activos</button>
            <button onClick={() => setStatusFilter('INACTIVO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${statusFilter === 'INACTIVO' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Inactivos</button>
          </div>

          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-3xs cursor-pointer select-none hover:bg-slate-50 transition-colors" onClick={() => setOnlyActive(!onlyActive)}>
            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${onlyActive ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
              {onlyActive && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
            </div>
            <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sólo Grados con Alumnos</span>
          </div>

          {selected.size > 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <span className="text-sm text-red-700 font-medium">{selected.size} seleccionado(s)</span>
              <button onClick={handleBulkDelete} className="p-1.5 hover:bg-red-100 rounded-lg"><Trash className="w-4 h-4 text-red-600" /></button>
              <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-red-100 rounded-lg"><X className="w-4 h-4 text-red-600" /></button>
            </motion.div>
          )}
          <div className="flex border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('card')} className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

      {/* Premium Statistics Banner */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Grados Activos</span>
              <span className="text-base font-extrabold text-slate-800 font-display">{filtered.length} registrados</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Secciones Totales</span>
              <span className="text-base font-extrabold text-slate-800 font-display">{filteredSectionsCount} secciones</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alumnos Matriculados</span>
              <span className="text-base font-extrabold text-slate-800 font-display">{filteredStudentsCount} alumnos</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario Modal */}
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
                <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Editar Grado' : 'Nuevo Grado'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: 10mo Grado" className="input" autoFocus />
                  </div>
                  <div>
                    <label className="form-label">Ciclo *</label>
                    <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value as Cycle })} className="input">
                      {(Object.keys(CYCLE_NAMES) as Cycle[]).map((c) => (
                        <option key={c} value={c}>{CYCLE_NAMES[c]}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Tipo de Bachillerato</label>
                    <select value={form.baccalaureateType} onChange={(e) => setForm({ ...form, baccalaureateType: e.target.value as '' | BaccalaureateType })} className="input">
                      <option value="">Ninguno</option>
                      <option value="general">General</option>
                      <option value="tecnico">Técnico</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {viewMode === 'card' && cycleFilter === 'all' ? (
        <div className="space-y-4">
          {(Object.keys(CYCLE_NAMES) as Cycle[]).map((c) => {
            const items = cycleGroups[c];
            if (items.length === 0) return null;
            return (
              <div key={c}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{CYCLE_NAMES[c]}</span>
                  <span className="text-xs text-slate-400">({items.length})</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {items.map((g, i) => {
                    const sectionsCount = sections.filter((s) => s.gradeId === g.id).length;
                    const buildingName = getGradeBuildingName(g.id);
                    return (
                      <GradeCard
                        key={g.id}
                        grade={g}
                        index={i}
                        sectionsCount={sectionsCount}
                        buildingName={buildingName}
                        selected={selected.has(g.id)}
                        onToggleSelect={() => toggleSelect(g.id)}
                        onEdit={() => handleEdit(g)}
                        onDelete={() => handleDelete(g.id)}
                        onToggleStatus={() => handleToggleStatus(g.id, g.status)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((g, i) => {
            const sectionsCount = sections.filter((s) => s.gradeId === g.id).length;
            const buildingName = getGradeBuildingName(g.id);
            return (
              <GradeCard
                key={g.id}
                grade={g}
                index={i}
                sectionsCount={sectionsCount}
                buildingName={buildingName}
                selected={selected.has(g.id)}
                onToggleSelect={() => toggleSelect(g.id)}
                onEdit={() => handleEdit(g)}
                onDelete={() => handleDelete(g.id)}
                onToggleStatus={() => handleToggleStatus(g.id, g.status)}
              />
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-8 px-3 py-2">
                  <button onClick={toggleSelectAll} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}>
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="w-2.5 h-2.5" />}
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Grado</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Ciclo</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Tipo</th>
                <th className="text-center px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <motion.tr key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className={`table-row ${selected.has(g.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-2">
                    <button onClick={() => toggleSelect(g.id)} className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(g.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}>
                      {selected.has(g.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2"><span className="font-medium text-slate-900">{g.name}</span></td>
                  <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${CYCLE_COLORS[g.cycle]}`}>{CYCLE_NAMES[g.cycle]}</span></td>
                  <td className="px-3 py-2">
                    {g.baccalaureateType ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${BAC_COLOR[g.baccalaureateType]}`}>{g.baccalaureateType === 'general' ? 'General' : 'Técnico'}</span>
                    ) : (<span className="text-slate-400 text-xs">—</span>)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => handleToggleStatus(g.id, g.status)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${(g.status || 'ACTIVO') === 'ACTIVO' ? `${STATUS_COLOR[g.cycle]} hover:bg-slate-200 hover:text-slate-600` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${(g.status || 'ACTIVO') === 'ACTIVO' ? 'bg-current' : 'bg-slate-400'}`} />
                      {(g.status || 'ACTIVO') === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(g)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => handleDelete(g.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron grados</p>
        </div>
      )}
    </div>
  );
}

const CYCLE_ICON_COLORS: Record<Cycle, string> = {
  'parvularia': 'text-pink-600',
  '1': 'text-emerald-600',
  '2': 'text-blue-600',
  '3': 'text-purple-600',
  '4': 'text-amber-600'
};

function GradeCard({ grade, index, sectionsCount, buildingName, selected, onToggleSelect, onEdit, onDelete, onToggleStatus }: {
  grade: Grade;
  index: number;
  sectionsCount: number;
  buildingName: string | null;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}) {
  const cycle = grade.cycle as Cycle;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className={`bg-white rounded-2xl p-5 border border-slate-200/80 transition-all ${selected ? 'ring-2 ring-primary border-primary' : 'hover:shadow-md'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-slate-50 border-slate-200/60 text-slate-500">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">{grade.name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleStatus} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${(grade.status || 'ACTIVO') === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
            {(grade.status || 'ACTIVO') === 'ACTIVO' ? 'Activo' : 'Inactivo'}
          </button>
          <button className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><span className="text-slate-400 text-xs font-bold tracking-widest">•••</span></button>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-slate-900 font-display tracking-tight">{sectionsCount ?? '—'}</span>
          <span className="text-sm text-slate-400 font-medium">secciones</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{grade.baccalaureateType ? (grade.baccalaureateType === 'general' ? 'Bachillerato General' : 'Bachillerato Técnico') : 'Educación Básica'}</p>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
          <Building2 className="w-4 h-4 text-slate-400" />
          {buildingName ? (<span className="truncate">{buildingName}</span>) : (<span className="text-slate-400">Sin edificio asignado</span>)}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          {(() => {
            const cfg = CYCLE_LABEL[cycle] || CYCLE_LABEL['1'];
            const Icon = cfg.Icon;
            return (
              <>
                <Icon className={`${cfg.size} text-slate-400`} />
                <span className="text-[11px] font-semibold text-slate-600">{cfg.label}</span>
              </>
            );
          })()}
        </div>
        <div className="flex gap-1">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar"><Edit2 className="w-3.5 h-3.5 text-slate-500" /></button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
        </div>
      </div>
    </motion.div>
  );
}
