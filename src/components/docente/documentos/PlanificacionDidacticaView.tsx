import React, { useState, useMemo, useEffect } from 'react';
import { LMSModule, InstitutionalHeader, DidacticPlan, DidacticEvaluationActivity } from '../../../types';
import { getDefaultDidacticPlan, formatModuleDateRange, exportDidacticPlanToWord, getModuleStagesAccionCompleta } from '../../../utils/didacticPlanHelper';
import { getPlanDidactico, savePlanDidactico } from '../../../lib/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import {
  ClipboardList,
  Download,
  Printer,
  Edit3,
  Save,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';

interface PlanificacionDidacticaViewProps {
  modules: LMSModule[];
}

export default function PlanificacionDidacticaView({ modules }: PlanificacionDidacticaViewProps) {
  const { userProfile } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [plans, setPlans] = useState<Record<string, DidacticPlan>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentModule = modules.find(m => m.id === selectedModuleId) || modules[0];
  const anoLectivo = new Date().getFullYear().toString();

  const headerData: InstitutionalHeader = {
    institucion: 'Colegio Salesiano San José',
    tituloDocumento: 'Planificación Didáctica',
    docente: userProfile?.displayName || 'Docente',
    gradoSeccion: currentModule?.name || '',
    anoLectivo,
    horasSemanalesModulo: currentModule?.hours || 4,
    notaEvaluativa: 'N/A',
    anoNivel: '10',
  };

  useEffect(() => {
    const loadPlan = async () => {
      if (!currentModule?.id) return;
      setLoading(true);
      const saved = await getPlanDidactico(currentModule.id);
      if (saved) {
        setPlans(prev => ({ ...prev, [currentModule.id]: saved }));
      }
      setLoading(false);
    };
    loadPlan();
  }, [currentModule?.id]);

  const currentPlan = useMemo(() => {
    if (plans[currentModule?.id]) return plans[currentModule.id];
    if (!currentModule) return null;
    const modDesc = {
      codigo: currentModule.code || currentModule.id,
      nombre: currentModule.name,
      duracionHoras: currentModule.hours || 72,
      semanas: currentModule.weeks || 12,
      horasSemanales: 4,
      totalHoras: currentModule.hours || 72,
      fechaInicio: '', fechaFin: '',
      mesInicio: 'enero', diaInicio: 1, mesFin: 'diciembre', diaFin: 15,
      totalIndicadores: 10, unidades: 3,
    };
    return getDefaultDidacticPlan(modDesc, anoLectivo);
  }, [plans, currentModule, anoLectivo]);

  const stages = useMemo(() => {
    if (!currentModule) return [];
    const modDesc = {
      codigo: currentModule.code || currentModule.id,
      nombre: currentModule.name,
      duracionHoras: currentModule.hours || 72,
      semanas: currentModule.weeks || 12,
      horasSemanales: 4,
      totalHoras: currentModule.hours || 72,
      fechaInicio: '', fechaFin: '',
      mesInicio: 'enero', diaInicio: 1, mesFin: 'diciembre', diaFin: 15,
      totalIndicadores: 10, unidades: 3,
    };
    return getModuleStagesAccionCompleta(modDesc);
  }, [currentModule]);

  const handleUpdatePlan = (updates: Partial<DidacticPlan>) => {
    if (!currentModule?.id || !currentPlan) return;
    setPlans(prev => ({ ...prev, [currentModule.id]: { ...currentPlan, ...updates } }));
  };

  const handleUpdateActivity = (idx: number, field: keyof DidacticEvaluationActivity, value: string | number) => {
    if (!currentPlan) return;
    const activities = [...currentPlan.actividades];
    activities[idx] = { ...activities[idx], [field]: value };
    handleUpdatePlan({ actividades: activities });
  };

  const handleAddActivity = () => {
    if (!currentPlan) return;
    const newAct: DidacticEvaluationActivity = {
      no: currentPlan.actividades.length + 1,
      etapa: '',
      tiempo: '',
      fase: '',
      actividad: 'Nueva actividad de evaluación',
      evidencia: '',
      ponderacion: '10%',
      fecha: formatModuleDateRange({ diaInicio: 1, mesInicio: 'enero', diaFin: 15, mesFin: 'diciembre' } as any, anoLectivo),
    };
    handleUpdatePlan({ actividades: [...currentPlan.actividades, newAct] });
  };

  const handleRemoveActivity = (idx: number) => {
    if (!currentPlan) return;
    const activities = currentPlan.actividades.filter((_, i) => i !== idx).map((a, i) => ({ ...a, no: i + 1 }));
    handleUpdatePlan({ actividades: activities });
  };

  const handleSave = async () => {
    if (!currentModule?.id || !currentPlan) return;
    await savePlanDidactico(currentModule.id, currentPlan);
  };

  const handleReset = () => {
    if (!currentModule?.id) return;
    setPlans(prev => {
      const next = { ...prev };
      delete next[currentModule.id];
      return next;
    });
  };

  if (!currentModule || !currentPlan) {
    return (
      <div className="text-center py-16 text-slate-500">
        <ClipboardList className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold">No hay módulos disponibles</p>
      </div>
    );
  }

  const dateRange = formatModuleDateRange({
    diaInicio: 1, mesInicio: 'enero', diaFin: 15, mesFin: 'diciembre',
  } as any, anoLectivo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-teal-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-600/80 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">Formato MINED</span>
              <span className="text-emerald-300 text-xs font-semibold">Colegio Salesiano San José</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              Planificación Didáctica {anoLectivo}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">Matriz de planificación por módulo con 6 Etapas de la Acción Completa.</p>
          </div>
          <div className="bg-white/10 p-1 rounded-xl">
            <label className="text-[10px] uppercase font-bold text-emerald-200 block px-2 pt-1">Módulo</label>
            <select
              value={currentModule.id}
              onChange={e => { setSelectedModuleId(e.target.value); setIsEditing(false); }}
              className="bg-transparent text-white font-bold text-sm px-2 py-1 focus:outline-none cursor-pointer"
            >
              {modules.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.name} ({m.hours || 72}h)</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center gap-2">
        <button onClick={() => setIsEditing(!isEditing)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${isEditing ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
          <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Editando' : 'Editar'}
        </button>
        <button onClick={handleReset} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Restablecer
        </button>
        <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5">
          <Save className="w-3.5 h-3.5" /> Guardar
        </button>
        <button onClick={() => exportDidacticPlanToWord(headerData, { ...currentModule, codigo: currentModule.code || currentModule.id, nombre: currentModule.name, duracionHoras: currentModule.hours || 72, semanas: currentModule.weeks || 12, horasSemanales: 4, totalHoras: currentModule.hours || 72, fechaInicio: '', fechaFin: '', mesInicio: 'enero', diaInicio: 1, mesFin: 'diciembre', diaFin: 15, totalIndicadores: 10, unidades: 3 } as any)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5" /> Word
        </button>
        <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5">
          <Printer className="w-3.5 h-3.5" /> PDF
        </button>
      </div>

      {/* Stages Guide */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200">
        <h3 className="text-sm font-black text-slate-800 uppercase mb-3">6 Etapas de la Acción Completa</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {stages.map(st => (
            <div key={st.id} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border border-slate-200">
              <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{st.faseNombre.split(':')[0]}</div>
              <div className="text-xs font-black text-slate-800">{st.nombreCorto}</div>
              <div className="text-[10px] text-slate-500 mt-1">{st.tiempo} · {st.horasEstimadas}h</div>
              <div className="text-[10px] font-bold text-emerald-700 mt-1">{st.ponderacionSugerida}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Document */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10">
        {/* Datos Generales */}
        <h3 className="text-sm font-black text-blue-900 uppercase mb-2">Datos Generales</h3>
        <table className="w-full border-collapse text-sm mb-6">
          <tbody>
            <tr>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50 w-[25%]">Centro Educativo:</td>
              <td className="p-2 border border-slate-200">{headerData.institucion}</td>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50 w-[25%]">Módulo:</td>
              <td className="p-2 border border-slate-200 font-semibold">{currentModule.code || currentModule.id} - {currentModule.name}</td>
            </tr>
            <tr>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50">Docente:</td>
              <td className="p-2 border border-slate-200">{headerData.docente}</td>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50">Grado:</td>
              <td className="p-2 border border-slate-200">{headerData.gradoSeccion}</td>
            </tr>
            <tr>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50">Tiempo:</td>
              <td className="p-2 border border-slate-200">{currentModule.hours || 72} horas</td>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50">Período:</td>
              <td className="p-2 border border-slate-200">{currentPlan.trimestrePeriodo || `${currentModule.weeks || 12} Semanas`}</td>
            </tr>
            <tr>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50">Fechas:</td>
              <td colSpan={3} className="p-2 border border-slate-200 font-semibold">{dateRange}</td>
            </tr>
            <tr>
              <td className="font-bold p-2 border border-slate-200 bg-slate-50">Competencias:</td>
              <td colSpan={3} className="p-2 border border-slate-200">{isEditing ? <textarea value={currentPlan.competenciasUnidad || ''} onChange={e => handleUpdatePlan({ competenciasUnidad: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : currentPlan.competenciasUnidad}</td>
            </tr>
          </tbody>
        </table>

        {/* Saberes */}
        <h3 className="text-sm font-black text-slate-800 uppercase mb-2">Saberes (Conceptuales / Procedimentales / Actitudinales)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {(['conceptuales', 'procedimentales', 'actitudinales'] as const).map(key => (
            <div key={key} className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
              <h4 className="text-xs font-black text-emerald-800 uppercase mb-2">{key === 'conceptuales' ? 'Conceptuales (Saber Conocer)' : key === 'procedimentales' ? 'Procedimentales (Saber Hacer)' : 'Actitudinales (Saber Ser)'}</h4>
              {isEditing ? (
                <textarea
                  value={currentPlan[key].join('\n')}
                  onChange={e => handleUpdatePlan({ [key]: e.target.value.split('\n').filter(Boolean) })}
                  className="w-full border rounded px-2 py-1 text-sm" rows={4}
                />
              ) : (
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-700">
                  {currentPlan[key].map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Actividades */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-blue-900 uppercase">Actividades de Evaluación</h3>
          {isEditing && (
            <button onClick={handleAddActivity} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
              <Plus className="w-3.5 h-3.5" /> Agregar
            </button>
          )}
        </div>
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr className="bg-slate-100">
              <th className="w-[5%] p-2 border border-slate-200 text-center text-xs">N°</th>
              <th className="w-[45%] p-2 border border-slate-200 text-left text-xs">Actividad</th>
              <th className="w-[15%] p-2 border border-slate-200 text-center text-xs">Ponderación</th>
              <th className="w-[20%] p-2 border border-slate-200 text-center text-xs">Fecha</th>
              {isEditing && <th className="w-[5%] p-2 border border-slate-200"></th>}
            </tr>
          </thead>
          <tbody>
            {currentPlan.actividades.map((act, idx) => (
              <tr key={idx}>
                <td className="p-2 border border-slate-200 text-center font-bold">{act.no}</td>
                <td className="p-2 border border-slate-200">
                  {isEditing ? <textarea value={act.actividad} onChange={e => handleUpdateActivity(idx, 'actividad', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : act.actividad}
                  {act.evidencia && <div className="text-[10px] text-slate-500 italic mt-1">Evidencia: {act.evidencia}</div>}
                </td>
                <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700">{isEditing ? <input value={act.ponderacion} onChange={e => handleUpdateActivity(idx, 'ponderacion', e.target.value)} className="w-full border rounded px-2 py-1 text-sm text-center" /> : act.ponderacion}</td>
                <td className="p-2 border border-slate-200 text-center text-xs">{isEditing ? <input value={act.fecha} onChange={e => handleUpdateActivity(idx, 'fecha', e.target.value)} className="w-full border rounded px-2 py-1 text-sm text-center" /> : act.fecha}</td>
                {isEditing && (
                  <td className="p-2 border border-slate-200 text-center">
                    <button onClick={() => handleRemoveActivity(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                )}
              </tr>
            ))}
            <tr className="bg-emerald-50">
              <td colSpan={2} className="p-2 border border-slate-200 font-bold text-xs">TOTAL: 6 ETAPAS DE ACCIÓN COMPLETA</td>
              <td className="p-2 border border-slate-200 text-center font-bold text-emerald-700">100%</td>
              <td className="p-2 border border-slate-200 text-center text-[10px] text-slate-500">FPP 25% + FEP 50% + FVP 25%</td>
              {isEditing && <td className="p-2 border border-slate-200"></td>}
            </tr>
          </tbody>
        </table>

        {/* Recursos & Bibliografía */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase mb-2">Recursos y TIC</h3>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
              <div><strong>Recursos:</strong> {isEditing ? <textarea value={currentPlan.recursos} onChange={e => handleUpdatePlan({ recursos: e.target.value })} className="w-full border rounded px-2 py-1 text-sm mt-1" rows={2} /> : currentPlan.recursos}</div>
              <div><strong>TIC:</strong> {isEditing ? <textarea value={currentPlan.tic} onChange={e => handleUpdatePlan({ tic: e.target.value })} className="w-full border rounded px-2 py-1 text-sm mt-1" rows={2} /> : currentPlan.tic}</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase mb-2">Bibliografía</h3>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs">
              {isEditing ? (
                <textarea value={currentPlan.bibliografia.join('\n')} onChange={e => handleUpdatePlan({ bibliografia: e.target.value.split('\n').filter(Boolean) })} className="w-full border rounded px-2 py-1 text-sm" rows={4} />
              ) : (
                <ul className="list-disc list-inside space-y-1 text-slate-700">
                  {currentPlan.bibliografia.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
