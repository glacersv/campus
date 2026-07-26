import React from 'react';
import { BookOpen, Calendar, ClipboardCheck, Users, BarChart3, FileText } from 'lucide-react';
import ProjectsModule from '../proyectos/ProjectsModule';

export default function AcademicaDashboard() {
  const modules = [
    { id: 'notas', label: 'Calificaciones', icon: BookOpen, color: 'bg-accent', desc: 'Gestión de notas y evaluaciones', count: '—' },
    { id: 'horario', label: 'Horarios', icon: Calendar, color: 'bg-purple-500', desc: 'Horarios de clases', count: '—' },
    { id: 'carga-docente', label: 'Carga Docente', icon: Users, color: 'bg-emerald-500', desc: 'Asignación de materias', count: '—' },
    { id: 'reportes', label: 'Reportes', icon: BarChart3, color: 'bg-amber-500', desc: 'Estadísticas académicas', count: '—' },
  ];

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-accent/10">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="module-title">Coordinación Académica</h1>
            <p className="module-subtitle">Gestión de notas, evaluaciones y horarios</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <FileText className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900">Actividad Reciente</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-8">No hay actividad reciente</p>
      </div>

      <ProjectsModule view="coordinacion" />
    </div>
  );
}
