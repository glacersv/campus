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
  Layers
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
import { Student, Cycle } from '../../types';
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

const CYCLE_ORDER: Cycle[] = ['parvularia', '1', '2', '3', '4'];

export default function SchoolYearManager() {
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [rows, setRows] = useState<MigrationPlanRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

  // Filtering and view state
  const [selectedCycle, setSelectedCycle] = useState<Cycle | 'all'>('all');
  
  // State for manual year input
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
        `¿Confirmas el inicio del año escolar ${yearInt}? \n\nEsta operación promoverá automáticamente a los estudiantes activos e inicialización del nuevo período lectivo.`
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
        <p className="text-xs font-semibold text-slate-500 font-display animate-pulse">
          Cargando planificación del año escolar...
        </p>
      </div>
    );
  }

  // Filter rows by selected cycle
  const filteredRows = selectedCycle === 'all'
    ? rows
    : rows.filter(r => r.cycle === selectedCycle);

  // Group filtered rows by educational cycle
  const groupedRows: Record<Cycle, MigrationPlanRow[]> = {
    'parvularia': [],
    '1': [],
    '2': [],
    '3': [],
    '4': []
  };

  filteredRows.forEach(r => {
    const cy = (r.cycle || '1') as Cycle;
    if (groupedRows[cy]) {
      groupedRows[cy].push(r);
    } else {
      groupedRows['1'].push(r);
    }
  });

  const activeCycles = CYCLE_ORDER.filter(c => groupedRows[c] && groupedRows[c].length > 0);

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-12">
      {/* Standard Module Header */}
      <div className="module-header flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="module-title-group">
          <div className="module-icon">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Apertura del Período Lectivo</h1>
            <p className="module-subtitle">
              Planificación y estructuración de matrícula para el nuevo ciclo escolar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-3xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              {currentYear ? `Año Activo: ${currentYear}` : 'Sin Año Activo'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Próximo Año:
            </span>
            <input
              type="number"
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
              className="w-20 font-black text-primary font-mono bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg text-center text-xs focus:outline-none focus:border-primary transition-colors"
              min={currentYear ? currentYear + 1 : new Date().getFullYear()}
              max={new Date().getFullYear() + 10}
            />
          </div>
        </div>
      </div>

      {/* Year Warning Banner */}
      {yearWarning && (
        <div className={`rounded-2xl p-3.5 border flex items-center gap-3 text-xs font-semibold ${
          yearWarning.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : yearWarning.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {yearWarning.type === 'error' || yearWarning.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{yearWarning.message}</span>
        </div>
      )}

      {/* Standard KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alumnos a promover */}
        <div className="stat-card">
          <div className="stat-card-icon bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-value block">{totalIncoming}</span>
            <span className="stat-card-label block">Alumnos a Promover</span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Padrón promovible para próximo ciclo
            </span>
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="stat-card">
          <div className="stat-card-icon bg-amber-500/10 text-amber-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-value block text-amber-600">{totalGraduates}</span>
            <span className="stat-card-label block">Egresados a Graduar</span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Egresarán del plantel (11G / 12T)
            </span>
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="stat-card">
          <div className="stat-card-icon bg-accent/10 text-accent">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-value block text-accent">{totalSections}</span>
            <span className="stat-card-label block">Nuevas Secciones</span>
            <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
              Aulas lectivas a estructurar
            </span>
          </div>
        </div>
      </div>

      {/* Educational Cycle Filter Pills Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCycle('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycle === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Todos los Ciclos
          </button>
          {CYCLE_ORDER.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCycle(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCycle === c
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              {CYCLE_LABEL[c]}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-slate-500 font-mono bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
          {filteredRows.length} Grado(s) Visible(s)
        </span>
      </div>

      {/* Grade Migration Cards Container */}
      {filteredRows.length === 0 ? (
        <div className="card-crema text-center py-16 text-slate-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No se encontraron grados para el ciclo seleccionado.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeCycles.map(cycleKey => {
            const cycleRows = groupedRows[cycleKey];
            return (
              <div key={cycleKey} className="space-y-3">
                {/* Cycle section header */}
                <div className="flex items-center gap-2.5 pt-1">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-display">
                    {CYCLE_LABEL[cycleKey] || cycleKey}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-200/60 text-slate-600 text-[10px] font-bold rounded-full font-mono">
                    {cycleRows.length} {cycleRows.length === 1 ? 'Grado' : 'Grados'}
                  </span>
                  <div className="flex-1 h-px bg-slate-200/80" />
                </div>

                {/* Grid of Grade Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {cycleRows.map((r, rowIndex) => {
                    const dist = getDistribution(r);
                    const isReconfigured =
                      r.currentSectionNames.length !==
                      r.newSectionNames.filter(n => n.trim()).length;

                    return (
                      <motion.div
                        key={r.gradeId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: rowIndex * 0.02 }}
                        className="card-crema p-4.5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
                      >
                        <div className="space-y-3">
                          {/* Card Top Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-900 leading-tight font-display" title={r.gradeName}>
                                {r.gradeName}
                              </h4>
                              <span className="inline-block text-[10px] text-slate-400 font-semibold mt-0.5">
                                {CYCLE_LABEL[r.cycle as Cycle] || r.cycle}
                              </span>
                            </div>

                            <div className="shrink-0">
                              {r.nextGradeId === null ? (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  <GraduationCap className="w-3 h-3" />
                                  Egreso
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-600 font-semibold bg-slate-100/80 border border-slate-200/60 px-2 py-0.5 rounded-md whitespace-nowrap" title={r.nextGradeName}>
                                  {r.nextGradeName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Student Flow Block */}
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1.5 text-xs">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500 text-[11px] font-medium shrink-0">Ingreso (+{r.incomingCount}):</span>
                              <span className="font-bold text-primary text-right text-[11px] whitespace-nowrap" title={r.sourceGradeName}>
                                {r.sourceGradeName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2 border-t border-slate-200/60 pt-1">
                              <span className="text-slate-500 text-[11px] font-medium shrink-0">Egreso ({r.outgoingCount}):</span>
                              <span className="font-semibold text-slate-700 text-right text-[11px] whitespace-nowrap" title={r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}>
                                {r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}
                              </span>
                            </div>
                          </div>

                          {/* Current Sections */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Aulas en Curso
                            </span>
                            {r.currentSectionNames.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {r.currentSectionNames.map(n => (
                                  <span
                                    key={n}
                                    className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-600 font-bold font-mono text-[11px]"
                                  >
                                    {n}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Sin aulas en curso</span>
                            )}
                          </div>

                          {/* Planned Sections for Target Year */}
                          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Aulas Planificadas ({targetYear})
                              </span>
                              {isReconfigured && (
                                <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">
                                  Ajustado
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {/* +/- Stepper */}
                              <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                                  disabled={r.newSectionNames.length <= 1}
                                  className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 transition-all font-bold cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center text-xs font-black text-slate-800 font-mono">
                                  {r.newSectionNames.length}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateCount(r.gradeId, r.newSectionNames.length + 1)}
                                  disabled={r.newSectionNames.length >= 6}
                                  className="w-5 h-5 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 transition-all font-bold cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Interactive letter inputs */}
                              <div className="flex flex-wrap gap-1 items-center">
                                {r.newSectionNames.map((n, i) => (
                                  <input
                                    key={i}
                                    value={n}
                                    onChange={e => updateName(r.gradeId, i, e.target.value)}
                                    maxLength={2}
                                    placeholder="A"
                                    title="Letra o identificador de sección"
                                    className="w-7 h-7 text-center text-xs font-black uppercase bg-white border border-slate-200 text-primary rounded-lg focus:border-primary focus:outline-none transition-colors"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Live Student Projections */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Distribución Proyectada
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(dist).map(([name, count]) => (
                                <span
                                  key={name}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-700 shadow-3xs"
                                >
                                  <span className="text-slate-400 text-[9px] uppercase font-bold">
                                    Secc. {name}:
                                  </span>
                                  <span className="text-primary font-mono font-bold">
                                    {count}
                                  </span>
                                </span>
                              ))}
                              {Object.keys(dist).length === 0 && (
                                <span className="text-[11px] text-slate-400 italic">Sin alumnos proyectados</span>
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

      {/* Confirmation & Action Banner */}
      <div className="card-crema p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider font-display">
              Confirmación de Apertura Lectiva
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Se estructurará el año <span className="font-bold text-primary font-mono">{targetYear}</span> promoviendo <span className="font-bold text-slate-800">{totalIncoming}</span> alumnos activos y egresando <span className="font-bold text-slate-800">{totalGraduates}</span> graduandos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary px-6 py-3 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer w-full sm:w-auto"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Aperturar Año Escolar {targetYear}</span>
            </>
          )}
        </button>
      </div>

      {/* System Diagnostics & Calibration Drawer */}
      <div className="card-crema overflow-hidden p-0 border border-slate-200">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full p-4 flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-500" />
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
              <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-5">
                <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Estas utilidades ejecutan mantenimiento profundo sobre la base de datos de producción. Úselas para calibrar historiales de inscripciones o resetear escenarios de pruebas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reset Scenario */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Reinicio de Matrícula de Pruebas
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Restablece las secciones temporales de prueba, permitiendo volver a simular flujos de promoción.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-xs py-2 px-3.5 self-start rounded-xl cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Reconstruct History */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between gap-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Reconstrucción Académica de Historiales
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Recalcula y reconstruye cronológicamente el historial de matrículas de todos los alumnos activos desde su ingreso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 text-xs py-2 px-3.5 self-start rounded-xl cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Sincronizador Multi-Firebase SDK */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Migrador Interactivo de Alumnos (Multi-Firebase SDK)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Pega la configuración JSON Web SDK de Firebase del proyecto de origen para migrar y limpiar la colección de alumnos.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-3">
                    <textarea
                      rows={4}
                      value={migrationSdk}
                      onChange={e => setMigrationSdk(e.target.value)}
                      placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "..."\n}`}
                      className="input-crema text-xs font-mono p-3"
                    />

                    {migrationStatus && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-600">{migrationStatus}</span>
                          <span className="font-extrabold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${migrationProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={runningMigration}
                      className="btn-primary text-xs py-2.5 px-5 rounded-xl disabled:opacity-40 cursor-pointer"
                    >
                      {runningMigration ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sincronizando...</span>
                        </>
                      ) : (
                        <span>Iniciar Sincronización</span>
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
