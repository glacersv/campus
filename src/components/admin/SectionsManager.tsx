import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, Edit2, Trash2, Save, X, Search, LayoutGrid, List, Check, Trash } from 'lucide-react';
import { getAllSections, createSection, updateSection, deleteSection, getAllGrades, getAllBuildings } from '../../lib/firestore';
import { Section, Grade, Building } from '../../types';

export default function SectionsManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', gradeId: '', capacity: '', buildingId: '' });
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, g, b] = await Promise.all([getAllSections(), getAllGrades(), getAllBuildings()]);
      console.log('Sections loaded:', s.length, 'Grades:', g.length, 'Buildings:', b.length);
      setSections(s); setGrades(g); setBuildings(b);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally { setLoading(false); }
  };

  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;
  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || '—';
  const getBuildingColor = (id: string) => buildings.find(b => b.id === id)?.color || '#6B7280';
  const getGradeCycle = (id: string) => grades.find(g => g.id === id)?.cycle || '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.gradeId) return;
    try {
      const data: Record<string, any> = {
        name: form.name.trim().toUpperCase(),
        gradeId: form.gradeId
      };
      if (form.capacity) data.capacity = parseInt(form.capacity);
      if (form.buildingId) data.buildingId = form.buildingId;
      
      if (editingId) {
        await updateSection(editingId, data);
      } else {
        const newId = `${form.gradeId}-${form.name.trim().toLowerCase()}`;
        await createSection({ id: newId, ...data });
      }
      setShowForm(false); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '' });
      loadData();
    } catch (err) {
      console.error('Error creating section:', err);
      alert('Error al crear sección: ' + (err as Error).message);
    }
  };

  const handleEdit = (s: Section) => {
    setEditingId(s.id);
    setForm({ name: s.name, gradeId: s.gradeId, capacity: s.capacity?.toString() || '', buildingId: s.buildingId || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta sección?')) {
      await deleteSection(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} sección(es)?`)) {
      for (const id of selected) await deleteSection(id);
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
    else setSelected(new Set(filtered.map(s => s.id)));
  };

  const filtered = sections.filter(s => {
    const matchesSearch = `${s.name} ${getGradeName(s.gradeId)} ${getBuildingName(s.buildingId || '')}`.toLowerCase().includes(search.toLowerCase());
    const matchesCycle = cycleFilter === 'all' || getGradeCycle(s.gradeId) === cycleFilter;
    return matchesSearch && matchesCycle;
  });

  const CYCLE_NAMES: Record<string, string> = { '1': '1° Ciclo', '2': '2° Ciclo', '3': '3° Ciclo', '4': 'Bachillerato' };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-accent/10 p-2 rounded-lg"><Layers className="w-5 h-5 text-accent" /></div>
            Secciones
          </h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} sección(es) registrada(s)</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Sección
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar sección..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setCycleFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cycleFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {Object.entries(CYCLE_NAMES).map(([k, v]) => (
            <button key={k} onClick={() => setCycleFilter(k)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${cycleFilter === k ? 'bg-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{v}</button>
          ))}
        </div>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <span className="text-sm text-red-700 font-medium">{selected.size} seleccionado(s)</span>
            <button onClick={handleBulkDelete} className="p-1.5 hover:bg-red-100 rounded-lg"><Trash className="w-4 h-4 text-red-600" /></button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-red-100 rounded-lg"><X className="w-4 h-4 text-red-600" /></button>
          </motion.div>
        )}
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('card')} className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Sección' : 'Nueva Sección'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Grado *</label>
                <select required value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })} className="input">
                  <option value="">Seleccionar grado</option>
                  {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Sección *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: A" className="input" maxLength={3} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Capacidad</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Ej: 40" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Edificio</label>
                <select value={form.buildingId} onChange={e => setForm({ ...form, buildingId: e.target.value })} className="input">
                  <option value="">Sin edificio</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`card card-hover p-4 group relative ${selected.has(s.id) ? 'ring-2 ring-primary border-primary' : ''}`}>
              <div className="absolute top-3 left-3">
                <button onClick={() => toggleSelect(s.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                  {selected.has(s.id) && <Check className="w-3 h-3" />}
                </button>
              </div>
              <div className="pt-2 pl-6">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{s.name}</h3>
                  <span className="badge badge-blue">{getGradeName(s.gradeId)}</span>
                </div>
                <div className="mt-2 space-y-1">
                  {s.capacity && <p className="text-xs text-gray-500">Capacidad: {s.capacity} alumnos</p>}
                  {s.buildingId && (
                    <p className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(s.buildingId) }} />
                      {getBuildingName(s.buildingId)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
                <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-10 px-4 py-3">
                  <button onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="w-3 h-3" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Sección</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Grado</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Capacidad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Edificio</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`table-row ${selected.has(s.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleSelect(s.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                      {selected.has(s.id) && <Check className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3"><span className="badge badge-green">{getGradeName(s.gradeId)}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{s.capacity || '—'}</td>
                  <td className="px-4 py-3">
                    {s.buildingId ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(s.buildingId) }} />
                        {getBuildingName(s.buildingId)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron secciones</p>
        </div>
      )}
    </div>
  );
}
