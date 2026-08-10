/**
 * QuickStatsSidebar — Panel Lateral Derecho
 *
 * Contenido:
 *  1. Tarjeta de usuario (perfil + rol)
 *  2. Mini Calendario Mensual con días de asueto marcados
 *  3. Lista de próximos eventos del calendario institucional
 *  4. Acceso a Configuración del Calendario (solo admin/coordinación)
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Settings2,
  Flag, PartyPopper, GraduationCap, AlertCircle, BookOpen
} from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import CalendarConfigModal, { CalendarEvent, EventType } from './CalendarConfigModal';

/* ─── Event type display config ─── */
const EVENT_COLORS: Record<EventType, { dot: string; bg: string; text: string; icon: React.ElementType }> = {
  asueto:  { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Flag },
  feriado: { dot: 'bg-blue-400',    bg: 'bg-blue-50',    text: 'text-blue-700',    icon: PartyPopper },
  examen:  { dot: 'bg-purple-400',  bg: 'bg-purple-50',  text: 'text-purple-700',  icon: GraduationCap },
  civico:  { dot: 'bg-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CalendarDays },
  reunion: { dot: 'bg-sky-400',     bg: 'bg-sky-50',     text: 'text-sky-700',     icon: BookOpen },
  otro:    { dot: 'bg-slate-400',   bg: 'bg-slate-50',   text: 'text-slate-600',   icon: AlertCircle },
};

const DAYS_SHORT = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];
const MONTHS_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function QuickStatsSidebar() {
  const { userProfile, userRole } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const today = new Date();

  const canManageCalendar = userRole === 'admin' || userRole === 'coordinacion';

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const q = query(collection(db, 'calendar_events'), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent)));
    } catch {
      // silently fail if no events yet
    }
  };

  /* Build set of event dates for the current calendar month */
  const eventDateMap = new Map<string, CalendarEvent[]>();
  events.forEach(ev => {
    const start = new Date(ev.date + 'T00:00:00');
    const end = ev.endDate ? new Date(ev.endDate + 'T00:00:00') : start;
    const cur = new Date(start);
    while (cur <= end) {
      const key = cur.toISOString().slice(0, 10);
      if (!eventDateMap.has(key)) eventDateMap.set(key, []);
      eventDateMap.get(key)!.push(ev);
      cur.setDate(cur.getDate() + 1);
    }
  });

  /* Upcoming events (next 60 days) */
  const todayStr = today.toISOString().slice(0, 10);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 60);
  const limitStr = limit.toISOString().slice(0, 10);
  const upcomingEvents = events
    .filter(e => e.date >= todayStr && e.date <= limitStr)
    .slice(0, 5);

  /* Calendar navigation */
  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfMonth(calYear, calMonth);
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-SV', { day: 'numeric', month: 'short' });
  };

  return (
    <>
      <aside className="w-60 shrink-0 hidden xl:flex flex-col gap-3 p-4 bg-white/60 backdrop-blur-xl border-l border-slate-200/60 overflow-y-auto">

        {/* ── User Card ── */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-sm relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-primary/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md font-display shrink-0">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate font-display">
                {userProfile?.displayName || 'Usuario'}
              </h4>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-semibold text-emerald-700">En línea</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mini Calendario Institucional ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-2">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <ChevronLeft className="w-3 h-3 text-slate-500" />
            </button>
            <h4 className="text-[11px] font-bold text-slate-800 font-display">
              {MONTHS_ES[calMonth]} {calYear}
            </h4>
            <button onClick={nextMonth} className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
              <ChevronRight className="w-3 h-3 text-slate-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px">
            {DAYS_SHORT.map(d => (
              <div key={d} className="text-center text-[8px] font-bold text-slate-400 uppercase py-0.5">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px">
            {calDays.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} />;
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventDateMap.get(dateStr) || [];
              const isToday = calYear === today.getFullYear() && calMonth === today.getMonth() && day === today.getDate();
              const hasAsueto = dayEvents.some(e => e.affectsClasses);
              const hasEvent = dayEvents.length > 0;

              return (
                <div
                  key={dateStr}
                  title={dayEvents.map(e => e.title).join(', ')}
                  className={`
                    relative flex items-center justify-center w-full aspect-square rounded-lg text-[9px] font-semibold transition-all
                    ${isToday ? 'bg-primary text-white shadow-sm shadow-primary/30' : ''}
                    ${!isToday && hasAsueto ? 'bg-amber-100 text-amber-800' : ''}
                    ${!isToday && hasEvent && !hasAsueto ? 'bg-primary/8 text-primary' : ''}
                    ${!isToday && !hasEvent ? 'text-slate-500 hover:bg-slate-50' : ''}
                  `}
                >
                  {day}
                  {hasEvent && !isToday && (
                    <span
                      className={`absolute bottom-0.5 w-0.5 h-0.5 rounded-full ${
                        hasAsueto ? 'bg-amber-500' : 'bg-primary/60'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-[8px] text-slate-400 font-medium">Asueto</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 inline-block" />
              <span className="text-[8px] text-slate-400 font-medium">Evento</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
              <span className="text-[8px] text-slate-400 font-medium">Hoy</span>
            </div>
          </div>
        </div>

        {/* ── Próximos Eventos ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider font-display">
              Próximos Eventos
            </h4>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-2">
              Sin eventos próximos
            </p>
          ) : (
            <div className="space-y-1.5">
              {upcomingEvents.map(event => {
                const cfg = EVENT_COLORS[event.type];
                const Icon = cfg.icon;
                return (
                  <div key={event.id} className={`flex items-center gap-2 p-2 rounded-xl ${cfg.bg}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 bg-white/80`}>
                      <Icon className={`w-3 h-3 ${cfg.text}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-bold ${cfg.text} leading-tight truncate`}>{event.title}</p>
                      <p className="text-[9px] text-slate-400">{formatDate(event.date)}</p>
                    </div>
                    {event.affectsClasses && (
                      <span className="text-[8px] font-bold text-red-500 shrink-0 bg-red-50 px-1 py-0.5 rounded-full">
                        Sin clases
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Configurar Calendario (solo admin / coordinación) ── */}
        {canManageCalendar && (
          <button
            onClick={() => setShowConfig(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-primary/30 text-primary text-[10px] font-bold hover:bg-primary/5 transition-colors"
          >
            <Settings2 className="w-3 h-3" />
            Gestionar Calendario
          </button>
        )}
      </aside>

      {/* Calendar Config Modal */}
      <CalendarConfigModal
        open={showConfig}
        onClose={() => {
          setShowConfig(false);
          loadEvents(); // refresh after managing
        }}
      />
    </>
  );
}
