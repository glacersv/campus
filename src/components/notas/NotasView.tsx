import React from 'react';
import { BookOpen, Plus, Search, Filter, Download, Upload, FileText } from 'lucide-react';

export default function NotasView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-accent/10">
            <BookOpen className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="module-title">Notas y Calificaciones</h1>
            <p className="module-subtitle">Gestión de evaluaciones y calificaciones académicas</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-primary">
            <Plus className="w-4 h-4" />
            Nueva Evaluación
          </button>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Evaluaciones', value: '12', color: 'bg-accent' },
          { label: 'Promedio General', value: '8.4', color: 'bg-primary' },
          { label: 'Alumnos Evaluados', value: '156', color: 'bg-secondary' },
          { label: 'Pendientes', value: '3', color: 'bg-orange-500' },
        ].map((stat, i) => (
          <div key={stat.label} className="card-crema p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <FileText className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold font-display text-slate-900">{stat.value}</div>
            <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card-crema p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por alumno o evaluación..."
            className="input pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select className="input w-auto">
            <option>Todos los grados</option>
            <option>1° Grado</option>
            <option>2° Grado</option>
            <option>3° Grado</option>
          </select>
          <select className="input w-auto">
            <option>Todas las materias</option>
            <option>Matemáticas</option>
            <option>Lenguaje</option>
            <option>Ciencias</option>
          </select>
        </div>
      </div>

      {/* Content Placeholder */}
      <div className="card-crema p-8 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Vista de Notas</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Aquí se mostrará la tabla de calificaciones por alumno, con filtros por grado, sección y materia.
          Podrás registrar, editar y exportar notas.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Próximamente</span>
        </div>
      </div>
    </div>
  );
}
