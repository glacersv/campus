import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, BookOpen, Users, Calendar, ClipboardCheck, Award } from 'lucide-react';
import ProjectsModule from '../proyectos/ProjectsModule';

export default function PrimariaDashboard() {
  const modules = [
    { id: 'formacion', label: 'Formación', icon: ClipboardCheck, color: 'bg-primary', desc: 'Asistencia y disciplina', count: '1° - 6°' },
    { id: 'notas', label: 'Calificaciones', icon: BookOpen, color: 'bg-accent', desc: 'Notas de primaria', count: '1° - 6°' },
    { id: 'horario', label: 'Horarios', icon: Calendar, color: 'bg-purple-500', desc: 'Horarios de primaria', count: '1° - 6°' },
    { id: 'alumnos', label: 'Alumnos', icon: Users, color: 'bg-emerald-500', desc: 'Alumnos de primaria', count: '1° - 6°' },
  ];

  const gradeStats = [
    { grade: '1°', sections: 2, students: 60 },
    { grade: '2°', sections: 2, students: 58 },
    { grade: '3°', sections: 2, students: 62 },
    { grade: '4°', sections: 2, students: 55 },
    { grade: '5°', sections: 2, students: 57 },
    { grade: '6°', sections: 2, students: 54 },
  ];

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-emerald-100">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="module-title">Coordinación de Primaria</h1>
            <p className="module-subtitle">Módulos de formación para grados 1° - 6°</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <span className="text-xs font-semibold text-secondary">Grados</span>
                <span className="text-xs font-bold text-primary">{mod.count}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card-crema p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900">Resumen por Grado</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {gradeStats.map((stat) => (
            <div key={stat.grade} className="card-crema p-3 text-center">
              <p className="text-lg font-bold text-emerald-700">{stat.grade}</p>
              <p className="text-[10px] text-emerald-600">{stat.sections} secciones</p>
              <p className="text-[10px] text-emerald-500">{stat.students} alumnos</p>
            </div>
          ))}
        </div>
      </div>

      <ProjectsModule view="coordinacion" />
    </div>
  );
}
