import React, { useState } from 'react';
import { ModuleDescriptor } from '../../types';
import { BookOpen, AlertCircle, Plus, Edit2, Trash2, ExternalLink, Save } from 'lucide-react';

interface Table4Props {
  modules: ModuleDescriptor[];
  notaEvaluativa: string;
  isEditMode?: boolean;
  onUpdateModules?: (newModules: ModuleDescriptor[]) => void;
  onUpdateNota?: (newNota: string) => void;
  onSelectModule?: (mod: ModuleDescriptor) => void;
  onAddNewModule?: () => void;
}

export const Table4NominaModulos: React.FC<Table4Props> = ({
  modules,
  notaEvaluativa,
  isEditMode = false,
  onUpdateModules,
  onUpdateNota,
  onSelectModule,
  onAddNewModule,
}) => {
  const handleNameChange = (index: number, newName: string) => {
    if (!onUpdateModules) return;
    const updated = [...modules];
    updated[index] = { ...updated[index], nombre: newName };
    onUpdateModules(updated);
  };

  const handleCodeChange = (index: number, newCode: string) => {
    if (!onUpdateModules) return;
    const updated = [...modules];
    updated[index] = { ...updated[index], codigo: newCode };
    onUpdateModules(updated);
  };

  const handleDelete = (index: number, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateModules) return;
    if (confirm(`¿Desea eliminar el módulo ${code}?`)) {
      const updated = modules.filter((_, i) => i !== index);
      onUpdateModules(updated);
    }
  };

  return (
    <div id="section-tabla-4" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
            4
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>CÓDIGOS Y NOMBRES OFICIALES DE CADA MÓDULO</span>
              {isEditMode && (
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                  Edición de Títulos y Códigos
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Descriptores curriculares del Bachillerato Técnico Vocacional en Diseño Gráfico
            </p>
          </div>
        </div>

        {isEditMode && onAddNewModule && (
          <button
            id="btn-add-module-table4"
            onClick={onAddNewModule}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Módulo</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="py-2.5 px-4 font-bold text-slate-900 w-36 border-r border-slate-200">
                CÓDIGO
              </th>
              <th className="py-2.5 px-4 font-bold text-slate-900 border-r border-slate-200">
                NOMBRE DEL MÓDULO
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 text-center w-24 border-r border-slate-200">
                DURACIÓN
              </th>
              <th className="py-2.5 px-3 font-semibold text-slate-700 text-center w-24 border-r border-slate-200">
                SEMANAS
              </th>
              <th className="py-2.5 px-3 text-center w-28">
                ACCIONES
              </th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">No hay módulos cargados para este grado</p>
                  <p className="text-[11px] text-slate-400 mt-1">Suba su archivo en "Subir / Cargar Doc." o haga clic en "Restablecer a Valores Oficiales".</p>
                </td>
              </tr>
            ) : (
              modules.map((m, idx) => (
                <tr
                  key={m.codigo + idx}
                  onClick={() => onSelectModule && onSelectModule(m)}
                  className={`border-b border-slate-200 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white hover:bg-amber-50/40' : 'bg-slate-50/40 hover:bg-amber-50/40'
                  }`}
                >
                <td className="py-3 px-4 font-bold text-blue-700 border-r border-slate-200 whitespace-nowrap">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={m.codigo}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      className="w-28 px-2 py-1 font-mono font-bold text-blue-800 border border-blue-300 rounded bg-blue-50/50"
                    />
                  ) : (
                    m.codigo
                  )}
                </td>
                <td className="py-3 px-4 font-medium text-slate-800 border-r border-slate-200">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={m.nombre}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1 font-semibold text-slate-900 border border-slate-300 rounded bg-slate-50"
                    />
                  ) : (
                    <>
                      <div className="font-semibold text-slate-900">{m.nombre}</div>
                      {m.competenciaGeneral && (
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {m.competenciaGeneral}
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="py-3 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                  {m.duracionHoras} hrs
                </td>
                <td className="py-3 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                  {m.semanas} sem
                </td>
                <td className="py-3 px-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectModule) onSelectModule(m);
                      }}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                      title="Ver y editar descriptor completo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isEditMode ? 'Editar' : 'Ver'}</span>
                    </button>
                    {isEditMode && modules.length > 1 && (
                      <button
                        onClick={(e) => handleDelete(idx, m.codigo, e)}
                        className="p-1 rounded text-red-500 hover:bg-red-50"
                        title="Eliminar este módulo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Institutional Evaluation Note */}
      <div className="p-4 bg-amber-50/70 border-t border-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="w-full">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>Nota Evaluativa Institucional</span>
            {isEditMode && <span className="text-amber-700 text-[10px]">Editable</span>}
          </div>
          {isEditMode && onUpdateNota ? (
            <textarea
              rows={2}
              value={notaEvaluativa}
              onChange={(e) => onUpdateNota(e.target.value)}
              className="w-full p-2 text-xs font-bold text-red-700 bg-white border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 outline-hidden"
            />
          ) : (
            <p className="text-xs font-bold text-red-600 tracking-wide leading-relaxed">
              {notaEvaluativa}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
