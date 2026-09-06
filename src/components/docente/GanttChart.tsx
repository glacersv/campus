import { useState, useMemo } from 'react';
import { ModuloCronograma } from '../../types';
import { Calendar, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface GanttChartProps {
  cronograma: ModuloCronograma[];
  onModuleClick?: (module: ModuloCronograma) => void;
}

type ViewMode = 'months' | 'weeks';

const YEAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  '1': { bg: 'bg-emerald-400', border: 'border-emerald-600', text: 'text-emerald-800' },
  '2': { bg: 'bg-blue-400', border: 'border-blue-600', text: 'text-blue-800' },
  '3': { bg: 'bg-purple-400', border: 'border-purple-600', text: 'text-purple-800' },
};

const STAGE_COLORS: Record<string, string> = {
  'Informarse': 'bg-emerald-500',
  'Planificar': 'bg-blue-500',
  'Decidir': 'bg-yellow-500',
  'Ejecutar': 'bg-orange-500',
  'Controlar': 'bg-red-500',
  'Valorar': 'bg-purple-500',
};

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function formatShortDate(date: Date): string {
  const day = date.getDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${day} ${months[date.getMonth()]}`;
}

export default function GanttChart({ cronograma, onModuleClick }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('months');
  const [hoveredModule, setHoveredModule] = useState<string | null>(null);

  const sortedByYear = useMemo(() => {
    return [...cronograma].sort((a, b) => {
      if (a.year !== b.year) return Number(a.year) - Number(b.year);
      return a.codigo.localeCompare(b.codigo);
    });
  }, [cronograma]);

  const dateRange = useMemo(() => {
    if (cronograma.length === 0) return { start: new Date(), end: new Date(), totalDays: 0 };
    let minDate = parseDate(cronograma[0].fechaInicio);
    let maxDate = parseDate(cronograma[0].fechaFin);
    for (const mod of cronograma) {
      const start = parseDate(mod.fechaInicio);
      const end = parseDate(mod.fechaFin);
      if (start < minDate) minDate = start;
      if (end > maxDate) maxDate = end;
    }
    return {
      start: new Date(minDate.getFullYear(), minDate.getMonth(), 1),
      end: new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0),
      totalDays: daysBetween(minDate, maxDate),
    };
  }, [cronograma]);

  const timelineColumns = useMemo(() => {
    const columns: { label: string; date: Date; isStart: boolean }[] = [];
    const current = new Date(dateRange.start);

    if (viewMode === 'months') {
      while (current <= dateRange.end) {
        columns.push({
          label: current.toLocaleDateString('es-SV', { month: 'short', year: '2-digit' }),
          date: new Date(current),
          isStart: current.getDate() === 1,
        });
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      while (current <= dateRange.end) {
        columns.push({
          label: formatShortDate(current),
          date: new Date(current),
          isStart: current.getDay() === 1,
        });
        current.setDate(current.getDate() + 7);
      }
    }

    return columns;
  }, [dateRange, viewMode]);

  const getPosition = (dateStr: string) => {
    const date = parseDate(dateStr);
    const totalRange = daysBetween(dateRange.start, dateRange.end);
    if (totalRange === 0) return 0;
    return (daysBetween(dateRange.start, date) / totalRange) * 100;
  };

  const getWidth = (startStr: string, endStr: string) => {
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    const totalRange = daysBetween(dateRange.start, dateRange.end);
    if (totalRange === 0) return 0;
    return (daysBetween(start, end) / totalRange) * 100;
  };

  if (cronograma.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500 font-medium">No hay cronograma para mostrar</p>
        <p className="text-slate-400 text-sm mt-1">Genera un cronograma para ver el diagrama de Gantt</p>
      </div>
    );
  }

  const years = [...new Set(sortedByYear.map(m => m.year))].sort();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800">Diagrama de Gantt</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Legend */}
          <div className="flex items-center gap-3 mr-4">
            {years.map(y => (
              <div key={y} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${YEAR_COLORS[y]?.bg || 'bg-gray-400'}`} />
                <span className="text-xs font-medium text-slate-600">{y}° Año</span>
              </div>
            ))}
          </div>
          {/* Zoom controls */}
          <button
            onClick={() => setViewMode('months')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'months' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Meses
          </button>
          <button
            onClick={() => setViewMode('weeks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'weeks' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            Semanas
          </button>
        </div>
      </div>

      {/* Gantt Body */}
      <div className="overflow-x-auto">
        <div style={{ minWidth: Math.max(800, timelineColumns.length * (viewMode === 'months' ? 100 : 60)) }}>
          {/* Timeline header */}
          <div className="flex border-b border-slate-200 sticky top-0 bg-white z-10">
            {/* Module label column */}
            <div className="w-56 min-w-56 px-4 py-2 bg-slate-50 border-r border-slate-200 text-xs font-bold text-slate-600">
              Módulo
            </div>
            {/* Timeline columns */}
            <div className="flex-1 flex">
              {timelineColumns.map((col, i) => (
                <div
                  key={i}
                  className={`flex-1 px-1 py-2 text-center text-xs font-medium border-r border-slate-100 ${
                    col.isStart ? 'bg-slate-50' : ''
                  }`}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Module rows */}
          {years.map(year => (
            <div key={year}>
              {/* Year separator */}
              <div className={`flex items-center px-4 py-2 ${
                year === '1' ? 'bg-emerald-50' : year === '2' ? 'bg-blue-50' : 'bg-purple-50'
              }`}>
                <div className="w-56 min-w-56">
                  <span className={`text-sm font-bold ${
                    year === '1' ? 'text-emerald-700' : year === '2' ? 'text-blue-700' : 'text-purple-700'
                  }`}>
                    {year}° Año Técnico
                  </span>
                </div>
                <div className="flex-1" />
              </div>

              {/* Modules for this year */}
              {sortedByYear.filter(m => m.year === year).map(mod => {
                const colors = YEAR_COLORS[year] || YEAR_COLORS['1'];
                const left = getPosition(mod.fechaInicio);
                const width = Math.max(getWidth(mod.fechaInicio, mod.fechaFin), 2);

                return (
                  <div
                    key={mod.moduleId}
                    className={`flex items-center border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                      hoveredModule === mod.moduleId ? 'bg-slate-50' : ''
                    }`}
                    onMouseEnter={() => setHoveredModule(mod.moduleId)}
                    onMouseLeave={() => setHoveredModule(null)}
                  >
                    {/* Module label */}
                    <div className="w-56 min-w-56 px-4 py-2 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${colors.text}`}>{mod.codigo}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5" title={mod.nombre}>
                        {mod.nombre}
                      </p>
                    </div>

                    {/* Bar */}
                    <div className="flex-1 relative h-10">
                      <div
                        className={`absolute top-1.5 h-7 rounded-md cursor-pointer transition-all duration-200 ${
                          hoveredModule === mod.moduleId ? 'ring-2 ring-slate-400 shadow-md scale-[1.02]' : ''
                        }`}
                        style={{
                          left: `${left}%`,
                          width: `${width}%`,
                        }}
                        onClick={() => onModuleClick?.(mod)}
                        title={`${mod.codigo} — ${mod.nombre}\n${mod.fechaInicio} → ${mod.fechaFin}\n${mod.horasTotales}h / ${mod.semanasTotales} sem`}
                      >
                        {/* Stage segments */}
                        <div className="flex h-full rounded-md overflow-hidden">
                          {mod.jornalizacion.map((stage, si) => {
                            const stageWidth = mod.horasTotales > 0
                              ? (stage.hours / mod.horasTotales) * 100
                              : 100 / 6;
                            return (
                              <div
                                key={si}
                                className={`${STAGE_COLORS[stage.name] || 'bg-gray-400'} h-full relative group/stage`}
                                style={{ width: `${stageWidth}%` }}
                              >
                                {/* Stage tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-slate-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/stage:opacity-100 transition-opacity pointer-events-none z-20">
                                  {stage.name}: {stage.hours}h
                                  <br />
                                  {formatShortDate(parseDate(stage.startDate))} → {formatShortDate(parseDate(stage.endDate))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Date labels */}
                        {width > 8 && (
                          <>
                            <span className="absolute left-1 top-0.5 text-[9px] font-bold text-white drop-shadow-sm">
                              {formatShortDate(parseDate(mod.fechaInicio))}
                            </span>
                            <span className="absolute right-1 top-0.5 text-[9px] font-bold text-white drop-shadow-sm">
                              {formatShortDate(parseDate(mod.fechaFin))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Stage legend */}
          <div className="flex items-center gap-4 px-6 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs font-bold text-slate-600">Etapas:</span>
            {Object.entries(STAGE_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-[10px] text-slate-600">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
