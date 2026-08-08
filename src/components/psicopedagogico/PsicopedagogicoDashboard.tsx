import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, BookOpen, Bell, School, Calendar, CalendarDays, Medal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SYSTEM_MODULES, SystemModuleId } from '../../types';

const moduleIcons: Record<SystemModuleId, React.ElementType> = {
  formacion: ClipboardCheck,
  notas: BookOpen,
  clase: School,
  horario: Calendar,
  eventos: CalendarDays,
  avisos: Bell,
  proyectos: Medal,
};

const moduleColors: Record<SystemModuleId, string> = {
  formacion: 'bg-primary',
  notas: 'bg-accent',
  clase: 'bg-secondary',
  horario: 'bg-purple-500',
  eventos: 'bg-emerald-500',
  avisos: 'bg-amber-500',
  proyectos: 'bg-orange-500',
};

export default function PsicopedagogiaDashboard() {
  const navigate = useNavigate();
  const { userProfile, hasPermission } = useAuth();

  const availableModules = SYSTEM_MODULES.filter(m => hasPermission(m.id));

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>Psicopedagogía</h2>
        <p className="text-slate-500 mt-1">Bienvenido, {userProfile?.displayName}. Selecciona un módulo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {availableModules.map((mod, i) => {
          const Icon = moduleIcons[mod.id];
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', bounce: 0.1 }}
              onClick={() => navigate(`/psicopedagogia/${mod.id}`)}
              className="group relative bg-white rounded-2xl p-5 border-l-[3px] border-y border-r border-slate-200/80 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
              style={{ borderLeftColor: `var(--color-${mod.id === 'formacion' ? 'primary' : mod.id === 'notas' ? 'accent' : mod.id === 'clase' ? 'secondary' : mod.id === 'horario' ? 'purple-500' : mod.id === 'eventos' ? 'emerald-500' : mod.id === 'avisos' ? 'amber-500' : 'orange-500'})` }}
            >
              <div className="flex items-start gap-4">
                <div className={`${moduleColors[mod.id]} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">{mod.label}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>
                </div>
              </div>
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}