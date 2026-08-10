import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitBranch,
  Save,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  DoorOpen,
  Edit2,
  Trash2,
  Check,
  BookOpen,
  Layers,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllGrades,
  getAllSections,
  getAllBuildings,
  updateSection,
  deleteSection,
  toggleGradeStatus,
  getCurrentSchoolYear,
  getAllStudents
} from '../../lib/firestore';
import { Grade, Section, Building as BuildingType, Cycle, CYCLE_NAMES, Student } from '../../types';

export default function GradeSectionAssignment() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [buildings, setBuildings] = useState<BuildingType[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState<string | null>(null);
  const [onlyActive, setOnlyActive] = useState(true);

  // State for interactive assignment editor
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [g, s, b, cy, st] = await Promise.all([
        getAllGrades(),
        getAllSections(),
        getAllBuildings(),
        getCurrentSchoolYear(),
        getAllStudents()
      ]);
      const activeYear = cy || new Date().getFullYear();
      const hasYearSections = s.some(sec => sec.schoolYear === activeYear);
      const filteredSecs = s.filter(sec =>
        hasYearSections ? sec.schoolYear === activeYear : !sec.schoolYear
      );
      setGrades(g);
      setSections(filteredSecs);
      setBuildings(b);
      setStudents(st);

      const init: Record<string, string> = {};
      filteredSecs.forEach(sec => { if (sec.buildingId) init[sec.id] = sec.buildingId; });
      setAssignments(init);
    } finally { setLoading(false); }
  };

  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;

  const handleDelete = async (sectionId: string) => {
    try {
      await deleteSection(sectionId);
      setSections(prev => prev.filter(s => s.id !== sectionId));
      toast.success('Sección eliminada');
    } catch { toast.error('Error al eliminar sección'); }
  };

  const handleToggleGradeStatus = async (grade: Grade) => {
    try {
      await toggleGradeStatus(grade.id, grade.status);
      setGrades(prev => prev.map(g => g.id === grade.id ? { ...g, status: g.status === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO' } : g));
      toast.success(grade.status === 'ACTIVO' ? 'Grado desactivado' : 'Grado activado');
    } catch { toast.error('Error al cambiar estado del grado'); }
  };

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

  const activeGradeIds = new Set(students.map(st => st.gradeId).filter(Boolean));

  // Extract grade sorting weight
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

  const sortedGrades = [...grades].sort((a, b) => {
    const weightA = getGradeSortWeight(a.id);
    const weightB = getGradeSortWeight(b.id);
    return weightA - weightB;
  });

  const filteredGradesList = sortedGrades.filter(g => {
    const matchesActive = !onlyActive || activeGradeIds.has(g.id);
    return matchesActive;
  });

  const groupedGrades = {
    'parvularia': filteredGradesList.filter(g => g.cycle === 'parvularia'),
    '1': filteredGradesList.filter(g => g.cycle === '1'),
    '2': filteredGradesList.filter(g => g.cycle === '2'),
    '3': filteredGradesList.filter(g => g.cycle === '3'),
    '4': filteredGradesList.filter(g => g.cycle === '4')
  };

  // Sections that belong to the filtered grades list
  const filteredSections = sections.filter(sec => filteredGradesList.some(g => g.id === sec.gradeId));
  const filteredStudentsCount = students.filter(st => filteredGradesList.some(g => g.id === st.gradeId)).length;

  const getSectionsByGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);

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
            <GitBranch className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Edificios por Sección</h1>
            <p className="module-subtitle">
              {changedCount} de {totalSections} secciones con edificio asignado
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary shrink-0" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Filter and settings bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <Filter className="w-3.5 h-3.5 text-tertiary ml-1" />
          {buildings.map(b => {
            const count = Object.values(assignments).filter(v => v === b.id).length;
            const isActive = filterBuilding === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setFilterBuilding(isActive ? null : b.id)}
                className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {b.name}
                <span className={`font-mono text-[10px] ${isActive ? 'text-white/80' : 'text-tertiary'}`}>{count}</span>
              </button>
            );
          })}
          <button
            onClick={() => setFilterBuilding(filterBuilding === '__unassigned__' ? null : '__unassigned__')}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border-0 ${
              filterBuilding === '__unassigned__'
                ? 'bg-primary text-white shadow-xs'
                : 'text-secondary hover:bg-slate-200/50'
            }`}
          >
            Sin asignar
            <span className={`font-mono text-[10px] ${filterBuilding === '__unassigned__' ? 'text-white/80' : 'text-tertiary'}`}>
              {totalSections - changedCount}
            </span>
          </button>
          {filterBuilding && (
            <button onClick={() => setFilterBuilding(null)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-secondary hover:bg-slate-200/50 transition-all cursor-pointer border-0">
              <X className="w-3 h-3" /> Limpiar
            </button>
          )}
        </div>

        {/* Toggle only active with students */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-sm cursor-pointer select-none hover:bg-slate-50 transition-colors" onClick={() => setOnlyActive(!onlyActive)}>
          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${onlyActive ? 'bg-primary border-primary text-white' : 'border-slate-300'}`}>
            {onlyActive && <Check className="w-2.5 h-2.5 stroke-[3px]" />}
          </div>
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Sólo Grados con Alumnos</span>
        </div>
      </div>

      {/* Premium Statistics Banner - Unified Single Bar */}
      {filteredGradesList.length > 0 && (
        <div className="card-crema p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Grados Activos</span>
                <span className="text-base font-extrabold text-slate-800 font-display">{filteredGradesList.length} registrados</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                <Layers className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Secciones Totales</span>
                <span className="text-base font-extrabold text-slate-800 font-display">{filteredSections.length} secciones</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alumnos Matriculados</span>
                <span className="text-base font-extrabold text-slate-800 font-display">{filteredStudentsCount} alumnos</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Grid */}
      <div className="space-y-8">
        {(Object.keys(groupedGrades) as Cycle[]).map(cycle => {
          const gradesInCycle = groupedGrades[cycle];
          if (gradesInCycle.length === 0) return null;

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
            <div key={cycle} className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {CYCLE_NAMES[cycle]}
                </span>
                <span className="text-xs text-tertiary">
                  ({filteredGrades.reduce((acc, g) => acc + getSectionsByGrade(g.id).length, 0)} secciones)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredGrades.map(grade => {
                  const gradeSections = getSectionsByGrade(grade.id).filter(s =>
                    filterBuilding
                      ? filterBuilding === '__unassigned__'
                        ? !assignments[s.id]
                        : assignments[s.id] === filterBuilding
                      : true
                  );
                  const assignedCount = gradeSections.filter(s => assignments[s.id]).length;
                  const buildingName = gradeSections.length > 0 && assignments[gradeSections[0].id]
                    ? buildings.find(b => b.id === assignments[gradeSections[0].id])?.name || '—'
                    : '—';

                  return (
                    <motion.div
                      key={grade.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-crema p-5 transition-all hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        {/* Header with icon and title */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0">
                              <DoorOpen className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-900 leading-tight">{grade.name}</h3>
                              <p className="text-[10px] text-slate-400 font-medium mt-0.5">{CYCLE_NAMES[cycle]}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleGradeStatus(grade)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                              grade.status === 'ACTIVO'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {grade.status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                          </button>
                        </div>

                        {/* Info lines */}
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{gradeSections.length} Secciones activas</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <Building2 className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edificio {buildingName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Stats row at bottom */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                        <div className="text-center">
                          <span className="text-2xl font-black text-emerald-600 font-display">{gradeSections.length}</span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Secciones</p>
                        </div>
                        <div className="text-center">
                          <span className="text-2xl font-black text-blue-600 font-display">{assignedCount}</span>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Asignados</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            if (gradeSections.length > 0) setEditingSection(gradeSections[0]);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Gestionar Grado
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (gradeSections.length > 0) setEditingSection(gradeSections[0]);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            gradeSections.forEach(sec => handleDelete(sec.id));
                          }}
                          className="p-2 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
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
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="modal-container max-w-sm"
            >
              <div className="modal-header">
                <h3 className="modal-title">Asignar Edificio</h3>
                <button type="button" onClick={() => setEditingSection(null)} className="modal-close-btn"><X className="w-4 h-4 text-secondary" /></button>
              </div>

              <div className="modal-body">
                <p className="text-[10px] font-semibold text-tertiary uppercase tracking-wider mb-3">Selecciona un edificio disponible:</p>
                <div className="space-y-2">
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
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-50 border-primary shadow-xs'
                            : 'bg-white hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-slate-100">
                            <Building2 className="w-4 h-4 text-slate-600" />
                          </div>
                          <span className="font-bold text-slate-800 text-xs">{building.name}</span>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {buildings.length === 0 && (
                    <div className="text-center py-4 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs text-tertiary">No hay edificios registrados en el sistema.</p>
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
              <div className="modal-footer">
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
        <div className="text-center py-12 text-tertiary">
          <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay grados registrados</p>
        </div>
      )}
    </div>
  );
}
