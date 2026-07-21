import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LogOut,
  Search,
  UserCheck,
  Clock,
  Scissors,
  CheckCircle,
  FileText,
  Sparkles,
  Calendar,
  AlertCircle,
  AlertTriangle,
  Flame,
  CheckSquare,
  Square,
  UserX
} from 'lucide-react';
import { Teacher, StudentSessionState, Grade, AttendanceStatus } from '../types';
import { STUDENTS, GRADES } from '../data';
import InstitutionLogo from './InstitutionLogo';
import SummaryModal from './SummaryModal';

interface DashboardProps {
  teacher: Teacher;
  onLogout: () => void;
}

export default function Dashboard({ teacher, onLogout }: DashboardProps) {
  const activeGrade = GRADES.find((g) => g.id === teacher.gradeId) || GRADES[0];

  // Simulator State
  const [simulatedTime, setSimulatedTime] = useState('06:40 AM'); // Default on time
  const [civicAct, setCivicAct] = useState(false); // Standard vs Acto Cívico theme shift
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance Records: studentId -> StudentSessionState
  const [records, setRecords] = useState<Record<string, StudentSessionState>>({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Initialize records for this grade's students
  useEffect(() => {
    const initialRecords: Record<string, StudentSessionState> = {};
    STUDENTS.filter((s) => s.gradeId === activeGrade.id).forEach((s) => {
      initialRecords[s.id] = {
        studentId: s.id,
        status: 'Presente', // Default to present
        discipline: {
          cabelloLargo: false,
          unasPintadas: false,
          uniformeIncorrecto: false
        }
      };
    });
    setRecords(initialRecords);
  }, [activeGrade, teacher]);

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setRecords((prev) => {
      const current = prev[studentId] || {
        studentId,
        status: 'Presente',
        discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
      };

      // If status changes to Tarde, capture the simulated arrival time
      const arrivalTime = status === 'Tarde' ? simulatedTime : undefined;

      return {
        ...prev,
        [studentId]: {
          ...current,
          status,
          arrivalTime
        }
      };
    });
  };

  const toggleDiscipline = (studentId: string, field: 'cabelloLargo' | 'unasPintadas' | 'uniformeIncorrecto') => {
    setRecords((prev) => {
      const current = prev[studentId] || {
        studentId,
        status: 'Presente',
        discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
      };

      return {
        ...prev,
        [studentId]: {
          ...current,
          discipline: {
            ...current.discipline,
            [field]: !current.discipline[field]
          }
        }
      };
    });
  };

  const handleReset = () => {
    const cleared: Record<string, StudentSessionState> = {};
    STUDENTS.filter((s) => s.gradeId === activeGrade.id).forEach((s) => {
      cleared[s.id] = {
        studentId: s.id,
        status: 'Presente',
        discipline: {
          cabelloLargo: false,
          unasPintadas: false,
          uniformeIncorrecto: false
        }
      };
    });
    setRecords(cleared);
    setIsSummaryOpen(false);
  };

  // Filter students
  const filteredStudents = STUDENTS.filter(
    (student) =>
      student.gradeId === activeGrade.id &&
      student.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Stats calculation
  const totalStudents = STUDENTS.filter((s) => s.gradeId === activeGrade.id).length;
  let presentCount = 0;
  let tardyCount = 0;
  let absentCount = 0;
  let disciplineAlertsCount = 0;

  (Object.values(records) as StudentSessionState[]).forEach((r) => {
    if (r.status === 'Presente') presentCount++;
    else if (r.status === 'Tarde') {
      presentCount++;
      tardyCount++;
    } else if (r.status === 'Ausente') absentCount++;

    if (r.discipline.cabelloLargo || r.discipline.unasPintadas || r.discipline.uniformeIncorrecto) {
      disciplineAlertsCount++;
    }
  });

  return (
    <div id="app-dashboard" className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* 1. Sidebar Navigation (Solid green, no gradients) */}
      <aside className="w-80 bg-salesiano-green-dark border-r-2 border-slate-900 flex flex-col justify-between shrink-0 text-white z-20">
        <div className="flex flex-col">
          {/* Institution Header with high-fidelity Logo */}
          <div className="p-6 bg-salesiano-green border-b border-slate-900 flex flex-col items-center">
            <InstitutionLogo className="w-20 h-20 mb-3" />
            <h2 className="text-sm font-bold font-display uppercase tracking-widest text-salesiano-yellow text-center">
              Salesiano San José
            </h2>
            <p className="text-[10px] text-emerald-100 font-medium tracking-wider uppercase mt-0.5 text-center">
              Educación para el Corazón
            </p>
          </div>

          {/* Teacher Profile Info */}
          <div className="p-6 border-b border-slate-900 bg-slate-900/40 flex items-center gap-3">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-salesiano-yellow shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-salesiano-yellow uppercase tracking-wider block">
                Docente Logueado
              </span>
              <span className="text-sm font-bold block truncate font-display text-slate-100">
                {teacher.name}
              </span>
              <span className="text-[11px] text-emerald-100 truncate block font-medium">
                {teacher.email}
              </span>
            </div>
          </div>

          {/* Configuration and Mode selection */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2">
              <Calendar className="w-4 h-4 text-salesiano-yellow" />
              <span>Modalidad de Jornada:</span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setCivicAct(false)}
                className={`w-full p-3 rounded-lg border-2 text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  !civicAct
                    ? 'bg-salesiano-green border-salesiano-yellow text-white font-bold'
                    : 'bg-slate-900/30 border-transparent text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <span className="block font-bold">Buenos Días Regular</span>
                  <span className="text-[10px] text-emerald-100 opacity-90 block font-normal">Formación matutina tradicional</span>
                </div>
                {!civicAct && <div className="w-2 h-2 rounded-full bg-salesiano-yellow shrink-0 ml-2" />}
              </button>

              <button
                onClick={() => setCivicAct(true)}
                className={`w-full p-3 rounded-lg border-2 text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  civicAct
                    ? 'bg-salesiano-yellow border-slate-900 text-slate-900 font-bold'
                    : 'bg-slate-900/30 border-transparent text-slate-300 hover:bg-slate-900/50'
                }`}
              >
                <div>
                  <span className="block font-bold">Acto Cívico</span>
                  <span className="text-[10px] opacity-90 block font-normal text-slate-700">Lunes o efemérides patrias</span>
                </div>
                {civicAct && <div className="w-2 h-2 rounded-full bg-slate-900 shrink-0 ml-2" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer with sign out */}
        <div className="p-6 border-t border-slate-900 bg-slate-900/20">
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-red-800 hover:bg-red-900 border border-red-950 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. Main Work Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic Header Banner (Civic Act Shift - Golden yellow vs Green, no gradients) */}
        <header
          className={`h-20 px-8 flex items-center justify-between border-b-2 border-slate-900 shrink-0 transition-all ${
            civicAct ? 'bg-salesiano-yellow text-slate-900' : 'bg-white text-slate-800'
          }`}
        >
          {/* Grade display & Locker status */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black font-display tracking-tight uppercase">
                  {activeGrade.name}
                </h1>
                <span className="text-[10px] bg-red-100 text-red-800 border border-red-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                  Acceso Bloqueado
                </span>
              </div>
              <p className={`text-xs ${civicAct ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                Nómina oficial asignada exclusivamente al docente tutor.
              </p>
            </div>
          </div>

          {/* Time & Clock Simulator Control */}
          <div className="flex items-center gap-3 bg-slate-900/10 p-2 rounded-lg border border-slate-900/10 text-xs font-semibold">
            <div className="flex items-center gap-1.5 pr-2 border-r border-slate-900/20">
              <Clock className="w-4 h-4 text-slate-700" />
              <span>Simulador de Hora:</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setSimulatedTime('06:40 AM')}
                className={`px-3 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                  simulatedTime === '06:40 AM'
                    ? 'bg-slate-900 text-white'
                    : 'hover:bg-slate-900/10 text-slate-700'
                }`}
              >
                06:40 AM (A tiempo)
              </button>
              <button
                onClick={() => setSimulatedTime('06:46 AM')}
                className={`px-3 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
                  simulatedTime === '06:46 AM'
                    ? 'bg-salesiano-red text-white'
                    : 'hover:bg-slate-900/10 text-slate-700'
                }`}
              >
                06:46 AM (Tarde)
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Dashboard view */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* Info banner about civic act or simulated delay */}
          {simulatedTime === '06:46 AM' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50 border-2 border-amber-300 rounded-lg text-amber-900 text-xs flex items-center gap-2.5 font-medium"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>Modo Simulación Activo:</strong> La hora de llegada actual está establecida a las <strong>06:46 AM</strong>. Cualquier alumno que sea marcado como <strong>&ldquo;Tarde&rdquo;</strong> registrará automáticamente esta hora como su tiempo de retardo.
              </span>
            </motion.div>
          )}

          {civicAct && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-indigo-50 border-2 border-indigo-300 rounded-lg text-indigo-900 text-xs flex items-center gap-2.5 font-medium"
            >
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              <span>
                <strong>Disposición de Acto Cívico:</strong> Se está utilizando el modo protocolar para los días lunes o efemérides nacionales. Los datos serán archivados bajo esta modalidad.
              </span>
            </motion.div>
          )}

          {/* Interactive Statistics Cards (No gradients, clear border design) */}
          <section className="grid grid-cols-5 gap-4">
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-premium">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Estudiantes</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-800 font-mono">{totalStudents}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Nómina total</span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-premium border-l-4 border-l-emerald-600">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Presentes</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-slate-850 font-mono text-emerald-700">{presentCount}</span>
                <span className="text-xs text-slate-400">/{totalStudents}</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1">
                {((presentCount / (totalStudents || 1)) * 100).toFixed(0)}% de asistencia
              </span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-premium border-l-4 border-l-amber-500">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Llegadas Tarde</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-amber-700 font-mono">{tardyCount}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Con retardo</span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-premium border-l-4 border-l-salesiano-red">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ausentes</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-salesiano-red font-mono">{absentCount}</span>
              </div>
              <span className="text-[10px] text-salesiano-red font-bold mt-1">Inasistencias</span>
            </div>

            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-premium border-l-4 border-l-indigo-600">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Faltas de Disciplina</span>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-indigo-700 font-mono">{disciplineAlertsCount}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-1">Alumnos observados</span>
            </div>
          </section>

          {/* Student list controls */}
          <div className="flex justify-between items-center bg-white p-4 border-2 border-slate-200 rounded-xl shadow-premium gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Buscar alumno por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-salesiano-green focus:border-transparent transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 font-semibold">
              Mostrando {filteredStudents.length} de {totalStudents} alumnos inscritos
            </div>
          </div>

          {/* Student Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredStudents.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                <UserX className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No se encontraron alumnos con ese nombre.</p>
                <p className="text-xs mt-1">Verifique la búsqueda o limpie el filtro.</p>
              </div>
            ) : (
              filteredStudents.map((student) => {
                const record = records[student.id] || {
                  studentId: student.id,
                  status: 'Presente',
                  discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
                };

                const cardBorderColor =
                  record.status === 'Ausente'
                    ? 'border-l-salesiano-red'
                    : record.status === 'Tarde'
                    ? 'border-l-amber-500'
                    : 'border-l-emerald-600';

                return (
                  <motion.div
                    key={student.id}
                    layout
                    className={`bg-white border-2 border-slate-200 rounded-xl p-5 shadow-premium flex flex-col justify-between relative border-l-4 ${cardBorderColor}`}
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
                      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1">
                        <button
                          onClick={() => updateAttendance(student.id, 'Presente')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            record.status === 'Presente'
                              ? 'bg-emerald-600 text-white'
                              : 'text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Presente
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, 'Tarde')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            record.status === 'Tarde'
                              ? 'bg-amber-500 text-white'
                              : 'text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          Tarde
                        </button>
                        <button
                          onClick={() => updateAttendance(student.id, 'Ausente')}
                          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                            record.status === 'Ausente'
                              ? 'bg-salesiano-red text-white'
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
                              onClick={() => toggleDiscipline(student.id, 'cabelloLargo')}
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
                              onClick={() => toggleDiscipline(student.id, 'unasPintadas')}
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
                            onClick={() => toggleDiscipline(student.id, 'uniformeIncorrecto')}
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
              })
            )}
          </div>
        </div>

        {/* Action Bar Footer */}
        <footer className="h-20 bg-white border-t-2 border-slate-900 px-8 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            Fecha: {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <button
            onClick={() => setIsSummaryOpen(true)}
            className="px-6 py-3 bg-salesiano-green hover:bg-salesiano-green-dark text-white font-extrabold rounded-lg shadow-sm flex items-center gap-2 text-sm transition-all"
          >
            <CheckCircle className="w-4 h-4 text-salesiano-yellow" />
            Finalizar y Reportar
          </button>
        </footer>
      </main>

      {/* 3. Summary Modal */}
      <SummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        teacher={teacher}
        activeGrade={activeGrade}
        civicAct={civicAct}
        records={records}
        onReset={handleReset}
      />
    </div>
  );
}
