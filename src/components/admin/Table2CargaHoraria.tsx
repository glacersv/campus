import React from 'react';
import { ModuleDescriptor } from '../../types';
import { Edit2, Sparkles } from 'lucide-react';

interface Table2Props {
  modules: ModuleDescriptor[];
  isEditMode?: boolean;
  onUpdateModules?: (newModules: ModuleDescriptor[]) => void;
  onSelectModule?: (mod: ModuleDescriptor) => void;
}

export const Table2CargaHoraria: React.FC<Table2Props> = ({
  modules,
  isEditMode = false,
  onUpdateModules,
  onSelectModule,
}) => {
  const totalHorasAnuales = modules.reduce((acc, m) => acc + (Number(m.totalHoras) || 0), 0);
  const totalIndicadores = modules.reduce((acc, m) => acc + (Number(m.totalIndicadores) || 0), 0);
  const totalTecnico = modules.reduce((acc, m) => acc + (Number(m.desarrolloTecnico) || 0), 0);
  const totalEmprendedor = modules.reduce((acc, m) => acc + (Number(m.desarrolloEmprendedor) || 0), 0);
  const totalHumano = modules.reduce((acc, m) => acc + (Number(m.desarrolloHumanoSocial) || 0), 0);
  const totalAcademico = modules.reduce((acc, m) => acc + (Number(m.desarrolloAcademicoAplicado) || 0), 0);

  const handleModuleValueChange = (
    index: number,
    field: keyof ModuleDescriptor,
    val: any
  ) => {
    if (!onUpdateModules) return;
    const updated = [...modules];
    const item = { ...updated[index], [field]: Number(val) || 0 };

    // Auto compute total indicators
    const tec = field === 'desarrolloTecnico' ? Number(val) : item.desarrolloTecnico;
    const emp = field === 'desarrolloEmprendedor' ? Number(val) : item.desarrolloEmprendedor;
    const hum = field === 'desarrolloHumanoSocial' ? Number(val) : item.desarrolloHumanoSocial;
    const acad = field === 'desarrolloAcademicoAplicado' ? Number(val) : item.desarrolloAcademicoAplicado;
    item.totalIndicadores = (Number(tec) || 0) + (Number(emp) || 0) + (Number(hum) || 0) + (Number(acad) || 0);

    if (field === 'duracionHoras') {
      item.totalHoras = Number(val) || 0;
      item.horasPorUnidad = { ...(item.horasPorUnidad || { u1: Number(val) || 0 }), u1: Number(val) || 0 };
    }

    updated[index] = item;
    onUpdateModules(updated);
  };

  return (
    <div id="section-tabla-2" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
            2
          </span>
          <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>CARGA HORARIA DE MÓDULOS Y DESGLOSE DE COMPETENCIAS</span>
            {isEditMode && (
              <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                Edición de Indicadores y Horas
              </span>
            )}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>* Clic en cualquier módulo para ver o editar descriptor completo</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs md:text-sm">
          <thead>
            {/* Super header */}
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
              <th rowSpan={2} className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200 bg-slate-200/60 text-left min-w-[90px]">
                Módulos
              </th>
              <th colSpan={4} className="py-2 px-2 border-r border-slate-200 bg-indigo-50/70 text-indigo-950 font-bold">
                Competencias por módulo (Indicadores)
              </th>
              <th rowSpan={2} className="py-2 px-2 border-r border-slate-200 font-semibold text-slate-800 max-w-[85px]">
                Total de Indicadores
              </th>
              <th rowSpan={2} className="py-2 px-2 border-r border-slate-200 font-semibold text-slate-800 max-w-[75px]">
                Horas semanales
              </th>
              <th rowSpan={2} className="py-2 px-2 border-r border-slate-200 font-semibold text-slate-800 max-w-[75px]">
                Horas anuales
              </th>
              <th colSpan={4} className="py-2 px-2 border-r border-slate-200 bg-amber-50/70 text-amber-950 font-bold">
                Horas clase por unidad
              </th>
              <th rowSpan={2} className="py-2 px-3 font-bold text-slate-900 bg-slate-100 min-w-[65px]">
                Total
              </th>
            </tr>
            {/* Sub header */}
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px] font-semibold">
              <th className="py-2 px-2 border-r border-slate-200 max-w-[100px] leading-tight">
                DESARROLLO TÉCNICO
              </th>
              <th className="py-2 px-2 border-r border-slate-200 max-w-[100px] leading-tight">
                DESARROLLO EMPRENDEDOR
              </th>
              <th className="py-2 px-2 border-r border-slate-200 max-w-[100px] leading-tight">
                DESARROLLO HUMANO SOCIAL
              </th>
              <th className="py-2 px-2 border-r border-slate-200 max-w-[100px] leading-tight">
                DESARROLLO ACADÉMICO APLICADO
              </th>
              <th className="py-1.5 px-2 border-r border-slate-200 w-9">1</th>
              <th className="py-1.5 px-2 border-r border-slate-200 w-9">2</th>
              <th className="py-1.5 px-2 border-r border-slate-200 w-9">3</th>
              <th className="py-1.5 px-2 border-r border-slate-200 w-9">4</th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-8 text-center text-slate-500 text-xs">
                  <p className="font-bold text-slate-700">No hay módulos registrados en este grado (memoria en blanco)</p>
                  <p className="text-[11px] text-slate-400 mt-1">Diríjase a "Subir / Cargar Doc." para subir su archivo Word, Excel o PDF, o restablezca los valores oficiales.</p>
                </td>
              </tr>
            ) : (
              modules.map((m, idx) => (
                <tr
                  key={m.codigo}
                  onClick={() => onSelectModule && onSelectModule(m)}
                  className={`border-b border-slate-200 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white hover:bg-indigo-50/40' : 'bg-slate-50/40 hover:bg-indigo-50/40'
                  }`}
                >
                <td className="py-2.5 px-3 text-left font-bold text-slate-900 border-r border-slate-200 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>{m.codigo}</span>
                  </div>
                  {isEditMode && <Edit2 className="w-3 h-3 text-slate-400" />}
                </td>

                {/* Técnico */}
                <td className="py-2 px-1 border-r border-slate-200 text-slate-700 font-medium">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={m.desarrolloTecnico}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleModuleValueChange(idx, 'desarrolloTecnico', e.target.value)}
                      className="w-12 text-center py-1 rounded border border-indigo-200 bg-indigo-50/60 font-bold text-indigo-900"
                    />
                  ) : (
                    m.desarrolloTecnico
                  )}
                </td>

                {/* Emprendedor */}
                <td className="py-2 px-1 border-r border-slate-200 text-slate-700 font-medium">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={m.desarrolloEmprendedor}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleModuleValueChange(idx, 'desarrolloEmprendedor', e.target.value)}
                      className="w-12 text-center py-1 rounded border border-indigo-200 bg-indigo-50/60 font-bold text-indigo-900"
                    />
                  ) : (
                    m.desarrolloEmprendedor
                  )}
                </td>

                {/* Humano Social */}
                <td className="py-2 px-1 border-r border-slate-200 text-slate-700 font-medium">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={m.desarrolloHumanoSocial}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleModuleValueChange(idx, 'desarrolloHumanoSocial', e.target.value)}
                      className="w-12 text-center py-1 rounded border border-indigo-200 bg-indigo-50/60 font-bold text-indigo-900"
                    />
                  ) : (
                    m.desarrolloHumanoSocial
                  )}
                </td>

                {/* Académico Aplicado */}
                <td className="py-2 px-1 border-r border-slate-200 text-slate-700 font-medium">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={m.desarrolloAcademicoAplicado}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleModuleValueChange(idx, 'desarrolloAcademicoAplicado', e.target.value)}
                      className="w-12 text-center py-1 rounded border border-indigo-200 bg-indigo-50/60 font-bold text-indigo-900"
                    />
                  ) : (
                    m.desarrolloAcademicoAplicado
                  )}
                </td>

                {/* Total Indicadores */}
                <td className="py-2 px-2 border-r border-slate-200 font-bold text-slate-900 bg-slate-50/60">
                  {m.totalIndicadores}
                </td>

                {/* Horas semanales */}
                <td className="py-2 px-1 border-r border-slate-200 text-slate-700">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={m.horasSemanales}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleModuleValueChange(idx, 'horasSemanales', e.target.value)}
                      className="w-12 text-center py-1 rounded border border-slate-200 font-medium text-slate-800"
                    />
                  ) : (
                    m.horasSemanales
                  )}
                </td>

                {/* Horas anuales */}
                <td className="py-2 px-1 border-r border-slate-200 font-semibold text-slate-800">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={m.duracionHoras}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleModuleValueChange(idx, 'duracionHoras', e.target.value)}
                      className="w-14 text-center py-1 rounded border border-blue-200 bg-blue-50/50 font-bold text-blue-900"
                    />
                  ) : (
                    m.duracionHoras
                  )}
                </td>

                {/* Unit 1 */}
                <td className="py-2 px-2 border-r border-slate-200 text-slate-700 font-medium">
                  {m.horasPorUnidad?.u1 ?? m.duracionHoras ?? m.totalHoras ?? 0}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-slate-400">
                  {m.horasPorUnidad?.u2 || '-'}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-slate-400">
                  {m.horasPorUnidad?.u3 || '-'}
                </td>
                <td className="py-2 px-2 border-r border-slate-200 text-slate-400">
                  {m.horasPorUnidad?.u4 || '-'}
                </td>

                {/* Total Horas */}
                <td className="py-2 px-3 font-bold text-indigo-700 bg-indigo-50/30">
                  {m.totalHoras}
                </td>
              </tr>
            )))}

            {/* Total Row */}
            <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <td className="py-3 px-3 text-left">TOTAL</td>
              <td className="py-3 px-2 border-r border-slate-200 text-indigo-900">{totalTecnico}</td>
              <td className="py-3 px-2 border-r border-slate-200 text-indigo-900">{totalEmprendedor}</td>
              <td className="py-3 px-2 border-r border-slate-200 text-indigo-900">{totalHumano}</td>
              <td className="py-3 px-2 border-r border-slate-200 text-indigo-900">{totalAcademico}</td>
              <td className="py-3 px-2 border-r border-slate-200 text-slate-900">{totalIndicadores}</td>
              <td className="py-3 px-2 border-r border-slate-200 text-slate-600">
                {modules[0]?.horasSemanales || 18} avg
              </td>
              <td className="py-3 px-2 border-r border-slate-200 text-indigo-900">{totalHorasAnuales}</td>
              <td colSpan={4} className="py-3 px-2 border-r border-slate-200 text-slate-500 text-xs">
                Distribución en módulos secuenciales
              </td>
              <td className="py-3 px-3 text-indigo-700 bg-indigo-100/70 text-sm">
                {totalHorasAnuales}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
