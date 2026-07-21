import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ClipboardCheck,
  BookOpen,
  School,
  Calendar,
  CalendarDays,
  Bell,
  GraduationCap,
  Users,
  UserCheck,
  BookMarked,
  Lock
} from 'lucide-react';
import { getAllTeachers, getAllGrades, getAllStudents, getAllSections, getAllSubjects } from '../../lib/firestore';

interface Stats {
  teachers: number;
  grades: number;
  sections: number;
  students: number;
  subjects: number;
}

const modules = [
  { id: 'formacion', label: 'Formación Buenos Días', icon: ClipboardCheck, color: 'bg-primary', active: true },
  { id: 'notas', label: 'Notas', icon: BookOpen, color: 'bg-accent', active: false },
  { id: 'clase', label: 'Clase', icon: School, color: 'bg-secondary', active: false },
  { id: 'horario', label: 'Horario', icon: Calendar, color: 'bg-purple-500', active: false },
  { id: 'eventos', label: 'Eventos', icon: CalendarDays, color: 'bg-emerald-500', active: false },
  { id: 'avisos', label: 'Avisos', icon: Bell, color: 'bg-amber-500', active: false },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ teachers: 0, grades: 0, sections: 0, students: 0, subjects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [teachers, grades, sections, students, subjects] = await Promise.all([
          getAllTeachers(), getAllGrades(), getAllSections(), getAllStudents(), getAllSubjects()
        ]);
        setStats({ teachers: teachers.length, grades: grades.length, sections: sections.length, students: students.length, subjects: subjects.length });
      } finally { setLoading(false); }
    })();
  }, []);

  const statCards = [
    { label: 'Docentes', value: stats.teachers, icon: GraduationCap, color: 'text-primary' },
    { label: 'Grados', value: stats.grades, icon: Users, color: 'text-accent' },
    { label: 'Secciones', value: stats.sections, icon: Users, color: 'text-secondary-dark' },
    { label: 'Alumnos', value: stats.students, icon: UserCheck, color: 'text-purple-600' },
    { label: 'Materias', value: stats.subjects, icon: BookMarked, color: 'text-emerald-600' },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <card.icon className={`w-8 h-8 ${card.color} opacity-80`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Módulos del Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`module-card ${!mod.active ? 'disabled' : ''}`}
            >
              <div className={`${mod.color} w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3`}>
                <mod.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{mod.label}</h3>
              {!mod.active && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 font-medium">Próximamente</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
