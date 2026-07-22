import React from 'react';
import { motion } from 'motion/react';
import { Scissors, AlertCircle, UserCheck } from 'lucide-react';
import { Student, StudentSessionState, AttendanceStatus } from '../../types';

interface StudentCardProps {
  student: Student;
  record: StudentSessionState;
  onUpdateAttendance: (studentId: string, status: AttendanceStatus) => void;
  onToggleDiscipline: (studentId: string, field: 'cabelloLargo' | 'unasPintadas' | 'uniformeIncorrecto') => void;
}

export default function StudentCard({
  student,
  record,
  onUpdateAttendance,
  onToggleDiscipline
}: StudentCardProps) {
  const cardBorderColor =
    record.status === 'Ausente'
      ? 'border-l-salesiano-red'
      : record.status === 'Tarde'
      ? 'border-l-amber-500'
      : 'border-l-emerald-600';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      className={`card p-5 flex flex-col justify-between relative border-l-4 ${cardBorderColor}`}
    >
      <div className="flex justify-between items-start gap-3">
        {/* Name and Gender Indicator */}
        <div className="flex gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-display shrink-0 ${
            student.gender === 'M' ? 'bg-blue-50 text-salesiano-blue' : 'bg-pink-50 text-pink-700'
          }`}>
            {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-snug">{student.name}</h3>
            <div className="flex gap-2 items-center mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase">
                {student.gender === 'M' ? 'Varonil (V)' : 'Femenino (S)'}
              </span>
              {record.status === 'Tarde' && record.arrivalTime && (
                <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.2 rounded font-mono">
                  Retardo {record.arrivalTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Attendance Selector Group */}
        <div className="flex bg-slate-100/50 backdrop-blur-sm p-1 rounded-lg border border-slate-200 gap-1 shadow-inner">
          <button
            onClick={() => onUpdateAttendance(student.id, 'Presente')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              record.status === 'Presente'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            Presente
          </button>
          <button
            onClick={() => onUpdateAttendance(student.id, 'Tarde')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              record.status === 'Tarde'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            Tarde
          </button>
          <button
            onClick={() => onUpdateAttendance(student.id, 'Ausente')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              record.status === 'Ausente'
                ? 'bg-salesiano-red text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-200'
            }`}
          >
            Ausente
          </button>
        </div>
      </div>

      {/* Gender Specific Discipline Controls */}
      {record.status !== 'Ausente' && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
            Incidencias de Uniforme o Aspecto
          </span>
          <div className="flex flex-wrap gap-2">
            {/* 1. Cabello Largo (Male only) */}
            {student.gender === 'M' && (
              <button
                onClick={() => onToggleDiscipline(student.id, 'cabelloLargo')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  record.discipline.cabelloLargo
                    ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 shrink-0" />
                Cabello Largo
              </button>
            )}

            {/* 2. Uñas Pintadas (Female only) */}
            {student.gender === 'F' && (
              <button
                onClick={() => onToggleDiscipline(student.id, 'unasPintadas')}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  record.discipline.unasPintadas
                    ? 'bg-red-100 border-red-350 text-red-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                Uñas Pintadas/Acrílicas
              </button>
            )}

            {/* 3. Uniforme Incorrecto (Both) */}
            <button
              onClick={() => onToggleDiscipline(student.id, 'uniformeIncorrecto')}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all ${
                record.discipline.uniformeIncorrecto
                  ? 'bg-orange-100 border-orange-400 text-orange-900 shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              Uniforme Incorrecto
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
