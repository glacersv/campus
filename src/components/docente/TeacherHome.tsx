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
  Medal,
  Users,
  CheckSquare
} from 'lucide-react';
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
  formacion: 'bg-primary text-white',
  notas: 'bg-accent text-white',
  clase: 'bg-secondary text-primary',
  horario: 'bg-purple-500 text-white',
  eventos: 'bg-emerald-500 text-white',
  avisos: 'bg-blue-500 text-white',
  proyectos: 'bg-orange-500 text-white',
};

export default function TeacherHome() {
  const navigate = useNavigate();
  const { userProfile, roleConfig } = useAuth();
  const today = new Date();
  const dayOfWeek = today.getDay();
  const isMonday = dayOfWeek === 1;

  const permissions = roleConfig?.permissions || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Welcome banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">¡Bienvenido, {userProfile?.displayName}!</h2>
          <p className="text-slate-500 text-sm mt-1">Este es tu panel docente. Aquí puedes acceder a las herramientas que tienes habilitadas.</p>
        </div>
        <div className="text-left md:text-right shrink-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha de hoy</p>
          <p className="text-sm font-semibold text-slate-700 mt-0.5">
            {today.toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {isMonday && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
        >
          <p className="text-sm text-slate-800 font-medium">
            Hoy es Lunes - <span className="font-bold">Acto Cívico Automático</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">La formación de hoy será en modalidad Acto Cívico.</p>
        </motion.div>
      )}

      {/* Module Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tus Módulos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {SYSTEM_MODULES.map((mod, i) => {
            const hasAccess = permissions.includes(mod.id);
            const Icon = moduleIcons[mod.id];

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  if (hasAccess) {
                    navigate(`/docente/${mod.id}`);
                  }
                }}
                className={`bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-all ${
                  hasAccess ? 'cursor-pointer hover:border-primary/30' : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasAccess ? moduleColors[mod.id] : 'bg-slate-100 text-slate-400'}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900">{mod.label}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.desc}</p>

                    {!hasAccess && (
                      <div className="flex items-center gap-1 mt-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">No habilitado</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
