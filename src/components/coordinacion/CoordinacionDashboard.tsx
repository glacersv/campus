import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, BookOpen, School, Calendar, CalendarDays, Bell, Medal, Lock } from 'lucide-react';
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

export default function CoordinacionDashboard() {
  const navigate = useNavigate();
  const { userProfile, hasPermission } = useAuth();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;

  const availableModules = SYSTEM_MODULES.filter(m => hasPermission(m.id));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold text-slate-900">Coordinación Académica</h2>
        <p className="text-slate-500 mt-1">Bienvenido, {userProfile?.displayName}. Selecciona un módulo.</p>
      </div>

      {isMonday && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 font-medium">
            Hoy es Lunes - <span className="font-bold">Acto Cívico Automático</span>
          </p>
        </motion.div>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {availableModules.map((mod, i) => {
          const Icon = moduleIcons[mod.id];
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/coordinacion/${mod.id}`)}
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