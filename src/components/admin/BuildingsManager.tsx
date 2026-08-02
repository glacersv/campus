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
import { getGradeSortWeight, sortGradesChronological } from '../../lib/ordering';
import { Building, Section, Grade, Student } from '../../types';

interface GradeStat {
  gradeId: string;
  gradeName: string;
  sections: Section[];
  totalCapacity: number;
  enrolledStudents: number;
  sortWeight: number;
}

interface BuildingStats {
  building: Building;
  totalSections: number;
  totalCapacity: number;
  totalEnrolled: number;
  gradeStats: GradeStat[];
  lowestGradeSortWeight: number;
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
  const [form, setForm] = useState({ name: '', code: '', description: '' });

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
        enrolledStudents: enrolled,
        sortWeight: getGradeSortWeight(gradeId)
      });
    });

    // Sort interior grade details chronologically (lowest to highest grade)
    gradeStats.sort((a, b) => a.sortWeight - b.sortWeight);

    // Lowest grade sort weight for the whole building (used to order building cards)
    const lowestGradeSortWeight = gradeStats.length > 0 ? gradeStats[0].sortWeight : 9999;

    return {
      building,
      totalSections: buildingSections.length,
      totalCapacity,
      totalEnrolled,
      gradeStats,
      lowestGradeSortWeight
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    try {
      const data: Partial<Building> = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase()
      };
      if (form.description.trim()) data.description = form.description.trim();
      
      if (editingId) {
        await updateBuilding(editingId, data);
        toast.success('Edificio actualizado correctamente');
      } else {
        await createBuilding({ id: form.code.trim().toLowerCase(), name: data.name!, code: data.code!, ...(data.description && { description: data.description }) });
        toast.success('Edificio creado correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', code: '', description: '' });
      loadData();
    } catch (err) { toast.error('Error al guardar edificio'); console.error(err); }
  };

  const handleEdit = (b: Building) => {
    setEditingId(b.id);
    setForm({ name: b.name, code: b.code, description: b.description || '' });
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

  // Compute building stats and order them chronologically based on the lowest grade they contain
  const sortedBuildingsStats = buildings
    .map(b => computeStats(b))
    .sort((a, b) => a.lowestGradeSortWeight - b.lowestGradeSortWeight);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-primary/10">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Edificios</h1>
            <p className="module-subtitle">{buildings.length} edificio(s) registrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', code: '', description: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Edificio
        </button>
      </div>

      {/* Formulario Modal Premium con backdrop blur */}
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
                <h3 className="font-bold text-slate-900 text-base">
                  {editingId ? 'Editar Edificio' : 'Nuevo Edificio'}
                </h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
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
                  <div className="col-span-2">
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
                  <div className="col-span-2">
                    <label className="form-label">Descripción</label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Ej: Administración y oficinas"
                      className="input"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    <Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cards de Edificios Unificados y Limpios (Sin colores) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {sortedBuildingsStats.map(({ building: b, totalSections, totalCapacity, totalEnrolled, gradeStats }, i) => {
          const isSelected = selectedBuildingId === b.id;
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/20 shadow-md scale-[1.01]'
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
              }`}
              onClick={() => setSelectedBuildingId(isSelected ? null : b.id)}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-extrabold text-sm flex items-center justify-center shadow-xs">
                      {b.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{b.name}</h3>
                      {b.description && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" /> {b.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-2.5 py-1 rounded-lg font-mono font-bold shrink-0">
                    {totalCapacity} cupos
                  </span>
                </div>

                {totalSections > 0 && (
                  <p className="text-[11px] text-slate-400 font-medium mb-4">
                    {gradeStats.length} grado(s) · {totalSections} sección(es) · {totalEnrolled} alumno(s)
                  </p>
                )}
              </div>

              {/* Barra de progreso unificada en Verde Institucional */}
              <div className="space-y-4">
                {totalSections > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Ocupación</span>
                      <span className="font-mono">{Math.round((totalEnrolled / Math.max(totalCapacity, 1)) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((totalEnrolled / Math.max(totalCapacity, 1)) * 100, 100)}%` }}
                        className="h-full rounded-full bg-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Acciones de Tarjeta unificadas */}
                <div className="flex gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(b); }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(b.id); }}
                    className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {buildings.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Building2 className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron edificios registrados</p>
        </div>
      )}

      {/* Panel de Estadísticas Detalladas de Edificio Seleccionado */}
      {selectedBuildingId && (() => {
        const b = buildings.find(x => x.id === selectedBuildingId);
        if (!b) return null;
        const stats = computeStats(b);
        return (
          <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 text-slate-700 font-extrabold text-sm flex items-center justify-center shadow-xs">
                  {b.code}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{b.name}</h3>
                  <p className="text-sm text-slate-500">{b.description || 'Desglose detallado de ocupación'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBuildingId(null)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Cerrar desglose
              </button>
            </div>

            {/* Tarjetas resumen del desglose */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
              {[
                { icon: Layers, label: 'Secciones', value: stats.totalSections, sub: 'asignadas' },
                { icon: Users, label: 'Capacidad Total', value: stats.totalCapacity, sub: 'cupos disponibles' },
                { icon: GraduationCap, label: 'Alumnos Matriculados', value: stats.totalEnrolled, sub: `de ${stats.totalCapacity} cupos` }
              ].map(({ icon: Icon, label, value, sub }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-2xs">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                  </div>
                  <p className="text-3xl font-black text-slate-900 font-mono">{value}</p>
                  <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>
                </div>
              ))}
            </div>

            {/* Desglose de grados (Ordenados K4 -> 12°) */}
            {stats.gradeStats.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Distribución de Grados (Orden Cronológico)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {stats.gradeStats.map(gs => {
                    const pct = Math.min((gs.enrolledStudents / Math.max(gs.totalCapacity, 1)) * 100, 100);
                    return (
                      <div key={gs.gradeId} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:scale-[1.01] transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{gs.gradeName}</span>
                            <span className="text-xs bg-slate-50 text-slate-500 font-semibold px-2 py-0.5 rounded-md border border-slate-150">
                              {gs.sections.length} secc{(gs.sections.length > 1 ? 'iones' : 'ión')}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5 font-mono">
                            <span className="text-xl font-bold text-slate-900">{gs.enrolledStudents}</span>
                            <span className="text-xs text-slate-400">/ {gs.totalCapacity}</span>
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
                          {gs.sections.map(sec => {
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
                          {gs.sections.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Sin secciones asignadas</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.gradeStats.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                <p className="text-xs font-bold text-slate-500">No hay secciones asignadas a este edificio</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Asigna secciones desde el módulo de Secciones</p>
              </div>
            )}
          </div>
        );
      })()}

      {!selectedBuildingId && buildings.length > 0 && (
        <div className="mt-6 text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-white shadow-2xs">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
          <p className="text-xs font-bold text-slate-500">Selecciona un edificio para ver sus estadísticas</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en cualquier tarjeta de edificio arriba</p>
        </div>
      )}
    </div>
  );
}
