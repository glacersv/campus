import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookMarked, Plus, Edit2, Trash2, Save, X, Search, LayoutGrid, List, Check, Trash } from 'lucide-react';
import { getAllSubjects, createSubject, updateSubject, deleteSubject } from '../../lib/firestore';
import { Subject } from '../../types';

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { setSubjects(await getAllSubjects()); } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      if (editingId) {
        await updateSubject(editingId, { name: name.trim() });
      } else {
        await createSubject({ id: name.trim().toLowerCase().replace(/\s+/g, '-'), name: name.trim() });
      }
      setShowForm(false); setEditingId(null); setName('');
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (s: Subject) => { setEditingId(s.id); setName(s.name); setShowForm(true); };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta materia?')) {
      await deleteSubject(id);
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
      loadData();
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} materia(s)?`)) {
      for (const id of selected) await deleteSubject(id);
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

  const filtered = subjects.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-secondary/10 p-2 rounded-lg"><BookMarked className="w-5 h-5 text-secondary-dark" /></div>
            Materias
          </h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} materia(s) registrada(s)</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setName(''); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Materia
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar materia..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
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
              <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Materia' : 'Nueva Materia'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Matemáticas" className="input flex-1" autoFocus />
              <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
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
                <h3 className="font-semibold text-gray-900">{s.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">ID: {s.id}</p>
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">ID</th>
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
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">{s.id}</td>
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
          <BookMarked className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron materias</p>
        </div>
      )}
    </div>
  );
}
