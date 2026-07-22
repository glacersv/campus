import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LogOut,
  Search,
  CheckCircle,
  Sparkles,
  Calendar,
  AlertTriangle,
  UserX
} from 'lucide-react';
import { Teacher, StudentSessionState, Grade, AttendanceStatus, Student } from '../types';
import { getGrade, getStudentsByGrade } from '../lib/firestore';
import InstitutionLogo from './InstitutionLogo';
import SummaryModal from './SummaryModal';
import StudentCard from './dashboard/StudentCard';
import AttendanceStats from './dashboard/AttendanceStats';
import SimulatorControls from './dashboard/SimulatorControls';

interface DashboardProps {
  teacher: Teacher;
  onLogout: () => void;
}

export default function Dashboard({ teacher, onLogout }: DashboardProps) {
  const [activeGrade, setActiveGrade] = useState<Grade | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Simulator State
  const [simulatedTime, setSimulatedTime] = useState('06:40 AM'); // Default on time
  const [civicAct, setCivicAct] = useState(false); // Standard vs Acto Cívico theme shift
  const [searchQuery, setSearchQuery] = useState('');

  // Attendance Records: studentId -> StudentSessionState
  const [records, setRecords] = useState<Record<string, StudentSessionState>>({});
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Fetch grade and students
  useEffect(() => {
    async function loadData() {
      if (!teacher.guideGradeId) {
        setLoadingData(false);
        return;
      }
      try {
        const gradeData = await getGrade(teacher.guideGradeId);
        setActiveGrade(gradeData);
        if (gradeData) {
          const studentsData = await getStudentsByGrade(gradeData.id);
          setStudents(studentsData);
          
          const initialRecords: Record<string, StudentSessionState> = {};
          studentsData.forEach((s) => {
            initialRecords[s.id] = {
              studentId: s.id,
              status: 'Presente',
              discipline: {
                cabelloLargo: false,
                unasPintadas: false,
                uniformeIncorrecto: false
              }
            };
          });
          setRecords(initialRecords);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoadingData(false);
      }
    }
    loadData();
  }, [teacher.guideGradeId]);

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
    students.forEach((s) => {
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
  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // Stats calculation
  const totalStudents = students.length;
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

  if (loadingData) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cargando Asistencia...</span>
        </div>
      </div>
    );
  }

  if (!activeGrade) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-bold text-slate-800">No tienes un grado guía asignado</h2>
        <button onClick={onLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg">Cerrar Sesión</button>
      </div>
    );
  }

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
          <div className="flex-1 bg-white/40 backdrop-blur-md p-8 overflow-y-auto relative">
            {/* Header section with Stats */}
            <header className="mb-8 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black font-display tracking-tight text-slate-800 uppercase">
                      {activeGrade.name} {teacher.guideSectionId ? `"${teacher.guideSectionId.toUpperCase()}"` : ''}
                    </h1>
                    <span className="text-xs bg-red-100/80 backdrop-blur-sm text-red-800 border border-red-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                      Acceso Bloqueado
                    </span>
                  </div>
                  <p className={`text-xs ${civicAct ? 'text-slate-700 font-medium' : 'text-slate-500'}`}>
                    Nómina oficial asignada exclusivamente al docente tutor.
                  </p>
                </div>
              </div>
            </header>
          </div>

          <SimulatorControls simulatedTime={simulatedTime} onTimeChange={setSimulatedTime} />
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

          <AttendanceStats
            presentCount={presentCount}
            tardyCount={tardyCount}
            absentCount={absentCount}
            disciplineAlertsCount={disciplineAlertsCount}
            totalStudents={totalStudents}
          />

          {/* Student list controls */}
          <div className="flex justify-between items-center card p-4 mb-6 gap-4 relative z-10">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                placeholder="Buscar alumno por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <div className="text-xs text-slate-600 font-bold bg-white/50 px-3 py-1.5 rounded-md">
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

                return (
                  <StudentCard
                    key={student.id}
                    student={student}
                    record={record}
                    onUpdateAttendance={updateAttendance}
                    onToggleDiscipline={toggleDiscipline}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Action Bar Footer */}
        <footer className="h-20 bg-white/80 backdrop-blur-md border-t border-slate-200/50 px-8 flex items-center justify-between shrink-0 relative z-20">
          <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">
            Fecha: {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <button
            onClick={() => setIsSummaryOpen(true)}
            className="btn-primary"
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
        students={students}
      />
    </div>
  );
}
