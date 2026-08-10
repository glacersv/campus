import React from 'react';
import { CalendarDays, Plus, MapPin, Users } from 'lucide-react';

export default function EventosView() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-emerald-100">
            <CalendarDays className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="module-title">Eventos</h1>
            <p className="module-subtitle">Gestión de eventos del colegio</p>
          </div>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo Evento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
        <CalendarDays className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Vista de Eventos</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Aquí podrás crear y gestionar eventos del colegio: actos cívicos, reuniones de padres, festivales y actividades especiales.
        </p>
        <div className="mt-4">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Próximamente</span>
        </div>
      </div>
    </div>
  );
}
