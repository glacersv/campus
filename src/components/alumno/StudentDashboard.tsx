import React from 'react';
import { motion } from 'motion/react';
import {
  ClipboardCheck,
  Medal,
  ArrowUpRight,
  CheckCircle2,
  GraduationCap,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SystemModuleId } from '../../types';


interface StudentDashboardProps {
  studentName: string;
  onLogout: () => void;
}

const MODULE_CONFIG: Record<SystemModuleId, { label: string; desc: string; icon: React.ElementType; color: string }> = {
  formacion: { label: 'Formación Buenos Días', desc: 'Registro de asistencia y disciplina', icon: ClipboardCheck, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200' },
  proyectos: { label: 'Semana de la Juventud', desc: 'Sube y gestiona tu proyecto', icon: Medal, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  'semana-juventud': { label: 'Mi Proyecto', desc: 'Ver estado de mi proyecto', icon: Medal, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
  notas: { label: 'Notas', desc: 'Calificaciones y evaluaciones', icon: ClipboardCheck, color: 'bg-sky-500/10 text-sky-600 border-sky-200' },
  clase: { label: 'Clase', desc: 'Control de clases del día', icon: ClipboardCheck, color: 'bg-amber-500/10 text-amber-600 border-amber-200' },
  horario: { label: 'Horario', desc: 'Horarios de clases', icon: Calendar, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  eventos: { label: 'Eventos', desc: 'Eventos del colegio', icon: Calendar, color: 'bg-teal-500/10 text-teal-600 border-teal-200' },
  avisos: { label: 'Avisos', desc: 'Comunicados y anuncios', icon: Calendar, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  'semana-juventud-admin': { label: 'Semana de la Juventud', desc: 'Administrar proyectos estudiantiles', icon: Medal, color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
};

export default function StudentDashboard({ studentName, onLogout }: StudentDashboardProps) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;
  const navigate = useNavigate();
  const { roleConfig } = useAuth();
  
  const enabledModules = roleConfig?.permissions || [];

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-3xl bg-gradient-to-r from-[#124D37] via-[#25855A] to-[#1D6F4B] text-white p-6 md:p-8 shadow-xl shadow-emerald-900/10 overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">
            ¡Hola, {studentName}!
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            Bienvenido a tu plataforma del Colegio Salesiano San José.
          </p>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-card-icon bg-emerald-50 text-emerald-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Estado Alumno</span>
            <div className="stat-card-value">Activo 2026</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-sky-50 text-sky-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Asistencia</span>
            <div className="stat-card-value text-emerald-600">Al Día</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-purple-50 text-purple-600">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Proyectos</span>
            <div className="stat-card-value">Habilitados</div>
          </div>
        </div>
      </div>

      {/* Monday Notice */}
      {isMonday && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-500/10 border border-amber-200 rounded-3xl flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900 font-display">
              Hoy es Lunes — <span className="font-extrabold">Acto Cívico Automático</span>
            </p>
            <p className="text-xs text-amber-800/80 mt-0.5">Asiste puntualmente a la cancha principal para la formación cívica.</p>
          </div>
        </motion.div>
      )}

      {/* Modules Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900 font-display">Tus Módulos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enabledModules.map((moduleId, i) => {
            const config = MODULE_CONFIG[moduleId];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <motion.div
                key={moduleId}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/alumno/${moduleId}`)}
                className="card-crema p-6 transition-all card-interactive hover:shadow-xl hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${config.color}`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-5 space-y-1">
                  <h4 className="text-base font-bold text-slate-900 font-display">{config.label}</h4>
                  <p className="text-xs text-slate-400">{config.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
