import React from 'react';
import { Calendar, Plus, Download, Upload } from 'lucide-react';

export default function HorarioView() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-purple-100">
            <Calendar className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="module-title">Horarios de Clases</h1>
            <p className="module-subtitle">Consulta y gestión de horarios académicos</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Nuevo Horario
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>
      </div>

      <div className="card-crema p-8 text-center">
        <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Vista de Horarios</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Aquí se mostrará el horario de clases por grado, sección y docente.
          Podrás filtrar por día, grado y ver la distribución de materias.
        </p>
        <div className="mt-4">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Próximamente</span>
        </div>
      </div>
    </div>
  );
}
