import React, { useState, useMemo } from 'react';
import { MonthStats, SuspensionEvent, SuspensionCategory } from '../../types';
import {
  SUSPENSION_CATEGORIES,
  MONTH_NAMES_ORDER,
  getCurrentMonthKey,
  formatMonthFeriadosDesc,
  ensureMonthEvents,
  loadDefaultSuspensionEvents,
  sortSuspensionEventsChronologically,
} from '../../utils/suspensionesHelper';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Coffee,
  Sun,
  Building2,
  AlertCircle,
  FileCheck,
  Check,
  X,
  Grid,
  Sliders,
  Sparkles,
  CalendarRange,
  Clock,
  RotateCcw,
  MousePointerClick,
  Info,
} from 'lucide-react';

interface SuspensionesManagerProps {
  months: MonthStats[];
  isEditMode?: boolean;
  onUpdateMonths?: (newMonths: MonthStats[]) => void;
  calendarCleared?: boolean;
}

type ViewMode = 'current' | 'slide' | 'all';

export const SuspensionesManager: React.FC<SuspensionesManagerProps> = ({
  months,
  isEditMode = false,
  onUpdateMonths,
  calendarCleared = false,
}) => {
  // Ensure all months have structured eventos sorted chronologically (1 to 31)
  const safeMonths = useMemo(
    () => {
      const base = calendarCleared ? months.map(m => ({ ...m, eventos: m.eventos || [] })) : ensureMonthEvents(months);
      return base.map(m => ({
        ...m,
        eventos: sortSuspensionEventsChronologically(m.eventos || []),
      }));
    },
    [months, calendarCleared]
  );

  // Current real-world month
  const autoCurrentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // View state: 'current' (Mes en curso), 'slide' (Slide por mes), 'all' (Todos los meses)
  const [viewMode, setViewMode] = useState<ViewMode>('slide');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(autoCurrentMonthKey);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showLoadDefaults, setShowLoadDefaults] = useState(false);

  const handleLoadDefaults = () => {
    if (onUpdateMonths) {
      const newMonths = loadDefaultSuspensionEvents(safeMonths);
      onUpdateMonths(newMonths);
    }
    setShowLoadDefaults(false);
  };

  // Modal / Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formMonthKey, setFormMonthKey] = useState<string>(autoCurrentMonthKey);
  const [formDia, setFormDia] = useState('');
  const [formActividad, setFormActividad] = useState('');
  const [formTipo, setFormTipo] = useState<SuspensionCategory>('pausa');

  // Calendar Day / Range Picker State in Modal
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');
  const [rangeStartDay, setRangeStartDay] = useState<number | null>(null);
  const [rangeEndDay, setRangeEndDay] = useState<number | null>(null);

  // Month abbreviations
  const MONTH_ABBR_MAP: Record<string, string> = {
    enero: 'ene',
    febrero: 'feb',
    marzo: 'mar',
    abril: 'abr',
    mayo: 'may',
    junio: 'jun',
    julio: 'jul',
    agosto: 'ago',
    septiembre: 'sep',
    octubre: 'oct',
    noviembre: 'nov',
    diciembre: 'dic',
  };

  // Helper to parse day/range numbers from text like "23 feb", "01-05 abr", "30-31 mar"
  const parseDaysFromText = (diaText: string) => {
    if (!diaText) return { start: null, end: null };
    const rangeMatch = diaText.match(/(\d{1,2})\s*[-–alALa]+\s*(\d{1,2})/);
    if (rangeMatch) {
      const s = parseInt(rangeMatch[1], 10);
      const e = parseInt(rangeMatch[2], 10);
      return { start: s, end: e };
    }
    const singleMatch = diaText.match(/(\d{1,2})/);
    if (singleMatch) {
      const s = parseInt(singleMatch[1], 10);
      return { start: s, end: s };
    }
    return { start: null, end: null };
  };

  // Compute calendar grid data for the currently selected form month (2026)
  const modalCalendarData = useMemo(() => {
    const monthMeta = MONTH_NAMES_ORDER.find((m) => m.key === formMonthKey) || MONTH_NAMES_ORDER[0];
    const monthIdx = monthMeta.index; // 0 = Jan, 1 = Feb, etc.
    const year = 2026;

    const firstDate = new Date(year, monthIdx, 1);
    // getDay: 0 = Sunday, 1 = Monday...
    let startingWeekday = firstDate.getDay() - 1;
    if (startingWeekday === -1) startingWeekday = 6; // Monday is 0, Sunday is 6

    const totalDays = new Date(year, monthIdx + 1, 0).getDate();

    // Map existing events in this month to day numbers for dots
    const currentMonthEvents = safeMonths.find((m) => m.month === formMonthKey)?.eventos || [];
    const daysWithEvents: Record<number, SuspensionEvent[]> = {};

    currentMonthEvents.forEach((ev) => {
      if (editingEventId && ev.id === editingEventId) return; // ignore current editing event
      const parsed = parseDaysFromText(ev.dia);
      if (parsed.start) {
        const start = parsed.start;
        const end = parsed.end || parsed.start;
        for (let d = start; d <= end; d++) {
          if (!daysWithEvents[d]) daysWithEvents[d] = [];
          daysWithEvents[d].push(ev);
        }
      }
    });

    return {
      monthName: monthMeta.name,
      monthIdx,
      startingWeekday,
      totalDays,
      daysWithEvents,
      year,
      abbr: MONTH_ABBR_MAP[formMonthKey] || formMonthKey.slice(0, 3),
    };
  }, [formMonthKey, safeMonths, editingEventId]);

  // Calendar Day Click Handler
  const handleCalendarDayClick = (dayNum: number) => {
    const abbr = modalCalendarData.abbr;

    if (calendarMode === 'single') {
      setRangeStartDay(dayNum);
      setRangeEndDay(dayNum);
      const formatted = `${dayNum < 10 ? '0' + dayNum : dayNum} ${abbr}`;
      setFormDia(formatted);
    } else {
      // Range Mode
      if (rangeStartDay === null || (rangeStartDay !== null && rangeEndDay !== null)) {
        // Start a new range
        setRangeStartDay(dayNum);
        setRangeEndDay(null);
        const formatted = `${dayNum < 10 ? '0' + dayNum : dayNum} ${abbr}`;
        setFormDia(formatted);
      } else {
        // Complete the range
        const start = Math.min(rangeStartDay, dayNum);
        const end = Math.max(rangeStartDay, dayNum);
        setRangeStartDay(start);
        setRangeEndDay(end);
        const formatted =
          start === end
            ? `${start < 10 ? '0' + start : start} ${abbr}`
            : `${start < 10 ? '0' + start : start}-${end < 10 ? '0' + end : end} ${abbr}`;
        setFormDia(formatted);
      }
    }
  };

  // Active month index for slider
  const currentMonthIdx = MONTH_NAMES_ORDER.findIndex((m) => m.key === selectedMonthKey);
  const activeMonthIndex = currentMonthIdx >= 0 ? currentMonthIdx : 0;
  const activeMonthData = safeMonths.find((m) => m.month === selectedMonthKey) || safeMonths[0];

  // Global counts
  const totalEventsCount = useMemo(() => {
    return safeMonths.reduce((acc, m) => acc + (m.eventos?.length || 0), 0);
  }, [safeMonths]);

  const countsByCategory = useMemo(() => {
    const counts: Record<SuspensionCategory, number> = {
      pausa: 0,
      feriado: 0,
      institucional: 0,
      suspension: 0,
      evaluacion: 0,
    };
    safeMonths.forEach((m) => {
      m.eventos?.forEach((e) => {
        if (counts[e.tipo] !== undefined) {
          counts[e.tipo]++;
        }
      });
    });
    return counts;
  }, [safeMonths]);

  // Navigation handlers
  const handlePrevMonth = () => {
    const prevIdx = (activeMonthIndex - 1 + MONTH_NAMES_ORDER.length) % MONTH_NAMES_ORDER.length;
    setSelectedMonthKey(MONTH_NAMES_ORDER[prevIdx].key);
  };

  const handleNextMonth = () => {
    const nextIdx = (activeMonthIndex + 1) % MONTH_NAMES_ORDER.length;
    setSelectedMonthKey(MONTH_NAMES_ORDER[nextIdx].key);
  };

  // Open Form to Add
  const handleOpenAddModal = (monthKey?: string) => {
    const targetMonth = monthKey || selectedMonthKey || 'enero';
    setEditingEventId(null);
    setFormMonthKey(targetMonth);
    setFormDia('');
    setFormActividad('');
    setFormTipo('pausa');
    setRangeStartDay(null);
    setRangeEndDay(null);
    setCalendarMode('single');
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEditModal = (event: SuspensionEvent) => {
    setEditingEventId(event.id);
    setFormMonthKey(event.mes);
    setFormDia(event.dia);
    setFormActividad(event.actividad);
    setFormTipo(event.tipo);

    const parsed = parseDaysFromText(event.dia);
    if (parsed.start && parsed.end && parsed.start !== parsed.end) {
      setCalendarMode('range');
      setRangeStartDay(parsed.start);
      setRangeEndDay(parsed.end);
    } else if (parsed.start) {
      setCalendarMode('single');
      setRangeStartDay(parsed.start);
      setRangeEndDay(parsed.start);
    } else {
      setCalendarMode('single');
      setRangeStartDay(null);
      setRangeEndDay(null);
    }

    setIsFormOpen(true);
  };

  // Save Add/Edit Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDia.trim() || !formActividad.trim()) return;

    const newMonths = safeMonths.map((m) => {
      let updatedEventos = [...(m.eventos || [])];

      if (editingEventId) {
        // If editing, remove from original month and add to target month
        updatedEventos = updatedEventos.filter((ev) => ev.id !== editingEventId);
      }

      if (m.month === formMonthKey) {
        const newEv: SuspensionEvent = {
          id: editingEventId || `ev-${formMonthKey}-${Date.now()}`,
          dia: formDia.trim(),
          mes: formMonthKey,
          actividad: formActividad.trim(),
          tipo: formTipo,
        };
        updatedEventos.push(newEv);
      }

      const sorted = sortSuspensionEventsChronologically(updatedEventos);

      return {
        ...m,
        eventos: sorted,
        feriadosDesc: formatMonthFeriadosDesc(sorted),
      };
    });

    if (onUpdateMonths) {
      onUpdateMonths(newMonths);
    }

    setIsFormOpen(false);
    setSelectedMonthKey(formMonthKey);
  };

  // Delete Event
  const handleDeleteEvent = (eventId: string, monthKey: string) => {
    const newMonths = safeMonths.map((m) => {
      if (m.month !== monthKey) return m;
      const updatedEventos = (m.eventos || []).filter((e) => e.id !== eventId);
      const sorted = sortSuspensionEventsChronologically(updatedEventos);
      return {
        ...m,
        eventos: sorted,
        feriadosDesc: formatMonthFeriadosDesc(sorted),
      };
    });

    if (onUpdateMonths) {
      onUpdateMonths(newMonths);
    }
  };

  // Helper icon renderer
  const renderCategoryIcon = (tipo: SuspensionCategory) => {
    switch (tipo) {
      case 'pausa':
        return <Coffee className="w-3.5 h-3.5 text-indigo-700" />;
      case 'feriado':
        return <Sun className="w-3.5 h-3.5 text-amber-700" />;
      case 'institucional':
        return <Building2 className="w-3.5 h-3.5 text-emerald-700" />;
      case 'suspension':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-700" />;
      case 'evaluacion':
        return <FileCheck className="w-3.5 h-3.5 text-blue-700" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <div id="detalle-descansos-pausas-section" className="bg-slate-50/70 border-t border-slate-200 p-4 text-xs text-slate-700">
      
      {/* Global Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="text-[11px] text-slate-500">
          Seleccione un mes en el panel izquierdo para visualizar y gestionar sus fechas y asuetos al centro.
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {safeMonths.some(m => !m.eventos || m.eventos.length === 0) && (
            <button
              type="button"
              onClick={() => setShowLoadDefaults(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Cargar valores por defecto</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => handleOpenAddModal(selectedMonthKey)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Agregar Día / Actividad</span>
          </button>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: Left Months Sidebar + Center Dates & Month Slide */}
      <div className="flex flex-col md:flex-row items-start gap-4">
        
        {/* LEFT COLUMN: Meses del Año (Vertical Selector) */}
         <div className="w-full md:w-56 lg:w-64 shrink-0 card-crema p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                Meses del Año
              </span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
              12 Meses
            </span>
          </div>

          {/* Month buttons list */}
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto md:max-h-[620px] pb-2 md:pb-0 scrollbar-thin">
            {MONTH_NAMES_ORDER.map((m, idx) => {
              const mData = safeMonths.find((item) => item.month === m.key);
              const eventCount = mData?.eventos?.length || 0;
              const isSelected = selectedMonthKey === m.key && viewMode !== 'all';
              const isRealCurrent = autoCurrentMonthKey === m.key;

              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setSelectedMonthKey(m.key);
                    setViewMode('slide');
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2 shrink-0 md:shrink border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                      : isRealCurrent
                      ? 'bg-blue-50/70 text-blue-900 border-blue-200 hover:bg-blue-100 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`text-[10px] font-mono font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="truncate">
                      <span className="capitalize block truncate">{m.name}</span>
                      <span
                        className={`text-[10px] block leading-none mt-0.5 ${
                          isSelected ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {mData?.semanas || 0} sem · {mData?.dias || 0} días
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isRealCurrent && (
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        Hoy
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full min-w-[20px] text-center ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : eventCount > 0
                          ? 'bg-slate-100 text-slate-700 border border-slate-300'
                          : 'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {eventCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Toggle to view all months grid if desired */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'all' ? 'slide' : 'all')}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>{viewMode === 'all' ? 'Volver a Slide de Mes' : 'Ver Todos los Meses'}</span>
            </button>
          </div>
        </div>

        {/* CENTER / MAIN COLUMN: Slide de Mes + Filtros Organizados + Fechas */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          
          {/* VIEW MODE: SLIDE / MES EN CURSO */}
          {viewMode !== 'all' && (
             <div className="card-crema shadow-sm p-4 sm:p-5 transition-all space-y-4">
              
              {/* Slide Header: Navigation & Month Info */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-2xs"
                    title="Mes anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900 capitalize tracking-tight">
                        {activeMonthData.name} 2026
                      </h4>
                      {selectedMonthKey === autoCurrentMonthKey && (
                        <span className="text-[10px] font-extrabold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-600" />
                          Mes en Curso
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-slate-700">
                        {activeMonthData.semanas} semanas laborales
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">
                        {activeMonthData.dias} días lectivos
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors shadow-2xs"
                    title="Mes siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(selectedMonthKey)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar en {activeMonthData.name}</span>
                  </button>
                </div>
              </div>

              {/* FILTROS ORGANIZADOS: Cerca del Slide de Mes */}
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  Filtrar actividades:
                </span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Todos ({totalEventsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('pausa')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'pausa'
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Coffee className="w-3 h-3" />
                  Pausas Pedagógicas ({countsByCategory.pausa})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('feriado')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'feriado'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  Feriados / Asuetos ({countsByCategory.feriado})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('institucional')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'institucional'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  Institucionales ({countsByCategory.institucional})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('evaluacion')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'evaluacion'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <FileCheck className="w-3 h-3" />
                  Evaluaciones ({countsByCategory.evaluacion})
                </button>
              </div>

              {/* Event Cards Grid for Selected Month */}
              {(() => {
                const events = (activeMonthData.eventos || []).filter(
                  (ev) => categoryFilter === 'all' || ev.tipo === categoryFilter
                );

                if (events.length === 0) {
                  return (
                    <div className="py-12 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-700 font-bold text-sm">
                        No hay actividades en {activeMonthData.name} con el filtro seleccionado.
                      </p>
                      <p className="text-slate-400 text-xs mt-1">
                        Haga clic en agregar para registrar un asueto, pausa o evento institucional.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenAddModal(selectedMonthKey)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Registrar Actividad en {activeMonthData.name}</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {events.map((ev) => {
                      const catMeta = SUSPENSION_CATEGORIES[ev.tipo] || SUSPENSION_CATEGORIES.institucional;
                      return (
                        <div
                          key={ev.id}
                          className={`p-3.5 rounded-2xl border transition-all relative group flex flex-col justify-between shadow-2xs hover:shadow-sm ${catMeta.cardBg} ${catMeta.badgeBorder}`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="font-mono font-black text-xs px-2.5 py-1 rounded-lg bg-white text-slate-900 border border-slate-300 shadow-2xs">
                                📅 {ev.dia}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catMeta.badgeBg} ${catMeta.badgeText} ${catMeta.badgeBorder}`}
                              >
                                {renderCategoryIcon(ev.tipo)}
                                {catMeta.shortLabel}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-slate-800 leading-snug">
                              {ev.actividad}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1.5 mt-3 pt-2 border-t border-slate-200/60">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(ev)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                              title="Editar actividad"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEvent(ev.id, ev.mes)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                              title="Eliminar actividad"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* VIEW MODE: ALL MONTHS GRID */}
          {viewMode === 'all' && (
            <div className="space-y-4">
              <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-slate-400" />
                  Filtrar todas las actividades:
                </span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                    categoryFilter === 'all'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  Todos ({totalEventsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('pausa')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'pausa'
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                      : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <Coffee className="w-3 h-3" />
                  Pausas ({countsByCategory.pausa})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('feriado')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'feriado'
                      ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  Feriados ({countsByCategory.feriado})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('institucional')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'institucional'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  Institucionales ({countsByCategory.institucional})
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('evaluacion')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'evaluacion'
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <FileCheck className="w-3 h-3" />
                  Evaluaciones ({countsByCategory.evaluacion})
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {safeMonths.map((m) => {
                  const isCurrent = autoCurrentMonthKey === m.month;
                  const events = (m.eventos || []).filter(
                    (ev) => categoryFilter === 'all' || ev.tipo === categoryFilter
                  );

                  return (
                    <div
                      key={m.month}
                      onClick={() => {
                        setSelectedMonthKey(m.month);
                        setViewMode('slide');
                      }}
                      className={`p-3.5 rounded-2xl border bg-white shadow-2xs transition-all flex flex-col justify-between cursor-pointer hover:border-blue-300 hover:shadow-xs ${
                        isCurrent ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900 text-xs capitalize">
                              {m.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                Actual
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">
                            {m.dias} días • {events.length} act.
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {events.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1">Sin actividades</p>
                          ) : (
                            events.map((ev) => {
                              const catMeta = SUSPENSION_CATEGORIES[ev.tipo] || SUSPENSION_CATEGORIES.institucional;
                              return (
                                <div
                                  key={ev.id}
                                  className={`p-1.5 rounded-lg border text-[11px] flex items-start justify-between gap-1.5 ${catMeta.cardBg} ${catMeta.badgeBorder}`}
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="font-mono font-bold text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-300 text-[10px]">
                                        {ev.dia}
                                      </span>
                                      <span
                                        className={`text-[9px] font-extrabold px-1 rounded ${catMeta.badgeBg} ${catMeta.badgeText}`}
                                      >
                                        {catMeta.shortLabel}
                                      </span>
                                    </div>
                                    <p className="text-slate-800 font-medium truncate">{ev.actividad}</p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-blue-600">
                        <span>Ver detalle del mes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ADD / EDIT EVENT MODAL WITH VISUAL CALENDAR PICKER */}
      {isFormOpen && (
        <div className="modal-backdrop">
          <div className="modal-container max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-800 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {editingEventId ? 'Editar Actividad o Descanso' : 'Registrar Día y Actividad'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Seleccione el día o rango directamente en el calendario interactivo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEvent} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
              
              {/* VISUAL INTERACTIVE CALENDAR PICKER */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                {/* Calendar Header: Month Switcher & Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          const currentIdx = MONTH_NAMES_ORDER.findIndex((m) => m.key === formMonthKey);
                          const prevIdx = (currentIdx - 1 + MONTH_NAMES_ORDER.length) % MONTH_NAMES_ORDER.length;
                          setFormMonthKey(MONTH_NAMES_ORDER[prevIdx].key);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-700"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <select
                        value={formMonthKey}
                        onChange={(e) => setFormMonthKey(e.target.value)}
                        className="px-2 py-1 text-xs font-extrabold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer"
                      >
                        {MONTH_NAMES_ORDER.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.name} 2026
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const currentIdx = MONTH_NAMES_ORDER.findIndex((m) => m.key === formMonthKey);
                          const nextIdx = (currentIdx + 1) % MONTH_NAMES_ORDER.length;
                          setFormMonthKey(MONTH_NAMES_ORDER[nextIdx].key);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-700"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mode Toggle: Single Day vs Date Range */}
                  <div className="flex items-center bg-slate-200/80 p-1 rounded-lg self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarMode('single');
                        if (rangeStartDay) {
                          setRangeEndDay(rangeStartDay);
                          setFormDia(`${rangeStartDay < 10 ? '0' + rangeStartDay : rangeStartDay} ${modalCalendarData.abbr}`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        calendarMode === 'single'
                          ? 'bg-white text-blue-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MousePointerClick className="w-3.5 h-3.5" />
                      <span>Día Único</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMode('range')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        calendarMode === 'range'
                          ? 'bg-white text-blue-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarRange className="w-3.5 h-3.5" />
                      <span>Rango de Días</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid Header (Weekdays) */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-500 mb-1">
                  <div title="Lunes">LUN</div>
                  <div title="Martes">MAR</div>
                  <div title="Miércoles">MIÉ</div>
                  <div title="Jueves">JUE</div>
                  <div title="Viernes">VIE</div>
                  <div className="text-amber-600" title="Sábado">SÁB</div>
                  <div className="text-amber-600" title="Domingo">DOM</div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty Offset Days */}
                  {Array.from({ length: modalCalendarData.startingWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8 sm:h-9 rounded-lg bg-transparent" />
                  ))}

                  {/* Month Day Cells */}
                  {Array.from({ length: modalCalendarData.totalDays }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayWeekdayIdx = (modalCalendarData.startingWeekday + i) % 7;
                    const isWeekend = dayWeekdayIdx === 5 || dayWeekdayIdx === 6;

                    // Range status
                    const isStart = rangeStartDay === dayNum;
                    const isEnd = rangeEndDay === dayNum;
                    const isInRange =
                      rangeStartDay !== null &&
                      rangeEndDay !== null &&
                      dayNum >= Math.min(rangeStartDay, rangeEndDay) &&
                      dayNum <= Math.max(rangeStartDay, rangeEndDay);

                    const isSingleSelected = calendarMode === 'single' && isStart;
                    const hasEvents = modalCalendarData.daysWithEvents[dayNum]?.length > 0;
                    const eventTitles = modalCalendarData.daysWithEvents[dayNum]?.map((e) => e.actividad).join(' · ');

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => handleCalendarDayClick(dayNum)}
                        title={eventTitles ? `Día ${dayNum}: ${eventTitles}` : `Seleccionar día ${dayNum}`}
                        className={`h-8 sm:h-9 rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-bold border ${
                          isSingleSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/50 scale-105 z-10'
                            : isStart
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300 z-10'
                            : isEnd
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300 z-10'
                            : isInRange
                            ? 'bg-blue-100 text-blue-900 border-blue-200 font-extrabold'
                            : isWeekend
                            ? 'bg-slate-100/60 text-slate-400 border-slate-200/50 hover:bg-slate-200/70 hover:text-slate-700'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="leading-none">{dayNum}</span>
                        {/* Event Dot Indicator */}
                        {hasEvents && !isSingleSelected && !isStart && !isEnd && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute bottom-1"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Selection Summary Banner */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="font-bold text-blue-700">Selección:</span>
                    {rangeStartDay ? (
                      <span className="font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                        {rangeStartDay === rangeEndDay || !rangeEndDay
                          ? `${rangeStartDay} de ${modalCalendarData.monthName} 2026`
                          : `Del ${Math.min(rangeStartDay, rangeEndDay)} al ${Math.max(
                              rangeStartDay,
                              rangeEndDay
                            )} de ${modalCalendarData.monthName} (${
                              Math.abs(rangeEndDay - rangeStartDay) + 1
                            } días)`}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">
                        {calendarMode === 'single'
                          ? '👆 Haz clic en un día del calendario'
                          : '👆 Haz clic en el día de inicio y luego en el día de cierre'}
                      </span>
                    )}
                  </div>

                  {rangeStartDay && (
                    <button
                      type="button"
                      onClick={() => {
                        setRangeStartDay(null);
                        setRangeEndDay(null);
                        setFormDia('');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold self-start sm:self-auto"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
              </div>

              {/* Day / Date Input & Manual Text Override */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Texto en la Jornalización (Día o Rango):
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Sincronizado con el calendario</span>
                </div>
                <input
                  type="text"
                  value={formDia}
                  onChange={(e) => {
                    setFormDia(e.target.value);
                    const parsed = parseDaysFromText(e.target.value);
                    if (parsed.start) {
                      setRangeStartDay(parsed.start);
                      setRangeEndDay(parsed.end || parsed.start);
                    }
                  }}
                  placeholder="Ej: 23 feb, 19 mar, 01-05 abr, 30-31 mar"
                  className="input-crema font-mono font-bold text-xs"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormDia(`${modalCalendarData.abbr}`);
                      setRangeStartDay(1);
                      setRangeEndDay(modalCalendarData.totalDays);
                    }}
                    className="text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 font-medium"
                  >
                    Todo el mes ({modalCalendarData.abbr})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDia(`15 ${modalCalendarData.abbr}`);
                      setRangeStartDay(15);
                      setRangeEndDay(15);
                    }}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-medium"
                  >
                    Día 15
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDia(`01-15 ${modalCalendarData.abbr}`);
                      setRangeStartDay(1);
                      setRangeEndDay(15);
                    }}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-medium"
                  >
                    1ª Quincena (01-15)
                  </button>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Categoría / Tipo de Suspensión:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(Object.keys(SUSPENSION_CATEGORIES) as SuspensionCategory[]).map((catKey) => {
                    const meta = SUSPENSION_CATEGORIES[catKey];
                    const isSelected = formTipo === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setFormTipo(catKey)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? `${meta.cardBg} ${meta.badgeBorder} ring-2 ring-blue-500 font-extrabold shadow-2xs`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        {renderCategoryIcon(catKey)}
                        <span className="truncate text-[11px]">{meta.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activity / Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción de la Actividad / Motivo:
                </label>
                <textarea
                  rows={2}
                  value={formActividad}
                  onChange={(e) => setFormActividad(e.target.value)}
                  placeholder="Ej: Pausa Pedagógica #1 - Formación y Evaluación Curricular"
                   className="input-crema font-medium text-xs resize-none h-16"
                  required
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Plantillas Rápidas:
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('pausa');
                      setFormActividad('Pausa Pedagógica - Jornada de Formación y Evaluación Docente');
                    }}
                    className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md hover:bg-indigo-100 font-medium"
                  >
                    🧘 Pausa Pedagógica
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('feriado');
                      setFormActividad('Asueto Nacional Oficial');
                    }}
                    className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 font-medium"
                  >
                    🏖️ Asueto Nacional
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('institucional');
                      setFormActividad('Fiesta y Celebración Salesiana Institucional');
                    }}
                    className="text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 font-medium"
                  >
                    🏫 Fiesta Salesiana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('evaluacion');
                      setFormActividad('Cierre Evaluativo Trimestral y Registro TBox');
                    }}
                    className="text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-md hover:bg-blue-100 font-medium"
                  >
                    📝 Cierre de Trimestre
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                   onClick={() => setIsFormOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEventId ? 'Actualizar Actividad' : 'Guardar en Jornalización'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmar cargar valores por defecto */}
      {showLoadDefaults && (
      <div className="modal-backdrop animate-in fade-in">
        <div className="modal-container max-w-md w-full p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-amber-100 text-amber-600">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Cargar Valores por Defecto</h3>
              <p className="text-xs text-slate-600">
                Se cargarán las 28 actividades institucionales predefinidas (feriados, pausas pedagógicas, fiestas salesianas).
                Esto sobrescribirá los eventos actuales.
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
              Use esta opción solo si desea restaurar el calendario base del colegio.
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowLoadDefaults(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLoadDefaults}
                className="py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all bg-amber-600 hover:bg-amber-500"
              >
                Confirmar y Cargar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuspensionesManager;
