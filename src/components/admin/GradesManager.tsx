import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
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
  GraduationCap
} from 'lucide-react';
import { getAllGrades, createGrade, updateGrade, deleteGrade } from '../../lib/firestore';
import { Grade, Cycle, BaccalaureateType, CYCLE_NAMES } from '../../types';

const CYCLE_COLORS: Record<Cycle, string> = {
  '1': 'bg-emerald-100 text-emerald-700',
  '2': 'bg-blue-100 text-blue-700',
  '3': 'bg-purple-100 text-purple-700',
  '4': 'bg-amber-100 text-amber-700'
};

const BAC_COLOR: Record<BaccalaureateType, string> = {
  'general': 'bg-sky-100 text-sky-700',
  'tecnico': 'bg-orange-100 text-orange-700'
};

export default function GradesManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', cycle: '1' as Cycle, baccalaureateType: '' as '' | BaccalaureateType });
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<Cycle | 'all'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setGrades(await getAllGrades()); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const gradeData: Omit<Grade, 'createdAt'> = {
        id: editingId || form.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/°/g, ''),
        name: form.name.trim(),
        cycle: form.cycle,
        ...(form.cycle === '4' && form.baccalaureateType ? { baccalaureateType: form.baccalaureateType } : {})
      };
      if (editingId) {
        await updateGrade(editingId, gradeData);
      } else {
        await createGrade(gradeData);
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', cycle: '1', baccalaureateType: '' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (g: Grade) => {
    setEditingId(g.id);
    setForm({ name: g.name, cycle: g.cycle, baccalaureateType: g.baccalaureateType || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este grado?')) {
      await deleteGrade(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} grado(s)?`)) {
      for (const id of selected) await deleteGrade(id);
      setSelected(new Set());
      loadData();
    }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(g => g.id)));
  };

  const filtered = grades.filter(g => {
    const matchesSearch = `${g.name} ${CYCLE_NAMES[g.cycle]}`.toLowerCase().includes(search.toLowerCase());
    const matchesCycle = cycleFilter === 'all' || g.cycle === cycleFilter;
    return matchesSearch && matchesCycle;
  });

  const cycleGroups = {
    '1': filtered.filter(g => g.cycle === '1'),
    '2': filtered.filter(g => g.cycle === '2'),
    '3': filtered.filter(g => g.cycle === '3'),
    '4': filtered.filter(g => g.cycle === '4')
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            Grados
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} grado(s) registrado(s)
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', cycle: '1', baccalaureateType: '' }); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo Grado
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar grado..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>

        {/* Cycle filter pills */}
        <div className="flex gap-1.5">
          <button
            onClick={() => setCycleFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cycleFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => (
            <button
              key={c}
              onClick={() => setCycleFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cycleFilter === c ? CYCLE_COLORS[c] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {CYCLE_NAMES[c]}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <span className="text-sm text-red-700 font-medium">{selected.size} seleccionado(s)</span>
            <button onClick={handleBulkDelete} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
              <Trash className="w-4 h-4 text-red-600" />
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </motion.div>
        )}

        {/* View toggle */}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Editar Grado' : 'Nuevo Grado'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del Grado *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: 10° Bachillerato General"
                  className="input"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ciclo *</label>
                <select
                  value={form.cycle}
                  onChange={e => setForm({ ...form, cycle: e.target.value as Cycle, baccalaureateType: e.target.value !== '4' ? '' : form.baccalaureateType })}
                  className="input"
                  required
                >
                  {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => (
                    <option key={c} value={c}>{CYCLE_NAMES[c]}</option>
                  ))}
                </select>
              </div>
              {form.cycle === '4' && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Bachillerato *</label>
                  <select
                    value={form.baccalaureateType}
                    onChange={e => setForm({ ...form, baccalaureateType: e.target.value as BaccalaureateType })}
                    className="input"
                    required
                  >
                    <option value="">Seleccionar tipo</option>
                    <option value="general">General (hasta 11°)</option>
                    <option value="tecnico">Técnico (hasta 12°)</option>
                  </select>
                </div>
              )}
              <div className={`flex justify-end gap-2 ${form.cycle === '4' ? 'col-span-3' : 'col-span-2'}`}>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  <Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card View - Grouped by Cycle */}
      {viewMode === 'card' && cycleFilter === 'all' ? (
        <div className="space-y-6">
          {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => {
            const items = cycleGroups[c];
            if (items.length === 0) return null;
            return (
              <div key={c}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${CYCLE_COLORS[c]}`}>
                    {CYCLE_NAMES[c]}
                  </span>
                  <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((g, i) => (
                    <GradeCard
                      key={g.id}
                      grade={g}
                      index={i}
                      selected={selected.has(g.id)}
                      onToggleSelect={() => toggleSelect(g.id)}
                      onEdit={() => handleEdit(g)}
                      onDelete={() => handleDelete(g.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((g, i) => (
            <GradeCard
              key={g.id}
              grade={g}
              index={i}
              selected={selected.has(g.id)}
              onToggleSelect={() => toggleSelect(g.id)}
              onEdit={() => handleEdit(g)}
              onDelete={() => handleDelete(g.id)}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selected.size === filtered.length && filtered.length > 0
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="w-3 h-3" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ciclo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((g, i) => (
                <motion.tr
                  key={g.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`table-row ${selected.has(g.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(g.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selected.has(g.id)
                          ? 'bg-primary border-primary text-white'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {selected.has(g.id) && <Check className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{g.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${CYCLE_COLORS[g.cycle]}`}>
                      {CYCLE_NAMES[g.cycle]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.baccalaureateType ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${BAC_COLOR[g.baccalaureateType]}`}>
                        {g.baccalaureateType === 'general' ? 'General' : 'Técnico'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(g)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron grados</p>
        </div>
      )}
    </div>
  );
}

// Grade Card component
function GradeCard({ grade, index, selected, onToggleSelect, onEdit, onDelete }: {
  grade: Grade;
  index: number;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`card card-hover p-4 group relative ${selected ? 'ring-2 ring-primary border-primary' : ''}`}
    >
      {/* Checkbox */}
      <div className="absolute top-3 left-3">
        <button
          onClick={onToggleSelect}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            selected ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'
          }`}
        >
          {selected && <Check className="w-3 h-3" />}
        </button>
      </div>

      {/* Content */}
      <div className="pt-2 pl-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-gray-900">{grade.name}</h3>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${CYCLE_COLORS[grade.cycle]}`}>
            {CYCLE_NAMES[grade.cycle]}
          </span>
          {grade.baccalaureateType && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${BAC_COLOR[grade.baccalaureateType]}`}>
              {grade.baccalaureateType === 'general' ? 'General' : 'Técnico'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" /> Editar
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Eliminar
        </button>
      </div>
    </motion.div>
  );
}
