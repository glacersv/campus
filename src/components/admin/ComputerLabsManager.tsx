import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Monitor,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  LayoutGrid,
  List,
  Check,
  Trash
} from 'lucide-react';
import {
  getAllComputerLabs,
  createComputerLab,
  updateComputerLab,
  deleteComputerLab,
  getAllBuildings
} from '../../lib/firestore';
import { ComputerLab, Building } from '../../types';

export default function ComputerLabsManager() {
  const [labs, setLabs] = useState<ComputerLab[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', buildingId: '', capacity: '', devices: '' });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [l, b] = await Promise.all([getAllComputerLabs(), getAllBuildings()]);
      setLabs(l); setBuildings(b);
    } finally { setLoading(false); }
  };

  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || '—';
  const getBuildingColor = (id: string) => buildings.find(b => b.id === id)?.color || '#6B7280';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const data: Record<string, any> = { name: form.name.trim() };
      if (form.buildingId) data.buildingId = form.buildingId;
      if (form.capacity) data.capacity = parseInt(form.capacity);
      if (form.devices) data.devices = parseInt(form.devices);
      
      if (editingId) {
        await updateComputerLab(editingId, data);
      } else {
        await createComputerLab({ id: form.name.trim().toLowerCase().replace(/\s+/g, '-'), ...data });
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', buildingId: '', capacity: '', devices: '' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (l: ComputerLab) => {
    setEditingId(l.id);
    setForm({
      name: l.name,
      buildingId: l.buildingId || '',
      capacity: l.capacity?.toString() || '',
      devices: l.devices?.toString() || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este laboratorio?')) {
      await deleteComputerLab(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} laboratorio(s)?`)) {
      for (const id of selected) await deleteComputerLab(id);
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
    if (selected.size === labs.length) setSelected(new Set());
    else setSelected(new Set(labs.map(l => l.id)));
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
            <div className="bg-accent/10 p-2 rounded-lg">
              <Monitor className="w-5 h-5 text-accent" />
            </div>
            Laboratorios de Cómputo
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {labs.length} laboratorio(s) registrado(s)
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', buildingId: '', capacity: '', devices: '' }); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo Laboratorio
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
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
        <div className="flex border border-gray-200 rounded-lg overflow-hidden ml-auto">
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
                {editingId ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Lab 1"
                  className="input"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Edificio</label>
                <select
                  value={form.buildingId}
                  onChange={e => setForm({ ...form, buildingId: e.target.value })}
                  className="input"
                >
                  <option value="">Sin edificio</option>
                  {buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Capacidad</label>
                <input
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={e => setForm({ ...form, capacity: e.target.value })}
                  placeholder="Ej: 30"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Dispositivos</label>
                <input
                  type="number"
                  min="1"
                  value={form.devices}
                  onChange={e => setForm({ ...form, devices: e.target.value })}
                  placeholder="Ej: 30"
                  className="input"
                />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
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

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card card-hover p-4 group relative ${selected.has(l.id) ? 'ring-2 ring-primary border-primary' : ''}`}
            >
              <div className="absolute top-3 left-3">
                <button
                  onClick={() => toggleSelect(l.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected.has(l.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {selected.has(l.id) && <Check className="w-3 h-3" />}
                </button>
              </div>
              <div className="pt-2 pl-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{l.name}</h3>
                </div>
                <div className="mt-2 space-y-1">
                  {l.buildingId && (
                    <p className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(l.buildingId) }} />
                      {getBuildingName(l.buildingId)}
                    </p>
                  )}
                  {l.capacity && <p className="text-xs text-gray-500">Capacidad: {l.capacity}</p>}
                  {l.devices && <p className="text-xs text-gray-500">Dispositivos: {l.devices}</p>}
                </div>
              </div>
              <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(l)}
                  className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(l.id)}
                  className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Eliminar
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-10 px-4 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selected.size === labs.length && labs.length > 0
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {selected.size === labs.length && labs.length > 0 && <Check className="w-3 h-3" />}
                  </button>
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Edificio</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Capacidad</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Dispositivos</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((l, i) => (
                <motion.tr
                  key={l.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`table-row ${selected.has(l.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleSelect(l.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selected.has(l.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {selected.has(l.id) && <Check className="w-3 h-3" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{l.name}</td>
                  <td className="px-4 py-3">
                    {l.buildingId ? (
                      <span className="flex items-center gap-1.5 text-sm">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(l.buildingId) }} />
                        {getBuildingName(l.buildingId)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{l.capacity || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{l.devices || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(l)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
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
      {labs.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Monitor className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron laboratorios</p>
        </div>
      )}
    </div>
  );
}
