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
      <motion.div whileHover={{ y: -4 }} className="card p-5 flex flex-col justify-between border-l-4 border-l-emerald-500">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Presentes</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold text-slate-800 font-mono text-emerald-700">{presentCount}</span>
          <span className="text-xs text-slate-400 font-bold">/ {totalStudents}</span>
        </div>
        <span className="text-[10px] text-emerald-600 font-bold mt-2">
          {((presentCount / (totalStudents || 1)) * 100).toFixed(0)}% de asistencia
        </span>
      </motion.div>

      <motion.div whileHover={{ y: -4 }} className="card p-5 flex flex-col justify-between border-l-4 border-l-amber-500">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Llegadas Tarde</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold text-amber-700 font-mono">{tardyCount}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium mt-2">Con retardo</span>
      </motion.div>

      <motion.div whileHover={{ y: -4 }} className="card p-5 flex flex-col justify-between border-l-4 border-l-salesiano-red">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Ausentes</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold text-salesiano-red font-mono">{absentCount}</span>
        </div>
        <span className="text-[10px] text-salesiano-red font-bold mt-2">Inasistencias</span>
      </motion.div>

      <motion.div whileHover={{ y: -4 }} className="card p-5 flex flex-col justify-between border-l-4 border-l-indigo-600">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Faltas de Disciplina</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold text-indigo-700 font-mono">{disciplineAlertsCount}</span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium mt-2">Alumnos observados</span>
      </motion.div>
    </section>
  );
}
