import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch,
  Save,
  Building2,
  Monitor,
  Palette,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  DoorOpen,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllGrades,
  getAllSections,
  getAllBuildings,
  getAllComputerLabs,
  updateSection
} from '../../lib/firestore';
import { getGradeSortWeight } from '../../lib/ordering';
import { Grade, Section, Building as BuildingType, ComputerLab, Cycle, CYCLE_NAMES } from '../../types';

const CYCLE_STYLES: Record<Cycle, { color: string; bg: string; dot: string }> = {
  'parvularia': { color: 'text-pink-700', bg: 'bg-pink-50', dot: 'bg-pink-500' },
  '1': { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  '2': { color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  '3': { color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  '4': { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' }
};

type SectionAssignments = {
  buildingId?: string;
  computerLabId?: string;
  drawingRoomId?: string;
};

export default function GradeSectionAssignment() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [computerLabs, setComputerLabs] = useState<ComputerLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, SectionAssignments>>({});
  const [saving, setSaving] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState<string | null>(null);

  // State for interactive assignment editor
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [g, s, b, cl] = await Promise.all([
        getAllGrades(),
        getAllSections(),
        getAllBuildings(),
        getAllComputerLabs()
      ]);
      setGrades(g); setSections(s); setBuildings(b); setComputerLabs(cl);
      const init: Record<string, SectionAssignments> = {};
      s.forEach(sec => {
        init[sec.id] = {
          buildingId: sec.buildingId,
          computerLabId: sec.computerLabId,
          drawingRoomId: sec.drawingRoomId
        };
      });
      setAssignments(init);
    } finally { setLoading(false); }
  };

  const getSectionsByGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);
  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;
  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || '—';

  const computerLabsList = computerLabs.filter(cl => (cl.type || 'computo') === 'computo');
  const drawingRoomsList = computerLabs.filter(cl => (cl.type || 'computo') === 'dibujo');

  const selectBuildingForSection = (sectionId: string, buildingId: string) => {
    setAssignments(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], buildingId }
    }));
    toast.success('Edificio asignado temporalmente. No olvides guardar los cambios.');
  };

  const clearBuildingForSection = (sectionId: string) => {
    setAssignments(prev => {
      const next = { ...prev[sectionId] };
      delete next.buildingId;
      return { ...prev, [sectionId]: next };
    });
    toast.success('Asignación removida temporalmente. No olvides guardar los cambios.');
  };

  const selectComputerLabForSection = (sectionId: string, labId: string) => {
    setAssignments(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], computerLabId: labId }
    }));
    toast.success('Centro de Cómputo asignado temporalmente. No olvides guardar los cambios.');
  };

  const clearComputerLabForSection = (sectionId: string) => {
    setAssignments(prev => {
      const next = { ...prev[sectionId] };
      delete next.computerLabId;
      return { ...prev, [sectionId]: next };
    });
    toast.success('Asignación removida temporalmente. No olvides guardar los cambios.');
  };

  const selectDrawingRoomForSection = (sectionId: string, labId: string) => {
    setAssignments(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], drawingRoomId: labId }
    }));
    toast.success('Salón de Dibujo asignado temporalmente. No olvides guardar los cambios.');
  };

  const clearDrawingRoomForSection = (sectionId: string) => {
    setAssignments(prev => {
      const next = { ...prev[sectionId] };
      delete next.drawingRoomId;
      return { ...prev, [sectionId]: next };
    });
    toast.success('Asignación removida temporalmente. No olvides guardar los cambios.');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [sectionId, a] of Object.entries(assignments) as [string, SectionAssignments][]) {
        const data: Partial<Section> = {};
        if (a.buildingId !== undefined) data.buildingId = a.buildingId || null;
        if (a.computerLabId !== undefined) data.computerLabId = a.computerLabId || null;
        if (a.drawingRoomId !== undefined) data.drawingRoomId = a.drawingRoomId || null;
        await updateSection(sectionId, data);
      }
      toast.success('Asignaciones guardadas correctamente en la base de datos');
      loadData();
    } catch (err) {
      toast.error('Error al guardar asignaciones');
    } finally {
      setSaving(false);
    }
  };

  const assignedCount = sections.filter(s => {
    const a = assignments[s.id];
    return a && (a.buildingId || a.computerLabId || a.drawingRoomId);
  }).length;
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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Espacios por Grado y Sección</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {assignedCount} de {totalSections} secciones con espacios asignados (Haz clic en cualquier sección para editar)
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary shrink-0" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Filter bar - Clean neutral building pills (No colors) */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {buildings.map(b => {
          const count = Object.values(assignments).filter(a => a && a.buildingId === b.id).length;
          const isActive = filterBuilding === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setFilterBuilding(isActive ? null : b.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              {b.name}
              <span className={`font-mono font-bold ${isActive ? 'text-white/85' : 'text-slate-400'}`}>{count}</span>
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
          <span className="font-mono opacity-70">{totalSections - assignedCount}</span>
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

          // Filter grades based on selected building & Sort chronologically using helper weight
          const filteredGrades = filterBuilding
            ? gradesInCycle.filter(g => {
                const gradeSections = getSectionsByGrade(g.id);
                return gradeSections.some(s =>
                  filterBuilding === '__unassigned__'
                    ? !(assignments[s.id] && (assignments[s.id].buildingId || assignments[s.id].computerLabId || assignments[s.id].drawingRoomId))
                    : assignments[s.id] && assignments[s.id].buildingId === filterBuilding
                );
              })
            : gradesInCycle;

          if (filteredGrades.length === 0) return null;

          // Order grades chronologically K4 -> 12
          const sortedGrades = [...filteredGrades].sort((a, b) => getGradeSortWeight(a.id) - getGradeSortWeight(b.id));

          return (
            <div key={cycle}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-2 h-2 rounded-full ${cs.dot}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${cs.color}`}>
                  {CYCLE_NAMES[cycle]}
                </span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs text-slate-400">
                  {sortedGrades.reduce((acc, g) => acc + getSectionsByGrade(g.id).length, 0)} secciones
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedGrades.map(grade => {
                  const gradeSections = getSectionsByGrade(grade.id).filter(s =>
                    filterBuilding
                      ? filterBuilding === '__unassigned__'
                        ? !(assignments[s.id] && (assignments[s.id].buildingId || assignments[s.id].computerLabId || assignments[s.id].drawingRoomId))
                        : assignments[s.id] && assignments[s.id].buildingId === filterBuilding
                      : true
                  );
                  const gradeAssigned = gradeSections.filter(s => {
                    const a = assignments[s.id];
                    return a && (a.buildingId || a.computerLabId || a.drawingRoomId);
                  }).length;
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
                          gradeAssigned === gradeSections.length && gradeSections.length > 0
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {gradeAssigned}/{gradeSections.length}
                        </span>
                      </div>

                      {/* Secciones */}
                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-slate-900 font-display tracking-tight">{gradeSections.length}</span>
                          <span className="text-sm text-slate-400 font-medium">secciones</span>
                        </div>
                      </div>

                      {/* Espacios asignados (Botones Interactivos de Edición Sobrios sin colores) */}
                      <div className="mb-4">
                        <div className="flex flex-col gap-2">
                          {gradeSections.map(sec => {
                            const a = assignments[sec.id] || {};
                            const building = buildings.find(b => b.id === a.buildingId);
                            const cc = computerLabs.find(cl => cl.id === a.computerLabId);
                            const drawing = computerLabs.find(cl => cl.id === a.drawingRoomId);
                            const hasAny = !!(a.buildingId || a.computerLabId || a.drawingRoomId);
                            return (
                              <button
                                type="button"
                                key={sec.id}
                                onClick={() => setEditingSection(sec)}
                                className={`group flex items-center justify-between text-left text-xs font-mono px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                                  hasAny
                                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 hover:shadow-2xs'
                                    : 'bg-white border-dashed border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold">Sección {sec.name}</span>
                                  {building ? (
                                    <span className="flex items-center gap-1">
                                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-bold text-slate-700">{building.name}</span>
                                    </span>
                                  ) : null}
                                  {cc ? (
                                    <span className="flex items-center gap-1">
                                      <Monitor className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-bold text-slate-700">{cc.name}</span>
                                    </span>
                                  ) : null}
                                  {drawing ? (
                                    <span className="flex items-center gap-1">
                                      <Palette className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="font-bold text-slate-700">{drawing.name}</span>
                                    </span>
                                  ) : null}
                                  {!hasAny && (
                                    <span className="text-[10px] italic bg-slate-50 px-1.5 py-0.5 rounded text-slate-400">Sin asignar</span>
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
                          <span className="text-[11px] font-semibold text-slate-600">{CYCLE_NAMES[cycle]}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Presiona para asignar</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal interactivo Premium para editar la asignación de espacios (Diseño sobrio sin colores) */}
      <AnimatePresence>
        {editingSection && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Asignar Espacios</h3>
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
              <div className="p-6 space-y-6 overflow-y-auto max-h-[420px]">
                {/* Edificio */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Edificio</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {buildings.map(building => {
                      const isSelected = assignments[editingSection.id]?.buildingId === building.id;
                      return (
                        <button
                          type="button"
                          key={building.id}
                          onClick={() => {
                            selectBuildingForSection(editingSection.id, building.id);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50 border-primary shadow-xs'
                              : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-bold text-slate-800 text-sm block">{building.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-medium">Código: {building.code}</span>
                            </div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                    {assignments[editingSection.id]?.buildingId && (
                      <button
                        type="button"
                        onClick={() => clearBuildingForSection(editingSection.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Quitar Edificio
                      </button>
                    )}
                    {buildings.length === 0 && (
                      <div className="text-center py-3 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400">No hay edificios registrados.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Centro de Cómputo */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Centro de Cómputo</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {computerLabsList.map(lab => {
                      const isSelected = assignments[editingSection.id]?.computerLabId === lab.id;
                      return (
                        <button
                          type="button"
                          key={lab.id}
                          onClick={() => {
                            selectComputerLabForSection(editingSection.id, lab.id);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50 border-primary shadow-xs'
                              : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600">
                              <Monitor className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{lab.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                    {assignments[editingSection.id]?.computerLabId && (
                      <button
                        type="button"
                        onClick={() => clearComputerLabForSection(editingSection.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Quitar Centro de Cómputo
                      </button>
                    )}
                    {computerLabsList.length === 0 && (
                      <div className="text-center py-3 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400">No hay centros de cómputo registrados.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Salón de Dibujo */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salón de Dibujo</p>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {drawingRoomsList.map(lab => {
                      const isSelected = assignments[editingSection.id]?.drawingRoomId === lab.id;
                      return (
                        <button
                          type="button"
                          key={lab.id}
                          onClick={() => {
                            selectDrawingRoomForSection(editingSection.id, lab.id);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-slate-50 border-primary shadow-xs'
                              : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-50 border border-slate-100 text-slate-600">
                              <Palette className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800 text-sm">{lab.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                    {assignments[editingSection.id]?.drawingRoomId && (
                      <button
                        type="button"
                        onClick={() => clearDrawingRoomForSection(editingSection.id)}
                        className="w-full flex items-center justify-center gap-2 py-2 border border-red-200 hover:border-red-300 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Quitar Salón de Dibujo
                      </button>
                    )}
                    {drawingRoomsList.length === 0 && (
                      <div className="text-center py-3 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400">No hay salones de dibujo registrados.</p>
                      </div>
                    )}
                  </div>
                </div>
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
