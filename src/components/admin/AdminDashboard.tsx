import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  GraduationCap,
  Users,
  UserCheck,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { getAllTeachers, getAllGrades, getAllStudents, getAllUsers } from '../../lib/firestore';
import { Teacher, Grade, Student, User } from '../../types';

interface Stats {
  teachers: number;
  grades: number;
  students: number;
  users: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ teachers: 0, grades: 0, students: 0, users: 0 });
  const [recentTeachers, setRecentTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [teachers, grades, students, users] = await Promise.all([
        getAllTeachers(),
        getAllGrades(),
        getAllStudents(),
        getAllUsers()
      ]);

      setStats({
        teachers: teachers.length,
        grades: grades.length,
        students: students.length,
        users: users.length
      });

      setRecentTeachers(teachers.slice(0, 3));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Docentes', value: stats.teachers, icon: GraduationCap, color: 'bg-blue-500' },
    { label: 'Grados', value: stats.grades, icon: Users, color: 'bg-emerald-500' },
    { label: 'Alumnos', value: stats.students, icon: UserCheck, color: 'bg-amber-500' },
    { label: 'Usuarios', value: stats.users, icon: FileText, color: 'bg-purple-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-salesiano-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Cargando estadísticas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{card.label}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-xl`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Teachers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-salesiano-green" />
          Docentes Registrados
        </h3>

        {recentTeachers.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay docentes registrados aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                <img
                  src={teacher.avatarUrl}
                  alt={teacher.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{teacher.name}</p>
                  <p className="text-xs text-slate-500">{teacher.email}</p>
                </div>
                <span className="text-xs bg-salesiano-green/10 text-salesiano-green px-2 py-1 rounded font-medium">
                  {teacher.gradeId}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}