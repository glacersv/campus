import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookMarked, Plus, Edit2, Trash2, Save, X, Search, LayoutGrid, List, Check, Trash, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { getAllSubjects, createSubject, updateSubject, deleteSubject, getAllGrades } from '../../lib/firestore';
import { Subject, Grade, CYCLE_NAMES, Cycle } from '../../types';

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filterCycle, setFilterCycle] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    cycle: '' as Cycle | '',
    gradeId: '',
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO',
    weeklyHours: 4,
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
    setForm({ name: '', description: '', cycle: '', gradeId: '', status: 'ACTIVO', weeklyHours: 4 });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }

    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        cycle: form.cycle || undefined,
        gradeId: form.gradeId || undefined,
        status: form.status,
        weeklyHours: form.weeklyHours,
      };

      if (editingId) {
        await updateSubject(editingId, data);
        toast.success('Materia actualizada correctamente');
      } else {
        const id = `${form.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${form.gradeId || 'general'}`;
        await createSubject({ id, ...data });
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

  const filtered = subjects.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCycle = !filterCycle || s.cycle === filterCycle;
    const matchGrade = !filterGrade || s.gradeId === filterGrade;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchCycle && matchGrade && matchStatus;
  });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <BookMarked className="w-5 h-5" />
          </div>
          <div>
            <h1 className="module-title">Materias</h1>
            <p className="module-subtitle">{filtered.length} materia(s) registrada(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); resetForm(); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Materia
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar materia..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <select value={filterCycle} onChange={e => setFilterCycle(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer px-2">
            <option value="">Todos los ciclos</option>
            {Object.entries(CYCLE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <select value={filterGrade} onChange={e => setFilterGrade(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer px-2">
            <option value="">Todos los grados</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-transparent text-xs font-bold text-slate-600 focus:outline-none cursor-pointer px-2">
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
        </div>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
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
                <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Editar Materia' : 'Nueva Materia'}</h3>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="form-label">Nombre *</label>
                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ej: Matemáticas" className="input" autoFocus />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Descripción</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Descripción breve de la materia..." className="input h-20 resize-none" />
                  </div>
                  <div>
                    <label className="form-label">Grado Específico (MINED)</label>
                    <select value={form.gradeId} onChange={e => setForm(p => ({ ...p, gradeId: e.target.value }))}
                      className="input">
                      <option value="">Cualquier grado</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Ciclo</label>
                    <select value={form.cycle} onChange={e => setForm(p => ({ ...p, cycle: e.target.value as Cycle | '' }))}
                      className="input">
                      <option value="">Sin asignar</option>
                      {Object.entries(CYCLE_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Horas semanales</label>
                    <input type="number" min={1} max={40} value={form.weeklyHours}
                      onChange={e => setForm(p => ({ ...p, weeklyHours: parseInt(e.target.value) || 4 }))}
                      className="input" />
                  </div>
                  <div>
                    <label className="form-label">Estado</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as 'ACTIVO' | 'INACTIVO' }))}
                      className="input">
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-all h-[240px] relative ${selected.has(s.id) ? 'ring-2 ring-primary border-primary' : ''}`}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleSelect(s.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}>
                      {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{s.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${s.status === 'INACTIVO' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    {s.status || 'ACTIVO'}
                  </span>
                </div>
                {s.description && <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{s.description}</p>}

                <div className="flex flex-wrap gap-1.5 mt-3">
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
                      Grado General
                    </span>
                  )}
                  {s.weeklyHours && (
                    <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {s.weeklyHours}h / semana
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-1 mt-4 pt-3 border-t border-slate-100 shrink-0">
                <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Editar"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Eliminar"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-8 px-3 py-2">
                  <button onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}>
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="w-2.5 h-2.5" />}
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Ciclo</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Horas</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Estado</th>
                <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`table-row ${selected.has(s.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-2">
                    <button onClick={() => toggleSelect(s.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}>
                      {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-slate-900">{s.name}</div>
                    {s.description && <div className="text-xs text-slate-400 truncate max-w-[200px]">{s.description}</div>}
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-600">{s.gradeId ? getGradeName(s.gradeId) : s.cycle ? CYCLE_NAMES[s.cycle] : '—'}</td>
                  <td className="px-3 py-2 text-sm text-slate-600">{s.weeklyHours || '—'}h</td>
                  <td className="px-3 py-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.status === 'INACTIVO' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {s.status || 'ACTIVO'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
          <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No se encontraron materias</p>
        </div>
      )}
    </div>
  );
}
