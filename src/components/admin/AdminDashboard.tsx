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
  Lock,
  DoorOpen,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { getAllTeachers, getAllGrades, getAllStudents, getAllSections, getAllSubjects } from '../../lib/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import ProjectsModule from '../proyectos/ProjectsModule';

const attendanceData = [
  { name: 'Parvularia', asistencia: 98.4, retardos: 1.2 },
  { name: '1°-3° Grado', asistencia: 97.8, retardos: 1.8 },
  { name: '4°-6° Grado', asistencia: 96.5, retardos: 2.5 },
  { name: '7°-9° Grado', asistencia: 95.2, retardos: 3.4 },
  { name: 'Bach. General', asistencia: 94.6, retardos: 4.2 },
  { name: 'Bach. Técnico', asistencia: 93.9, retardos: 4.8 },
];

const disciplineData = [
  { name: 'Uniforme Incorrecto', value: 48, color: 'var(--color-primary)' },
  { name: 'Cabello fuera de norma', value: 35, color: 'var(--color-secondary)' },
  { name: 'Uñas Pintadas/Acrílicas', value: 17, color: 'var(--color-danger)' }
];

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
    { label: 'Docentes', value: stats.teachers, icon: GraduationCap, accent: 'bg-primary' },
    { label: 'Grados', value: stats.grades, icon: DoorOpen, accent: 'bg-accent' },
    { label: 'Secciones', value: stats.sections, icon: Users, accent: 'bg-secondary' },
    { label: 'Alumnos', value: stats.students, icon: UserCheck, accent: 'bg-emerald-500' },
    { label: 'Materias', value: stats.subjects, icon: BookMarked, accent: 'bg-purple-500' },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', bounce: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {card.label}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.accent} bg-opacity-10`}>
                <card.icon className={`w-4 h-4 ${card.accent.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <div className="text-4xl font-bold font-display tracking-tight mb-2 text-slate-900">
              {card.value}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1 h-1 rounded-full ${card.accent}`} />
              <span className="text-[11px] font-semibold text-slate-500">
                Total registrados
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts (Premium Dashboard) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-primary" />
                Rendimiento de Asistencia Promedio por Nivel
              </h3>
              <p className="text-[11px] text-slate-500">Porcentaje promedio de asistencia y llegadas tarde en la jornada</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full font-mono">En Vivo</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar name="Asistencia %" dataKey="asistencia" fill="var(--color-primary)" radius={[12, 12, 0, 0]} barSize={25} />
                <Bar name="Retardos %" dataKey="retardos" fill="var(--color-secondary)" radius={[12, 12, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discipline Chart */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-[380px]">
          <div className="mb-4 shrink-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Distribución de Incidencias de Uniforme
            </h3>
            <p className="text-[11px] text-slate-500">Frecuencia relativa de incidencias registradas en la semana</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={disciplineData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {disciplineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Summary */}
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-2xl font-black text-slate-800">100%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Incidencias</span>
            </div>
          </div>
          {/* Legend Footer */}
          <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 shrink-0 border-t border-slate-100 pt-3">
            {disciplineData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="font-medium text-slate-700 truncate max-w-[160px]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Módulos del Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.05, type: 'spring', bounce: 0.1 }}
              className={`bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col items-center text-center gap-3 transition-all ${
                mod.active ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'opacity-50 grayscale cursor-not-allowed'
              }`}
            >
              <div className={`${mod.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                <mod.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">{mod.label}</h3>
              {!mod.active && (
                <div className="flex items-center justify-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] text-slate-400 font-medium">Próximamente</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Projects Module */}
      <ProjectsModule view="admin" />
    </div>
  );
}
