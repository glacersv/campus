import { useState, useEffect, useMemo } from 'react';
import { ModuloCronograma, StageJornalizacionItem } from '../../types';
import { X, Calendar, Clock, ChevronDown, ChevronUp, ArrowRight, AlertTriangle, Check, RotateCcw } from 'lucide-react';

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface AdjustmentPanelProps {
  cronograma: ModuloCronograma[];
  selectedModule: ModuloCronograma | null;
  onUpdateModule: (moduleId: string, updates: Partial<ModuloCronograma>) => void;
  onReorderModules: (reordered: ModuloCronograma[]) => void;
  onClose: () => void;
  schoolYearEnd: string;
}

interface ModuleChange {
  moduleId: string;
  field: string;
  oldValue: string;
  newValue: string;
}

export default function AdjustmentPanel({
  cronograma,
  selectedModule,
  onUpdateModule,
  onReorderModules,
  onClose,
  schoolYearEnd,
}: AdjustmentPanelProps) {
  const [editingModule, setEditingModule] = useState<ModuloCronograma | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hours, setHours] = useState(0);
  const [changes, setChanges] = useState<ModuleChange[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (selectedModule) {
      setEditingModule(selectedModule);
      setStartDate(selectedModule.fechaInicio);
      setEndDate(selectedModule.fechaFin);
      setHours(selectedModule.horasTotales);
      setChanges([]);
      setShowPreview(true);
    }
  }, [selectedModule]);

  const yearModules = useMemo(() => {
    if (!editingModule) return [];
    return cronograma
      .filter(m => m.year === editingModule.year)
      .sort((a, b) => {
        const dateA = new Date(a.fechaInicio);
        const dateB = new Date(b.fechaInicio);
        return dateA.getTime() - dateB.getTime();
      });
  }, [cronograma, editingModule]);

  const moduleIndex = useMemo(() => {
    if (!editingModule) return -1;
    return yearModules.findIndex(m => m.moduleId === editingModule.moduleId);
  }, [yearModules, editingModule]);

  const calculateNewEndDate = (start: string, totalHours: number, hPerWeek: number): string => {
    const startDate = new Date(start);
    const weeksNeeded = Math.ceil(totalHours / hPerWeek);
    const daysNeeded = weeksNeeded * 5;
    const endDate = new Date(startDate);
    let businessDays = 0;
    while (businessDays < daysNeeded) {
      endDate.setDate(endDate.getDate() + 1);
      if (endDate.getDay() !== 0 && endDate.getDay() !== 6) {
        businessDays++;
      }
    }
    return formatDate(endDate);
  };

  const recalculateStages = (mod: ModuloCronograma, newStartDate: string, newEndDate: string, newHours: number): StageJornalizacionItem[] => {
    const start = new Date(newStartDate);
    const end = new Date(newEndDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const stagePercentages: Record<string, number> = {
      'Informarse': 0.10,
      'Planificar': 0.10,
      'Decidir': 0.10,
      'Ejecutar': 0.25,
      'Controlar': 0.25,
      'Valorar': 0.20,
    };

    let currentDate = new Date(start);
    const stages: StageJornalizacionItem[] = [];
    
    for (const stage of mod.jornalizacion) {
      const percentage = stagePercentages[stage.name] || (1 / 6);
      const stageDays = Math.max(1, Math.round(totalDays * percentage));
      const stageEnd = new Date(currentDate);
      
      let days = 0;
      while (days < stageDays - 1) {
        stageEnd.setDate(stageEnd.getDate() + 1);
        if (stageEnd.getDay() !== 0 && stageEnd.getDay() !== 6) {
          days++;
        }
      }
      
      stages.push({
        stage: stage.stage,
        name: stage.name,
        startDate: formatDate(currentDate),
        endDate: formatDate(stageEnd),
        hours: Math.round(newHours * percentage * 10) / 10,
        description: stage.description,
      });
      
      currentDate = new Date(stageEnd);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return stages;
  };

  const previewChanges = useMemo((): ModuloCronograma[] => {
    if (!editingModule || !startDate || !endDate) return [];
    
    const hPerWeek = editingModule.year === '3' ? 30 : 18;
    const newEndDate = calculateNewEndDate(startDate, hours, hPerWeek);
    const newJornalizacion = recalculateStages(editingModule, startDate, newEndDate, hours);
    
    const updatedModule: ModuloCronograma = {
      ...editingModule,
      fechaInicio: startDate,
      fechaFin: newEndDate,
      horasTotales: hours,
      semanasTotales: Math.ceil(hours / hPerWeek),
      diasHabilesNecesarios: Math.ceil(hours / hPerWeek) * 5,
      jornalizacion: newJornalizacion,
    };
    
    // Push subsequent modules forward
    const result: ModuloCronograma[] = [];
    let lastEnd = new Date(newEndDate);
    lastEnd.setDate(lastEnd.getDate() + 1);
    
    for (let i = 0; i < yearModules.length; i++) {
      const mod = yearModules[i];
      if (mod.moduleId === editingModule.moduleId) {
        result.push(updatedModule);
        continue;
      }
      
      if (i > moduleIndex) {
        // Move forward
        const modHours = mod.horasTotales;
        const modWeeks = Math.ceil(modHours / hPerWeek);
        const modDays = modWeeks * 5;
        
        // Find next business day after lastEnd
        while (lastEnd.getDay() === 0 || lastEnd.getDay() === 6) {
          lastEnd.setDate(lastEnd.getDate() + 1);
        }
        
        const modEnd = new Date(lastEnd);
        let businessDays = 0;
        while (businessDays < modDays - 1) {
          modEnd.setDate(modEnd.getDate() + 1);
          if (modEnd.getDay() !== 0 && modEnd.getDay() !== 6) {
            businessDays++;
          }
        }
        
        result.push({
          ...mod,
          fechaInicio: formatDate(lastEnd),
          fechaFin: formatDate(modEnd),
          jornalizacion: recalculateStages(mod, formatDate(lastEnd), formatDate(modEnd), modHours),
        });
        
        lastEnd = new Date(modEnd);
        lastEnd.setDate(lastEnd.getDate() + 1);
      } else if (i < moduleIndex) {
        result.push(mod);
      }
    }
    
    return result;
  }, [editingModule, startDate, endDate, hours, yearModules, moduleIndex]);

  const hasConflicts = useMemo(() => {
    if (previewChanges.length === 0) return false;
    const schoolEnd = new Date(schoolYearEnd);
    return previewChanges.some(m => new Date(m.fechaFin) > schoolEnd);
  }, [previewChanges, schoolYearEnd]);

  const handleSave = () => {
    if (!editingModule) return;
    
    // Save all changes
    for (const mod of previewChanges) {
      onUpdateModule(mod.moduleId, {
        fechaInicio: mod.fechaInicio,
        fechaFin: mod.fechaFin,
        horasTotales: mod.horasTotales,
        semanasTotales: mod.semanasTotales,
        diasHabilesNecesarios: mod.diasHabilesNecesarios,
        jornalizacion: mod.jornalizacion,
      });
    }
    
    onClose();
  };

  const handleReset = () => {
    if (!selectedModule) return;
    setStartDate(selectedModule.fechaInicio);
    setEndDate(selectedModule.fechaFin);
    setHours(selectedModule.horasTotales);
    setChanges([]);
  };

  if (!editingModule) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-800">Ajustar Cronograma</h3>
              <p className="text-xs text-slate-500">{editingModule.codigo} — {editingModule.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              Revertir
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Editing controls */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm">Editar Fechas y Horas</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Horas Totales</label>
                  <input
                    type="number"
                    value={hours}
                    onChange={e => setHours(Number(e.target.value))}
                    min={1}
                    max={500}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={14} />
                  <span>
                    {editingModule.year === '3' ? '30' : '18'}h/sem • {Math.ceil(hours / (editingModule.year === '3' ? 30 : 18))} semanas • {Math.ceil(hours / (editingModule.year === '3' ? 30 : 18)) * 5} días
                  </span>
                </div>
              </div>

              {hasConflicts && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700">
                    El cronograma excede la fecha de fin del año escolar ({schoolYearEnd}). 
                    Reduce las horas o ajusta la fecha de inicio.
                  </p>
                </div>
              )}
            </div>

            {/* Right: Preview of changes */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-700 text-sm">Vista Previa de Cambios</h4>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {previewChanges.map((mod, i) => {
                  const isModified = mod.fechaInicio !== yearModules.find(m => m.moduleId === mod.moduleId)?.fechaInicio;
                  const isCurrentModule = mod.moduleId === editingModule.moduleId;
                  
                  return (
                    <div
                      key={mod.moduleId}
                      className={`p-3 rounded-lg border transition-colors ${
                        isCurrentModule
                          ? 'bg-blue-50 border-blue-300'
                          : isModified
                          ? 'bg-amber-50 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">{mod.codigo}</span>
                          {isModified && !isCurrentModule && (
                            <span className="text-[10px] font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                              Movido
                            </span>
                          )}
                          {isCurrentModule && (
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                              Editado
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">
                          {Math.round((mod.fechaFin ? (new Date(mod.fechaFin).getTime() - new Date(mod.fechaInicio).getTime()) / (1000 * 60 * 60 * 24) : 0))} días
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-600">
                        <span>{mod.fechaInicio}</span>
                        <ArrowRight size={12} />
                        <span>{mod.fechaFin}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={hasConflicts}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              hasConflicts
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Check size={16} />
            Aplicar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
