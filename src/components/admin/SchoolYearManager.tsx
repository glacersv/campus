import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  BookOpen,
  CalendarDays,
  Users,
  ArrowRight,
  GraduationCap,
  Save,
  ChevronDown,
  ChevronUp,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Minus,
  Layers,
  TrendingUp,
  Filter,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllStudents,
  getAllGrades,
  getAllSections,
  getAllBaccalaureateTypes,
  startSchoolYear,
  resetTestData,
  fixAllStudentHistories,
  getCurrentSchoolYear,
  YearSectionConfig
} from '../../lib/firestore';
import { Student, Grade, Section, BaccalaureateTypeDoc, Cycle, CYCLE_NAMES } from '../../types';
import {
  MigrationPlanRow,
  buildMigrationRows,
  resizeNames,
  distributeStudents,
  isActiveStudent
} from '../../lib/migration';

const CYCLE_LABEL: Record<Cycle, string> = {
  'parvularia': 'Parvularia',
  '1': 'Primer Ciclo',
  '2': 'Segundo Ciclo',
  '3': 'Tercer Ciclo',
  '4': 'Bachillerato'
};

const CYCLE_KEYS: Cycle[] = ['parvularia', '1', '2', '3', '4'];

export default function SchoolYearManager() {
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [rows, setRows] = useState<MigrationPlanRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  // Filtering and view state
  const [selectedCycle, setSelectedCycle] = useState<Cycle | 'all'>('all');

  // Manual year input
  const [manualYear, setManualYear] = useState<string>('');
  const [yearWarning, setYearWarning] = useState<{ type: 'error' | 'warning' | 'info'; message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [stud, gra, sec, bts, cy] = await Promise.all([
        getAllStudents(),
        getAllGrades(),
        getAllSections(),
        getAllBaccalaureateTypes(),
        getCurrentSchoolYear()
      ]);
      setStudents(stud);
      setCurrentYear(cy);
      setRows(buildMigrationRows(stud, gra, sec, bts, cy));
      if (cy) {
        setManualYear(String(cy + 1));
      } else {
        setManualYear(String(new Date().getFullYear()));
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar los datos de planificación');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Validate year input
  useEffect(() => {
    const yearInt = parseInt(manualYear, 10);
    if (!manualYear || isNaN(yearInt)) {
      setYearWarning({ type: 'error', message: 'Ingrese un año válido' });
      return;
    }

    const now = new Date();
    const currentCalendarYear = now.getFullYear();

    if (currentYear === null) {
      if (yearInt < currentCalendarYear) {
        setYearWarning({
          type: 'error',
          message: `El año ${yearInt} es anterior al año actual (${currentCalendarYear}). Se recomienda iniciar con el año en curso o próximo.`
        });
      } else if (yearInt > currentCalendarYear + 1) {
        setYearWarning({
          type: 'warning',
          message: `El año ${yearInt} está más de un año adelante. Asegúrese de que esto sea intencional.`
        });
      } else if (yearInt === currentCalendarYear) {
        setYearWarning({
          type: 'info',
          message: `Iniciando año lectivo ${yearInt} (año en curso)`
        });
      } else {
        setYearWarning({
          type: 'info',
          message: `Año ${yearInt} seleccionado correctamente`
        });
      }
    } else {
      if (yearInt <= currentYear) {
        setYearWarning({
          type: 'error',
          message: `El año ${yearInt} es igual o anterior al año lectivo actual (${currentYear}). No se puede retroceder en el tiempo.`
        });
      } else if (yearInt > currentYear + 1) {
        setYearWarning({
          type: 'warning',
          message: `Está saltando de ${currentYear} a ${yearInt}. Se omitirán ${yearInt - currentYear - 1} año(s) lectivo(s).`
        });
      } else if (yearInt === currentYear + 1) {
        setYearWarning({
          type: 'info',
          message: `Próximo año lectivo (${yearInt}) seleccionado correctamente`
        });
      } else {
        setYearWarning(null);
      }
    }
  }, [manualYear, currentYear]);

  const targetYear = parseInt(manualYear, 10) || (currentYear ? currentYear + 1 : 2026);

  const updateCount = (gradeId: string, count: number) => {
    const c = Math.max(1, Math.min(6, count));
    setRows(prev =>
      prev.map(r =>
        r.gradeId === gradeId
          ? { ...r, newSectionNames: resizeNames(r.newSectionNames, c) }
          : r
      )
    );
  };

  const updateName = (gradeId: string, index: number, value: string) => {
    setRows(prev =>
      prev.map(r =>
        r.gradeId === gradeId
          ? {
              ...r,
              newSectionNames: r.newSectionNames.map((n, i) =>
                i === index ? value.toUpperCase() : n
              )
            }
          : r
      )
    );
  };

  const totalIncoming = rows.reduce((sum, r) => sum + r.incomingCount, 0);
  const totalGraduates = rows
    .filter(r => r.nextGradeId === null)
    .reduce((sum, r) => sum + r.outgoingCount, 0);
  const totalSections = rows.reduce(
    (sum, r) => sum + r.newSectionNames.filter(n => n.trim()).length,
    0
  );

  const getDistribution = (r: MigrationPlanRow) => {
    const sourceStudents = students.filter(
      s => isActiveStudent(s) && s.gradeId === r.sourceGradeId
    );
    const names = r.newSectionNames.filter(n => n.trim());
    return distributeStudents(sourceStudents, names).counts;
  };

  const handleStart = async () => {
    if (submitting) return;

    const yearInt = parseInt(manualYear, 10);
    if (isNaN(yearInt)) {
      toast.error('Por favor ingrese un año válido');
      return;
    }

    if (yearWarning?.type === 'error') {
      toast.error(yearWarning.message);
      return;
    }

    if (yearWarning?.type === 'warning') {
      if (!confirm(`ADVERTENCIA: ${yearWarning.message}\n\n¿Está seguro de continuar?`)) {
        return;
      }
    }

    if (
      !confirm(
        `¿Confirmas el inicio del año escolar ${yearInt}? \n\nEsta operación promoverá automáticamente a los estudiantes activos e inicializará el nuevo período lectivo.`
      )
    )
      return;

    const config: YearSectionConfig[] = rows
      .filter(r => r.newSectionNames.some(n => n.trim()))
      .map(r => ({
        gradeId: r.gradeId,
        sectionNames: r.newSectionNames.filter(n => n.trim())
      }));

    setSubmitting(true);
    try {
      await startSchoolYear(yearInt, config);
      toast.success(`¡Año escolar ${yearInt} iniciado exitosamente!`);
      setLoading(true);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Ocurrió un error al procesar el cambio de año escolar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        '¿Ejecutar Reset de Escenario? Se restablecerá la base de datos de pruebas para simular nuevamente los flujos de migración.'
      )
    )
      return;
    try {
      await resetTestData();
      toast.success('Escenario de pruebas restablecido correctamente');
      setLoading(true);
      await loadData();
    } catch (err) {
      toast.error('Error al restablecer escenario de pruebas');
      console.error(err);
    }
  };

  const handleFixHistories = async () => {
    if (
      !confirm(
        '¿Deseas recalcular cronológicamente los historiales académicos de TODOS los alumnos? Esto se basará en su carnet o año de ingreso.'
      )
    )
      return;
    try {
      await fixAllStudentHistories();
      toast.success('Historiales académicos reconstruidos y corregidos');
      setLoading(true);
      await loadData();
    } catch (err) {
      toast.error('Error al recalcular historiales académicos');
      console.error(err);
    }
  };

  // State for interactive migration tool
  const [migrationSdk, setMigrationSdk] = useState('');
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [runningMigration, setRunningMigration] = useState(false);

  const handleInteractiveMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrationSdk.trim()) {
      toast.error('Por favor, ingresa el archivo de credenciales o Config SDK JSON válido.');
      return;
    }

    let parsedConfig;
    try {
      parsedConfig = JSON.parse(migrationSdk);
    } catch (err) {
      toast.error('La configuración SDK ingresada no es un JSON válido.');
      return;
    }

    if (!confirm('Esta operación borrará temporalmente la colección de alumnos del Firebase destino activo e insertará los registros correspondientes del Firebase origen ingresado. ¿Deseas continuar?')) return;

    setRunningMigration(true);
    setMigrationProgress(10);
    setMigrationStatus('Inicializando conexión con Firebase de origen...');

    try {
      const { initializeApp: initClientApp, deleteApp, getApp } = await import('firebase/app');
      const { getFirestore: getClientFirestore, collection: getClientCollection, getDocs: getClientDocs } = await import('firebase/firestore');

      let sourceApp;
      try {
        sourceApp = initClientApp(parsedConfig, 'source_migration_app');
      } catch (appErr) {
        try {
          sourceApp = getApp('source_migration_app');
        } catch {
          throw new Error('No se pudo inicializar la app origen. Verifica tu JSON SDK.');
        }
      }

      const sourceDb = getClientFirestore(sourceApp);
      setMigrationProgress(30);
      setMigrationStatus('Obteniendo alumnos del Firebase de origen...');

      let oldDocsSnap;
      try {
        oldDocsSnap = await getClientDocs(getClientCollection(sourceDb, 'alumnos'));
      } catch {
        oldDocsSnap = await getClientDocs(getClientCollection(sourceDb, 'students'));
      }

      const rawAlumnos = oldDocsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMigrationProgress(50);
      setMigrationStatus(`Se encontraron ${rawAlumnos.length} alumnos. Limpiando colección actual en destino...`);

      const currentLocalStudents = await getAllStudents();
      const { deleteStudent, createStudent } = await import('../../lib/firestore');

      for (let i = 0; i < currentLocalStudents.length; i++) {
        await deleteStudent(currentLocalStudents[i].id);
      }

      setMigrationProgress(75);
      setMigrationStatus(`Insertando ${rawAlumnos.length} nuevos alumnos reconstruidos en destino...`);

      const defaultYear = new Date().getFullYear();
      let insertedCount = 0;

      for (let i = 0; i < rawAlumnos.length; i++) {
        const a: any = rawAlumnos[i];

        const firstName = a.nombres || a.firstName || '';
        const lastName = a.apellidos || a.lastName || '';
        const name = a.name || `${firstName} ${lastName}`.trim();
        const carnet = a.carnet || a.id;
        const gender = a.sexo === 'FEMENINO' || a.gender === 'F' ? 'F' : 'M';
        const enrollmentYear = parseInt(a.anioIngreso || a.enrollmentYear) || defaultYear;

        const rawGrado = a.gradoActual || a.gradeId || '1';
        let gradeId = '1';
        if (rawGrado.includes('1° Grado') || rawGrado === '1') gradeId = '1';
        else if (rawGrado.includes('2° Grado') || rawGrado === '2') gradeId = '2';
        else if (rawGrado.includes('3° Grado') || rawGrado === '3') gradeId = '3';
        else if (rawGrado.includes('4° Grado') || rawGrado === '4') gradeId = '4';
        else if (rawGrado.includes('5° Grado') || rawGrado === '5') gradeId = '5';
        else if (rawGrado.includes('6° Grado') || rawGrado === '6') gradeId = '6';
        else if (rawGrado.includes('7° Grado') || rawGrado === '7') gradeId = '7';
        else if (rawGrado.includes('8° Grado') || rawGrado === '8') gradeId = '8';
        else if (rawGrado.includes('9° Grado') || rawGrado === '9') gradeId = '9';
        else if (rawGrado.includes('1° Bachillerato') || rawGrado === '10g') gradeId = '10g';
        else if (rawGrado.includes('2° Bachillerato') || rawGrado === '11g') gradeId = '11g';
        else if (rawGrado.includes('1° Diseño') || rawGrado === '11t') gradeId = '11t';
        else if (rawGrado.includes('Preparatoria') || rawGrado === 'k6') gradeId = 'k6';
        else if (rawGrado.includes('Kinder 5') || rawGrado === 'k5') gradeId = 'k5';
        else if (rawGrado.includes('Kinder 4') || rawGrado === 'k4') gradeId = 'k4';

        const rawSeccion = a.seccionId || a.sectionId || 'A';
        const sectionLetter = rawSeccion.includes('-')
          ? rawSeccion.split('-').pop()?.toUpperCase() || 'A'
          : rawSeccion.toUpperCase();
        const cleanLetter = sectionLetter.replace(/[0-9]/g, '').replace('G', '').replace('T', '').toLowerCase();

        const calculatedSectionId = `${defaultYear}-${gradeId}-${cleanLetter}`;

        await createStudent({
          id: `mig_${carnet}`,
          carnet,
          firstName,
          lastName,
          name,
          gender,
          gradeId,
          sectionId: calculatedSectionId,
          enrollmentYear,
          status: 'ACTIVO',
          enrollmentHistory: [
            {
              year: enrollmentYear,
              gradeId,
              sectionId: calculatedSectionId,
              status: 'EN_CURSO'
            }
          ]
        });
        insertedCount++;
      }

      setMigrationProgress(90);
      setMigrationStatus('Ejecutando calibración de historiales de inscripciones...');
      await fixAllStudentHistories();

      try {
        await deleteApp(sourceApp);
      } catch {}

      setMigrationProgress(100);
      setMigrationStatus(`¡Sincronización exitosa! Se migraron ${insertedCount} alumnos.`);
      toast.success('Migración interactiva completada');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setMigrationStatus(`Error en sincronización: ${err.message || err}`);
      toast.error('Fallo en la migración de datos');
    } finally {
      setRunningMigration(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 font-display animate-pulse">
          Cargando planificación del año escolar...
        </p>
      </div>
    );
  }

  // Group rows dynamically by educational cycle
  const groupedRows: Record<string, MigrationPlanRow[]> = {};
  rows.forEach(r => {
    const cy = r.cycle || 'unknown';
    if (!groupedRows[cy]) {
      groupedRows[cy] = [];
    }
    groupedRows[cy].push(r);
  });

  const activeCycles = CYCLE_KEYS.filter(
    c => groupedRows[c] && groupedRows[c].length > 0 && (selectedCycle === 'all' || selectedCycle === c)
  );

  return (
    <div className="space-y-6">
      {/* Institutional Module Header */}
      <div className="module-header flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="module-title-group">
          <div className="module-icon">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Iniciar Año Escolar</h1>
            <p className="module-subtitle">
              Apertura de nuevo período lectivo y planificación de matrícula
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-3xs">
            <span className="text-xs font-bold text-slate-500">Lectivo actual:</span>
            <span className="text-xs font-extrabold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
              {currentYear || '—'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-500">Próximo:</span>
            <input
              type="number"
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
              className="w-20 text-xs font-extrabold text-primary font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-primary/20"
              min={currentYear ? currentYear + 1 : new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
            />
          </div>
        </div>
      </div>

      {/* Year Warning Banner */}
      {yearWarning && (
        <div className={`rounded-xl p-3.5 border flex items-center gap-3 ${
          yearWarning.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : yearWarning.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {yearWarning.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          ) : yearWarning.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          )}
          <span className="text-xs font-semibold">{yearWarning.message}</span>
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="stat-card-icon bg-slate-100">
            <Users className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="stat-card-label block">Alumnos a Promover</span>
            <div className="stat-card-value">{totalIncoming}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-slate-100">
            <GraduationCap className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="stat-card-label block">Egresados a Graduar</span>
            <div className="stat-card-value">{totalGraduates}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon bg-slate-100">
            <Layers className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <span className="stat-card-label block">Nuevas Secciones</span>
            <div className="stat-card-value">{totalSections}</div>
          </div>
        </div>
      </div>

      {/* Cycle Filter Bar */}
      <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex-wrap">
        <button
          type="button"
          onClick={() => setSelectedCycle('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            selectedCycle === 'all' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          Todos
        </button>
        {CYCLE_KEYS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCycle(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycle === c ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            {CYCLE_LABEL[c]}
          </button>
        ))}
      </div>

      {/* Main Configurations Section */}
      <div className="space-y-6">
        {rows.length === 0 ? (
          <div className="text-center py-16 card-crema text-slate-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No se encontraron grados activos configurados en el sistema.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeCycles.map(cycleKey => {
              const cycleRows = groupedRows[cycleKey] || [];
              if (cycleRows.length === 0) return null;

              return (
                <div key={cycleKey} className="space-y-3">
                  {/* Cycle section title */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {CYCLE_LABEL[cycleKey] || cycleKey}
                    </span>
                    <span className="text-xs text-slate-400">({cycleRows.length})</span>
                  </div>

                  {/* Responsive grid of grade migration cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cycleRows.map((r, rowIndex) => {
                      const dist = getDistribution(r);
                      const isReconfigured =
                        r.currentSectionNames.length !==
                        r.newSectionNames.filter(n => n.trim()).length;
                      return (
                        <motion.div
                          key={r.gradeId}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: rowIndex * 0.03, duration: 0.25 }}
                          className="card-crema p-5 flex flex-col justify-between space-y-4"
                        >
                          <div className="space-y-3">
                            {/* Header: Grade & Egreso badge */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-slate-900 leading-tight" title={r.gradeName}>
                                  {r.gradeName}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                                  {CYCLE_LABEL[r.cycle] || r.cycle}
                                </span>
                              </div>

                              <div className="shrink-0">
                                {r.nextGradeId === null ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                                    <GraduationCap className="w-3 h-3" />
                                    Egreso
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-md inline-block max-w-[120px] truncate" title={r.nextGradeName}>
                                    {r.nextGradeName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Student flow */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Flujo de Alumnos</span>
                              </div>
                              <div className="flex justify-between items-center text-xs gap-2">
                                <span className="text-slate-500 font-medium shrink-0">Ingreso (+{r.incomingCount}):</span>
                                <span className="font-bold text-primary truncate text-right" title={r.sourceGradeName}>{r.sourceGradeName}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-t border-slate-100/80 pt-1 mt-1 gap-2">
                                <span className="text-slate-500 font-medium shrink-0">Egreso ({r.outgoingCount}):</span>
                                <span className="font-bold text-slate-700 truncate text-right" title={r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}>
                                  {r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}
                                </span>
                              </div>
                            </div>

                            {/* Current classrooms */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Aulas en Curso
                              </span>
                              {r.currentSectionNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {r.currentSectionNames.map(n => (
                                    <span
                                      key={n}
                                      className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-600 font-bold font-mono text-xs"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  Sin aulas asignadas
                                </span>
                              )}
                            </div>

                            {/* Next year planned sections */}
                            <div className="space-y-1.5 pt-2 border-t border-slate-100">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Aulas {targetYear}
                                </span>
                                {isReconfigured && (
                                  <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Modificado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                                    disabled={r.newSectionNames.length <= 1}
                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors font-bold cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-5 text-center text-xs font-bold text-slate-800 font-mono">
                                    {r.newSectionNames.length}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCount(r.gradeId, r.newSectionNames.length + 1)}
                                    disabled={r.newSectionNames.length >= 6}
                                    className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1 items-center">
                                  {r.newSectionNames.map((n, i) => (
                                    <input
                                      key={i}
                                      value={n}
                                      onChange={e => updateName(r.gradeId, i, e.target.value)}
                                      maxLength={2}
                                      placeholder="A"
                                      title="Identificador de la sección"
                                      className="w-7 h-7 text-center text-xs font-bold uppercase input-crema p-0 rounded-md"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Distribution projection */}
                            <div className="space-y-1 pt-2 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Distribución Proyectada
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(dist).map(([name, count]) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-bold text-slate-600"
                                  >
                                    <span className="text-[10px] text-slate-400 uppercase">Secc. {name}:</span>
                                    <span className="text-primary font-mono">{count}</span>
                                  </span>
                                ))}
                                {Object.keys(dist).length === 0 && (
                                  <span className="text-xs text-slate-400 italic">
                                    Sin alumnos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activation Action Section */}
      <div className="card-crema p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Preservación Histórica de Datos
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Toda la información académica de ciclos lectivos anteriores queda guardada en almacenamiento histórico aislado. Al aperturar el año <span className="font-extrabold text-primary font-mono">{targetYear}</span>, el sistema promoverá automáticamente a los estudiantes.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary px-6 py-3 font-bold text-xs uppercase tracking-wider shrink-0 w-full md:w-auto"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Ejecutando Migración...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Aperturar Año Escolar {targetYear}</span>
            </>
          )}
        </button>
      </div>

      {/* Maintenance Drawer */}
      <div className="card-crema p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-500" />
            <span>Herramientas del Sistema y Calibración de Datos</span>
          </div>
          {maintenanceOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>

        <AnimatePresence>
          {maintenanceOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 border-t border-slate-100 space-y-4">
                <div className="p-3 bg-slate-50 border-l-4 border-slate-400 rounded-r-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase">
                      Consola de Diagnóstico
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Herramientas avanzadas para corregir desalineaciones históricas de padrones o simular escenarios de prueba.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reset Pruebas */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-3">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 uppercase flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Reinicio de Matrícula y Pruebas
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Limpia las secciones temporales de prueba, restableciendo el año lectivo para simular nuevamente los flujos de migración.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-xs py-2 px-3 self-start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between gap-3">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 uppercase">
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Audita y recalcula año por año el historial completo de inscripciones del alumnado activo desde su fecha de ingreso.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 text-xs py-2 px-3 self-start"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Sincronizador Interactivo de Firebase */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 uppercase">
                      Migrador Interactivo y Sincronización de Alumnos (Multi-Firebase SDK)
                    </h6>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Ingresa la configuración Firebase SDK del proyecto de origen.
                      Esta herramienta <strong className="text-red-600">limpiará por completo la colección actual de alumnos</strong> e importará los registros de origen.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        JSON Configuración SDK de Firebase Origen
                      </label>
                      <textarea
                        rows={4}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "..."\n}`}
                        className="w-full text-xs font-mono p-3 input-crema"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600">{migrationStatus}</span>
                          <span className="font-bold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${migrationProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={runningMigration}
                      className="btn-primary text-xs py-2.5 px-4 disabled:opacity-40"
                    >
                      {runningMigration ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sincronizando...</span>
                        </>
                      ) : (
                        <span>Iniciar Sincronización y Limpieza</span>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
