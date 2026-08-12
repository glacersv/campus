import { useHistorial } from '../../hooks/useCatalogos';
import { AccionHistorial, UserRole, ROLE_LABELS } from '../../types';

const ACCION_INFO: Record<AccionHistorial, { label: string; icon: string; color: string }> = {
  registro:                { label: 'Proyecto registrado',          icon: '📝', color: 'bg-blue-500' },
  envio_validacion:        { label: 'Enviado a validación',         icon: '📤', color: 'bg-blue-500' },
  aprobacion_materia:      { label: 'Materia aprobada por docente', icon: '✅', color: 'bg-emerald-500' },
  reclasificacion:         { label: 'Reclasificado por docente',    icon: '🔄', color: 'bg-slate-500' },
  rechazo_materia:         { label: 'Rechazado por docente',        icon: '❌', color: 'bg-red-500' },
  aprobacion_coordinacion: { label: 'Aprobado oficialmente',        icon: '🏆', color: 'bg-emerald-500' },
  rechazo_coordinacion:    { label: 'Rechazado por coordinación',   icon: '🚫', color: 'bg-red-500' },
  eliminado:               { label: 'Proyecto eliminado',           icon: '🗑️', color: 'bg-red-600' },
};

export default function Historial({ proyectoId }: { proyectoId: string }) {
  const { historial, loading } = useHistorial(proyectoId);

  if (loading) return <p className="text-sm text-slate-400 py-2">Cargando historial...</p>;
  if (historial.length === 0) return <p className="text-sm text-slate-400 py-2">Sin actividad registrada aún.</p>;

  return (
    <div className="relative pl-9">
      {historial.map((h, idx) => {
        const info = ACCION_INFO[h.accion] ?? { label: h.accion, icon: '•', color: 'bg-slate-400' };
        return (
          <div key={h.id} className="relative pb-5 last:pb-0">
            {idx < historial.length - 1 && (
              <div className="absolute left-[-22px] top-7 bottom-0 w-px bg-slate-200" />
            )}
            <div className={`absolute -left-[28px] top-1 w-7 h-7 rounded-full ${info.color} flex items-center justify-center opacity-90`}>
              <span className="text-xs">{info.icon}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm text-slate-700">{info.label}</span>
                <span className="text-[10px] text-slate-300 whitespace-nowrap ml-2">
                  {formatFecha(h.fecha)}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {ROLE_LABELS[h.rol_actor as UserRole] ?? h.rol_actor}: <strong className="text-slate-600">{h.actor_nombre}</strong>
              </div>
              {h.comentario && (
                <div className="text-xs text-slate-400 mt-1.5 italic border-l-2 border-slate-200 pl-2">
                  "{h.comentario}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatFecha(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
