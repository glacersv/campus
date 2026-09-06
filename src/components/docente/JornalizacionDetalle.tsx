import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { LMSModule } from '../../types';
import { calculateProjectDeliveryDate, formatDateSpanish, StageJornalizacionItem } from '../../utils/jornalizacionHelper';
import { ArrowLeft, Calendar, Clock, AlertTriangle, CheckCircle2, Play, Pause, ChevronRight } from 'lucide-react';

export default function JornalizacionDetalle() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const [mod, setMod] = useState<LMSModule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleId) return;
    loadModule();
  }, [moduleId]);

  const loadModule = async () => {
    setLoading(true);
    try {
      const ref = doc(db, 'lms_modules', moduleId!);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setMod({ id: snap.id, ...snap.data() } as LMSModule);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40} />
          <h3 className="text-lg font-bold text-slate-900 mb-1">Módulo no encontrado</h3>
          <button onClick={() => navigate('/docente/jornalizacion')} className="text-primary text-sm font-medium mt-2">
            Volver a Jornalización
          </button>
        </div>
      </div>
    );
  }

  const jornalizacion = (mod.jornalizacion as StageJornalizacionItem[]) || [];
  const hasJornalizacion = jornalizacion.length > 0;
  const projectDeliveryDate = hasJornalizacion ? calculateProjectDeliveryDate(jornalizacion[jornalizacion.length - 1].endDate) : '';

  // Calcular totales
  const totalHours = jornalizacion.reduce((sum, s) => sum + s.hours, 0);
  const startDate = jornalizacion[0]?.startDate || '';
  const endDate = jornalizacion[jornalizacion.length - 1]?.endDate || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/docente/jornalizacion')}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-white px-2.5 py-1 rounded-md" style={{ backgroundColor: mod.color || '#0D71B9' }}>
              {mod.code}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">{mod.name}</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">{mod.gradeName} • {mod.hours}h • {mod.weeks} semanas</p>
        </div>
      </div>

      {/* Resumen */}
      {hasJornalizacion && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium mb-1">Inicio</div>
            <div className="text-sm font-bold text-slate-900">{formatDateSpanish(startDate)}</div>
          </div>
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium mb-1">Fin</div>
            <div className="text-sm font-bold text-slate-900">{formatDateSpanish(endDate)}</div>
          </div>
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium mb-1">Entrega Proyecto</div>
            <div className="text-sm font-bold text-amber-600">{formatDateSpanish(projectDeliveryDate)}</div>
          </div>
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-xs text-slate-500 font-medium mb-1">Total Horas</div>
            <div className="text-sm font-bold text-blue-600">{totalHours}h</div>
          </div>
        </div>
      )}

      {/* Timeline visual */}
      {hasJornalizacion && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            Línea de Tiempo — 6 Etapas de la Acción Completa
          </h3>

          {/* Barra de progreso */}
          <div className="relative h-3 bg-slate-100 rounded-full mb-6 overflow-hidden">
            {jornalizacion.map((stage, idx) => {
              const width = (stage.hours / totalHours) * 100;
              const colors = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#06B6D4', '#EC4899'];
              return (
                <div
                  key={idx}
                  className="absolute top-0 h-full rounded-full transition-all"
                  style={{
                    left: `${jornalizacion.slice(0, idx).reduce((sum, s) => sum + (s.hours / totalHours) * 100, 0)}%`,
                    width: `${width}%`,
                    backgroundColor: colors[idx % colors.length],
                  }}
                  title={`${stage.name}: ${stage.hours}h`}
                />
              );
            })}
          </div>

          {/* Etapas */}
          <div className="space-y-3">
            {jornalizacion.map((stage, idx) => {
              const colors = ['bg-blue-50 border-blue-200', 'bg-purple-50 border-purple-200', 'bg-amber-50 border-amber-200', 'bg-emerald-50 border-emerald-200', 'bg-cyan-50 border-cyan-200', 'bg-pink-50 border-pink-200'];
              const badgeColors = ['badge-jornal-blue', 'badge-jornal-purple', 'badge-jornal-amber', 'badge-jornal-emerald', 'badge-jornal-teal', 'badge-jornal-blue'];
              const isDelivery = stage.isDeliveryMilestone;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border ${colors[idx % colors.length]} ${isDelivery ? 'ring-2 ring-amber-300' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge-jornal ${badgeColors[idx % badgeColors.length]}`}>
                          {stage.stage}
                        </span>
                        {isDelivery && (
                          <span className="badge-jornal badge-jornal-amber">
                            <AlertTriangle size={10} /> Hito Crítico
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{stage.name}</h4>
                      {stage.description && (
                        <p className="text-xs text-slate-600 mt-1">{stage.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-sm font-bold text-slate-900">{stage.hours}h</div>
                      <div className="text-[11px] text-slate-500">
                        {formatDateSpanish(stage.startDate)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        → {formatDateSpanish(stage.endDate)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sin jornalización */}
      {!hasJornalizacion && (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-amber-500" size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Sin cronograma</h3>
          <p className="text-slate-500 mb-4">
            Este módulo no tiene jornalización generada
          </p>
          <button
            onClick={() => navigate('/docente/jornalizacion')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            Generar Cronograma
          </button>
        </div>
      )}
    </div>
  );
}
