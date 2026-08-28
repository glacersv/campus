import React, { useState } from 'react';
import { ModuleDescriptor } from '../../types';
import { Calendar, Edit3, Trash2, Sparkles, Check, HelpCircle } from 'lucide-react';

interface Table3Props {
  modules: ModuleDescriptor[];
  isEditMode?: boolean;
  onUpdateModules?: (newModules: ModuleDescriptor[]) => void;
  onSelectModule?: (mod: ModuleDescriptor) => void;
  onClearDates?: () => void;
  onRecalculateDates?: () => void;
}

const MONTH_KEYS = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
];

export const Table3MatrizFechas: React.FC<Table3Props> = ({
  modules,
  isEditMode = false,
  onUpdateModules,
  onSelectModule,
  onClearDates,
  onRecalculateDates,
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const handleDateChange = (
    index: number,
    field: 'diaInicio' | 'mesInicio' | 'diaFin' | 'mesFin' | 'fechaInicio' | 'fechaFin',
    val: any
  ) => {
    if (!onUpdateModules) return;
    const updated = [...modules];
    const item = { ...updated[index], [field]: val };

    if (field === 'diaInicio' || field === 'mesInicio') {
      item.fechaInicio = item.diaInicio && item.mesInicio ? `${item.diaInicio} de ${item.mesInicio}` : '';
    }
    if (field === 'diaFin' || field === 'mesFin') {
      item.fechaFin = item.diaFin && item.mesFin ? `${item.diaFin} de ${item.mesFin}` : '';
    }

    updated[index] = item;
    onUpdateModules(updated);
  };

  const handleExecuteClearDates = () => {
    if (onClearDates) {
      onClearDates();
      setActionNotice('Fechas limpiadas correctamente.');
      setTimeout(() => setActionNotice(null), 3000);
    }
    setShowConfirmClear(false);
  };

  const handleExecuteRecalculate = () => {
    if (onRecalculateDates) {
      onRecalculateDates();
      setActionNotice('Fechas recalculadas y sincronizadas con el calendario.');
      setTimeout(() => setActionNotice(null), 3000);
    }
  };

  const hasAnyDates = modules.some(
    (m) => (m.diaInicio && m.diaInicio > 0) || (m.fechaInicio && m.fechaInicio.trim().length > 0)
  );

  return (
    <div id="section-tabla-3" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
            3
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>DESARROLLO MÓDULOS · MATRIZ DE FECHAS (INICIO / FIN)</span>
              {isEditMode && (
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                  Edición de Fechas y Cronograma
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Secuenciación correlativa de módulos técnicos en semanas lectivas efectivas
            </p>
          </div>
        </div>

        {/* Toolbar with Clear Dates and Recalculate Dates */}
        <div className="flex items-center gap-2">
          {actionNotice && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{actionNotice}</span>
            </span>
          )}

          {onClearDates && (
            <button
              id="btn-limpiar-fechas-tabla3"
              onClick={() => setShowConfirmClear(true)}
              className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Borrar fechas probables de inicio y fin de la calendarización para iniciar el año escolar (los módulos y horas se mantienen intactos)"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Borrar Fechas Probables (Inicio de Año)</span>
            </button>
          )}

          {onRecalculateDates && (
            <button
              id="btn-recalcular-fechas-tabla3"
              onClick={handleExecuteRecalculate}
              className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Sincronizar y secuenciar fechas automáticamente con el Calendario Escolar 2026"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-200" />
              <span>Recalcular Fechas</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Prompt for Clear Dates */}
      {showConfirmClear && (
        <div className="bg-red-50/80 border-b border-red-200 px-5 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-red-900 font-medium">
            <HelpCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              ¿Desea limpiar y vaciar las fechas de todos los módulos de este grado? Los nombres y horas se conservarán.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-vaciar-fechas-t3"
              onClick={handleExecuteClearDates}
              className="px-3 py-1 bg-red-600 text-white rounded-lg font-bold hover:bg-red-500 shadow-xs"
            >
              Sí, Limpiar Fechas
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            {/* Super header with Month names */}
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
              <th rowSpan={2} className="py-2.5 px-3 text-left font-bold text-slate-900 border-r border-slate-200 bg-slate-200/60 min-w-[95px]">
                MÓDULOS
              </th>
              {MONTH_KEYS.map((m) => (
                <th key={m} colSpan={2} className="py-2 px-1 border-r border-slate-200 uppercase tracking-wide text-[11px]">
                  {m}
                </th>
              ))}
            </tr>
            {/* Sub header INI / FIN */}
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-semibold">
              {MONTH_KEYS.map((m) => (
                <React.Fragment key={m}>
                  <th className="py-1 px-1 border-r border-slate-200 w-8 bg-slate-100/50">INI</th>
                  <th className="py-1 px-1 border-r border-slate-200 w-8 bg-slate-100/50">FIN</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={21} className="py-8 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">No hay módulos cargados para este grado</p>
                  <p className="text-[11px] text-slate-400 mt-1">Suba su archivo en "Subir / Cargar Doc." o haga clic en "Restablecer a Valores Oficiales".</p>
                </td>
              </tr>
            ) : (
              modules.map((m, idx) => {
                const startIdx = m.mesInicio ? MONTH_KEYS.indexOf(m.mesInicio.toLowerCase()) : -1;
                const endIdx = m.mesFin ? MONTH_KEYS.indexOf(m.mesFin.toLowerCase()) : -1;
                const hasValidStart = Boolean(m.mesInicio && m.diaInicio && m.diaInicio > 0);
                const hasValidEnd = Boolean(m.mesFin && m.diaFin && m.diaFin > 0);

                return (
                  <tr
                    key={m.codigo + idx}
                    onClick={() => onSelectModule && onSelectModule(m)}
                    className={`border-b border-slate-200 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/30 hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-3 text-left font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap flex items-center justify-between">
                      <span>{m.codigo}</span>
                      {isEditMode && <Edit3 className="w-3 h-3 text-slate-400" />}
                    </td>

                    {MONTH_KEYS.map((mes, mesIdx) => {
                      const isStartMonth = hasValidStart && m.mesInicio?.toLowerCase() === mes;
                      const isEndMonth = hasValidEnd && m.mesFin?.toLowerCase() === mes;
                      const isBetween = hasValidStart && hasValidEnd && startIdx !== -1 && endIdx !== -1 && mesIdx >= startIdx && mesIdx <= endIdx;

                      return (
                        <React.Fragment key={mes}>
                          {/* INI cell */}
                          <td
                            className={`py-2 px-1 border-r border-slate-200 font-bold transition-all ${
                              isStartMonth
                                ? 'bg-blue-600 text-white shadow-inner'
                                : isBetween && !isStartMonth
                                ? 'bg-sky-50 text-slate-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {isStartMonth ? (
                              isEditMode ? (
                                <input
                                  type="number"
                                  value={m.diaInicio || ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleDateChange(idx, 'diaInicio', Number(e.target.value))}
                                  className="w-8 text-center text-xs py-0.5 bg-blue-700 text-white rounded font-bold"
                                />
                              ) : (
                                m.diaInicio
                              )
                            ) : isEditMode ? (
                              <input
                                type="text"
                                placeholder="-"
                                onClick={(e) => e.stopPropagation()}
                                onFocus={() => handleDateChange(idx, 'mesInicio', mes)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    handleDateChange(idx, 'mesInicio', mes);
                                    handleDateChange(idx, 'diaInicio', val);
                                  }
                                }}
                                className="w-7 text-center text-[10px] py-0.5 bg-transparent border border-slate-200 rounded text-slate-400 hover:border-blue-400"
                              />
                            ) : (
                              ''
                            )}
                          </td>

                          {/* FIN cell */}
                          <td
                            className={`py-2 px-1 border-r border-slate-200 font-bold transition-all ${
                              isEndMonth
                                ? 'bg-emerald-600 text-white shadow-inner'
                                : isBetween && !isEndMonth
                                ? 'bg-sky-50 text-slate-300'
                                : 'text-slate-400'
                            }`}
                          >
                            {isEndMonth ? (
                              isEditMode ? (
                                <input
                                  type="number"
                                  value={m.diaFin || ''}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => handleDateChange(idx, 'diaFin', Number(e.target.value))}
                                  className="w-8 text-center text-xs py-0.5 bg-emerald-700 text-white rounded font-bold"
                                />
                              ) : (
                                m.diaFin
                              )
                            ) : isEditMode ? (
                              <input
                                type="text"
                                placeholder="-"
                                onClick={(e) => e.stopPropagation()}
                                onFocus={() => handleDateChange(idx, 'mesFin', mes)}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val)) {
                                    handleDateChange(idx, 'mesFin', mes);
                                    handleDateChange(idx, 'diaFin', val);
                                  }
                                }}
                                className="w-7 text-center text-[10px] py-0.5 bg-transparent border border-slate-200 rounded text-slate-400 hover:border-emerald-400"
                              />
                            ) : (
                              ''
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Module quick legend with start/end details */}
      <div className="bg-slate-50/70 border-t border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Resumen de Fechas Reales de Ejecución Curricular:</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-slate-500">
              Azul: Fecha de Inicio · Verde: Fecha de Fin
            </span>
            {!hasAnyDates && modules.length > 0 && (
              <span className="text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                Fechas en blanco / Sin asignar
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {modules.map((m, idx) => {
            const hasDates = Boolean(m.fechaInicio && m.fechaInicio.trim() && m.fechaFin && m.fechaFin.trim());

            return (
              <div
                key={m.codigo + idx}
                onClick={() => onSelectModule && onSelectModule(m)}
                className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer text-xs"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasDates ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                  <span className="font-bold text-slate-800">{m.codigo}</span>
                  <span className="text-slate-500 truncate max-w-[110px]" title={m.nombre}>
                    {m.nombre}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium whitespace-nowrap shrink-0 pl-1">
                  {isEditMode ? (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        placeholder="Ej. 19 de enero"
                        value={m.fechaInicio || ''}
                        onChange={(e) => handleDateChange(idx, 'fechaInicio', e.target.value)}
                        className="w-20 px-1 py-0.5 text-[10px] border border-slate-300 rounded font-semibold text-blue-800"
                      />
                      <span>→</span>
                      <input
                        type="text"
                        placeholder="Ej. 20 de febrero"
                        value={m.fechaFin || ''}
                        onChange={(e) => handleDateChange(idx, 'fechaFin', e.target.value)}
                        className="w-20 px-1 py-0.5 text-[10px] border border-slate-300 rounded font-semibold text-emerald-800"
                      />
                    </div>
                  ) : hasDates ? (
                    <>
                      <span className="text-blue-800 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{m.fechaInicio}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{m.fechaFin}</span>
                    </>
                  ) : (
                    <span className="text-slate-400 italic text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      Sin fechas asignadas
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
