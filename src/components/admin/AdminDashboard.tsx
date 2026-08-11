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
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import { getAllTeachers, getAllGrades, getAllStudents, getAllSections, getAllSubjects } from '../../lib/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import ProjectsModule from '../proyectos/ProjectsModule';
import { useAuth } from '../../contexts/AuthContext';

const attendanceData = [
  { name: 'Parvularia', asistencia: 98.4, retardos: 1.2 },
  { name: '1°-3° Grado', asistencia: 97.8, retardos: 1.8 },
  { name: '4°-6° Grado', asistencia: 96.5, retardos: 2.5 },
  { name: '7°-9° Grado', asistencia: 95.2, retardos: 3.4 },
  { name: 'Bach. General', asistencia: 94.6, retardos: 4.2 },
  { name: 'Bach. Técnico', asistencia: 93.9, retardos: 4.8 },
];

const disciplineData = [
  { name: 'Uniforme Incorrecto', value: 48, color: '#25855A' },
  { name: 'Cabello fuera de norma', value: 35, color: '#FAB700' },
  { name: 'Uñas Pintadas/Acrílicas', value: 17, color: '#D32F2F' }
];

interface Stats {
  teachers: number;
  grades: number;
  sections: number;
  students: number;
  subjects: number;
}

export default function AdminDashboard() {
  const { userProfile } = useAuth();
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
    { label: 'Docentes', value: stats.teachers, icon: GraduationCap, accent: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { label: 'Grados', value: stats.grades, icon: DoorOpen, accent: 'bg-sky-50 text-sky-600 border-sky-200' },
    { label: 'Secciones', value: stats.sections, icon: Users, accent: 'bg-amber-50 text-amber-600 border-amber-200' },
    { label: 'Alumnos', value: stats.students, icon: UserCheck, accent: 'bg-teal-50 text-teal-600 border-teal-200' },
    { label: 'Materias', value: stats.subjects, icon: BookMarked, accent: 'bg-purple-50 text-purple-600 border-purple-200' },
  ];

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Showcase Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-3xl bg-gradient-to-r from-[#124D37] via-[#25855A] to-[#1D6F4B] text-white p-7 md:p-9 shadow-xl shadow-emerald-900/10 overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">
            Bienvenido, {userProfile?.displayName || 'Administrador'}.
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Resumen global de la institución: control de matriculados, docentes, horarios, secciones e incidencias en tiempo real.
          </p>
        </div>
      </motion.div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 md:gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="stat-card"
          >
            <div className={`stat-card-icon ${card.accent}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div>
              <span className="stat-card-label">{card.label}</span>
              <div className="stat-card-value">{card.value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Rendimiento de Asistencia Promedio por Nivel
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Porcentaje promedio de asistencia y llegadas tarde en la jornada</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full font-mono">En Vivo</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[80, 100]} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', fontSize: '11px' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                <Bar name="Asistencia %" dataKey="asistencia" fill="#25855A" radius={[12, 12, 0, 0]} barSize={24} />
                <Bar name="Retardos %" dataKey="retardos" fill="#FAB700" radius={[12, 12, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Discipline Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-[380px]">
          <div className="mb-4 shrink-0">
            <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" />
              Incidencias de Uniforme
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Distribución semanal de registros</p>
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
                <Tooltip contentStyle={{ borderRadius: '16px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <span className="block text-2xl font-black text-slate-900 font-display">100%</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
            </div>
          </div>
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

      {/* Projects Module */}
      <ProjectsModule view="admin" />
    </div>
  );
}
