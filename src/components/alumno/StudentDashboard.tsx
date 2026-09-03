import React from 'react';
import { motion } from 'motion/react';
import {
  ClipboardCheck,
  Medal,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Calendar,
  BookOpen,
  Users,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SystemModuleId, SYSTEM_MODULES } from '../../types';
import WelcomeBanner from '../shared/WelcomeBanner';
import { getRole } from '../../lib/firestore';


interface StudentDashboardProps {
  studentName: string;
  onLogout: () => void;
}

const MODULE_CONFIG: Partial<Record<SystemModuleId, { label: string; desc: string; icon: React.ElementType; color: string; path: string }>> = {
  lms: {
    label: 'Mi Aula Virtual',
    desc: 'Cursos, actividades, rúbricas y calificaciones',
    icon: BookOpen,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    path: '/alumno/aula-virtual',
  },
  formacion: {
    label: 'Formación Buenos Días',
    desc: 'Registro de asistencia y disciplina',
    icon: ClipboardCheck,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    path: '/alumno/formacion',
  },
  'semana-juventud': {
    label: 'Semana de la Juventud',
    desc: 'Sube y gestiona tu proyecto estudiantil',
    icon: Medal,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    path: '/alumno/semana-juventud',
  },
  notas: {
    label: 'Notas',
    desc: 'Calificaciones trimestrales y cuadro de honor',
    icon: ClipboardCheck,
    color: 'bg-sky-500/10 text-sky-600 border-sky-200',
    path: '/alumno/aula-virtual/progreso',
  },
  clase: {
    label: 'Clase',
    desc: 'Control de clases del día y materias',
    icon: ClipboardCheck,
    color: 'bg-amber-500/10 text-amber-600 border-amber-200',
    path: '/alumno/aula-virtual/cursos',
  },
  horario: {
    label: 'Horario',
    desc: 'Horarios de clases y laboratorios',
    icon: Calendar,
    color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    path: '/alumno/aula-virtual/cursos',
  },
  eventos: {
    label: 'Eventos',
    desc: 'Eventos pastorales y actividades del colegio',
    icon: Calendar,
    color: 'bg-teal-500/10 text-teal-600 border-teal-200',
    path: '/alumno/eventos',
  },
  avisos: {
    label: 'Avisos',
    desc: 'Comunicados oficiales y anuncios de dirección',
    icon: Calendar,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    path: '/alumno/avisos',
  },
  'semana-juventud-admin': {
    label: 'Semana de la Juventud (Admin)',
    desc: 'Administrar proyectos estudiantiles',
    icon: Medal,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    path: '/alumno/proyectos',
  },
};

export default function StudentDashboard({ studentName, onLogout }: StudentDashboardProps) {
  const navigate = useNavigate();
  const { roleConfig, userRole, refreshRole } = useAuth();

  const enabledModuleIds = (roleConfig?.permissions || [])
    .filter((modId): modId is SystemModuleId => modId in MODULE_CONFIG)
    .sort((a, b) => {
      const idxA = SYSTEM_MODULES.findIndex(m => m.id === a);
      const idxB = SYSTEM_MODULES.findIndex(m => m.id === b);
      return idxA - idxB;
    });



  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <WelcomeBanner
        name={studentName}
        role="alumno"
        area="alumno"
        title={`Hola, ${studentName}.`}
        subtitle="Acceda a los módulos de aula virtual, proyectos, calificaciones y horarios habilitados para su usuario."
        badge="Sistema Integrado Salesiano • 2026"
        ctaLabel="Aula Virtual LMS"
        onCta={() => navigate('/alumno/aula-virtual')}
        showProfile
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card-crema p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              TOTAL ALUMNOS
            </span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900">
              156
            </h3>
          </div>
        </div>

        <div className="card-crema p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-600 border border-sky-200 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              GRADOS ACTIVOS
            </span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900">
              6 Secciones
            </h3>
          </div>
        </div>

        <div className="card-crema p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              ESTADO SISTEMA
            </span>
            <h3 className="font-display font-extrabold text-2xl text-slate-900">
              Al Día
            </h3>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-xl text-slate-900">
            Módulos del Sistema
          </h2>
          <span className="text-xs font-semibold text-slate-400">
            {enabledModuleIds.length} disponibles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {enabledModuleIds.map((modId, idx) => {
            const config = MODULE_CONFIG[modId];
            if (!config) return null;
            const Icon = config.icon;
            const isLms = modId === 'lms';

            return (
              <motion.div
                key={modId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                onClick={() => navigate(config.path)}
                className={`card-crema card-interactive p-6 flex flex-col justify-between group cursor-pointer ${
                  isLms ? 'ring-2 ring-[#25855A]/30' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-105 ${config.color}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLms && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#25855A] text-white">
                          NUEVO
                        </span>
                      )}
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-slate-700 group-hover:bg-slate-200 transition-colors">
                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-slate-900 text-lg group-hover:text-[#25855A] transition-colors">
                    {config.label}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {config.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Acceso directo</span>
                  <span className="text-[#25855A] group-hover:underline">Entrar</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Módulos del rol */}
      <div className="card-crema p-6">
        <h3 className="font-display font-bold text-slate-900 text-base mb-4">
          Módulos habilitados para tu rol
        </h3>
        <div className="flex flex-wrap gap-2">
          {SYSTEM_MODULES.map((mod) => {
            const hasPermission = (roleConfig?.permissions || []).includes(mod.id);
            return (
              <span
                key={mod.id}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  hasPermission
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
                }`}
              >
                {mod.label}
              </span>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400 mt-3">
          Estos módulos están activos según tu rol actual. El administrador puede modificarlos desde Roles y Permisos.
        </p>
      </div>
    </div>
  );
}
