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
  Trash,
  Layers,
  Users,
  GraduationCap,
  Cpu,
  BarChart3,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllComputerLabs,
  createComputerLab,
  updateComputerLab,
  deleteComputerLab,
  getAllBuildings,
  getAllSections,
  getAllGrades,
  getAllStudents
} from '../../lib/firestore';
import { ComputerLab, Building, Section, Grade, Student } from '../../types';

export default function ComputerLabsManager() {
  const [labs, setLabs] = useState<ComputerLab[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', buildingId: '', capacity: '', devices: '' });
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [l, b, s, g, st] = await Promise.all([getAllComputerLabs(), getAllBuildings(), getAllSections(), getAllGrades(), getAllStudents()]);
      setLabs(l); setBuildings(b); setSections(s); setGrades(g); setStudents(st);
    } finally { setLoading(false); }
  };

  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || '—';
  const getBuildingColor = (id: string) => buildings.find(b => b.id === id)?.color || '#6B7280';
  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;

  interface LabStats {
    lab: ComputerLab;
    assignedSections: Section[];
    totalCapacity: number;
    totalEnrolled: number;
    usagePct: number;
    sectionsByGrade: { gradeName: string; sections: Section[]; enrolled: number; capacity: number }[];
  }

  const computeStats = (lab: ComputerLab): LabStats => {
    const assignedSections = sections.filter(s => s.computerLabId === lab.id);
    const gradeMap = new Map<string, Section[]>();
    assignedSections.forEach(s => {
      if (!gradeMap.has(s.gradeId)) gradeMap.set(s.gradeId, []);
      gradeMap.get(s.gradeId)!.push(s);
    });
    const secIds = new Set(assignedSections.map(s => s.id));
    const totalEnrolled = students.filter(st => secIds.has(st.sectionId)).length;
    const totalCapacity = assignedSections.reduce((sum, s) => sum + (s.capacity || 0), 0);
    const sectionsByGrade = Array.from(gradeMap.entries()).map(([gradeId, secs]) => {
      const secIds2 = new Set(secs.map(s => s.id));
      const enrolled = students.filter(st => secIds2.has(st.sectionId) && st.gradeId === gradeId).length;
      const cap = secs.reduce((sum, s) => sum + (s.capacity || 0), 0);
      return { gradeName: getGradeName(gradeId), sections: secs, enrolled, capacity: cap };
    }).sort((a, b) => a.gradeName.localeCompare(b.gradeName));

    return {
      lab,
      assignedSections,
      totalCapacity,
      totalEnrolled,
      usagePct: totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0,
      sectionsByGrade
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      const data: Partial<ComputerLab> = { name: form.name.trim() };
      if (form.buildingId) data.buildingId = form.buildingId;
      if (form.capacity) data.capacity = parseInt(form.capacity);
      if (form.devices) data.devices = parseInt(form.devices);
      
      if (editingId) {
        await updateComputerLab(editingId, data);
        toast.success('Laboratorio actualizado correctamente');
      } else {
        await createComputerLab({ id: form.name.trim().toLowerCase().replace(/\s+/g, '-'), name: data.name!, ...data });
        toast.success('Laboratorio creado correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', buildingId: '', capacity: '', devices: '' });
      loadData();
    } catch (err) { toast.error('Error al guardar laboratorio'); console.error(err); }
  };

  const handleEdit = (l: ComputerLab) => {
    setEditingId(l.id);
    setForm({ name: l.name, buildingId: l.buildingId || '', capacity: l.capacity?.toString() || '', devices: l.devices?.toString() || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este laboratorio?')) {
      try {
        await deleteComputerLab(id);
        toast.success('Laboratorio eliminado');
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        if (selectedLabId === id) setSelectedLabId(null);
        loadData();
      } catch (err) { toast.error('Error al eliminar laboratorio'); }
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} laboratorio(s)?`)) {
      try {
        for (const id of selected) await deleteComputerLab(id);
        toast.success(`${selected.size} laboratorio(s) eliminados`);
        setSelected(new Set());
        if (selectedLabId && selected.has(selectedLabId)) setSelectedLabId(null);
        loadData();
      } catch (err) { toast.error('Error al eliminar laboratorios'); }
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
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-accent" />
            </div>
            Laboratorios de Cómputo
          </h2>
          <p className="text-sm text-slate-500 mt-1">
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
            className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-gray-50'}`}
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
              <h3 className="font-semibold text-slate-900">{editingId ? 'Editar Laboratorio' : 'Nuevo Laboratorio'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Nombre *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Lab 1" className="input" autoFocus required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Edificio</label>
                <select value={form.buildingId} onChange={e => setForm({ ...form, buildingId: e.target.value })} className="input">
                  <option value="">Sin edificio</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Capacidad</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Ej: 30" className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Dispositivos</label>
                <input type="number" min="1" value={form.devices} onChange={e => setForm({ ...form, devices: e.target.value })} placeholder="Ej: 30" className="input" />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {labs.map((l, i) => {
            const stats = computeStats(l);
            const isSelected = selectedLabId === l.id;
            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`card card-hover p-3 group relative cursor-pointer transition-all ${selected.has(l.id) ? 'ring-2 ring-primary border-primary' : ''} ${isSelected ? 'ring-2 ring-offset-2' : 'hover:ring-1 hover:ring-offset-1'}`}
                style={{ '--tw-ring-color': isSelected ? '#6366F1' : 'transparent' } as React.CSSProperties}
                onClick={() => setSelectedLabId(isSelected ? null : l.id)}
              >
                <div className="absolute top-2.5 left-2.5">
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(l.id); }}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(l.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                    {selected.has(l.id) && <Check className="w-2.5 h-2.5" />}
                  </button>
                </div>
                <div className="pt-1 pl-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Monitor className="w-4 h-4 text-accent" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{l.name}</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    {l.buildingId && (
                      <p className="text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(l.buildingId) }} />
                        {getBuildingName(l.buildingId)}
                      </p>
                    )}
                    {l.capacity && <p className="text-xs text-slate-500">Capacidad: {l.capacity}</p>}
                    {l.devices && <p className="text-xs text-slate-500">Dispositivos: {l.devices}</p>}
                    {stats.assignedSections.length > 0 && (
                      <p className="text-[10px] text-slate-400 pt-1">
                        {stats.assignedSections.length} sección(es) · {stats.totalEnrolled} alumno(s)
                      </p>
                    )}
                  </div>
                  {stats.assignedSections.length > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="w-14 shrink-0">Uso:</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.usagePct}%` }}
                          className="h-full rounded-full" style={{ backgroundColor: '#6366F1' }} />
                      </div>
                      <span className="w-8 text-right font-mono">{stats.usagePct}%</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-1 mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-gray-100 rounded-lg text-xs font-medium text-slate-600"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }} className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-red-50 rounded-lg text-xs font-medium text-red-600"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="w-8 px-3 py-2">
                  <button onClick={toggleSelectAll}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.size === labs.length && labs.length > 0 ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                    {selected.size === labs.length && labs.length > 0 && <Check className="w-2.5 h-2.5" />}
                  </button>
                </th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Edificio</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Capacidad</th>
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Dispositivos</th>
                <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`table-row cursor-pointer ${selected.has(l.id) ? 'bg-primary/5' : ''} ${selectedLabId === l.id ? 'bg-indigo-50' : ''}`}
                  onClick={() => setSelectedLabId(selectedLabId === l.id ? null : l.id)}>
                  <td className="px-3 py-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(l.id); }}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(l.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                      {selected.has(l.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-slate-900">{l.name}</td>
                  <td className="px-3 py-2">{l.buildingId ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getBuildingColor(l.buildingId) }} />
                      {getBuildingName(l.buildingId)}
                    </span>
                  ) : '—'}</td>
                  <td className="px-3 py-2 text-sm text-slate-500">{l.capacity || '—'}</td>
                  <td className="px-3 py-2 text-sm text-slate-500">{l.devices || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
        <div className="text-center py-12 text-slate-400">
          <Monitor className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron laboratorios</p>
        </div>
      )}

      {/* Selected Lab Stats Panel */}
      {selectedLabId && (() => {
        const l = labs.find(x => x.id === selectedLabId);
        if (!l) return null;
        const stats = computeStats(l);
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{l.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    {l.buildingId && (
                      <><MapPin className="w-3.5 h-3.5" /> {getBuildingName(l.buildingId)} · </>  
                    )}
                    {l.devices || 0} dispositivo(s)
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLabId(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              {[
                { icon: Layers, label: 'Secciones Asignadas', value: stats.assignedSections.length, sub: stats.assignedSections.length === 1 ? 'asignada' : 'asignadas' },
                { icon: Users, label: 'Capacidad Total Aulas', value: stats.totalCapacity, sub: 'cupos en secciones asignadas' },
                { icon: GraduationCap, label: 'Alumnos Matriculados', value: stats.totalEnrolled, sub: `de ${stats.totalCapacity} cupos` },
                { icon: Cpu, label: 'Dispositivos', value: l.devices || 0, sub: 'equipos disponibles' }
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-indigo-50">
                      <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-4xl font-black text-slate-900 font-mono">{value}</p>
                  <p className="text-sm text-slate-400 mt-1">{sub}</p>
                </div>
              ))}
            </div>

            {/* Section breakdown */}
            {stats.assignedSections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Secciones Asignadas por Grado</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.sectionsByGrade.map(sg => {
                    const pct = sg.capacity > 0 ? Math.round((sg.enrolled / sg.capacity) * 100) : 0;
                    return (
                      <div key={sg.gradeName} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{sg.gradeName}</span>
                            <span className="text-xs bg-indigo-50 text-indigo-600 font-medium px-2 py-0.5 rounded-full">{sg.sections.length} secc{(sg.sections.length > 1 ? 'iones' : 'ión')}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-2xl font-black text-slate-900">{sg.enrolled}</span>
                            <span className="text-sm text-slate-400">/ {sg.capacity}</span>
                          </div>
                        </div>
                        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sg.sections.map(sec => {
                            const enrolled = students.filter(st => st.sectionId === sec.id && st.gradeId === sec.gradeId).length;
                            return (
                              <span key={sec.id} className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border ${
                                enrolled > 0 ? 'bg-white border-gray-200 text-slate-700' : 'bg-gray-50 border-dashed border-gray-200 text-slate-400'
                              }`}>
                                <span className="font-semibold">Sección {sec.name}</span>
                                <span className="font-bold text-indigo-600">{enrolled}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-slate-400">{sec.capacity || '?'}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.assignedSections.length === 0 && (
              <div className="text-center py-16 text-slate-400 bg-white border border-gray-200 rounded-xl">
                <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No hay secciones asignadas a este laboratorio</p>
                <p className="text-sm mt-1">Asigna este laboratorio desde el módulo de Secciones</p>
              </div>
            )}
          </div>
        );
      })()}

      {!selectedLabId && labs.length > 0 && (
        <div className="mt-6 text-center py-12 text-slate-400 bg-white border border-dashed border-gray-200 rounded-xl">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Selecciona un laboratorio para ver sus estadísticas</p>
          <p className="text-xs mt-1">Haz clic en cualquier laboratorio de arriba</p>
        </div>
      )}
    </div>
  );
}
