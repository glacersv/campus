import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SYSTEM_MODULES, SystemModuleId } from '../../types';
import { ClipboardCheck, BookOpen, School, Calendar, CalendarDays, Bell, Medal, ArrowUpRight, Users, GraduationCap, CheckCircle2 } from 'lucide-react';

interface ModuleCard {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
}

interface ModuleGridDashboardProps {
  title: string;
  subtitle: string;
  basePath: string;
  modules?: ModuleCard[];
  icon?: React.ElementType;
  iconBgClassName?: string;
  iconTextClassName?: string;
  children?: React.ReactNode;
  showMondayNotice?: boolean;
}

const moduleIcons: Record<SystemModuleId, React.ElementType> = {
  formacion: ClipboardCheck,
  notas: BookOpen,
  clase: School,
  horario: Calendar,
  eventos: CalendarDays,
  avisos: Bell,
  proyectos: Medal,
  'semana-juventud': Medal,
  'semana-juventud-admin': Medal,
};

const moduleColors: Record<SystemModuleId, string> = {
  formacion: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  notas: 'bg-sky-500/10 text-sky-600 border-sky-200',
  clase: 'bg-amber-500/10 text-amber-600 border-amber-200',
  horario: 'bg-purple-500/10 text-purple-600 border-purple-200',
  eventos: 'bg-teal-500/10 text-teal-600 border-teal-200',
  avisos: 'bg-blue-500/10 text-blue-600 border-blue-200',
  proyectos: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  'semana-juventud': 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
  'semana-juventud-admin': 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
};

export default function ModuleGridDashboard({
  title,
  subtitle,
  basePath,
  modules,
  icon,
  iconBgClassName = 'bg-primary/10',
  iconTextClassName = 'text-primary',
  children,
  showMondayNotice = true,
}: ModuleGridDashboardProps) {
  const navigate = useNavigate();
  const { userProfile, hasPermission } = useAuth();
  const today = new Date();
  const isMonday = today.getDay() === 1;

  const availableModules = modules
    ? modules.filter(m => hasPermission(m.id as SystemModuleId))
    : SYSTEM_MODULES.filter(m => hasPermission(m.id));

  const handleModuleClick = (modId: string) => {
    navigate(`${basePath}/${modId}`);
  };

  const handleModuleKeyDown = (e: React.KeyboardEvent, modId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate(`${basePath}/${modId}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner Showcase Card (Inspired by reference screens) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-3xl bg-gradient-to-r from-[#124D37] via-[#25855A] to-[#1D6F4B] text-white p-6 md:p-8 shadow-xl shadow-emerald-900/10 overflow-hidden"
      >
        {/* Abstract Background Circles */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Sistema Integrado Salesiano • 2026
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">
            Hola, {userProfile?.displayName || 'Bienvenido'}.
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            {subtitle || 'Gestione la asistencia, calificaciones y convivencia escolar desde su panel central.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => availableModules[0] && handleModuleClick(availableModules[0].id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-all active:scale-95 shadow-md shadow-amber-400/20 font-display"
            >
              Comenzar Asistencia
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-emerald-200/80">
              {availableModules.length} módulos habilitados
            </span>
          </div>
        </div>
      </motion.div>

      {/* Overview Stat Badges Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-card-icon bg-emerald-50 text-emerald-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Total Alumnos</span>
            <div className="stat-card-value">156</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-sky-50 text-sky-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Grados Activos</span>
            <div className="stat-card-value">6 Secciones</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-amber-50 text-amber-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Estado Sistema</span>
            <div className="stat-card-value">Al Día</div>
          </div>
        </div>
      </div>

      {/* Monday Notice */}
      {showMondayNotice && isMonday && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-200 rounded-3xl flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-amber-900 font-display">
              Hoy es Lunes — <span className="font-extrabold">Acto Cívico Automático</span>
            </p>
            <p className="text-xs text-amber-800/80 mt-0.5">La asistencia se registrará bajo la modalidad de formación cívica general.</p>
          </div>
        </motion.div>
      )}

      {/* Section Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-lg font-bold text-slate-900 font-display">Módulos del Sistema</h3>
        <span className="text-xs font-semibold text-slate-400">{availableModules.length} disponibles</span>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {availableModules.map((mod, i) => {
          const Icon = moduleIcons[mod.id as SystemModuleId];
          const colorClass = moduleColors[mod.id as SystemModuleId] || 'bg-slate-100 text-slate-600 border-slate-200';
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              onClick={() => handleModuleClick(mod.id)}
              onKeyDown={(e) => handleModuleKeyDown(e, mod.id)}
              className="group card-crema p-6 cursor-pointer card-interactive overflow-hidden"
              role="button"
              tabIndex={0}
              aria-label={`${mod.label}: ${mod.desc}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${colorClass}`}>
                  {Icon && <Icon className="w-7 h-7" />}
                </div>

                <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-primary group-hover:text-white text-slate-400 flex items-center justify-center transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-5 space-y-1">
                <h4 className="text-base font-bold text-slate-900 font-display group-hover:text-primary transition-colors">
                  {mod.label}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {children}
    </div>
  );
}
