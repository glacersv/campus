import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  GitBranch,
  Save,
  Building2,
  Monitor,
  CheckCircle2,
  XCircle,
  Filter,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllGrades,
  getAllSections,
  getAllBuildings,
  updateSection
} from '../../lib/firestore';
import { Grade, Section, Building, Cycle, CYCLE_NAMES } from '../../types';

const CYCLE_STYLES: Record<Cycle, { color: string; bg: string; dot: string }> = {
  '1': { color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  '2': { color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  '3': { color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  '4': { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' }
};

export default function GradeSectionAssignment() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filterBuilding, setFilterBuilding] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [g, s, b] = await Promise.all([
        getAllGrades(),
        getAllSections(),
        getAllBuildings()
      ]);
      setGrades(g); setSections(s); setBuildings(b);
      const init: Record<string, string> = {};
      s.forEach(sec => { if (sec.buildingId) init[sec.id] = sec.buildingId; });
      setAssignments(init);
    } finally { setLoading(false); }
  };

  const getSectionsByGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);

  const toggleBuilding = (sectionId: string, buildingId: string) => {
    setAssignments(prev => ({
      ...prev,
      [sectionId]: prev[sectionId] === buildingId ? '' : buildingId
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [sectionId, buildingId] of Object.entries(assignments) as [string, string][]) {
        await updateSection(sectionId, { buildingId: buildingId || undefined });
      }
      toast.success('Asignaciones guardadas correctamente');
      loadData();
    } catch (err) { toast.error('Error al guardar asignaciones'); }
    finally { setSaving(false); }
  };

  const changedCount = Object.values(assignments).filter(Boolean).length;
  const totalSections = sections.length;

  const groupedGrades = {
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
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0 border border-amber-100">
            <GitBranch className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Edificios por Sección</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {changedCount} de {totalSections} secciones con edificio asignado
            </p>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary shrink-0" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Filter bar - clickable building pills */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-gray-400" />
        {buildings.map(b => {
          const count = Object.values(assignments).filter(v => v === b.id).length;
          const isActive = filterBuilding === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setFilterBuilding(isActive ? null : b.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:border-gray-300'
              }`}
              style={{
                backgroundColor: isActive ? b.color : undefined,
                borderColor: isActive ? b.color : '#e5e7eb'
              }}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-white/80' : ''}`}
                style={{ backgroundColor: isActive ? undefined : b.color }} />
              {b.name}
              <span className={`font-mono ${isActive ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
            </button>
          );
        })}
        <button
          onClick={() => setFilterBuilding('__unassigned__')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            filterBuilding === '__unassigned__'
              ? 'bg-gray-700 text-white border-gray-700 shadow-sm'
              : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Sin asignar
          <span className="font-mono opacity-70">{totalSections - changedCount}</span>
        </button>
        {filterBuilding && (
          <button onClick={() => setFilterBuilding(null)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all">
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
                <span className="text-xs text-gray-300">/</span>
                <span className="text-xs text-gray-400">
                  {filteredGrades.reduce((acc, g) => acc + getSectionsByGrade(g.id).length, 0)} secciones
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredGrades.map(grade => {
                  const gradeSections = getSectionsByGrade(grade.id).filter(s =>
                    filterBuilding
                      ? filterBuilding === '__unassigned__'
                        ? !assignments[s.id]
                        : assignments[s.id] === filterBuilding
                      : true
                  );
                  return (
                    <motion.div
                      key={grade.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <span className="text-xs font-bold text-gray-800 truncate">{grade.name}</span>
                        <span className="text-[11px] text-gray-400 ml-1 shrink-0">{gradeSections.length}</span>
                      </div>

                      <div className="p-3 space-y-2">
                        {gradeSections.map(section => {
                          const currentBuilding = buildings.find(b => assignments[section.id] === b.id);
                          return (
                            <div key={section.id} className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-600 shrink-0">
                                {section.name}
                              </span>
                              <div className="flex-1 flex flex-wrap gap-1.5">
                                {buildings.map(b => {
                                  const isActive = assignments[section.id] === b.id;
                                  return (
                                    <button
                                      key={b.id}
                                      onClick={() => toggleBuilding(section.id, b.id)}
                                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                                        isActive
                                          ? 'text-white shadow-sm'
                                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700'
                                      }`}
                                      style={{
                                        backgroundColor: isActive ? b.color : undefined,
                                        borderColor: isActive ? b.color : undefined
                                      }}
                                    >
                                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white/70' : ''}`}
                                        style={{ backgroundColor: isActive ? undefined : b.color }} />
                                      {b.code}
                                    </button>
                                  );
                                })}
                                {!assignments[section.id] && (
                                  <span className="text-[11px] text-gray-300 italic px-1">—</span>
                                )}
                              </div>
                              {assignments[section.id] && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {grades.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <GitBranch className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay grados registrados</p>
        </div>
      )}
    </div>
  );
}
