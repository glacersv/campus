import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Edit2, Trash2, Save, X, Search, Users, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getAllSections, createSection, updateSection, deleteSection, getAllGrades, getAllBuildings, getAllComputerLabs, toggleSectionStatus, getAllBaccalaureateTypes, getAllStudents, getCurrentSchoolYear } from '../../lib/firestore';
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
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' });
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<{ letter: string; levels: { label: string; count: number }[]; totalGrades: number; totalStudents: number; totalCapacity: number; occupancyPercentage: number; gradeDetails: { sectionId: string; gradeId: string; gradeName: string; capacity: number; enrolled: number; percentage: number; rawSection: Section; sortWeight: number }[] } | null>(null);

  // Dynamic filter state for grades in detail analytics
  const [gradeFilter, setGradeFilter] = useState<'all' | 'parvularia' | 'basica' | 'bachillerato'>('all');

  const openAnalytics = (group: { letter: string; levels: { label: string; count: number }[]; totalGrades: number; totalStudents: number; totalCapacity: number; occupancyPercentage: number; gradeDetails: { sectionId: string; gradeId: string; gradeName: string; capacity: number; enrolled: number; percentage: number; rawSection: Section; sortWeight: number }[] }) => {
    setSelectedGroup(group);
  };

  const closeAnalytics = () => {
    setSelectedGroup(null);
    setGradeFilter('all');
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, g, b, cl, bt, st, cy] = await Promise.all([
        getAllSections(),
        getAllGrades(),
        getAllBuildings(),
        getAllComputerLabs(),
        getAllBaccalaureateTypes(),
        getAllStudents(),
        getCurrentSchoolYear()
      ]);
      setSections(s);
      setGrades(g);
      setBuildings(b);
      setComputerLabs(cl);
      setBaccalaureateTypes(bt);
      setStudents(st);
      if (cy) setCurrentYear(cy);
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
        gradeId: form.gradeId,
        buildingId: form.buildingId || null,
        computerLabId: form.computerLabId || null
      };
      if (form.capacity) data.capacity = parseInt(form.capacity);

      if (editingId) {
        await updateSection(editingId, data);
        toast.success('Sección actualizada');
      } else {
        const newId = `${currentYear}-${form.gradeId}-${form.name.trim().toLowerCase()}`;
        await createSection({
          id: newId,
          name: data.name!,
          gradeId: data.gradeId!,
          schoolYear: currentYear,
          status: 'ACTIVO',
          ...data
        });
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

  const hasYearSections = sections.some(s => s.schoolYear === currentYear);
  const activeSections = sections.filter(s =>
    hasYearSections ? s.schoolYear === currentYear : !s.schoolYear
  );

  const activeGradeIds = new Set(students.map(st => st.gradeId).filter(Boolean));

  const filteredActiveSections = activeSections.filter(s => {
    const gradeName = getGradeName(s.gradeId);
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || gradeName.toLowerCase().includes(search.toLowerCase());
    const matchesActive = !onlyActive || activeGradeIds.has(s.gradeId);
    return matchesSearch && matchesActive;
  });

  const getGradeSortWeight = (gradeId: string): number => {
    if (gradeId === 'k4') return 10;
    if (gradeId === 'k5') return 11;
    if (gradeId === 'k6') return 12;

    const numStr = gradeId.replace(/[^0-9]/g, '');
    const num = parseInt(numStr, 10);
    if (Number.isFinite(num)) {
      if (num >= 1 && num <= 9) return 20 + num;
      if (num >= 10 && num <= 12) return 40 + (num - 10);
    }
    return 100;
  };

  const sortedSections = [...filteredActiveSections].sort((a, b) => {
    const weightA = getGradeSortWeight(a.gradeId);
    const weightB = getGradeSortWeight(b.gradeId);
    if (weightA !== weightB) return weightA - weightB;
    return a.name.localeCompare(b.name);
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
            <p className="module-subtitle">{sortedSections.length} sección(es) registrada(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabId: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Sección
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar sección..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-3xs cursor-pointer select-none hover:bg-slate-50 transition-colors" onClick={() => setOnlyActive(!onlyActive)}>
          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${onlyActive ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
            {onlyActive && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
          </div>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sólo Secciones con Alumnos</span>
        </div>
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

      {sortedSections.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No hay secciones creadas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedSections.map((s, i) => {
            const enrolled = students.filter(st => st.sectionId === s.id).length;
            const capacity = s.capacity || 0;
            const percentage = capacity > 0 ? Math.round((enrolled / capacity) * 100) : 0;
            const gradeName = getGradeName(s.gradeId);
            const buildingName = getBuildingName(s.buildingId);
            const computerLabName = s.computerLabId ? getComputerLabName(s.computerLabId) : null;

            const strokeColor = percentage >= 90 ? '#dc2626' : percentage >= 70 ? '#d97706' : '#12562E';
            const strokeBg = '#e2e8f0';
            const circumference = 2 * Math.PI * 30;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-all h-[260px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                        <Layers className="w-4.5 h-4.5 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight uppercase tracking-wider">{gradeName}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Sección "{s.name}"</p>
                      </div>
                    </div>

                    {/* Radial Progress Gauge */}
                    <div className="relative w-12 h-12 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="30" fill="none" stroke={strokeBg} strokeWidth="10" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="30" fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-extrabold text-slate-900">{percentage}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity and Enrolled metrics */}
                  <div className="grid grid-cols-2 gap-3 my-3">
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Capacidad</span>
                      <span className="text-sm font-bold text-slate-800 font-mono mt-0.5">{capacity || '—'}</span>
                    </div>
                    <div className="bg-slate-50/50 p-2 rounded-xl border border-slate-100 flex flex-col">
                      <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Alumnos</span>
                      <span className="text-sm font-bold text-slate-800 font-mono mt-0.5">{enrolled}</span>
                    </div>
                  </div>

                  {/* Location details */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getBuildingColor(s.buildingId || '') }} />
                      <span className="truncate">Edificio: <strong className="text-slate-700">{buildingName}</strong></span>
                    </div>
                    {computerLabName && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500" />
                        <span className="truncate">Aula: <strong className="text-slate-700">{computerLabName}</strong></span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Unified footer actions always visible */}
                <div className="flex justify-end gap-1.5 pt-3 border-t border-slate-100 shrink-0 mt-3">
                  <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Editar"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Eliminar"><Trash2 className="w-4 h-4 text-red-500" /></button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
