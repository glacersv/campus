import React, { useState, useMemo, useEffect } from 'react';
import { LMSModule, InstitutionalHeader, GuionDeClase, GuionEvaluacionRow } from '../../../types';
import { generateModuleGuiones, exportGuionesToWord } from '../../../utils/guionDeClaseHelper';
import { getGuiones, saveGuiones } from '../../../lib/firestore';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FileText,
  Download,
  Printer,
  RotateCcw,
  Edit3,
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface GuionDeClaseViewProps {
  modules: LMSModule[];
}

export default function GuionDeClaseView({ modules }: GuionDeClaseViewProps) {
  const { userProfile } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<string>(modules[0]?.id || '');
  const [guionesByModule, setGuionesByModule] = useState<Record<string, GuionDeClase[]>>({});
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentModule = modules.find(m => m.id === selectedModuleId) || modules[0];

  const anoLectivo = new Date().getFullYear().toString();

  const headerData: InstitutionalHeader = {
    institucion: 'Colegio Salesiano San José',
    tituloDocumento: 'Guiones de Clase',
    docente: userProfile?.displayName || 'Docente',
    gradoSeccion: currentModule?.name || '',
    anoLectivo,
    horasSemanalesModulo: currentModule?.hours || 4,
    notaEvaluativa: 'N/A',
    anoNivel: '10',
  };

  useEffect(() => {
    const loadGuiones = async () => {
      if (!currentModule?.id) return;
      setLoading(true);
      const saved = await getGuiones(currentModule.id);
      if (saved.length > 0) {
        setGuionesByModule(prev => ({ ...prev, [currentModule.id]: saved }));
      }
      setLoading(false);
    };
    loadGuiones();
  }, [currentModule?.id]);

  const currentGuiones = useMemo(() => {
    if (guionesByModule[currentModule?.id]) {
      return guionesByModule[currentModule.id];
    }
    if (!currentModule) return [];
    const modDesc = {
      codigo: currentModule.code || currentModule.id,
      nombre: currentModule.name,
      duracionHoras: currentModule.hours || 72,
      semanas: currentModule.weeks || 12,
      horasSemanales: currentModule.hours ? Math.round(currentModule.hours / (currentModule.weeks || 12)) : 4,
      totalHoras: currentModule.hours || 72,
      fechaInicio: '',
      fechaFin: '',
      mesInicio: 'enero',
      diaInicio: 1,
      mesFin: 'diciembre',
      diaFin: 15,
      totalIndicadores: 10,
      unidades: 3,
    };
    const generated = generateModuleGuiones(modDesc, headerData, anoLectivo);
    return generated;
  }, [guionesByModule, currentModule, headerData, anoLectivo]);

  const safeSessionIndex = Math.min(Math.max(0, activeSessionIndex), Math.max(0, currentGuiones.length - 1));
  const activeGuion = currentGuiones[safeSessionIndex];

  const handleUpdateActiveGuion = (updates: Partial<GuionDeClase>) => {
    const updatedList = [...currentGuiones];
    updatedList[safeSessionIndex] = { ...updatedList[safeSessionIndex], ...updates };
    setGuionesByModule(prev => ({ ...prev, [currentModule.id]: updatedList }));
  };

  const handleResetToDefaults = () => {
    if (window.confirm('¿Restablecer todos los guiones a los valores MINED?')) {
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
      const generated = generateModuleGuiones(modDesc, headerData, anoLectivo);
      setGuionesByModule(prev => ({ ...prev, [currentModule.id]: generated }));
      setActiveSessionIndex(0);
      setIsEditing(false);
    }
  };

  const handleSave = async () => {
    if (!currentModule?.id) return;
    await saveGuiones(currentModule.id, currentGuiones);
  };

  const handleAddEvalRow = () => {
    if (!activeGuion) return;
    const currentRows = activeGuion.actividadesEvaluacion || [];
    const newRow: GuionEvaluacionRow = {
      no: currentRows.length + 1,
      actividad: 'Actividad de evaluación',
      ponderacion: '10%',
      fechaRealizacion: activeGuion.fecha,
    };
    handleUpdateActiveGuion({ actividadesEvaluacion: [...currentRows, newRow] });
  };

  const handleRemoveEvalRow = (idx: number) => {
    if (!activeGuion) return;
    const currentRows = activeGuion.actividadesEvaluacion || [];
    if (currentRows.length <= 1) return;
    const updated = currentRows.filter((_, i) => i !== idx).map((r, i) => ({ ...r, no: i + 1 }));
    handleUpdateActiveGuion({ actividadesEvaluacion: updated });
  };

  const handleUpdateEvalRow = (idx: number, field: keyof GuionEvaluacionRow, value: string | number) => {
    if (!activeGuion) return;
    const currentRows = [...(activeGuion.actividadesEvaluacion || [])];
    currentRows[idx] = { ...currentRows[idx], [field]: value };
    handleUpdateActiveGuion({ actividadesEvaluacion: currentRows });
  };

  if (!currentModule || currentGuiones.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="font-semibold">No hay módulos disponibles</p>
        <p className="text-sm">Se requiere al menos un módulo técnico asignado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600/80 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                Formato Oficial {anoLectivo}
              </span>
              <span className="text-blue-300 text-xs font-semibold">Colegio Salesiano San José</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-400" />
              Guión de Clases {anoLectivo}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
              Sesiones de clase alineadas a las <strong>6 Etapas de la Acción Completa</strong>.
            </p>
          </div>
          <div className="bg-white/10 p-1 rounded-xl">
            <label className="text-[10px] uppercase font-bold text-blue-200 block px-2 pt-1">Módulo</label>
            <select
              value={currentModule.id}
              onChange={(e) => { setSelectedModuleId(e.target.value); setActiveSessionIndex(0); }}
              className="bg-transparent text-white font-bold text-sm px-2 py-1 focus:outline-none cursor-pointer"
            >
              {modules.map(m => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name} ({m.hours || 72}h)
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400">Módulo</div>
            <div className="font-bold text-blue-300 truncate">{currentModule.name}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400">Duración</div>
            <div className="font-bold text-emerald-300">{currentModule.hours || 72}h ({currentModule.weeks || 12} sem)</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400">Sesiones</div>
            <div className="font-bold text-purple-300">{currentGuiones.length} Guiones</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] text-slate-400">Docente</div>
            <div className="font-bold text-slate-200 truncate">{headerData.docente}</div>
          </div>
        </div>
      </div>

      {/* Timeline + Actions */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
            Sesiones ({currentGuiones.length} Guiones)
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setIsEditing(!isEditing)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${isEditing ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              <Edit3 className="w-3.5 h-3.5" /> {isEditing ? 'Editando' : 'Editar'}
            </button>
            <button onClick={handleResetToDefaults} className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Restablecer
            </button>
            <button onClick={handleSave} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> Guardar
            </button>
            <button onClick={() => exportGuionesToWord([activeGuion], headerData, currentModule as any, 'single')} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Word (Actual)
            </button>
            <button onClick={() => exportGuionesToWord(currentGuiones, headerData, currentModule as any, 'all')} className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-700 hover:bg-indigo-800 text-white flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Word (Todos)
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Session cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {currentGuiones.map((g, idx) => {
            const isSelected = idx === safeSessionIndex;
            const stageNum = g.etapaNumero || idx + 1;
            let badgeBg = 'bg-blue-100 text-blue-800';
            if (stageNum === 3 || stageNum === 4) badgeBg = 'bg-emerald-100 text-emerald-800';
            else if (stageNum === 5 || stageNum === 6) badgeBg = 'bg-amber-100 text-amber-800';
            return (
              <button key={g.id || idx} onClick={() => setActiveSessionIndex(idx)} className={`p-2.5 rounded-xl text-left border transition-all ${isSelected ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20' : 'bg-white hover:bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Sesión {idx + 1}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeBg}`}>{g.horas}h</span>
                </div>
                <div className="text-xs font-black text-slate-800 line-clamp-1">{g.etapaAccionCompleta || `Etapa ${stageNum}`}</div>
                <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex justify-between">
                  <span className="font-semibold text-blue-700">{g.faseEvaluacion?.split('[')[0]}</span>
                  <span>Ver →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guion Content */}
      {activeGuion && (
        <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setActiveSessionIndex(Math.max(0, safeSessionIndex - 1))} disabled={safeSessionIndex === 0} className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>
            <span className="text-sm font-black text-slate-800">Sesión {safeSessionIndex + 1} de {currentGuiones.length}</span>
            <button onClick={() => setActiveSessionIndex(Math.min(currentGuiones.length - 1, safeSessionIndex + 1))} disabled={safeSessionIndex >= currentGuiones.length - 1} className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30">
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4 mb-4">
            <div>
              <h2 className="text-2xl font-black text-blue-900 uppercase">Guion de Clase {anoLectivo}</h2>
              <div className="text-xs text-slate-500 mt-1">
                <strong>Módulo [{activeGuion.moduloCodigo}]:</strong> {activeGuion.moduloNombre} | <strong>{activeGuion.etapaAccionCompleta}</strong>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-800 uppercase">COLEGIO SALESIANO<br/><span className="text-blue-600 text-lg">SAN JOSÉ</span></div>
              <div className="text-[10px] text-slate-400">Santa Ana, El Salvador</div>
            </div>
          </div>

          {/* Data Table */}
          <table className="w-full border-collapse text-sm mb-4">
            <tbody>
              <tr className="bg-slate-50">
                <td className="font-bold p-2 border border-slate-200 w-[15%]">Docente:</td>
                <td colSpan={5} className="p-2 border border-slate-200 font-semibold">{isEditing ? <input value={activeGuion.docente} onChange={e => handleUpdateActiveGuion({ docente: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /> : activeGuion.docente}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50">Grado:</td>
                <td className="p-2 border border-slate-200 w-[25%]">{isEditing ? <input value={activeGuion.gradoSeccion} onChange={e => handleUpdateActiveGuion({ gradoSeccion: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /> : activeGuion.gradoSeccion}</td>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50 w-[14%]">Semana:</td>
                <td className="p-2 border border-slate-200 w-[20%] font-bold text-blue-700">{activeGuion.semanaModulo}</td>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50 w-[8%]">Fecha:</td>
                <td className="p-2 border border-slate-200 w-[18%]">{activeGuion.fecha}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50">Unidad:</td>
                <td colSpan={5} className="p-2 border border-slate-200 font-semibold">{isEditing ? <input value={activeGuion.unidad} onChange={e => handleUpdateActiveGuion({ unidad: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" /> : activeGuion.unidad}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50">Contenido:</td>
                <td colSpan={3} className="p-2 border border-slate-200">{isEditing ? <textarea value={activeGuion.contenido} onChange={e => handleUpdateActiveGuion({ contenido: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.contenido}</td>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50">Tiempo:</td>
                <td className="p-2 border border-slate-200 font-bold text-blue-700">{activeGuion.tiempo}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50">Objetivo:</td>
                <td colSpan={5} className="p-2 border border-slate-200">{isEditing ? <textarea value={activeGuion.objetivoClase} onChange={e => handleUpdateActiveGuion({ objetivoClase: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.objetivoClase}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50">Indicador:</td>
                <td colSpan={5} className="p-2 border border-slate-200 font-semibold text-sky-700">{isEditing ? <textarea value={activeGuion.indicadorLogro} onChange={e => handleUpdateActiveGuion({ indicadorLogro: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.indicadorLogro}</td>
              </tr>
            </tbody>
          </table>

          {/* Situaciones de Aprendizaje */}
          <h3 className="text-sm font-black text-blue-900 uppercase mb-2">Situaciones de Aprendizaje vs Evaluación</h3>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="w-[55%] p-2 border border-blue-900 text-center uppercase text-xs">Situaciones de Aprendizaje</th>
                <th className="w-[45%] p-2 border border-blue-900 text-center uppercase text-xs">Evaluación</th>
              </tr>
            </thead>
            <tbody>
              {(['inicio', 'desarrollo', 'cierre'] as const).map(fase => (
                <tr key={fase}>
                  <td className="p-2 border border-slate-200 align-top">
                    <div className="font-bold text-blue-700 text-xs mb-1 uppercase">{fase === 'inicio' ? 'Inicio' : fase === 'desarrollo' ? 'Desarrollo' : 'Cierre'}</div>
                    {isEditing ? <textarea value={activeGuion[`${fase}Situacion` as keyof GuionDeClase] as string} onChange={e => handleUpdateActiveGuion({ [`${fase}Situacion`]: e.target.value } as any)} className="w-full border rounded px-2 py-1 text-sm" rows={3} /> : <div className="text-sm">{activeGuion[`${fase}Situacion` as keyof GuionDeClase] as string}</div>}
                  </td>
                  <td className="p-2 border border-slate-200 bg-slate-50 align-top">
                    <div className="font-bold text-xs mb-1 uppercase">{fase === 'inicio' ? 'Diagnóstica' : fase === 'desarrollo' ? 'Formativa' : 'Sumativa'}</div>
                    {isEditing ? <textarea value={activeGuion[`${fase}Evaluacion` as keyof GuionDeClase] as string} onChange={e => handleUpdateActiveGuion({ [`${fase}Evaluacion`]: e.target.value } as any)} className="w-full border rounded px-2 py-1 text-sm" rows={3} /> : <div className="text-sm">{activeGuion[`${fase}Evaluacion` as keyof GuionDeClase] as string}</div>}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="p-2 border border-slate-200 font-bold bg-slate-50 text-xs">Adaptaciones Curriculares</td>
                <td className="p-2 border border-slate-200 text-xs">{isEditing ? <textarea value={activeGuion.adaptacionesCurriculares} onChange={e => handleUpdateActiveGuion({ adaptacionesCurriculares: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.adaptacionesCurriculares}</td>
              </tr>
            </tbody>
          </table>

          {/* Eval Table */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-black text-blue-900 uppercase">Actividades de Evaluación</h3>
            {isEditing && (
              <button onClick={handleAddEvalRow} className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                <Plus className="w-3.5 h-3.5" /> Agregar
              </button>
            )}
          </div>
          <table className="w-full border-collapse text-sm mb-6">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-[8%] p-2 border border-slate-200 text-center text-xs">N°</th>
                <th className="w-[52%] p-2 border border-slate-200 text-left text-xs">Actividad</th>
                <th className="w-[20%] p-2 border border-slate-200 text-center text-xs">Ponderación</th>
                <th className="w-[20%] p-2 border border-slate-200 text-center text-xs">Fecha</th>
                {isEditing && <th className="w-[5%] p-2 border border-slate-200"></th>}
              </tr>
            </thead>
            <tbody>
              {(activeGuion.actividadesEvaluacion || []).map((act, idx) => (
                <tr key={idx}>
                  <td className="p-2 border border-slate-200 text-center font-bold">{act.no}</td>
                  <td className="p-2 border border-slate-200">{isEditing ? <input value={act.actividad} onChange={e => handleUpdateEvalRow(idx, 'actividad', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /> : act.actividad}</td>
                  <td className="p-2 border border-slate-200 text-center font-bold text-blue-700">{isEditing ? <input value={act.ponderacion} onChange={e => handleUpdateEvalRow(idx, 'ponderacion', e.target.value)} className="w-full border rounded px-2 py-1 text-sm text-center" /> : act.ponderacion}</td>
                  <td className="p-2 border border-slate-200 text-center">{isEditing ? <input value={act.fechaRealizacion} onChange={e => handleUpdateEvalRow(idx, 'fechaRealizacion', e.target.value)} className="w-full border rounded px-2 py-1 text-sm text-center" /> : act.fechaRealizacion}</td>
                  {isEditing && (
                    <td className="p-2 border border-slate-200 text-center">
                      <button onClick={() => handleRemoveEvalRow(idx)} className="text-red-500 hover:text-red-700"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer Info */}
          <table className="w-full border-collapse text-xs mb-4">
            <tbody>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50 w-[18%] align-top">Tarea:</td>
                <td className="p-2 border border-slate-200">{isEditing ? <textarea value={activeGuion.tarea} onChange={e => handleUpdateActiveGuion({ tarea: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.tarea}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50 align-top">Recursos:</td>
                <td className="p-2 border border-slate-200">{isEditing ? <textarea value={activeGuion.recursosClase} onChange={e => handleUpdateActiveGuion({ recursosClase: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.recursosClase}</td>
              </tr>
              <tr>
                <td className="font-bold p-2 border border-slate-200 bg-slate-50 align-top">TICs:</td>
                <td className="p-2 border border-slate-200 font-semibold text-blue-700">{isEditing ? <textarea value={activeGuion.tics} onChange={e => handleUpdateActiveGuion({ tics: e.target.value })} className="w-full border rounded px-2 py-1 text-sm" rows={2} /> : activeGuion.tics}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
