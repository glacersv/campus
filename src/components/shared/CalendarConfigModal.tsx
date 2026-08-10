/**
 * CalendarConfigModal
 * Modal para gestionar el Calendario Académico Institucional:
 *  - Días de Asueto nacionales y salesianos
 *  - Semanas de evaluaciones / exámenes
 *  - Feriados y actos cívicos
 *
 * Persiste en Firestore → colección `calendar_events`
 */
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Plus, Trash2, Save, Calendar, Flag, BookOpen,
  AlertCircle, PartyPopper, GraduationCap, ChevronDown
} from 'lucide-react';
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

/* ─── Types ─── */
export type EventType =
  | 'asueto'        // Día de asueto / no lectivo
  | 'feriado'       // Feriado salesiano institucional
  | 'examen'        // Semana / día de evaluaciones
  | 'civico'        // Acto cívico
  | 'reunion'       // Reunión de padres / docentes
  | 'otro';         // Otro evento

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // ISO YYYY-MM-DD
  endDate?: string;   // ISO YYYY-MM-DD (para rangos)
  type: EventType;
  description?: string;
  isAllDay: boolean;
  affectsClasses: boolean; // true = suspensión de clases
}

const EVENT_TYPES: { value: EventType; label: string; color: string; bg: string; icon: React.ElementType }[] = [
  { value: 'asueto',   label: 'Día de Asueto',        color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',   icon: Flag },
  { value: 'feriado',  label: 'Feriado Salesiano',     color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',     icon: PartyPopper },
  { value: 'examen',   label: 'Semana de Exámenes',    color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200', icon: GraduationCap },
  { value: 'civico',   label: 'Acto Cívico',           color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: Calendar },
  { value: 'reunion',  label: 'Reunión',               color: 'text-sky-700',     bg: 'bg-sky-50 border-sky-200',       icon: BookOpen },
  { value: 'otro',     label: 'Otro Evento',           color: 'text-slate-700',   bg: 'bg-slate-100 border-slate-200',  icon: AlertCircle },
];

const getTypeConfig = (type: EventType) =>
  EVENT_TYPES.find(t => t.value === type) || EVENT_TYPES[EVENT_TYPES.length - 1];

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY_FORM = {
  title: '',
  date: '',
  endDate: '',
  type: 'asueto' as EventType,
  description: '',
  isAllDay: true,
  affectsClasses: true,
};

export default function CalendarConfigModal({ open, onClose }: Props) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState<EventType | 'all'>('all');

  useEffect(() => {
    if (open) loadEvents();
  }, [open]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'calendar_events'), orderBy('date', 'asc'));
      const snap = await getDocs(q);
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent)));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar el calendario');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { toast.error('Título y fecha son obligatorios'); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, 'calendar_events'), {
        title: form.title.trim(),
        date: form.date,
        endDate: form.endDate || null,
        type: form.type,
        description: form.description.trim() || null,
        isAllDay: form.isAllDay,
        affectsClasses: form.affectsClasses,
      });
      toast.success('Evento agregado al calendario');
      setForm(EMPTY_FORM);
      setShowAddForm(false);
      loadEvents();
    } catch (err) {
      toast.error('Error al guardar el evento');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento del calendario?')) return;
    try {
      await deleteDoc(doc(db, 'calendar_events', id));
      toast.success('Evento eliminado');
      loadEvents();
    } catch {
      toast.error('Error al eliminar el evento');
    }
  };

  const filtered = events.filter(e => filterType === 'all' || e.type === filterType);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 24 }}
            transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
            className="modal-container max-w-3xl"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="modal-title">Calendario Académico Institucional</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Asuetos, feriados, exámenes y eventos del año lectivo</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={onClose}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body space-y-5">
              {/* Filter + Add Button */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 flex-wrap">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                  >
                    Todos
                  </button>
                  {EVENT_TYPES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setFilterType(t.value)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${filterType === t.value ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/50'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddForm(v => !v)}
                  className="btn-primary shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Evento
                </button>
              </div>

              {/* Add Form */}
              <AnimatePresence>
                {showAddForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handleSave} className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
                      <p className="text-sm font-bold text-slate-800 font-display">Nuevo Evento</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1.5">
                          <label className="form-label">Título del Evento *</label>
                          <input
                            type="text"
                            required
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                            placeholder="Ej: Día de Independencia, Semana Santa..."
                            className="input-crema"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="form-label">Tipo *</label>
                          <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType })} className="input-crema">
                            {EVENT_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="form-label">Fecha de Inicio *</label>
                          <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-crema" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="form-label">Fecha de Fin (para rangos)</label>
                          <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="input-crema" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="form-label">Descripción</label>
                          <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción opcional..." className="input-crema" />
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.affectsClasses} onChange={e => setForm({ ...form, affectsClasses: e.target.checked })} className="w-4 h-4 accent-primary rounded" />
                            <span className="text-xs font-semibold text-slate-700">Suspensión de clases</span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">Cancelar</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                          <Save className="w-4 h-4" />
                          {saving ? 'Guardando...' : 'Guardar Evento'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Events List */}
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No hay eventos registrados</p>
                  <p className="text-xs mt-1 text-slate-300">Agrega días de asueto, feriados o eventos del calendario lectivo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(event => {
                    const cfg = getTypeConfig(event.type);
                    const Icon = cfg.icon;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border ${cfg.bg} group`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white/70 border ${cfg.bg}`}>
                          <Icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-bold ${cfg.color} font-display`}>{event.title}</p>
                            {event.affectsClasses && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
                                Sin clases
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(event.date)}
                            {event.endDate && event.endDate !== event.date && ` → ${formatDate(event.endDate)}`}
                          </p>
                          {event.description && (
                            <p className="text-xs text-slate-400 mt-1 italic">{event.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 rounded-xl hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <span className="text-xs text-slate-400 mr-auto">{events.length} evento(s) registrado(s) en el calendario</span>
              <button className="btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
