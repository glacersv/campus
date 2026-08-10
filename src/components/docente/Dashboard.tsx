import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  LogOut,
  Search,
  CheckCircle,
  Calendar,
  AlertTriangle,
  UserX
} from 'lucide-react';
import { Teacher, StudentSessionState, Grade, AttendanceStatus, Student } from '../../types';
import { getGrade, getStudentsByGrade } from '../../lib/firestore';
import InstitutionLogo from '../shared/InstitutionLogo';
import SummaryModal from './SummaryModal';
import StudentCard from './StudentCard';
import AttendanceStats from './AttendanceStats';
import SimulatorControls from './SimulatorControls';
import ThemeSwitcher from '../shared/ThemeSwitcher';

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
      <div className="flex h-screen bg-[#F3F5F6] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando Asistencia...</span>
        </div>
      </div>
    );
  }

  if (!activeGrade) {
    return (
      <div className="flex h-screen bg-[#F3F5F6] items-center justify-center flex-col gap-4">
        <h2 className="text-xl font-bold text-slate-900">No tienes un grado guía asignado</h2>
        <button onClick={onLogout} className="btn-primary">Cerrar Sesión</button>
      </div>
    );
  }

  return (
    <div id="app-dashboard" className="flex h-screen bg-[#F3F5F6] overflow-hidden font-sans">
      {/* 1. Sidebar Navigation */}
      <aside className="w-80 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 text-slate-900 z-20">
        <div className="flex flex-col">
          {/* Institution Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col items-center">
            <InstitutionLogo className="w-16 h-16 mb-3" />
            <h2 className="text-sm font-bold font-display uppercase tracking-widest text-primary text-center">
              Salesiano San José
            </h2>
            <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-0.5 text-center">
              Educación para el Corazón
            </p>
          </div>

          {/* Teacher Profile Info */}
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div className="overflow-hidden">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                Docente Logueado
              </span>
              <span className="text-sm font-bold block truncate font-display text-slate-900">
                {teacher.name}
              </span>
              <span className="text-[11px] text-slate-500 truncate block font-medium">
                {teacher.email}
              </span>
            </div>
          </div>

          {/* Configuration and Mode selection */}
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">
              <Calendar className="w-4 h-4 text-secondary-dark" />
              <span>Modalidad de Jornada:</span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setCivicAct(false)}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  !civicAct
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className="block font-bold">Buenos Días Regular</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Formación matutina tradicional</span>
                </div>
                {!civicAct && <div className="w-2 h-2 rounded-full bg-primary shrink-0 ml-2" />}
              </button>

              <button
                onClick={() => setCivicAct(true)}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all ${
                  civicAct
                    ? 'bg-secondary text-primary border-secondary shadow-sm'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                <div>
                  <span className="block font-bold">Acto Cívico</span>
                  <span className="text-[10px] text-slate-400 block font-normal">Lunes o efemérides patrias</span>
                </div>
                {civicAct && <div className="w-2 h-2 rounded-full bg-primary shrink-0 ml-2" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer with sign out */}
        <div className="p-5 border-t border-slate-100 space-y-3">
          <div className="flex justify-center">
            <ThemeSwitcher />
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs rounded-full transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* 2. Main Work Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dynamic Header Banner */}
        <header
          className={`h-20 px-8 flex items-center justify-between border-b border-slate-200 shrink-0 transition-all ${
            civicAct ? 'bg-secondary text-primary' : 'bg-white text-slate-800'
          }`}
        >
          <div className="flex-1 p-8 overflow-y-auto relative">
            <header className="mb-8 relative z-10">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-black font-display tracking-tight text-slate-900 uppercase">
                      {activeGrade.name} {teacher.guideSectionId ? `"${teacher.guideSectionId.toUpperCase()}"` : ''}
                    </h1>
                    <span className="text-xs bg-red-100 text-red-800 border border-red-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                      Acceso Bloqueado
                    </span>
                  </div>
                  <p className={`text-xs ${civicAct ? 'text-primary/80 font-medium' : 'text-slate-500'}`}>
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
              className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs flex items-center gap-2.5 font-medium"
            >
              <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0" />
              <span>
                <strong>Modo Simulación Activo:</strong> La hora de llegada actual está establecida a las <strong>06:46 AM</strong>. Cualquier alumno que sea marcado como <strong>&ldquo;Tarde&rdquo;</strong> registrará automáticamente esta hora como su tiempo de retardo.
              </span>
            </motion.div>
          )}

          {civicAct && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center gap-2.5 font-medium"
            >
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
          <div className="flex justify-between items-center bg-white rounded-2xl p-4 border border-slate-200/80 gap-4 relative z-10">
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
            <div className="text-xs text-slate-600 font-bold bg-slate-50 px-3 py-1.5 rounded-full">
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
        <footer className="h-20 bg-white border-t border-slate-200 px-8 flex items-center justify-between shrink-0 relative z-20">
          <div className="text-xs text-slate-600 font-bold uppercase tracking-wider">
            Fecha: {new Date().toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <button
            onClick={() => setIsSummaryOpen(true)}
            className="btn-primary rounded-full"
          >
            <CheckCircle className="w-4 h-4 text-secondary" />
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
