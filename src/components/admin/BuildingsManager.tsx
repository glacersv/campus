import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Palette,
  MapPin
} from 'lucide-react';
import { getAllBuildings, createBuilding, updateBuilding, deleteBuilding } from '../../lib/firestore';
import { Building } from '../../types';

const BUILDING_COLORS = [
  '#12562E', '#0D71B9', '#FAB700', '#D32F2F', '#7B1FA2',
  '#00897B', '#5D4037', '#455A64', '#E65100', '#1565C0'
];

export default function BuildingsManager() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', color: '#12562E', description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setBuildings(await getAllBuildings()); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    try {
      const data: Record<string, any> = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        color: form.color
      };
      if (form.description.trim()) data.description = form.description.trim();
      
      if (editingId) {
        await updateBuilding(editingId, data);
      } else {
        await createBuilding({ id: form.code.trim().toLowerCase(), ...data });
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', code: '', color: '#12562E', description: '' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (b: Building) => {
    setEditingId(b.id);
    setForm({ name: b.name, code: b.code, color: b.color, description: b.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este edificio?')) {
      await deleteBuilding(id);
      loadData();
    }
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
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            Edificios
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {buildings.length} edificio(s) registrado(s)
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', color: '#12562E', description: '' }); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo Edificio
        </button>
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
                {editingId ? 'Editar Edificio' : 'Nuevo Edificio'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej: Edificio Principal"
                  className="input"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Código *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="Ej: EP"
                  className="input"
                  maxLength={3}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {BUILDING_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-900 scale-110' : 'border-gray-200 hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Ej: Administración y oficinas"
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

      {/* Glassmorphism Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {buildings.map((b, i) => (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card group relative overflow-hidden"
            style={{ '--card-accent': b.color } as React.CSSProperties}
          >
            {/* Color accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: b.color }} />
            
            {/* Content */}
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    style={{ backgroundColor: b.color }}
                  >
                    {b.code}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{b.name}</h3>
                    {b.description && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {b.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex border-t border-white/20">
              <button
                onClick={() => handleEdit(b)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-gray-600 hover:bg-white/30 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Editar
              </button>
              <div className="w-px bg-white/20" />
              <button
                onClick={() => handleDelete(b.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium text-red-600 hover:bg-red-50/50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {buildings.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron edificios</p>
        </div>
      )}
    </div>
  );
}
