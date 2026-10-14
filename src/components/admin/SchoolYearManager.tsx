import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  BookOpen,
  CalendarDays,
  Calendar,
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
import { Student, Grade, Section, BaccalaureateTypeDoc, Cycle } from '../../types';
import {
  MigrationPlanRow,
  buildMigrationRows,
  resizeNames,
  distributeStudents,
  isActiveStudent
} from '../../lib/migration';

const CYCLE_LABEL: Record<string, string> = {
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
  
  // New state for manual year input
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
      // Set default manual year to next year
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

  // Validate year input and show warnings
  useEffect(() => {
    const yearInt = parseInt(manualYear, 10);
    if (!manualYear || isNaN(yearInt)) {
      setYearWarning({ type: 'error', message: 'Ingrese un año válido' });
      return;
    }

    const now = new Date();
    const currentCalendarYear = now.getFullYear();
    
    if (currentYear === null) {
      // No year initialized yet
      if (yearInt < currentCalendarYear) {
        setYearWarning({ 
          type: 'error', 
          message: `⚠️ El año ${yearInt} es anterior al año actual (${currentCalendarYear}). Se recomienda iniciar con el año en curso o próximo.` 
        });
      } else if (yearInt > currentCalendarYear + 1) {
        setYearWarning({ 
          type: 'warning', 
          message: `⚠️ El año ${yearInt} está más de un año adelante. Asegúrese de que esto sea intencional.` 
        });
      } else if (yearInt === currentCalendarYear) {
        setYearWarning({ 
          type: 'info', 
          message: `ℹ️ Iniciando año lectivo ${yearInt} (año en curso)` 
        });
      } else {
        setYearWarning({ 
          type: 'info', 
          message: `✓ Año ${yearInt} seleccionado correctamente` 
        });
      }
    } else {
      // Year already initialized
      if (yearInt <= currentYear) {
        setYearWarning({ 
          type: 'error', 
          message: `⚠️ El año ${yearInt} es igual o anterior al año lectivo actual (${currentYear}). No se puede retroceder en el tiempo.` 
        });
      } else if (yearInt > currentYear + 1) {
        setYearWarning({ 
          type: 'warning', 
          message: `⚠️ Está saltando de ${currentYear} a ${yearInt}. Se omitirán ${yearInt - currentYear - 1} año(s) lectivo(s).` 
        });
      } else if (yearInt === currentYear + 1) {
        setYearWarning({ 
          type: 'info', 
          message: `✓ Próximo año lectivo (${yearInt}) seleccionado correctamente` 
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
    
    // Validate year input
    const yearInt = parseInt(manualYear, 10);
    if (isNaN(yearInt)) {
      toast.error('Por favor ingrese un año válido');
      return;
    }

    // Block if error warning
    if (yearWarning?.type === 'error') {
      toast.error(yearWarning.message);
      return;
    }

    // Extra confirmation for warnings
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

  // State for interactive migration and data cleanup tool
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

      // Buscamos la colección "alumnos" (o "students" si ya tiene el nuevo formato)
      let oldDocsSnap;
      try {
        oldDocsSnap = await getClientDocs(getClientCollection(sourceDb, 'alumnos'));
      } catch {
        oldDocsSnap = await getClientDocs(getClientCollection(sourceDb, 'students'));
      }

      const rawAlumnos = oldDocsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMigrationProgress(50);
      setMigrationStatus(`Se encontraron ${rawAlumnos.length} alumnos. Limpiando colección actual en destino...`);

      // Limpiar alumnos locales
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

        // Mapear campos desde el formato antiguo o conservar si ya tiene el nuevo formato
        const firstName = a.nombres || a.firstName || '';
        const lastName = a.apellidos || a.lastName || '';
        const name = a.name || `${firstName} ${lastName}`.trim();
        const carnet = a.carnet || a.id;
        const gender = a.sexo === 'FEMENINO' || a.gender === 'F' ? 'F' : 'M';
        const enrollmentYear = parseInt(a.anioIngreso || a.enrollmentYear) || defaultYear;

        // Determinar gradoID mapeable
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

        // Creamos sección de este año por defecto
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

      // Limpiar app origen para evitar colisión de memoria
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
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-secondary font-display animate-pulse">
          Cargando planificación del año escolar...
        </p>
      </div>
    );
  }

  // Group rows dynamically by educational cycle
  const cycleOrder = ['parvularia', '1', '2', '3', '4'];
  const groupedRows: Record<string, MigrationPlanRow[]> = {};
  rows.forEach(r => {
    const cy = r.cycle || 'unknown';
    if (!groupedRows[cy]) {
      groupedRows[cy] = [];
    }
    groupedRows[cy].push(r);
  });

  const activeCycles = cycleOrder.filter(c => groupedRows[c] && groupedRows[c].length > 0);
  Object.keys(groupedRows).forEach(c => {
    if (!activeCycles.includes(c)) {
      activeCycles.push(c);
    }
  });

  const visibleCycles = selectedCycle === 'all'
    ? activeCycles
    : activeCycles.filter(c => c === selectedCycle);

  return (
    <div className="space-y-8 fade-in max-w-7xl mx-auto pb-12">
      {/* Module Header */}
      <div className="module-header flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="module-title-group">
          <div className="module-icon">
            <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </div>
          <div>
            <h1 className="module-title">Iniciar Año Escolar</h1>
            <p className="module-subtitle">Apertura y planificación del próximo período lectivo</p>
          </div>
        </div>

        {/* Target Year Selector Pill */}
        <div className="flex flex-wrap items-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-3xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Lectivo actual:</span>
          <span className="font-mono font-black text-xs text-primary bg-primary/10 dark:bg-primary/20 px-2.5 py-1 rounded-lg">
            {currentYear || '—'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Próximo año:</span>
          <input
            type="number"
            value={manualYear}
            onChange={(e) => setManualYear(e.target.value)}
            className="w-20 font-mono font-black text-xs text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg py-1 px-2 text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
            min={currentYear ? currentYear + 1 : new Date().getFullYear()}
            max={new Date().getFullYear() + 10}
          />
        </div>
      </div>

      {/* Year Warning Banner */}
      {yearWarning && (
        <div className={`rounded-2xl p-4 border flex items-start gap-3 transition-all ${
          yearWarning.type === 'error' 
            ? 'bg-red-50/90 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
            : yearWarning.type === 'warning'
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
            : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
        }`}>
          {yearWarning.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          ) : yearWarning.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span className="text-xs font-bold leading-relaxed">{yearWarning.message}</span>
        </div>
      )}

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alumnos a promover */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Alumnos a Promover</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{totalIncoming}</span>
          </div>
        </div>

        {/* Card 2: Egresados */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-secondary-dark" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Egresados a Graduar</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{totalGraduates}</span>
          </div>
        </div>

        {/* Card 3: Nuevas Secciones */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-4 shadow-3xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nuevas Secciones</span>
            <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">{totalSections}</span>
          </div>
        </div>
      </div>

      {/* Main Configurations Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
              <TrendingUp className="w-5 h-5 text-primary" />
              Estructura de Promoción y Aulas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure las secciones que estarán disponibles para el período lectivo {targetYear}.
            </p>
          </div>

          {/* Educational Cycle Button Filter Bar */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 overflow-x-auto self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedCycle('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCycle === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              Todos
            </button>
            {CYCLE_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCycle(c)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCycle === c
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                }`}
              >
                {CYCLE_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 card text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No se encontraron grados activos configurados en el sistema.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleCycles.map(cycleKey => {
              const cycleRows = groupedRows[cycleKey];
              return (
                <div key={cycleKey} className="space-y-4">
                  {/* Elegant cycle header divider with count badge */}
                  <div className="flex items-center gap-3 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 font-display flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      {CYCLE_LABEL[cycleKey] || cycleKey}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-slate-200/60 border border-slate-300/30 text-slate-700 text-[10px] font-black rounded-full font-mono">
                      {cycleRows.length} {cycleRows.length === 1 ? 'Grado' : 'Grados'}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Responsive grid of interactive cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                          transition={{ delay: rowIndex * 0.02 }}
                          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-3xs flex flex-col justify-between transition-all duration-200 relative group/card overflow-hidden min-h-[380px]"
                        >
                          <div className="space-y-4">
                            {/* Header: Grade & Cycle */}
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 font-display group-hover/card:text-primary transition-colors leading-tight truncate" title={r.gradeName}>
                                  {r.gradeName}
                                </h4>
                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold border bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-600">
                                  {CYCLE_LABEL[r.cycle] || r.cycle}
                                </span>
                              </div>

                              <div className="shrink-0">
                                {r.nextGradeId === null ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-2 py-1 rounded-full uppercase tracking-wider">
                                    <GraduationCap className="w-3 h-3" />
                                    Egreso
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md block max-w-[85px] truncate" title={r.nextGradeName}>
                                    {r.nextGradeName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Enrollment flow */}
                            <div className="space-y-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl p-2.5">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Flujo de Alumnos</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Ingreso (+{r.incomingCount}):</span>
                                <span className="font-bold text-primary truncate max-w-[85px]" title={r.sourceGradeName}>{r.sourceGradeName}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-slate-700/50 pt-1.5 mt-1">
                                <span className="text-slate-500 dark:text-slate-400 font-medium">Egreso ({r.outgoingCount}):</span>
                                <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[85px]" title={r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}>{r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}</span>
                              </div>
                            </div>

                            {/* Aulas en Curso */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Aulas en Curso
                              </div>
                              {r.currentSectionNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {r.currentSectionNames.map(n => (
                                    <span
                                      key={n}
                                      className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-200 font-black font-mono text-[11px]"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium italic">
                                  Sin aulas asignadas
                                </span>
                              )}
                            </div>

                            {/* Next-year planned section inputs */}
                            <div className="bg-slate-50/80 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                  Aulas Planificadas ({targetYear})
                                </span>
                                {isReconfigured && (
                                  <span className="text-[9px] font-black uppercase text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                                    Modificado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-3xs shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                                    disabled={r.newSectionNames.length <= 1}
                                    className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-black text-slate-800 dark:text-slate-200 font-mono">
                                    {r.newSectionNames.length}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCount(r.gradeId, r.newSectionNames.length + 1)}
                                    disabled={r.newSectionNames.length >= 6}
                                    className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                {/* Section letter inputs */}
                                <div className="flex flex-wrap gap-1 items-center">
                                  {r.newSectionNames.map((n, i) => (
                                    <input
                                      key={i}
                                      value={n}
                                      onChange={e => updateName(r.gradeId, i, e.target.value)}
                                      maxLength={2}
                                      placeholder="A"
                                      title="Identificador de la sección"
                                      className="w-8 h-8 text-center text-xs font-black uppercase bg-white dark:bg-slate-800 text-primary dark:text-primary-light border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Projected distribution */}
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Distribución Proyectada
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(dist).map(([name, count]) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-lg text-[11px] font-bold text-slate-600 dark:text-slate-300 shadow-3xs"
                                  >
                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">
                                      Secc. {name}
                                    </span>
                                    <span className="text-primary dark:text-primary-light font-black font-mono text-[11px]">
                                      {count}
                                    </span>
                                  </span>
                                ))}
                                {Object.keys(dist).length === 0 && (
                                  <span className="text-[10px] text-slate-400 italic">
                                    Sin alumnos proyectados
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

      {/* Safety Info & Activation Call to Action */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-3xs">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider">
              Políticas de Preservación Histórica
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Toda la información académica de ciclos lectivos anteriores queda salvaguardada en el historial. Al iniciar el período, el sistema estructurará el año lectivo <span className="font-extrabold text-primary font-mono">{targetYear}</span>.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full lg:w-auto px-8 py-3.5 font-bold uppercase text-xs tracking-wider shrink-0"
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
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl overflow-hidden shadow-3xs">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left font-display text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Herramientas del Sistema y Calibración de Datos</span>
          </div>
          {maintenanceOpen ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
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
              <div className="px-6 py-6 border-t border-slate-200/80 dark:border-slate-700/80 space-y-5 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      Atención: Consola de Diagnóstico de Datos
                    </h5>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                      Estas herramientas realizan operaciones directamente sobre la base de datos de producción. Úselas con precaución para corregir desalineaciones históricas de padrones o limpiar simulaciones de pruebas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Reset Pruebas */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-4">
                    <div>
                      <h6 className="text-xs font-black text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Reinicio de Matrícula y Pruebas
                      </h6>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Limpia las secciones temporales de prueba, restableciendo el año lectivo y permitiendo ejecutar múltiples flujos interactivos de simulación.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-danger text-xs font-bold py-2 px-4 self-start rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-4">
                    <div>
                      <h6 className="text-xs font-black text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider">
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Audita, recalcula y reconstruye cronológicamente año por año el historial completo de inscripciones de todo el alumnado activo.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-xs font-bold py-2 px-4 self-start rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Sincronizador Interactivo de Firebase */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                  <div>
                    <h6 className="text-xs font-black text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider flex items-center gap-2">
                      Migrador Interactivo y Sincronización de Alumnos (Multi-Firebase SDK)
                    </h6>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                      Pega el JSON de configuración de Firebase de tu proyecto de origen.
                      Esta herramienta limpiará la colección actual de alumnos e insertará y reconstruirá sus historiales.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">JSON de Configuración SDK de Firebase de Origen</label>
                      <textarea
                        rows={5}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                        className="w-full text-xs font-mono p-4 input font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{migrationStatus}</span>
                          <span className="text-xs font-extrabold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${migrationProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={runningMigration}
                      className="btn-primary text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 disabled:opacity-40 transition-all shadow-3xs cursor-pointer"
                    >
                      {runningMigration ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sincronizando y reconstruyendo...</span>
                        </>
                      ) : (
                        <>
                          <span>Iniciar Sincronización y Limpieza Completa</span>
                        </>
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

interface GradeMigrationCardProps {
  r: MigrationPlanRow;
  targetYear: number;
  getDistribution: (r: MigrationPlanRow) => Record<string, number>;
  updateCount: (gradeId: string, count: number) => void;
  updateName: (gradeId: string, index: number, value: string) => void;
}

function GradeMigrationCard({
  r,
  targetYear,
  getDistribution,
  updateCount,
  updateName
}: GradeMigrationCardProps) {
  const dist = getDistribution(r);
  const isReconfigured = r.currentSectionNames.length !== r.newSectionNames.filter(n => n.trim()).length;

  return (
    <div className="card-crema p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative group/card overflow-hidden min-h-[420px]">
      {/* Decorative premium slate/primary gradient top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

      {/* Card Body Container */}
      <div className="flex-1 flex flex-col justify-between space-y-4">
        {/* Header Block */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-base font-black text-slate-900 font-display group-hover/card:text-primary transition-colors leading-tight">
                {r.gradeName}
              </h4>
              <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-200/60">
                {CYCLE_LABEL[r.cycle] || r.cycle}
              </span>
            </div>

            {r.nextGradeId === null ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                Egreso
              </span>
            ) : (
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md shrink-0">
                {r.nextGradeName}
              </span>
            )}
          </div>
        </div>

        {/* Enrollment Flow (Source to Destination) */}
        <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100 space-y-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Flujo de Matrícula
          </div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="truncate max-w-[100px] bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[10px] text-slate-500">
              {r.sourceGradeName}
            </span>
            <div className="flex items-center gap-1 text-primary">
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="font-bold text-[10px] font-mono bg-primary/10 px-1.5 py-0.5 rounded-md">
                +{r.incomingCount}
              </span>
            </div>
            <span className="truncate max-w-[100px] bg-primary/5 border border-primary/20 text-primary px-2 py-0.5 rounded-md text-[10px]">
              {r.gradeName}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Padrón actual en grado:</span>
            <span className="font-bold text-slate-600">{r.outgoingCount} alumnos</span>
          </div>
        </div>

        {/* Current Classrooms State */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Aulas en Curso
          </div>
          {r.currentSectionNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {r.currentSectionNames.map(n => (
                <span
                  key={n}
                  className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-slate-600 font-black font-mono text-[11px] shadow-3xs"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium italic">
              Sin aulas asignadas
            </span>
          )}
        </div>

        {/* Next Year Section Settings Block */}
        <div className="space-y-2.5 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Aulas Planificadas ({targetYear})
            </span>
            {isReconfigured && (
              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-100/60 px-1.5 py-0.5 rounded">
                Reconfigurado
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-3xs shrink-0">
              <button
                type="button"
                onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                disabled={r.newSectionNames.length <= 1}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-black text-slate-800 font-mono">
                {r.newSectionNames.length}
              </span>
              <button
                type="button"
                onClick={() => updateCount(r.gradeId, r.newSectionNames.length + 1)}
                disabled={r.newSectionNames.length >= 6}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Interactive inputs for section letters */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {r.newSectionNames.map((n, i) => (
                <input
                  key={i}
                  value={n}
                  onChange={e => updateName(r.gradeId, i, e.target.value)}
                  maxLength={2}
                  placeholder="A"
                  title="Identificador de la sección"
                  className="w-8 h-8 text-center text-xs font-black uppercase bg-white border border-slate-200 rounded-lg text-primary focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none transition-all shadow-3xs"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Promotion/Balance Distribution Block */}
        <div className="space-y-1.5 pt-3 border-t border-slate-100">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Distribución Proyectada
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(dist).map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-lg text-[11px] font-bold text-primary shadow-3xs hover:scale-105 hover:bg-primary/10 transition-all duration-200 cursor-default"
              >
                <span className="text-[9px] text-primary/70 uppercase font-black tracking-wider">
                  Secc. {name}
                </span>
                <span className="bg-white text-primary px-1.5 py-0.2 rounded font-black font-mono text-[10px] border border-primary/10 shadow-3xs">
                  {count}
                </span>
              </span>
            ))}
            {Object.keys(dist).length === 0 && (
              <span className="text-xs text-slate-400 italic">
                Sin alumnos proyectados
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
