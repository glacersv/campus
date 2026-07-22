import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  LayoutGrid,
  List,
  Check,
  Trash
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllBaccalaureateTypes, createBaccalaureateType, updateBaccalaureateType, deleteBaccalaureateType } from '../../lib/firestore';
import { BaccalaureateTypeDoc } from '../../types';

export default function BaccalaureateTypesManager() {
  const [types, setTypes] = useState<BaccalaureateTypeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', maxGrade: '11' });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setTypes(await getAllBaccalaureateTypes()); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const data = {
        id: editingId || form.name.trim().toLowerCase().replace(/\s+/g, '-'),
        name: form.name.trim(),
        maxGrade: parseInt(form.maxGrade)
      };
      if (editingId) {
        await updateBaccalaureateType(editingId, data);
        toast.success('Tipo de bachillerato actualizado');
      } else {
        await createBaccalaureateType(data);
        toast.success('Tipo de bachillerato creado');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', maxGrade: '11' });
      loadData();
    } catch (err) { toast.error('Error al guardar tipo de bachillerato'); console.error(err); }
  };

  const handleEdit = (t: BaccalaureateTypeDoc) => {
    setEditingId(t.id);
    setForm({ name: t.name, maxGrade: t.maxGrade.toString() });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este tipo de bachillerato?')) {
      try {
        await deleteBaccalaureateType(id);
        toast.success('Tipo de bachillerato eliminado');
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        loadData();
      } catch (err) { toast.error('Error al eliminar tipo de bachillerato'); }
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} tipo(s)?`)) {
      try {
        for (const id of selected) await deleteBaccalaureateType(id);
        toast.success(`${selected.size} tipo(s) eliminados`);
        setSelected(new Set());
        loadData();
      } catch (err) { toast.error('Error al eliminar tipos'); }
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
    else setSelected(new Set(filtered.map(t => t.id)));
  };

  const filtered = types.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-secondary/10 p-2 rounded-lg">
              <GraduationCap className="w-5 h-5 text-secondary-dark" />
            </div>
            Tipos de Bachillerato
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} tipo(s) registrado(s)
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', maxGrade: '11' }); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo Tipo
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Información</h4>
            <p className="text-xs text-amber-700 mt-1">
              Los tipos de bachillerato definen los grados disponibles. El <strong>Bachillerato General</strong> llega hasta 11° y el <strong>Técnico</strong> hasta 12°.
              Estos tipos se usan al crear grados del ciclo de Bachillerato.
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tipo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
          />
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
            className="card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">
                {editingId ? 'Editar Tipo' : 'Nuevo Tipo de Bachillerato'}
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
                  placeholder="Ej: Bachillerato General"
                  className="input"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Grado Máximo *</label>
                <select
                  value={form.maxGrade}
                  onChange={e => setForm({ ...form, maxGrade: e.target.value })}
                  className="input"
                  required
                >
                  <option value="10">10°</option>
                  <option value="11">11°</option>
                  <option value="12">12°</option>
                </select>
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
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`card card-hover p-3 group relative ${selected.has(t.id) ? 'ring-2 ring-primary border-primary' : ''}`}
            >
              {/* Checkbox */}
              <div className="absolute top-2.5 left-2.5">
                <button
                  onClick={() => toggleSelect(t.id)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                    selected.has(t.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'
                  }`}
                >
                  {selected.has(t.id) && <Check className="w-2.5 h-2.5" />}
                </button>
              </div>

              {/* Content */}
              <div className="pt-1 pl-5">
                <h3 className="font-semibold text-gray-900">{t.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                    Hasta {t.maxGrade}°
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Grados: 10° - {t.maxGrade}°</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(t)}
                  className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
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
                <th className="w-8 px-3 py-2">
                  <button
                    onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                      selected.size === filtered.length && filtered.length > 0
                        ? 'bg-primary border-primary text-white'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {selected.size === filtered.length && filtered.length > 0 && <Check className="w-2.5 h-2.5" />}
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Grado Máximo</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Rango</th>
                <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
                <motion.tr
                  key={t.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className={`table-row ${selected.has(t.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={() => toggleSelect(t.id)}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        selected.has(t.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {selected.has(t.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <span className="font-medium text-gray-900">{t.name}</span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-700">
                      {t.maxGrade}°
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-500">10° - {t.maxGrade}°</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
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
          <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron tipos de bachillerato</p>
        </div>
      )}
    </div>
  );
}
