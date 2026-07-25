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

const CYCLE_HEX: Record<string, string> = {
  '1': '#10B981',
  '2': '#3B82F6',
  '3': '#8B5CF6',
  '4': '#F59E0B'
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
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0 border border-secondary/20">
            <GitBranch className="w-6 h-6 text-secondary-dark" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Edificios por Sección</h1>
            <p className="text-sm text-slate-500 mt-0.5">
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
        <Filter className="w-3.5 h-3.5 text-slate-400" />
        {buildings.map(b => {
          const count = Object.values(assignments).filter(v => v === b.id).length;
          const isActive = filterBuilding === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setFilterBuilding(isActive ? null : b.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
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
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all">
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
          const cycleHex = CYCLE_HEX[cycle];

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

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
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
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 transition-all hover:shadow-md"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                            style={{ backgroundColor: cycleHex }}>
                            {grade.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900 leading-tight">{grade.name}</h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">{gradeSections.length} secciones</p>
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

                      {/* Mini Bar Chart */}
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[11px] font-semibold text-slate-500 w-12">Asignadas</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${gradeSections.length > 0 ? (assignedCount / gradeSections.length) * 100 : 0}%`,
                                backgroundColor: cycleHex
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-semibold text-slate-500 w-12">Pendientes</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${gradeSections.length > 0 ? ((gradeSections.length - assignedCount) / gradeSections.length) * 100 : 0}%`,
                                backgroundColor: '#CBD5E0'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-300 font-mono mb-4">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>

                      {/* Legend / Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: cycleHex }} />
                          <span className="text-[11px] font-semibold text-slate-600"> Ciclo {cycle}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm bg-slate-300" />
                          <span className="text-[10px] text-slate-400">Sin asignar</span>
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
