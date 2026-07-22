import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, Edit2, Trash2, Save, X, Search, LayoutGrid, List, Check, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { getAllSections, createSection, updateSection, deleteSection, getAllGrades, getAllBuildings, getAllComputerLabs, toggleSectionStatus } from '../../lib/firestore';
import { Section, Grade, Building, ComputerLab, Cycle, CYCLE_NAMES } from '../../types';

export default function SectionsManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [computerLabs, setComputerLabs] = useState<ComputerLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' });
  const [search, setSearch] = useState('');
  const [cycleFilter, setCycleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'ACTIVO' | 'INACTIVO' | 'all'>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, g, b, cl] = await Promise.all([getAllSections(), getAllGrades(), getAllBuildings(), getAllComputerLabs()]);
      setSections(s); setGrades(g); setBuildings(b); setComputerLabs(cl);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally { setLoading(false); }
  };

  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;
  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || '—';
  const getBuildingColor = (id: string) => buildings.find(b => b.id === id)?.color || '#6B7280';
  const getGradeCycle = (id: string) => grades.find(g => g.id === id)?.cycle || '1';
  const getComputerLabName = (id: string) => computerLabs.find(cl => cl.id === id)?.name || id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.gradeId) return;
    try {
      const data: Partial<Section> = {
        name: form.name.trim().toUpperCase(),
        gradeId: form.gradeId
      };
      if (form.capacity) data.capacity = parseInt(form.capacity);
      if (form.buildingId) data.buildingId = form.buildingId;
      if (form.computerLabId) data.computerLabId = form.computerLabId;
      
      if (editingId) {
        await updateSection(editingId, data);
        toast.success('Sección actualizada correctamente');
      } else {
        const newId = `${form.gradeId}-${form.name.trim().toLowerCase()}`;
        await createSection({ id: newId, name: data.name!, gradeId: data.gradeId!, ...data });
        toast.success('Sección creada correctamente');
      }
      setShowForm(false); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' });
      loadData();
    } catch (err) {
      toast.error('Error al guardar sección');
      console.error('Error creating section:', err);
    }
  };

  const handleEdit = (s: Section) => {
    setEditingId(s.id);
    setForm({ name: s.name, gradeId: s.gradeId, capacity: s.capacity?.toString() || '', buildingId: s.buildingId || '', computerLabId: s.computerLabId || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta sección?')) {
      try {
        await deleteSection(id);
        toast.success('Sección eliminada');
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        loadData();
      } catch (err) { toast.error('Error al eliminar sección'); }
    }
  };

  const handleToggleStatus = async (id: string, current?: string) => {
    try {
      await toggleSectionStatus(id, current);
      toast.success('Estado actualizado');
      loadData();
    } catch (err) {
      toast.error('Error al cambiar estado');
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} sección(es)?`)) {
      try {
        for (const id of selected) await deleteSection(id);
        toast.success(`${selected.size} sección(es) eliminadas`);
        setSelected(new Set());
        loadData();
      } catch (err) { toast.error('Error al eliminar secciones'); }
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
    const matchesStatus = statusFilter === 'all' || (s.status || 'ACTIVO') === statusFilter;
    return matchesSearch && matchesCycle && matchesStatus;
  });

  const CYCLE_COLORS: Record<string, string> = {
    '1': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    '2': 'bg-blue-100 text-blue-700 border-blue-200',
    '3': 'bg-purple-100 text-purple-700 border-purple-200',
    '4': 'bg-amber-100 text-amber-700 border-amber-200'
  };
  const CYCLE_HEX: Record<string, string> = {
    '1': '#10B981',
    '2': '#3B82F6',
    '3': '#8B5CF6',
    '4': '#F59E0B'
  };
  const STATUS_COLOR: Record<string, string> = {
    '1': 'bg-emerald-100 text-emerald-700',
    '2': 'bg-blue-100 text-blue-700',
    '3': 'bg-purple-100 text-purple-700',
    '4': 'bg-amber-100 text-amber-700'
  };

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-accent/10 p-2 rounded-lg"><Layers className="w-5 h-5 text-accent" /></div>
            Secciones
          </h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} sección(es) registrada(s)</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' }); }} className="btn-primary">
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
        <div className="flex gap-1.5">
          <button onClick={() => setStatusFilter('all')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          <button onClick={() => setStatusFilter('ACTIVO')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'ACTIVO' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Activos</button>
          <button onClick={() => setStatusFilter('INACTIVO')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === 'INACTIVO' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Inactivos</button>
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
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Sección' : 'Nueva Sección'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Laboratorio / Centro de Cómputo</label>
                <select value={form.computerLabId} onChange={e => setForm({ ...form, computerLabId: e.target.value })} className="input">
                  <option value="">Sin laboratorio</option>
                  {computerLabs.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                </select>
              </div>
              <div className="flex items-end justify-end lg:col-span-3 gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {viewMode === 'card' && cycleFilter === 'all' ? (
        <div className="space-y-6">
          {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => {
            const items = filtered.filter(s => getGradeCycle(s.gradeId) === c);
            if (items.length === 0) return null;
            return (
              <div key={c}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${CYCLE_COLORS[c]}`}>
                    {CYCLE_NAMES[c]}
                  </span>
                  <span className="text-xs text-gray-400">({items.length})</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {items.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className={`card card-hover p-3 group relative ${selected.has(s.id) ? 'ring-2 ring-primary border-primary' : ''}`}>
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                        style={{ backgroundColor: CYCLE_HEX[getGradeCycle(s.gradeId)] || '#6B7280' }} />
                      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.04] transition-all duration-300"
                        style={{ backgroundColor: CYCLE_HEX[getGradeCycle(s.gradeId)] || '#6B7280' }} />
                      <div className="absolute top-2.5 left-2.5">
                        <button onClick={() => toggleSelect(s.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                          {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                        </button>
                      </div>
                      <div className="relative pt-1 pl-5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">Sección {s.name}</h3>
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
                          {s.computerLabId && (
                            <p className="text-xs text-indigo-600 font-medium">
                              Lab: {getComputerLabName(s.computerLabId)}
                            </p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (s.status || 'ACTIVO') === 'ACTIVO' ? STATUS_COLOR[getGradeCycle(s.gradeId)] || 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {(s.status || 'ACTIVO') === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                            </span>
                            {s.schoolYear && (
                              <span className="text-[10px] text-gray-400">{s.schoolYear}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="relative flex justify-end gap-1 mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleToggleStatus(s.id, s.status)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          (s.status || 'ACTIVO') === 'ACTIVO' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-100 text-gray-600'
                        }`}>
                          <Check className="w-3.5 h-3.5" /> {(s.status || 'ACTIVO') === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                        </button>
                        <button onClick={() => handleEdit(s)} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
                        <button onClick={() => handleDelete(s.id)} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`card card-hover p-3 group relative ${selected.has(s.id) ? 'ring-2 ring-primary border-primary' : ''}`}>
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{ backgroundColor: CYCLE_HEX[getGradeCycle(s.gradeId)] || '#6B7280' }} />
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.04] transition-all duration-300"
                style={{ backgroundColor: CYCLE_HEX[getGradeCycle(s.gradeId)] || '#6B7280' }} />
              <div className="absolute top-2.5 left-2.5">
                <button onClick={() => toggleSelect(s.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                  {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                </button>
              </div>
              <div className="relative pt-1 pl-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">Sección {s.name}</h3>
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
                  {s.computerLabId && (
                    <p className="text-xs text-indigo-600 font-medium">
                      Lab: {getComputerLabName(s.computerLabId)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      (s.status || 'ACTIVO') === 'ACTIVO' ? STATUS_COLOR[getGradeCycle(s.gradeId)] || 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {(s.status || 'ACTIVO') === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                    </span>
                    {s.schoolYear && (
                      <span className="text-[10px] text-gray-400">{s.schoolYear}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative flex justify-end gap-1 mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleToggleStatus(s.id, s.status)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  (s.status || 'ACTIVO') === 'ACTIVO' ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-gray-100 text-gray-600'
                }`}>
                  <Check className="w-3.5 h-3.5" /> {(s.status || 'ACTIVO') === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                </button>
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
                <th className="w-8 px-3 py-2">
                  <button onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.size === filtered.length && filtered.length > 0 ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="w-2.5 h-2.5" />}
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Sección</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Grado</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Capacidad</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Edificio</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Laboratorio</th>
                <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Estado</th>
                <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`table-row ${selected.has(s.id) ? 'bg-primary/5' : ''}`}>
                  <td className="px-3 py-2">
                    <button onClick={() => toggleSelect(s.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(s.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                      {selected.has(s.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-gray-900">{s.name}</td>
                  <td className="px-3 py-2"><span className="badge badge-green">{getGradeName(s.gradeId)}</span></td>
                  <td className="px-3 py-2 text-sm text-gray-500">{s.capacity || '—'}</td>
                  <td className="px-3 py-2">
                    {s.buildingId ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(s.buildingId) }} />
                        {getBuildingName(s.buildingId)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">
                    {s.computerLabId ? (
                      <span className="text-indigo-600 font-medium text-xs">{getComputerLabName(s.computerLabId)}</span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => handleToggleStatus(s.id, s.status)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                        (s.status || 'ACTIVO') === 'ACTIVO'
                          ? `${STATUS_COLOR[getGradeCycle(s.gradeId)] || 'bg-emerald-100 text-emerald-800'} hover:bg-gray-200 hover:text-gray-600`
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${(s.status || 'ACTIVO') === 'ACTIVO' ? 'bg-current' : 'bg-gray-400'}`} />
                      {(s.status || 'ACTIVO') === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO'}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-right">
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
