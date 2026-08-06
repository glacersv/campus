import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [form, setForm] = useState({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabIds: [] as string[] });
  const [search, setSearch] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [letterFilter, setLetterFilter] = useState<string>('all');
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
        computerLabIds: form.computerLabIds.length > 0 ? form.computerLabIds : null
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
      setShowForm(false); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabIds: [] });
      loadData();
    } catch (err) {
      toast.error('Error al guardar sección');
      console.error(err);
    }
  };

  const handleEdit = (s: Section) => {
    setEditingId(s.id);
    setForm({
      name: s.name,
      gradeId: s.gradeId,
      capacity: s.capacity?.toString() || '',
      buildingId: s.buildingId || '',
      computerLabIds: s.computerLabIds || (s.computerLabId ? [s.computerLabId] : [])
    });
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

  const sectionLetters = Array.from(
    new Set(activeSections.map(s => getSectionLetter(s.name)))
  ).sort((a, b) => a.localeCompare(b));

  const filteredActiveSections = activeSections.filter(s => {
    const gradeName = getGradeName(s.gradeId);
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || gradeName.toLowerCase().includes(search.toLowerCase());
    const matchesActive = !onlyActive || activeGradeIds.has(s.gradeId);
    const matchesLetter = letterFilter === 'all' || getSectionLetter(s.name) === letterFilter;
    return matchesSearch && matchesActive && matchesLetter;
  });

  const totalCapacityFiltered = filteredActiveSections.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const totalStudentsFiltered = filteredActiveSections.reduce((acc, s) => acc + students.filter(st => st.sectionId === s.id).length, 0);
  const occupancyPercentageFiltered = totalCapacityFiltered > 0 ? Math.round((totalStudentsFiltered / totalCapacityFiltered) * 100) : 0;

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
          <div className="module-icon">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="module-title">Secciones</h1>
            <p className="module-subtitle">{sortedSections.length} sección(es) registrada(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', gradeId: '', capacity: '', buildingId: '', computerLabIds: [] }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva Sección
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar sección..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>

        {sectionLetters.length > 0 && (
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setLetterFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                letterFilter === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Todas
            </button>
            {sectionLetters.map(letter => (
              <button
                key={letter}
                onClick={() => setLetterFilter(letter)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  letterFilter === letter
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-3xs cursor-pointer select-none hover:bg-slate-50 transition-colors" onClick={() => setOnlyActive(!onlyActive)}>
          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${onlyActive ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
            {onlyActive && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
          </div>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sólo Secciones con Alumnos</span>
        </div>
      </div>

      {/* Premium Statistics Banner */}
      {filteredActiveSections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Matrícula Filtrada</span>
              <span className="text-base font-extrabold text-slate-800 font-display">{totalStudentsFiltered} alumnos</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Capacidad Total</span>
              <span className="text-base font-extrabold text-slate-800 font-display">{totalCapacityFiltered} espacios</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
              <div className="relative w-7 h-7">
                <svg viewBox="0 0 36 36" className="w-full h-full text-slate-500">
                  <path className="text-slate-200" strokeWidth="4" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className="text-slate-500" strokeDasharray={`${occupancyPercentageFiltered}, 100`} strokeWidth="4" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promedio de Ocupación</span>
              <span className="text-base font-extrabold text-slate-800 font-display">{occupancyPercentageFiltered}% ocupado</span>
            </div>
          </div>
        </div>
      )}

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
                    <label className="form-label mb-2.5 block text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      LABORATORIOS / CC / SALONES ESPECIALIZADOS
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto pr-1">
                      {computerLabs.map(cl => {
                        const isChecked = form.computerLabIds.includes(cl.id);
                        return (
                          <button
                            type="button"
                            key={cl.id}
                            onClick={() => {
                              setForm(prev => {
                                const isIncluded = prev.computerLabIds.includes(cl.id);
                                const nextIds = isIncluded
                                  ? prev.computerLabIds.filter(id => id !== cl.id)
                                  : [...prev.computerLabIds, cl.id];
                                return { ...prev, computerLabIds: nextIds };
                              });
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary/95'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${isChecked ? 'bg-white border-white text-primary' : 'border-slate-400 bg-white'}`}>
                              {isChecked && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
                            </div>
                            <span>{cl.name}</span>
                          </button>
                        );
                      })}
                      {computerLabs.length === 0 && (
                        <p className="text-[11px] text-slate-400 w-full text-center py-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                          No hay aulas especializadas creadas.
                        </p>
                      )}
                    </div>
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

            const strokeColor = '#64748b'; // slate-500 neutral monochrome
            const strokeBg = '#e2e8f0';
            const circumference = 2 * Math.PI * 35;
            const strokeDashoffset = circumference - (percentage / 100) * circumference;

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-all min-h-[290px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/60 text-slate-500">
                        <Layers className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight uppercase tracking-wider">{gradeName}</h3>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Sección "{s.name}"</p>
                      </div>
                    </div>

                    {/* Radial Progress Gauge */}
                    <div className="relative w-16 h-16 shrink-0">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        <circle cx="50" cy="50" r="35" fill="none" stroke={strokeBg} strokeWidth="10" strokeLinecap="round" />
                        <circle cx="50" cy="50" r="35" fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-slate-900">{percentage}%</span>
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
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-400" />
                      <span className="truncate">Edificio: <strong className="text-slate-700">{buildingName}</strong></span>
                    </div>
                    {(() => {
                      const assignedIds = s.computerLabIds || (s.computerLabId ? [s.computerLabId] : []);
                      if (assignedIds.length === 0) return null;
                      return (
                        <div className="flex flex-col gap-1 mt-1.5">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Aulas / laboratorios:</span>
                          <div className="flex flex-wrap gap-1 pr-1">
                            {assignedIds.map(id => {
                              const name = getComputerLabName(id);
                              return (
                                <span key={id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 text-[9px] font-black uppercase px-2 py-0.5 rounded-md" title={name}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                  <span className="truncate max-w-[80px]">{name}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
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
