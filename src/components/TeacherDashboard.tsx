import React from 'react';
import { motion } from 'motion/react';
import {
  ClipboardCheck,
  BookOpen,
  School,
  Calendar,
  CalendarDays,
  Bell,
  Lock,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InstitutionLogo from './InstitutionLogo';

interface TeacherDashboardProps {
  teacherName: string;
  onLogout: () => void;
}

const modules = [
  { id: 'formacion', label: 'Formación Buenos Días', desc: 'Registro de asistencia y disciplina', icon: ClipboardCheck, color: 'bg-primary', active: true },
  { id: 'notas', label: 'Notas', desc: 'Calificaciones de alumnos', icon: BookOpen, color: 'bg-accent', active: false },
  { id: 'clase', label: 'Clase', desc: 'Control de clases del día', icon: School, color: 'bg-secondary', active: false },
  { id: 'horario', label: 'Horario', desc: 'Horarios de clases', icon: Calendar, color: 'bg-purple-500', active: false },
  { id: 'eventos', label: 'Eventos', desc: 'Eventos del colegio', icon: CalendarDays, color: 'bg-emerald-500', active: false },
  { id: 'avisos', label: 'Avisos', desc: 'Comunicados y anuncios', icon: Bell, color: 'bg-amber-500', active: false },
];

export default function TeacherDashboard({ teacherName, onLogout }: TeacherDashboardProps) {
  const navigate = useNavigate();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InstitutionLogo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Campus Salesiano</h1>
              <p className="text-xs text-gray-400">San José</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{teacherName}</p>
              <p className="text-xs text-gray-400">
                {today.toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <LogOut className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Bienvenido, {teacherName}</h2>
          <p className="text-gray-500 mt-1">Selecciona un módulo para comenzar</p>
        </div>

        {/* Monday Notice */}
        {isMonday && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 font-medium">
              Hoy es Lunes - <span className="font-bold">Acto Cívico Automático</span>
            </p>
            <p className="text-xs text-amber-600 mt-1">La formación de hoy será en modalidad Acto Cívico</p>
          </motion.div>
        )}

        {/* Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => {
                if (mod.active) {
                  if (mod.id === 'formacion') navigate('/attendance');
                }
              }}
              className={`module-card text-left ${mod.active ? 'cursor-pointer' : 'disabled'}`}
            >
              <div className="flex items-start gap-4">
                <div className={`${mod.color} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                  <mod.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">{mod.label}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{mod.desc}</p>
                  {!mod.active && (
                    <div className="flex items-center gap-1 mt-2">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] text-gray-400 font-medium">Próximamente</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
