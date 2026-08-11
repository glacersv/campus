import React from 'react';
import { motion } from 'motion/react';
import { Baby, Puzzle, Music, Palette, Users, Sun } from 'lucide-react';
import ProjectsModule from '../proyectos/ProjectsModule';

export default function ParvulariaDashboard() {
  const modules = [
    { id: 'formacion', label: 'Formación', icon: Puzzle, color: 'bg-secondary', desc: 'Actividades formativas', count: 'K4 - K6' },
    { id: 'actividades', label: 'Actividades', icon: Music, color: 'bg-purple-500', desc: 'Rutinas y actividades', count: 'K4 - K6' },
    { id: 'alumnos', label: 'Alumnos', icon: Users, color: 'bg-emerald-500', desc: 'Alumnos de parvularia', count: 'K4 - K6' },
  ];

  const levelStats = [
    { level: 'K4', sections: 2, students: 30, age: '4 años' },
    { level: 'K5', sections: 2, students: 32, age: '5 años' },
    { level: 'K6', sections: 2, students: 28, age: '6 años' },
  ];

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-secondary/10">
            <Baby className="w-5 h-5 text-secondary-dark" />
          </div>
          <div>
            <h1 className="module-title">Coordinación de Parvularia</h1>
            <p className="module-subtitle">Módulos de formación para grados K4 - K6</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', bounce: 0.1 }}
              className="card-crema group card-interactive"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{mod.label}</h3>
                  <p className="text-xs text-secondary">{mod.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs font-semibold text-secondary">Niveles</span>
                <span className="text-xs font-bold text-secondary">{mod.count}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card-crema p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sun className="w-5 h-5 text-secondary" />
          <h3 className="text-sm font-bold text-slate-900">Resumen por Nivel</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {levelStats.map((stat) => (
            <div key={stat.level} className="card-crema p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-secondary">{stat.level}</span>
                <span className="text-xs font-semibold text-secondary/70 bg-secondary/10 px-2 py-0.5 rounded-full">{stat.age}</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-600"><span className="font-semibold">{stat.sections}</span> secciones</p>
                <p className="text-xs text-slate-600"><span className="font-semibold">{stat.students}</span> alumnos</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ProjectsModule view="coordinacion" />
    </div>
  );
}
