import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, Edit2, Trash2, Save, X, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getAllSections, createSection, updateSection, deleteSection, getAllGrades, getAllBuildings, getAllComputerLabs, toggleSectionStatus, getAllBaccalaureateTypes, getAllStudents } from '../../lib/firestore';
import { Section, Grade, Building, ComputerLab, BaccalaureateTypeDoc, Student } from '../../types';

const CYCLE_LABEL: Record<string, string> = {
  '1': 'Primer Ciclo (1° - 3°)',
  '2': 'Segundo Ciclo (4° - 6°)',
  '3': 'Tercer Ciclo (7° - 9°)',
};

export default function SectionsManager() {
  const [sections, setSections] = useState<Section[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [computerLabs, setComputerLabs] = useState<ComputerLab[]>([]);
  const [baccalaureateTypes, setBaccalaureateTypes] = useState<BaccalaureateTypeDoc[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' });
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<{ letter: string; levels: { label: string; count: number }[]; totalGrades: number; totalStudents: number; totalCapacity: number; occupancyPercentage: number; gradeDetails: { gradeId: string; gradeName: string; capacity: number; enrolled: number; percentage: number }[] } | null>(null);

  const openAnalytics = (group: { letter: string; levels: { label: string; count: number }[]; totalGrades: number; totalStudents: number; totalCapacity: number; occupancyPercentage: number; gradeDetails: { gradeId: string; gradeName: string; capacity: number; enrolled: number; percentage: number }[] }) => {
    setSelectedGroup(group);
  };

  const closeAnalytics = () => setSelectedGroup(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, g, b, cl, bt, st] = await Promise.all([getAllSections(), getAllGrades(), getAllBuildings(), getAllComputerLabs(), getAllBaccalaureateTypes(), getAllStudents()]);
      setSections(s); setGrades(g); setBuildings(b); setComputerLabs(cl); setBaccalaureateTypes(bt); setStudents(st);
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
        toast.success('Sección actualizada');
      } else {
        const newId = `${form.gradeId}-${form.name.trim().toLowerCase()}`;
        await createSection({ id: newId, name: data.name!, gradeId: data.gradeId!, ...data });
        toast.success('Sección creada');
      }
      setShowForm(false); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' });
      loadData();
    } catch (err) {
      toast.error('Error al guardar sección');
      console.error(err);
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
        loadData();
      } catch (err) { toast.error('Error al eliminar'); }
    }
  };

  const getSectionLetter = (name: string): string => {
    const upper = name.trim().toUpperCase();
    const parts = upper.split('-');
    const possibleLetter = parts[parts.length - 1];
    if (/^[A-Z]$/.test(possibleLetter)) return possibleLetter;
    if (upper.length === 1 && /^[A-Z]$/.test(upper)) return upper;
    return upper;
  };

  const letterGroups = sections.reduce<Record<string, Section[]>>((acc, s) => {
    const letter = getSectionLetter(s.name);
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(s);
    return acc;
  }, {});

  const groupStats = Object.entries(letterGroups).map(([letter, group]) => {
    const totalGrades = group.length;

    const gradeCounts: Record<string, number> = {};
    group.forEach(s => {
      gradeCounts[s.gradeId] = (gradeCounts[s.gradeId] || 0) + 1;
    });

    const cycleCounts: Record<string, number> = {};
    Object.entries(gradeCounts).forEach(([gradeId, count]) => {
      const grade = grades.find(g => g.id === gradeId);
      const cycle = grade?.cycle || '1';
      if (cycle === '4' && grade?.baccalaureateType) {
        const key = `4-${grade.baccalaureateType}`;
        cycleCounts[key] = (cycleCounts[key] || 0) + count;
      } else {
        cycleCounts[cycle] = (cycleCounts[cycle] || 0) + count;
      }
    });

    const levels = [
      { key: '1', label: 'Primer Ciclo (1° - 3°)', count: cycleCounts['1'] || 0 },
      { key: '2', label: 'Segundo Ciclo (4° - 6°)', count: cycleCounts['2'] || 0 },
      { key: '3', label: 'Tercer Ciclo (7° - 9°)', count: cycleCounts['3'] || 0 },
    ];

    const gradeNumbers = grades
      .filter(g => g.cycle === '4')
      .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    gradeNumbers.forEach(grade => {
      const count = gradeCounts[grade.id] || 0;
      if (count > 0) {
        const bt = baccalaureateTypes.find(b => b.id === grade.baccalaureateType);
        const btName = bt?.name || 'Bachillerato';
        levels.push({ key: grade.id, label: `${btName} (${grade.name}°)`, count });
      }
    });

    const totalStudents = students.filter(st => group.some(section => section.id === st.sectionId)).length;
    const totalCapacity = group.reduce((sum, section) => sum + (section.capacity || 0), 0);
    const occupancyPercentage = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
    
    // Detalle por grado: capacidad vs matriculados
    const gradeDetails = group.map(section => {
      const grade = grades.find(g => g.id === section.gradeId);
      const gradeName = grade ? (grade.cycle === '4' && grade.baccalaureateType ? `${baccalaureateTypes.find(b => b.id === grade.baccalaureateType)?.name || 'Bachillerato'} ${grade.name}°` : `${grade.name}°`) : section.gradeId;
      const enrolledInGrade = students.filter(st => st.sectionId === section.id).length;
      const capacity = section.capacity || 0;
      
      return {
        gradeId: section.gradeId,
        gradeName,
        capacity,
        enrolled: enrolledInGrade,
        percentage: capacity > 0 ? Math.round((enrolledInGrade / capacity) * 100) : 0
      };
    });
    
    // Debug temporal
    console.log(`Sección ${letter}:`, { 
      totalStudents, 
      totalCapacity, 
      occupancyPercentage,
      sectionIds: group.map(s => s.id),
      studentsInSection: students.filter(st => group.some(section => section.id === st.sectionId)).map(st => ({ id: st.id, name: st.name, sectionId: st.sectionId }))
    });

    return {
      letter: letter.toUpperCase(),
      totalGrades,
      levels,
      totalStudents,
      totalCapacity,
      occupancyPercentage,
      gradeDetails
    };
  });

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-accent/10">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="module-title">Secciones</h1>
            <p className="module-subtitle">{groupStats.length} sección(es) registrada(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Sección
        </button>
      </div>

      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Buscar sección..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {/* Formulario Modal */}
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
                <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Editar Sección' : 'Nueva Sección'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Grado *</label>
                    <select required value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value })} className="input">
                      <option value="">Seleccionar grado</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: A" className="input" maxLength={3} />
                  </div>
                  <div>
                    <label className="form-label">Capacidad</label>
                    <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} placeholder="Ej: 40" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Edificio</label>
                    <select value={form.buildingId} onChange={e => setForm({ ...form, buildingId: e.target.value })} className="input">
                      <option value="">Sin edificio</option>
                      {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Laboratorio de Cómputo</label>
                    <select value={form.computerLabId} onChange={e => setForm({ ...form, computerLabId: e.target.value })} className="input">
                      <option value="">Sin laboratorio</option>
                      {computerLabs.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                    </select>
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

      {groupStats.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No hay secciones creadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupStats.map((group, i) => {
            const progressColor = group.occupancyPercentage >= 90 ? 'bg-red-600' : group.occupancyPercentage >= 70 ? 'bg-amber-500' : 'bg-primary';
            return (
              <motion.div
                key={group.letter}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between h-[230px]"
                onClick={() => openAnalytics(group)}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sección</span>
                    <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-primary-light group-hover:text-primary transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 leading-none font-display">Sección "{group.letter}"</h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">Nómina y asignaciones integrales</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                    <div className="flex gap-4">
                      <div>
                        <span className="text-slate-900 font-bold font-mono">{group.totalGrades}</span> <span className="text-[10px] text-slate-400 uppercase tracking-wider">Grados</span>
                      </div>
                      <div>
                        <span className="text-slate-900 font-bold font-mono">{group.totalStudents}</span> <span className="text-[10px] text-slate-400 uppercase tracking-wider">Alumnos</span>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{group.occupancyPercentage}%</span>
                  </div>

                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressColor} transition-all duration-500`}
                      style={{ width: `${group.occupancyPercentage}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {selectedGroup && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Analytics - Sección {selectedGroup.letter}</h3>
            <button onClick={closeAnalytics} className="text-xs text-slate-500 hover:text-slate-700">Cerrar</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Distribución por Niveles</h4>
              <div className="space-y-3">
                {selectedGroup.levels.map((level, idx) => {
                  const maxCount = Math.max(...selectedGroup.levels.map(l => l.count), 1);
                  const percentage = Math.round((level.count / maxCount) * 100);
                  const barColors = [
                    'bg-gradient-to-r from-emerald-600 to-emerald-400',
                    'bg-gradient-to-r from-emerald-500 to-emerald-300',
                    'bg-gradient-to-r from-emerald-700 to-emerald-500',
                    'bg-gradient-to-r from-emerald-400 to-emerald-200',
                    'bg-gradient-to-r from-emerald-800 to-emerald-600',
                    'bg-gradient-to-r from-emerald-600 to-emerald-400'
                  ];
                  const barColor = barColors[idx % barColors.length];
                  return (
                    <div key={level.label} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="truncate pr-2">{level.label}</span>
                        <span className="text-slate-900 font-bold">{level.count} Grados</span>
                      </div>
                      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${barColor} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col items-center">
              <h4 className="text-sm font-bold text-slate-900 mb-4">Ocupación de la Sección</h4>
              <div className="relative w-48 h-24">
                <svg viewBox="0 0 200 110" className="w-full h-full">
                  <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#e2e8f0" strokeWidth="20" />
                  <path d="M 25 100 A 75 75 0 0 1 175 100" fill="none" stroke="#2e8b57" strokeWidth="20" strokeDasharray={`${selectedGroup.occupancyPercentage * 2.35}, 235`} strokeLinecap="round" />
                </svg>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-2xl font-extrabold text-slate-900">{selectedGroup.occupancyPercentage}%</div>
                  <div className="text-[10px] font-semibold text-slate-500">Ocupación</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-2xl font-extrabold text-slate-900">{selectedGroup.totalStudents}</div>
                <div className="text-[10px] font-semibold text-slate-500">Alumnos matriculados</div>
              </div>
            </div>
          </div>
          <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Total Alumnos</span>
              <span className="text-slate-900">{selectedGroup.totalStudents}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mt-2">
              <span>Capacidad</span>
              <span className="text-slate-900">{selectedGroup.totalCapacity}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mt-2">
              <span>% Ocupación</span>
              <span className="text-slate-900">{selectedGroup.occupancyPercentage}%</span>
            </div>
          </div>

          <div className="mt-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <h4 className="text-sm font-bold text-slate-900 mb-4">Capacidad vs Matriculados por Grado</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedGroup.gradeDetails.map((detail, idx) => {
                const strokeColor = detail.percentage >= 90 ? '#dc2626' : detail.percentage >= 70 ? '#d97706' : '#059669';
                const bgColor = detail.percentage >= 90 ? 'bg-red-50' : detail.percentage >= 70 ? 'bg-amber-50' : 'bg-emerald-50';
                const textColor = detail.percentage >= 90 ? 'text-red-700' : detail.percentage >= 70 ? 'text-amber-700' : 'text-emerald-700';
                const circumference = 2 * Math.PI * 40;
                const strokeDashoffset = circumference - (detail.percentage / 100) * circumference;
                
                return (
                  <div key={detail.gradeId} className={`${bgColor} rounded-2xl p-4 border border-slate-200/80`}>
                    <div className="text-center mb-3">
                      <span className="text-xs font-bold text-slate-700">{detail.gradeName}</span>
                    </div>
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke={strokeColor} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-lg font-extrabold ${textColor}`}>{detail.percentage}%</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                      <div className="text-center">
                        <div className="text-slate-900 font-bold">{detail.capacity}</div>
                        <div className="text-[10px] text-slate-500">Capacidad</div>
                      </div>
                      <div className="text-center">
                        <div className="text-slate-900 font-bold">{detail.enrolled}</div>
                        <div className="text-[10px] text-slate-500">Matriculados</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
