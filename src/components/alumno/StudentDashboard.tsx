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
  LogOut,
  Users,
  Medal,
  FolderOpen,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import InstitutionLogo from '../shared/InstitutionLogo';
import ProjectsModule from '../proyectos/ProjectsModule';

interface StudentDashboardProps {
  studentName: string;
  onLogout: () => void;
}

const modules = [
  { id: 'formacion', label: 'Formación Buenos Días', desc: 'Registro de asistencia y disciplina', icon: ClipboardCheck, color: 'bg-primary', active: true },
  { id: 'notas', label: 'Notas', desc: 'Calificaciones y evaluaciones', icon: BookOpen, color: 'bg-accent', active: false },
  { id: 'clase', label: 'Clase', desc: 'Control de clases del día', icon: School, color: 'bg-secondary', active: false },
  { id: 'horario', label: 'Horario', desc: 'Horarios de clases', icon: Calendar, color: 'bg-purple-500', active: false },
  { id: 'eventos', label: 'Eventos', desc: 'Eventos del colegio', icon: CalendarDays, color: 'bg-emerald-500', active: false },
  { id: 'avisos', label: 'Avisos', desc: 'Comunicados y anuncios', icon: Bell, color: 'bg-blue-500', active: false },
  { id: 'proyectos', label: 'Semana de la Juventud', desc: 'Sube y gestiona tu proyecto', icon: Medal, color: 'bg-orange-500', active: true, to: '/estudiante' },
];

export default function StudentDashboard({ studentName, onLogout }: StudentDashboardProps) {
  const navigate = useNavigate();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;
  const [activeModule, setActiveModule] = React.useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <InstitutionLogo className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Campus Salesiano</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">San José</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{studentName}</p>
              <p className="text-xs text-slate-400">
                {today.toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button onClick={onLogout} className="p-2 hover:bg-red-50 rounded-lg transition-colors group">
              <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600 transition-colors" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto p-6">
        {activeModule === 'proyectos' ? (
          <div>
            <button onClick={() => setActiveModule(null)} className="text-xs text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1 transition-colors">
              ← Volver al menú
            </button>
            <ProjectsModule view="alumno" />
          </div>
        ) : (
          <>
            {/* Welcome */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Bienvenido, {studentName}</h2>
              <p className="text-slate-500 mt-1">Selecciona un módulo para comenzar</p>
            </div>

            {/* Monday Notice */}
            {isMonday && (
              <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', bounce: 0.1 }} className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    Hoy es Lunes - <span className="font-bold">Acto Cívico Automático</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">La formación de hoy será en modalidad Acto Cívico</p>
                </div>
              </motion.div>
            )}

            {/* Module Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {modules.map((mod, i) => (
                <motion.div
                  key={mod.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, type: 'spring', bounce: 0.1 }}
                  onClick={() => {
                    if (mod.active && mod.id === 'proyectos') {
                      setActiveModule('proyectos');
                    }
                  }}
                  className={`group relative bg-white rounded-2xl p-5 border-l-[3px] transition-all ${
                    mod.active && mod.id === 'proyectos'
                      ? 'border-l-primary border-y border-r border-slate-200/80 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                      : 'border-l-slate-200 border-y border-r border-slate-200/80 opacity-50 grayscale cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${mod.active && mod.id === 'proyectos' ? mod.color : 'bg-slate-100'}`}>
                      <mod.icon className={`w-6 h-6 ${mod.active && mod.id === 'proyectos' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-slate-900">{mod.label}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                      {!mod.active && (
                        <div className="flex items-center gap-1 mt-2">
                          <Lock className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-400 font-medium">Próximamente</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {mod.active && mod.id === 'proyectos' && (
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}