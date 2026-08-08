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
import { getGradeSortWeight, sortGradesChronological } from '../../lib/ordering';
import { ComputerLab, Building, Section, Grade, Student } from '../../types';

const LAB_TYPE_LABELS = {
  computo: 'Centro de Cómputo',
  dibujo: 'Salón de Dibujo',
  ingles: 'Salón de Inglés',
  ciencias: 'Laboratorio de Ciencias',
  otros: 'Aula Especializada'
};

const LAB_TYPE_ICONS = {
  computo: Monitor,
  dibujo: Palette,
  ingles: Languages,
  ciencias: FlaskConical,
  otros: DoorOpen
};

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
  const [form, setForm] = useState({ name: '', type: 'computo' as 'computo' | 'dibujo' | 'ingles' | 'ciencias' | 'otros', buildingId: '', capacity: '', devices: '' });
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
  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;

  interface LabStats {
    lab: ComputerLab;
    assignedSections: Section[];
    totalCapacity: number;
    totalEnrolled: number;
    usagePct: number;
    sectionsByGrade: { gradeName: string; sections: Section[]; enrolled: number; capacity: number; sortWeight: number }[];
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
      return {
        gradeName: getGradeName(gradeId),
        sections: secs,
        enrolled,
        capacity: cap,
        sortWeight: getGradeSortWeight(gradeId)
      };
    }).sort((a, b) => a.sortWeight - b.sortWeight);

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
      const data: Partial<ComputerLab> = {
        name: form.name.trim(),
        type: form.type
      };
      if (form.buildingId) data.buildingId = form.buildingId;
      if (form.capacity) data.capacity = parseInt(form.capacity);
      if (form.devices) data.devices = parseInt(form.devices);

      if (editingId) {
        await updateComputerLab(editingId, data);
        toast.success('Aula Especializada actualizada correctamente');
      } else {
        await createComputerLab({ id: form.name.trim().toLowerCase().replace(/\s+/g, '-'), name: data.name!, type: data.type!, ...data });
        toast.success('Aula Especializada creada correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', type: 'computo', buildingId: '', capacity: '', devices: '' });
      loadData();
    } catch (err) { toast.error('Error al guardar aula'); console.error(err); }
  };

  const handleEdit = (l: ComputerLab) => {
    setEditingId(l.id);
    setForm({ name: l.name, type: l.type || 'computo', buildingId: l.buildingId || '', capacity: l.capacity?.toString() || '', devices: l.devices?.toString() || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta Aula Especializada?')) {
      try {
        await deleteComputerLab(id);
        toast.success('Aula Especializada eliminada');
        setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
        if (selectedLabId === id) setSelectedLabId(null);
        loadData();
      } catch (err) { toast.error('Error al eliminar'); }
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (confirm(`¿Eliminar ${selected.size} aula(s) especializada(s)?`)) {
      try {
        for (const id of selected) await deleteComputerLab(id);
        toast.success(`${selected.size} aula(s) eliminada(s)`);
        setSelected(new Set());
        if (selectedLabId && selected.has(selectedLabId)) setSelectedLabId(null);
        loadData();
      } catch (err) { toast.error('Error al eliminar aulas'); }
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
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-accent/10">
            <Monitor className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="module-title">Aulas Especializadas</h1>
            <p className="module-subtitle">{labs.length} aula(s) registrada(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', type: 'computo', buildingId: '', capacity: '', devices: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Aula
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            <span className="text-sm text-red-700 font-medium">{selected.size} seleccionado(s)</span>
            <button onClick={handleBulkDelete} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors cursor-pointer">
              <Trash className="w-4 h-4 text-red-600" />
            </button>
            <button onClick={() => setSelected(new Set())} className="p-1.5 hover:bg-red-100 rounded-lg transition-colors cursor-pointer">
              <X className="w-4 h-4 text-red-600" />
            </button>
          </motion.div>
        )}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 transition-colors cursor-pointer ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formulario Modal Premium */}
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
                <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Editar Aula Especializada' : 'Nueva Aula Especializada'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="form-label">Nombre *</label>
                    <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Salón de Dibujo 1, Salón de Inglés..." className="input" autoFocus required />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Tipo de Aula *</label>
                    <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="input">
                      {Object.entries(LAB_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Edificio</label>
                    <select value={form.buildingId} onChange={e => setForm({ ...form, buildingId: e.target.value })} className="input">
                      <option value="">Sin edificio</option>
                      {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Capacidad de Alumnos</label>
                    <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Ej: 30" className="input" />
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Dispositivos / Recursos Especiales</label>
                    <input type="number" min="0" value={form.devices} onChange={e => setForm({ ...form, devices: e.target.value })} placeholder="Ej: 30 (solo para Cómputo/Inglés si aplica)" className="input" />
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

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {labs.map((l, i) => {
            const stats = computeStats(l);
            const isSelected = selectedLabId === l.id;
            const IconComponent = LAB_TYPE_ICONS[l.type || 'computo'] || DoorOpen;
            const typeLabel = LAB_TYPE_LABELS[l.type || 'computo'] || LAB_TYPE_LABELS.otros;

            return (
              <motion.div
                key={l.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'border-primary ring-1 ring-primary/20 shadow-md scale-[1.01]'
                    : 'border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                }`}
                onClick={() => setSelectedLabId(isSelected ? null : l.id)}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
                        <IconComponent className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{l.name}</h3>
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mt-0.5">{typeLabel}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(l.id); }}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors cursor-pointer ${selected.has(l.id) ? 'bg-primary border-primary text-white' : 'border-slate-300 hover:border-primary'}`}
                    >
                      {selected.has(l.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </div>

                  <div className="space-y-1.5 mb-4 text-xs font-semibold text-slate-600">
                    {l.buildingId && (
                      <p className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{getBuildingName(l.buildingId)}</span>
                      </p>
                    )}
                    {l.capacity && <p className="text-slate-500 font-mono">Capacidad: {l.capacity} alumnos</p>}
                    {l.devices !== undefined && l.devices > 0 && <p className="text-slate-500 font-mono">Recursos/Equipos: {l.devices}</p>}
                    {stats.assignedSections.length > 0 && (
                      <p className="text-[11px] text-slate-400 pt-1 font-medium">
                        {stats.assignedSections.length} sección(es) · {stats.totalEnrolled} alumno(s)
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {stats.assignedSections.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Ocupación de Aula</span>
                        <span className="font-mono">{stats.usagePct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${stats.usagePct}%` }}
                          className="h-full rounded-full bg-primary" />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-slate-100 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(l); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(l.id); }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
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
                <th className="text-left px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Equipos</th>
                <th className="text-right px-3 py-2 text-[11px] font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((l, i) => (
                <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className={`table-row cursor-pointer ${selected.has(l.id) ? 'bg-primary/5' : ''} ${selectedLabId === l.id ? 'bg-slate-50' : ''}`}
                  onClick={() => setSelectedLabId(selectedLabId === l.id ? null : l.id)}>
                  <td className="px-3 py-2">
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(l.id); }}
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${selected.has(l.id) ? 'bg-primary border-primary text-white' : 'border-gray-300 hover:border-primary'}`}>
                      {selected.has(l.id) && <Check className="w-2.5 h-2.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-sm font-medium text-slate-900">{l.name}</td>
                  <td className="px-3 py-2 text-xs font-semibold text-slate-500">{LAB_TYPE_LABELS[l.type || 'computo'] || LAB_TYPE_LABELS.otros}</td>
                  <td className="px-3 py-2 text-sm text-slate-500">{l.buildingId ? getBuildingName(l.buildingId) : '—'}</td>
                  <td className="px-3 py-2 text-sm text-slate-500">{l.capacity || '—'}</td>
                  <td className="px-3 py-2 text-sm text-slate-500">{l.devices || '—'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(l); }} className="p-1.5 hover:bg-slate-100 rounded-lg"><Edit2 className="w-4 h-4 text-slate-500" /></button>
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
          <p className="text-sm">No se encontraron aulas especializadas registradas</p>
        </div>
      )}

      {/* Selected Lab Stats Panel */}
      {selectedLabId && (() => {
        const l = labs.find(x => x.id === selectedLabId);
        if (!l) return null;
        const stats = computeStats(l);
        const typeLabel = LAB_TYPE_LABELS[l.type || 'computo'] || LAB_TYPE_LABELS.otros;

        return (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 flex items-center justify-center shadow-xs">
                  {React.createElement(LAB_TYPE_ICONS[l.type || 'computo'] || DoorOpen, { className: 'w-5 h-5 text-slate-600' })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{l.name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">{typeLabel} {l.buildingId && `· ${getBuildingName(l.buildingId)}`}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLabId(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Cerrar desglose
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-6">
              {[
                { icon: Layers, label: 'Secciones Asignadas', value: stats.assignedSections.length, sub: stats.assignedSections.length === 1 ? 'sección asignada' : 'secciones asignadas' },
                { icon: Users, label: 'Capacidad Aulas', value: stats.totalCapacity, sub: 'cupos en secciones' },
                { icon: GraduationCap, label: 'Alumnos Matriculados', value: stats.totalEnrolled, sub: `de ${stats.totalCapacity} cupos` },
                { icon: Cpu, label: 'Recursos Especiales', value: l.devices || 0, sub: 'equipos disponibles' }
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 font-mono">{value}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>
                </div>
              ))}
            </div>

            {/* Section breakdown */}
            {stats.assignedSections.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Distribución de Secciones por Grado</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {stats.sectionsByGrade.map(sg => {
                    const pct = sg.capacity > 0 ? Math.round((sg.enrolled / sg.capacity) * 100) : 0;
                    return (
                      <div key={sg.gradeName} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:scale-[1.01] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{sg.gradeName}</span>
                            <span className="text-xs bg-slate-50 text-slate-500 font-semibold px-2 py-0.5 rounded-md border border-slate-150">{sg.sections.length} secc{(sg.sections.length > 1 ? 'iones' : 'ión')}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-xl font-bold text-slate-900">{sg.enrolled}</span>
                            <span className="text-xs text-slate-400">/ {sg.capacity}</span>
                          </div>
                        </div>
                        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 rounded-full bg-primary"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sg.sections.map(sec => {
                            const enrolled = students.filter(st => st.sectionId === sec.id && st.gradeId === sec.gradeId).length;
                            return (
                              <span key={sec.id} className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border ${
                                enrolled > 0 ? 'bg-white border-slate-200 text-slate-700 shadow-2xs' : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'
                              }`}>
                                <span className="font-bold">Sección {sec.name}</span>
                                <span className="font-extrabold text-primary">{enrolled}</span>
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
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Monitor className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-bold text-slate-500 font-medium">No hay secciones asignadas a esta aula especializada</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Asigna esta aula especializada desde el módulo de Secciones</p>
              </div>
            )}
          </div>
        );
      })()}

      {!selectedLabId && labs.length > 0 && (
        <div className="mt-6 text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-bold text-slate-500">Selecciona un aula especializada para ver sus estadísticas</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en cualquier tarjeta de aula arriba</p>
        </div>
      )}
    </div>
  );
}
