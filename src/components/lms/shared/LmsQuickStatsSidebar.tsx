import React from 'react';
import { Clock } from 'lucide-react';
import { LMSActivity } from '../../../types';

interface LmsQuickStatsSidebarProps {
  userName?: string;
  userRole?: string;
  upcomingActivities?: LMSActivity[];
  onActivityClick?: (activityId: string) => void;
}

export const LmsQuickStatsSidebar: React.FC<LmsQuickStatsSidebarProps> = ({
  userName = 'Estudiante Salesiano',
  userRole = 'Alumno',
  upcomingActivities = [],
  onActivityClick,
}) => {
  return (
    <aside className="w-full xl:w-72 shrink-0 space-y-5">
      {/* User profile card */}
      <div className="card-crema p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#25855A] text-white flex items-center justify-center font-display font-bold text-sm shadow-sm">
          {userName
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-display font-bold text-slate-900 text-sm truncate">
            {userName}
          </h4>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700">En línea</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">{userRole}</span>
          </div>
        </div>
      </div>

      {/* Próximas Entregas LMS */}
      <div className="card-crema p-4.5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wider">
            Próximas Entregas
          </h4>
          <span className="text-[11px] font-bold text-[#25855A] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            LMS
          </span>
        </div>

        {upcomingActivities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Sin entregas pendientes</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingActivities.slice(0, 3).map((act) => (
              <div
                key={act.id}
                onClick={() => onActivityClick?.(act.id)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 hover:border-[#25855A]/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span
                    className="font-bold truncate max-w-[130px]"
                    style={{ color: act.courseColor || '#0D71B9' }}
                  >
                    {act.courseName}
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(act.dueDate).toLocaleDateString('es-SV', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 line-clamp-1 group-hover:text-[#25855A] transition-colors">
                  {act.title}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default LmsQuickStatsSidebar;
