import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch,
  Save,
  Building2,
  Monitor,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  DoorOpen,
  Edit2,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllGrades,
  getAllSections,
  getAllBuildings,
  updateSection,
  getCurrentSchoolYear
} from '../../lib/firestore';
import { Grade, Section, Building as BuildingType, Cycle, CYCLE_NAMES } from '../../types';

const CYCLE_STYLES: Record<Cycle, { color: string; bg: string; dot: string }> = {
  'parvularia': { color: 'text-pink-700', bg: 'bg-pink-50', dot: 'bg-pink-500' },
  '1': { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  '2': { color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  '3': { color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  '4': { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' }
};

const CYCLE_HEX: Record<string, string> = {
  '1': '#10B981',
  '2': '#3B82F6',
  '3': '#8B5CF6',
  '4': '#F59E0B'
};

export default function GradeSectionAssignment() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState<string | null>(null);

  // State for interactive assignment editor
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [g, s, b, cy] = await Promise.all([
        getAllGrades(),
        getAllSections(),
        getAllBuildings(),
        getCurrentSchoolYear()
      ]);
      const activeYear = cy || new Date().getFullYear();
      const hasYearSections = s.some(sec => sec.schoolYear === activeYear);
      const filteredSecs = s.filter(sec =>
        hasYearSections ? sec.schoolYear === activeYear : !sec.schoolYear
      );
      setGrades(g);
      setSections(filteredSecs);
      setBuildings(b);
      const init: Record<string, string> = {};
      filteredSecs.forEach(sec => { if (sec.buildingId) init[sec.id] = sec.buildingId; });
      setAssignments(init);
    } finally { setLoading(false); }
  };

  const getSectionsByGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);
  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;

  const selectBuildingForSection = (sectionId: string, buildingId: string) => {
    setAssignments(prev => ({
      ...prev,
      [sectionId]: buildingId
    }));
    toast.success('Edificio asignado temporalmente. No olvides guardar los cambios.');
  };

  const clearBuildingForSection = (sectionId: string) => {
    setAssignments(prev => ({
      ...prev,
      [sectionId]: ''
    }));
    toast.success('Asignación removida temporalmente. No olvides guardar los cambios.');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [sectionId, buildingId] of Object.entries(assignments) as [string, string][]) {
        await updateSection(sectionId, { buildingId: buildingId || null });
      }
      toast.success('Asignaciones guardadas correctamente en la base de datos');
      loadData();
    } catch (err) {
      toast.error('Error al guardar asignaciones');
    } finally {
      setSaving(false);
    }
  };

  const changedCount = Object.values(assignments).filter(Boolean).length;
  const totalSections = sections.length;

  const groupedGrades = {
    'parvularia': grades.filter(g => g.cycle === 'parvularia'),
    '1': grades.filter(g => g.cycle === '1'),
    '2': grades.filter(g => g.cycle === '2'),
    '3': grades.filter(g => g.cycle === '3'),
    '4': grades.filter(g => g.cycle === '4')
  };

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
            <GitBranch className="w-6 h-6 text-secondary-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Edificios por Sección</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {changedCount} de {totalSections} secciones con edificio asignado (Haz clic en cualquier sección para editar)
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary shrink-0" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Filter bar - clickable building pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {buildings.map(b => {
          const count = Object.values(assignments).filter(v => v === b.id).length;
          const isActive = filterBuilding === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setFilterBuilding(isActive ? null : b.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
              style={{
                backgroundColor: isActive ? b.color : undefined,
                borderColor: isActive ? b.color : '#e2e8f0'
              }}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white/80' : ''}`}
                style={{ backgroundColor: isActive ? undefined : b.color }} />
              {b.name}
              <span className={`font-mono ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>
            </button>
          );
        })}
        <button
          onClick={() => setFilterBuilding('__unassigned__')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            filterBuilding === '__unassigned__'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Sin asignar
          <span className="font-mono opacity-70">{totalSections - changedCount}</span>
        </button>
        {filterBuilding && (
          <button onClick={() => setFilterBuilding(null)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all cursor-pointer">
            <X className="w-3.5 h-3.5" /> Limpiar filtro
          </button>
        )}
      </div>

      {/* Assignment Grid */}
      <div className="space-y-8">
        {(Object.keys(groupedGrades) as Cycle[]).map(cycle => {
          const gradesInCycle = groupedGrades[cycle];
          if (gradesInCycle.length === 0) return null;
          const cs = CYCLE_STYLES[cycle];
          const cycleHex = CYCLE_HEX[cycle] || '#64748b';

          // Filter grades based on selected building
          const filteredGrades = filterBuilding
            ? gradesInCycle.filter(g => {
                const gradeSections = getSectionsByGrade(g.id);
                return gradeSections.some(s =>
                  filterBuilding === '__unassigned__'
                    ? !assignments[s.id]
                    : assignments[s.id] === filterBuilding
                );
              })
            : gradesInCycle;

          if (filteredGrades.length === 0) return null;

          return (
            <div key={cycle}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-2 h-2 rounded-full ${cs.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${cs.color}`}>
                  {CYCLE_NAMES[cycle]}
                </span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs text-slate-400">
                  {filteredGrades.reduce((acc, g) => acc + getSectionsByGrade(g.id).length, 0)} secciones
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredGrades.map(grade => {
                  const gradeSections = getSectionsByGrade(grade.id).filter(s =>
                    filterBuilding
                      ? filterBuilding === '__unassigned__'
                        ? !assignments[s.id]
                        : assignments[s.id] === filterBuilding
                      : true
                  );
                  const assignedCount = gradeSections.filter(s => assignments[s.id]).length;
                  return (
                    <motion.div
                      key={grade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 transition-all hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-700 border border-slate-200 bg-slate-50">
                            <DoorOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{grade.name}</h3>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                          assignedCount === gradeSections.length && gradeSections.length > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {assignedCount}/{gradeSections.length}
                        </span>
                      </div>

                      {/* Secciones */}
                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-900 font-display tracking-tight">{gradeSections.length}</span>
                          <span className="text-sm text-slate-400 font-medium">secciones</span>
                        </div>
                      </div>

                      {/* Edificios asignados (Botones Interactivos de Edición) */}
                      <div className="mb-4">
                        <div className="flex flex-col gap-2">
                          {gradeSections.map(sec => {
                            const buildingId = assignments[sec.id];
                            const building = buildings.find(b => b.id === buildingId);
                            return (
                              <button
                                type="button"
                                key={sec.id}
                                onClick={() => setEditingSection(sec)}
                                className={`group flex items-center justify-between text-left text-xs font-mono px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                                  building
                                    ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:shadow-xs'
                                    : 'bg-slate-50 border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">Sección {sec.name}</span>
                                  {building ? (
                                    <span className="flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: building.color }} />
                                      <span className="font-bold" style={{ color: building.color }}>{building.name}</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] italic bg-slate-100 px-1.5 py-0.5 rounded text-slate-400">Sin asignar</span>
                                  )}
                                </div>
                                <Edit2 className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            );
                          })}
                          {gradeSections.length === 0 && (
                            <span className="text-xs text-slate-400 italic">Sin secciones</span>
                          )}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: cycleHex }} />
                          <span className="text-[11px] font-semibold text-slate-600"> Ciclo {cycle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm bg-slate-300" />
                          <span className="text-[10px] text-slate-400">Presiona para asignar</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal interactivo Premium para editar la asignación de edificios */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Asignar Edificio</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {getGradeName(editingSection.gradeId)} - Sección "{editingSection.name}"
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[400px]">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selecciona un edificio disponible:</p>
                <div className="grid grid-cols-1 gap-2.5">
                  {buildings.map(building => {
                    const isSelected = assignments[editingSection.id] === building.id;
                    return (
                      <button
                        type="button"
                        key={building.id}
                        onClick={() => {
                          selectBuildingForSection(editingSection.id, building.id);
                          setEditingSection(null);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-50 shadow-xs'
                            : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                        style={{ borderLeftWidth: '5px', borderLeftColor: building.color }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${building.color}15` }}>
                            <Building2 className="w-4 h-4" style={{ color: building.color }} />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 text-sm block">{building.name}</span>
                            <span className="text-xs text-slate-400">Impartir clases en esta infraestructura</span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {buildings.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-400">No hay edificios registrados en el sistema.</p>
                    </div>
                  )}
                </div>

                {assignments[editingSection.id] && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearBuildingForSection(editingSection.id);
                        setEditingSection(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" /> Quitar Edificio (Dejar sin asignar)
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {grades.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay grados registrados</p>
        </div>
      )}
    </div>
  );
}
