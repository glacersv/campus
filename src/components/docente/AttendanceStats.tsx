import { motion } from 'motion/react';

interface AttendanceStatsProps {
  presentCount: number;
  tardyCount: number;
  absentCount: number;
  disciplineAlertsCount: number;
  totalStudents: number;
}

export default function AttendanceStats({ presentCount, tardyCount, absentCount, disciplineAlertsCount, totalStudents }: AttendanceStatsProps) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
      <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Presentes</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold text-slate-900 font-display tracking-tight">{presentCount}</span>
          <span className="text-xs text-slate-400 font-semibold">/ {totalStudents}</span>
        </div>
        <span className="text-[11px] text-emerald-600 font-bold mt-2 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
          {((presentCount / (totalStudents || 1)) * 100).toFixed(0)}% asistencia
        </span>
      </motion.div>

      <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Llegadas Tarde</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold text-amber-600 font-display tracking-tight">{tardyCount}</span>
        </div>
        <span className="text-[11px] text-slate-500 font-semibold mt-2 bg-slate-100 w-fit px-2 py-0.5 rounded-full">
          Con retardo
        </span>
      </motion.div>

      <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ausentes</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold text-red-600 font-display tracking-tight">{absentCount}</span>
        </div>
        <span className="text-[11px] text-red-600 font-bold mt-2 bg-red-50 w-fit px-2 py-0.5 rounded-full">
          Inasistencias
        </span>
      </motion.div>

      <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl p-5 border border-slate-200/80 flex flex-col justify-between">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Disciplina</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold text-indigo-600 font-display tracking-tight">{disciplineAlertsCount}</span>
        </div>
        <span className="text-[11px] text-indigo-600 font-semibold mt-2 bg-indigo-50 w-fit px-2 py-0.5 rounded-full">
          Observados
        </span>
      </motion.div>
    </section>
  );
}