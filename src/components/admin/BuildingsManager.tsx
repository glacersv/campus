import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  MapPin,
  Users,
  Layers,
  GraduationCap,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { getAllBuildings, createBuilding, updateBuilding, deleteBuilding, getAllSections, getAllGrades, getAllStudents } from '../../lib/firestore';
import { Building, Section, Grade, Student } from '../../types';

const BUILDING_COLORS = [
  '#12562E', '#0D71B9', '#FAB700', '#D32F2F', '#7B1FA2',
  '#00897B', '#5D4037', '#455A64', '#E65100', '#1565C0'
];

interface GradeStat {
  gradeId: string;
  gradeName: string;
  sections: Section[];
  totalCapacity: number;
  enrolledStudents: number;
}

interface BuildingStats {
  building: Building;
  totalSections: number;
  totalCapacity: number;
  totalEnrolled: number;
  gradeStats: GradeStat[];
}

export default function BuildingsManager() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', color: '#12562E', description: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [b, s, g, st] = await Promise.all([getAllBuildings(), getAllSections(), getAllGrades(), getAllStudents()]);
      setBuildings(b); setSections(s); setGrades(g); setStudents(st);
    } finally { setLoading(false); }
  };

  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;

  const computeStats = (building: Building): BuildingStats => {
    const buildingSections = sections.filter(s => s.buildingId === building.id);
    const gradeMap = new Map<string, Section[]>();
    buildingSections.forEach(s => {
      if (!gradeMap.has(s.gradeId)) gradeMap.set(s.gradeId, []);
      gradeMap.get(s.gradeId)!.push(s);
    });

    let totalCapacity = 0;
    let totalEnrolled = 0;
    const gradeStats: GradeStat[] = [];

    gradeMap.forEach((secs, gradeId) => {
      const cap = secs.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const sectionIds = new Set(secs.map(s => s.id));
      const enrolled = students.filter(st => st.gradeId === gradeId && sectionIds.has(st.sectionId)).length;
      totalCapacity += cap;
      totalEnrolled += enrolled;
      gradeStats.push({
        gradeId,
        gradeName: getGradeName(gradeId),
        sections: secs,
        totalCapacity: cap,
        enrolledStudents: enrolled
      });
    });

    gradeStats.sort((a, b) => a.gradeName.localeCompare(b.gradeName));

    return {
      building,
      totalSections: buildingSections.length,
      totalCapacity,
      totalEnrolled,
      gradeStats
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    try {
      const data: Partial<Building> = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        color: '#64748b' // default slate-500 monochrome style
      };
      if (form.description.trim()) data.description = form.description.trim();
      
      if (editingId) {
        await updateBuilding(editingId, data);
        toast.success('Edificio actualizado correctamente');
      } else {
        await createBuilding({ id: form.code.trim().toLowerCase(), name: data.name!, code: data.code!, color: '#64748b', ...(data.description && { description: data.description }) });
        toast.success('Edificio creado correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', code: '', color: '#64748b', description: '' });
      loadData();
    } catch (err) { toast.error('Error al guardar edificio'); console.error(err); }
  };

  const handleEdit = (b: Building) => {
    setEditingId(b.id);
    setForm({ name: b.name, code: b.code, color: b.color || '#64748b', description: b.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este edificio?')) {
      try { await deleteBuilding(id); toast.success('Edificio eliminado'); loadData(); }
      catch (err) { toast.error('Error al eliminar edificio'); }
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
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="module-title">Edificios</h1>
            <p className="module-subtitle">{buildings.length} edificio(s) registrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', color: '#64748b', description: '' }); }} className="btn-primary">
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
              <h3 className="font-semibold text-slate-900">
                {editingId ? 'Editar Edificio' : 'Nuevo Edificio'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-secondary" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nombre *</label>
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
                <label className="form-label">Código *</label>
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
                <label className="form-label">Descripción</label>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {buildings.map((b, i) => {
          const stats = computeStats(b);
          const isSelected = selectedBuildingId === b.id;
          const cardColor = '#64748b'; // slate-500 unificado
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-all h-[240px] relative cursor-pointer ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
              onClick={() => setSelectedBuildingId(isSelected ? null : b.id)}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base bg-slate-500 shadow-xs shrink-0">
                      {b.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">{b.name}</h3>
                      {b.description && (
                        <p className="text-xs text-secondary flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-tertiary" /> <span className="truncate max-w-[120px]">{b.description}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-tertiary font-bold uppercase tracking-wider shrink-0">{stats.totalCapacity} cupos</span>
                </div>

                {stats.totalSections > 0 && (
                  <p className="text-[10px] text-tertiary mt-3 font-semibold uppercase tracking-wider leading-relaxed">
                    {stats.gradeStats.length} grado(s) · {stats.totalSections} sección(es) · {stats.totalEnrolled} alumno(s)
                  </p>
                )}
              </div>

              {/* Quick mini bar */}
              {stats.totalSections > 0 && (
                <div className="my-2">
                  <div className="flex items-center gap-2 text-[10px] text-tertiary">
                    <span className="w-16 shrink-0 uppercase font-bold tracking-wider">Ocupación:</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((stats.totalEnrolled / Math.max(stats.totalCapacity, 1)) * 100, 100)}%` }}
                        className="h-full rounded-full transition-all bg-slate-500"
                      />
                    </div>
                    <span className="w-10 text-right font-bold text-slate-700">{Math.round((stats.totalEnrolled / Math.max(stats.totalCapacity, 1)) * 100)}%</span>
                  </div>
                </div>
              )}

              {/* Actions always visible in footer */}
              <div className="flex border-t border-slate-100 pt-3 gap-2 justify-end shrink-0 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(b); }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4 text-secondary" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {buildings.length === 0 && (
        <div className="text-center py-12 text-tertiary">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron edificios</p>
        </div>
      )}

      {/* Selected Building Stats Panel */}
      {selectedBuildingId && (() => {
        const b = buildings.find(x => x.id === selectedBuildingId);
        if (!b) return null;
        const stats = computeStats(b);
        return (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                  style={{ backgroundColor: b.color }}>{b.code}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{b.name}</h3>
                  <p className="text-sm text-secondary">{b.description || ''}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBuildingId(null)} className="text-xs text-tertiary hover:text-slate-600 flex items-center gap-1">
                <X className="w-3.5 h-3.5" /> Cerrar
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                 { icon: Layers, label: 'Secciones', value: stats.totalSections, sub: 'asignadas', color: 'bg-primary/10 text-primary' },
                 { icon: Users, label: 'Capacidad Total', value: stats.totalCapacity, sub: 'cupos disponibles', color: 'bg-accent/10 text-accent' },
                 { icon: GraduationCap, label: 'Alumnos Matriculados', value: stats.totalEnrolled, sub: `de ${stats.totalCapacity} cupos`, color: 'bg-secondary/10 text-secondary' }
               ].map(({ icon: Icon, label, value, sub, color }) => (
                 <div key={label} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                   <div className="flex items-center gap-3 mb-3">
                     <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
                       <Icon className="w-5 h-5" />
                     </div>
                     <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{label}</span>
                   </div>
                   <p className="text-4xl font-black text-slate-900 font-display">{value}</p>
                   <p className="text-sm text-tertiary mt-1">{sub}</p>
                 </div>
               ))}
            </div>

            {/* Grade breakdown */}
            {stats.gradeStats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-accent" />
                  </div>
                  <h4 className="text-sm font-bold text-primary uppercase tracking-wider">Rendimiento por Grado</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.gradeStats.map(gs => {
                    const pct = Math.min((gs.enrolledStudents / Math.max(gs.totalCapacity, 1)) * 100, 100);
                    return (
                      <div key={gs.gradeId} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{gs.gradeName}</span>
                            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{gs.sections.length} secc{(gs.sections.length > 1 ? 'iones' : 'ión')}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5 font-display">
                            <span className="text-2xl font-black text-slate-900">{gs.enrolledStudents}</span>
                            <span className="text-sm text-tertiary">/ {gs.totalCapacity}</span>
                          </div>
                        </div>
                        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="absolute inset-y-0 left-0 rounded-full bg-slate-500"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {gs.sections.map(sec => {
                            const enrolled = students.filter(st => st.sectionId === sec.id && st.gradeId === sec.gradeId).length;
                            return (
                              <span key={sec.id} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                                enrolled > 0 ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-50 border-dashed border-slate-200 text-tertiary'
                              }`}>
                                <span className="font-semibold">Sección {sec.name}</span>
                                <span className="font-bold text-slate-700">{enrolled}</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-tertiary">{sec.capacity || '?'}</span>
                              </span>
                            );
                          })}
                          {gs.sections.length === 0 && (
                            <span className="text-xs text-tertiary italic">Sin secciones asignadas</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.gradeStats.length === 0 && (
              <div className="text-center py-16 text-tertiary bg-white border border-slate-200 rounded-xl">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">No hay secciones asignadas a este edificio</p>
                <p className="text-sm mt-1">Asigna secciones desde el módulo de Secciones</p>
              </div>
            )}
          </div>
        );
      })()}

      {!selectedBuildingId && buildings.length > 0 && (
        <div className="mt-6 text-center py-12 text-tertiary bg-white border border-dashed border-slate-200 rounded-xl">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">Selecciona un edificio para ver sus estadísticas</p>
          <p className="text-xs mt-1">Haz clic en cualquier edificio de arriba</p>
        </div>
      )}
    </div>
  );
}
