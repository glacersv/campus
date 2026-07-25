import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, BookOpen, School, Calendar, CalendarDays, Bell, Medal } from 'lucide-react';
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

export default function RegistroDashboard() {
  const navigate = useNavigate();
  const { userProfile, hasPermission } = useAuth();

  const availableModules = SYSTEM_MODULES.filter(m => hasPermission(m.id));

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Registro Académico</h2>
        <p className="text-slate-500 mt-1">Bienvenido, {userProfile?.displayName}. Selecciona un módulo.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {availableModules.map((mod, i) => {
          const Icon = moduleIcons[mod.id];
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/registro/${mod.id}`)}
              className="module-card text-left cursor-pointer"
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}