import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  Filter,
  AlertTriangle
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { getAllTeachers, getAllGrades, getAllStudents, getAllSections, getAllSubjects } from '../../lib/firestore';
import { getAttendanceReports } from '../../firebase';
import { AttendanceReport } from '../../types';

interface Stats {
  teachers: number;
  grades: number;
  sections: number;
  students: number;
  subjects: number;
}

const COLORS = ['#25855A', '#FAB700', '#0D71B9', '#D32F2F', '#8B5CF6', '#EC4899'];

export default function EstadisticasDashboard() {
  const [stats, setStats] = useState<Stats>({ teachers: 0, grades: 0, sections: 0, students: 0, subjects: 0 });
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    (async () => {
      try {
        const [teachers, grades, sections, students, subjects, attendanceReports] = await Promise.all([
          getAllTeachers(),
          getAllGrades(),
          getAllSections(),
          getAllStudents(),
          getAllSubjects(),
          getAttendanceReports()
        ]);
        setStats({
          teachers: teachers.length,
          grades: grades.length,
          sections: sections.length,
          students: students.length,
          subjects: subjects.length,
        });
        setReports(attendanceReports);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Calcular estadísticas de asistencia
  const attendanceStats = reports.reduce((acc, report) => {
    acc.total += report.estadisticas.totalEstudiantes;
    acc.presentes += report.estadisticas.presentes;
    acc.tardes += report.estadisticas.llegadasTarde;
    acc.ausentes += report.estadisticas.ausentes;
    acc.cabelloLargo += report.estadisticas.disciplina.cabelloLargo;
    acc.unasPintadas += report.estadisticas.disciplina.unasPintadas;
    acc.uniformeIncorrecto += report.estadisticas.disciplina.uniformeIncorrecto;
    return acc;
  }, { total: 0, presentes: 0, tardes: 0, ausentes: 0, cabelloLargo: 0, unasPintadas: 0, uniformeIncorrecto: 0 });

  const promedioAsistencia = attendanceStats.total > 0
    ? ((attendanceStats.presentes + attendanceStats.tardes) / attendanceStats.total) * 100
    : 0;

  // Datos por grado
  const attendanceByGrade = reports.reduce((acc, report) => {
    const existing = acc.find(item => item.name === report.grado);
    if (existing) {
      existing.total += report.estadisticas.totalEstudiantes;
      existing.presentes += report.estadisticas.presentes;
      existing.tardes += report.estadisticas.llegadasTarde;
      existing.ausentes += report.estadisticas.ausentes;
    } else {
      acc.push({
        name: report.grado,
        total: report.estadisticas.totalEstudiantes,
        presentes: report.estadisticas.presentes,
        tardes: report.estadisticas.llegadasTarde,
        ausentes: report.estadisticas.ausentes,
      });
    }
    return acc;
  }, [] as { name: string; total: number; presentes: number; tardes: number; ausentes: number }[]);

  // Datos de disciplina
  const disciplineData = [
    { name: 'Cabello Largo', value: attendanceStats.cabelloLargo, color: '#FAB700' },
    { name: 'Uñas Pintadas', value: attendanceStats.unasPintadas, color: '#0D71B9' },
    { name: 'Uniforme Incorrecto', value: attendanceStats.uniformeIncorrecto, color: '#D32F2F' },
  ].filter(item => item.value > 0);

  // Datos de tendencia de asistencia por fecha
  const attendanceTrend = reports
    .slice(0, 10)
    .reverse()
    .map(report => ({
      fecha: report.fecha,
      asistencia: report.estadisticas.totalEstudiantes > 0
        ? ((report.estadisticas.presentes + report.estadisticas.llegadasTarde) / report.estadisticas.totalEstudiantes) * 100
        : 0,
      tardes: report.estadisticas.llegadasTarde,
    }));

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Dashboard Estadístico</h1>
            <p className="module-subtitle">Métricas y análisis del sistema educativo</p>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Docentes', value: stats.teachers, icon: GraduationCap, color: 'bg-primary', textColor: 'text-primary' },
          { label: 'Grados', value: stats.grades, icon: BookOpen, color: 'bg-accent', textColor: 'text-accent' },
          { label: 'Secciones', value: stats.sections, icon: Users, color: 'bg-secondary', textColor: 'text-secondary' },
          { label: 'Alumnos', value: stats.students, icon: Award, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
          { label: 'Materias', value: stats.subjects, icon: Calendar, color: 'bg-purple-500', textColor: 'text-purple-600' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', bounce: 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="stat-card-label">
                {card.label}
              </span>
              <div className={`stat-card-icon ${card.color}/10`}>
                <card.icon className={`w-4 h-4 ${card.textColor}`} />
              </div>
            </div>
            <div className="stat-card-value">
              {card.value}
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-1 h-1 rounded-full ${card.color}`} />
              <span className="text-[11px] font-semibold text-secondary">
                Total registrados
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance by Grade */}
        <div className="lg:col-span-2 card-crema p-5 flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-primary" />
                Asistencia por Grado
              </h3>
              <p className="text-[11px] text-slate-500">Distribución de asistencia por grado</p>
            </div>
            <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full font-mono">
              {promedioAsistencia.toFixed(1)}% promedio
            </span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            <div className="space-y-4">
              {attendanceByGrade.map((item) => {
                const total = item.total || 1;
                const pPresentes = (item.presentes / total) * 100;
                const pTardes = (item.tardes / total) * 100;
                const pAusentes = (item.ausentes / total) * 100;
                return (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-24 text-xs font-semibold text-slate-500 truncate text-right shrink-0">
                      {item.name}
                    </span>
                    <div className="flex-1">
                      <div className="w-full bg-slate-100 rounded-full h-7 flex items-center overflow-hidden p-1">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(0, pPresentes)}%`, background: 'linear-gradient(90deg, var(--color-primary-light), var(--color-primary))' }}
                        />
                        <div
                          className="h-full transition-all duration-500"
                          style={{ width: `${Math.max(0, pTardes)}%`, background: 'var(--color-secondary)' }}
                        />
                        <div
                          className="h-full rounded-r-full transition-all duration-500"
                          style={{ width: `${Math.max(0, pAusentes)}%`, background: 'var(--color-danger)' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-28 shrink-0">
                      <span className="text-xs font-mono font-bold text-primary">
                        {((item.presentes + item.tardes) / total * 100).toFixed(0)}%
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.total}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-primary)' }} />
                Presentes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-secondary)' }} />
                Tardes
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: 'var(--color-danger)' }} />
                Ausentes
              </span>
            </div>
          </div>
        </div>

        {/* Discipline Chart */}
        <div className="card-crema p-5 flex flex-col h-[380px]">
          <div className="mb-4 shrink-0">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Incidencias de Disciplina
            </h3>
            <p className="text-[11px] text-slate-500">Distribución total</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            {disciplineData.length > 0 ? (
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
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '0.6875rem' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400">
                <Award className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Sin incidencias registradas</p>
              </div>
            )}
            {disciplineData.length > 0 && (
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="block text-2xl font-black text-slate-800">
                  {attendanceStats.cabelloLargo + attendanceStats.unasPintadas + attendanceStats.uniformeIncorrecto}
                </span>
                <span className="text-[0.5625rem] text-slate-400 font-bold uppercase tracking-wider">Total</span>
              </div>
            )}
          </div>
          {disciplineData.length > 0 && (
            <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 shrink-0 border-t border-slate-100 pt-3">
              {disciplineData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-slate-700 truncate max-w-[160px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Trend */}
      <div className="card-crema p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-accent" />
              Tendencia de Asistencia
            </h3>
            <p className="text-[11px] text-slate-500">Últimos reportes registrados</p>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`filter-pill ${period === p ? 'active' : ''}`}
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="fecha" stroke="#94a3b8" fontSize="0.625rem" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize="0.625rem" tickLine={false} axisLine={false} domain={[80, 100]} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '12px', fontSize: '0.6875rem' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '0.6875rem', paddingTop: '5px' }} />
              <Line type="monotone" dataKey="asistencia" name="% Asistencia" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="tardes" name="Tardes" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
