import React from 'react';
import { School, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function ClaseView() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-secondary/10">
            <School className="w-5 h-5 text-secondary-dark" />
          </div>
          <div>
            <h1 className="module-title">Control de Clases</h1>
            <p className="module-subtitle">Registro diario de clases impartidas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Clases Hoy', value: '6', color: 'bg-secondary' },
          { label: 'Completadas', value: '4', color: 'bg-primary' },
          { label: 'Pendientes', value: '2', color: 'bg-orange-500' },
          { label: 'Canceladas', value: '0', color: 'bg-red-500' },
        ].map((stat) => (
          <div key={stat.label} className="card-crema p-5">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2`}>
              {stat.label === 'Completadas' ? <CheckCircle className="w-5 h-5 text-white" /> :
               stat.label === 'Canceladas' ? <XCircle className="w-5 h-5 text-white" /> :
               <School className="w-5 h-5 text-white" />}
            </div>
            <div className="text-2xl font-bold font-display text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="card-crema p-8 text-center">
        <School className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Vista de Clases</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Aquí podrás registrar el control diario de clases: temas impartidos, tareas asignadas y observaciones por sección.
        </p>
        <div className="mt-4">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Próximamente</span>
        </div>
      </div>
    </div>
  );
}
