import React from 'react';
import { Handshake, CheckCircle, AlertTriangle, Shield, Users, FileText } from 'lucide-react';
import ProjectsModule from '../proyectos/ProjectsModule';

export default function ConvivenciaDashboard() {
  const modules = [
    { id: 'asistencia', label: 'Asistencia', icon: CheckCircle, color: 'bg-emerald-500', desc: 'Control de asistencia diaria', count: '—' },
    { id: 'disciplina', label: 'Disciplina', icon: AlertTriangle, color: 'bg-amber-500', desc: 'Registro de infracciones', count: '—' },
    { id: 'incidentes', label: 'Incidentes', icon: Shield, color: 'bg-red-500', desc: 'Reportes de incidentes', count: '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-red-100">
            <Handshake className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="module-title">Coordinación de Convivencia</h1>
            <p className="module-subtitle">Control de asistencia, disciplina e incidentes (7° - 12°)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <div key={mod.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{mod.label}</h3>
                  <p className="text-[10px] text-slate-400">{mod.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400">Pendiente</span>
                <span className="text-xs font-bold text-slate-300">{mod.count}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Estadísticas de Convivencia</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-8">No hay estadísticas disponibles</p>
      </div>

      <ProjectsModule view="coordinacion" />
    </div>
  );
}
