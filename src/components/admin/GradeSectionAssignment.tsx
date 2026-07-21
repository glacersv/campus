import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  GitBranch,
  Save,
  Check,
  Monitor,
  Building2
} from 'lucide-react';
import {
  getAllGrades,
  getAllSections,
  getAllComputerLabs,
  getAllBuildings,
  updateSection
} from '../../lib/firestore';
import { Grade, Section, ComputerLab, Building, Cycle, CYCLE_NAMES } from '../../types';

const CYCLE_COLORS: Record<Cycle, string> = {
  '1': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '2': 'bg-blue-100 text-blue-700 border-blue-200',
  '3': 'bg-purple-100 text-purple-700 border-purple-200',
  '4': 'bg-amber-100 text-amber-700 border-amber-200'
};

export default function GradeSectionAssignment() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [labs, setLabs] = useState<ComputerLab[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [g, s, l, b] = await Promise.all([
        getAllGrades(),
        getAllSections(),
        getAllComputerLabs(),
        getAllBuildings()
      ]);
      setGrades(g); setSections(s); setLabs(l); setBuildings(b);
      
      // Initialize assignments from existing data
      const init: Record<string, string> = {};
      s.forEach(sec => { if (sec.buildingId) init[sec.id] = sec.buildingId; });
      setAssignments(init);
    } finally { setLoading(false); }
  };

  const getSectionsByGrade = (gradeId: string) => sections.filter(s => s.gradeId === gradeId);
  const getBuildingName = (id: string) => buildings.find(b => b.id === id)?.name || '—';
  const getBuildingColor = (id: string) => buildings.find(b => b.id === id)?.color || '#6B7280';

  const handleAssignmentChange = (sectionId: string, buildingId: string) => {
    setAssignments(prev => ({ ...prev, [sectionId]: buildingId }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [sectionId, buildingId] of Object.entries(assignments)) {
        await updateSection(sectionId, { buildingId: buildingId || undefined });
      }
      loadData();
    } finally { setSaving(false); }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-secondary/10 p-2 rounded-lg">
              <GitBranch className="w-5 h-5 text-secondary-dark" />
            </div>
            Asignación Grado-Sección-Edificio
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Asigna edificios y laboratorios a cada sección
          </p>
        </div>
        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Legend */}
      <div className="bg-primary-light/50 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-6 flex-wrap">
          <span className="text-xs font-semibold text-gray-600">Ciclos:</span>
          {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => (
            <span key={c} className={`px-2.5 py-1 rounded-md text-xs font-bold ${CYCLE_COLORS[c]}`}>
              {CYCLE_NAMES[c]}
            </span>
          ))}
        </div>
      </div>

      {/* Assignment Grid */}
      <div className="space-y-6">
        {(Object.keys(groupedGrades) as Cycle[]).map(cycle => {
          const gradesInCycle = groupedGrades[cycle];
          if (gradesInCycle.length === 0) return null;
          
          return (
            <div key={cycle}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${CYCLE_COLORS[cycle]}`}>
                  {CYCLE_NAMES[cycle]}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradesInCycle.map(grade => {
                  const gradeSections = getSectionsByGrade(grade.id);
                  return (
                    <motion.div
                      key={grade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card overflow-hidden"
                    >
                      {/* Grade Header */}
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 border-b">
                        <h3 className="font-bold text-gray-900">{grade.name}</h3>
                        <p className="text-xs text-gray-500">{gradeSections.length} sección(es)</p>
                      </div>
                      
                      {/* Sections */}
                      <div className="p-4 space-y-3">
                        {gradeSections.map(section => (
                          <div key={section.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-accent">{section.name}</span>
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] text-gray-400 mb-0.5">Edificio</label>
                              <select
                                value={assignments[section.id] || ''}
                                onChange={e => handleAssignmentChange(section.id, e.target.value)}
                                className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
                              >
                                <option value="">Sin asignar</option>
                                {buildings.map(b => (
                                  <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                              </select>
                            </div>
                            {assignments[section.id] && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        ))}
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
