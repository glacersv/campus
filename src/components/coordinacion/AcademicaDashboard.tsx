import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { BookOpen, Calendar, Users, Medal } from 'lucide-react';

const customModules = [
  { id: 'notas', label: 'Calificaciones', desc: 'Gestión de notas y evaluaciones', icon: BookOpen, color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  { id: 'horario', label: 'Horarios', desc: 'Horarios de clases', icon: Calendar, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  { id: 'clase', label: 'Control de Clases', desc: 'Asistencia y control diario', icon: Users, color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  { id: 'semana-juventud-admin', label: 'Semana de la Juventud', desc: 'Administrar proyectos estudiantiles', icon: Medal, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
];

export default function AcademicaDashboard() {
  return (
    <ModuleGridDashboard
      title="Coordinación Académica"
      subtitle="Gestión de notas, evaluaciones, horarios y proyectos estudiantiles."
      basePath="/coordinacion-academica"
      icon={BookOpen}
      iconBgClassName="bg-sky-500/10"
      iconTextClassName="text-sky-600"
      modules={customModules}
      showMondayNotice={false}
    />
  );
}
