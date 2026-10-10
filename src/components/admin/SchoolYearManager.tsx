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
  X,
  Sparkles
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
  
  // Year input and warning state
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

  const activeCycles = cycleOrder.filter(c => {
    if (selectedCycle !== 'all' && c !== selectedCycle) return false;
    return groupedRows[c] && groupedRows[c].length > 0;
  });

  const totalFilteredRows = activeCycles.reduce((acc, cy) => acc + (groupedRows[cy]?.length || 0), 0);

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-12">
      {/* Standardized Module Header */}
      <div className="module-header flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="module-title-group">
          <div className="module-icon bg-primary/10 text-primary">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Apertura del Período Lectivo</h1>
            <p className="module-subtitle flex flex-wrap items-center gap-2">
              {currentYear ? (
                <>
                  <span>Lectivo actual:</span>
                  <span className="font-extrabold text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md text-xs">
                    {currentYear}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Próximo año:</span>
                  <input
                    type="number"
                    value={manualYear}
                    onChange={(e) => setManualYear(e.target.value)}
                    className="w-20 font-extrabold text-slate-800 font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/40 text-center text-xs"
                    min={currentYear ? currentYear + 1 : new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                  />
                </>
              ) : (
                <span className="text-amber-700 font-bold flex items-center gap-1.5 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Sin año lectivo activo. Inicialice el sistema.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Planificación en Vivo
          </span>
        </div>
      </div>

      {/* Year Warning Banner */}
      {yearWarning && (
        <div className={`rounded-xl p-4 border flex items-start gap-3 ${
          yearWarning.type === 'error' 
            ? 'bg-red-50 border-red-200 text-red-800' 
            : yearWarning.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {yearWarning.type === 'error' || yearWarning.type === 'warning' ? (
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{yearWarning.message}</span>
        </div>
      )}

      {/* Premium KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Alumnos a promover */}
        <div className="stat-card relative overflow-hidden">
          <div className="stat-card-icon bg-primary/10 text-primary">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Alumnos a Promover</span>
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              Padrón activo a migrar
            </span>
          </div>
          <div className="stat-card-value text-primary font-mono">
            {totalIncoming}
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="stat-card relative overflow-hidden">
          <div className="stat-card-icon bg-amber-50 text-amber-600 border border-amber-200/60">
            <GraduationCap className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Egresados a Graduar</span>
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              Graduaciones (11G / 12T)
            </span>
          </div>
          <div className="stat-card-value text-slate-800 font-mono">
            {totalGraduates}
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="stat-card relative overflow-hidden">
          <div className="stat-card-icon bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Nuevas Secciones</span>
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              Aulas a generar
            </span>
          </div>
          <div className="stat-card-value text-slate-800 font-mono">
            {totalSections}
          </div>
        </div>
      </div>

      {/* Cycle Filter Pills & Section Header */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 font-display">
              <TrendingUp className="w-5 h-5 text-primary" />
              Estructura de Promoción y Aulas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina cantidad y letras de secciones para el año <span className="font-bold text-primary font-mono">{targetYear}</span>. El sistema distribuirá equitativamente los alumnos.
            </p>
          </div>

          {/* Cycle filter pills */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setSelectedCycle('all')}
              className={`filter-pill ${selectedCycle === 'all' ? 'active' : ''}`}
            >
              Todos
            </button>
            {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedCycle(c)}
                className={`filter-pill ${selectedCycle === c ? 'active' : ''}`}
              >
                {CYCLE_NAMES[c]}
              </button>
            ))}
          </div>
        </div>

        {totalFilteredRows === 0 ? (
          <div className="card-crema p-12 text-center space-y-3">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-500">
              No se encontraron grados configurados para el filtro seleccionado.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeCycles.map(cycleKey => {
              const cycleRows = groupedRows[cycleKey];
              return (
                <div key={cycleKey} className="space-y-4">
                  {/* Cycle Header Divider */}
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

                  {/* Responsive Grid of Grade Cards */}
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
                          className="card-crema p-5 flex flex-col justify-between transition-all duration-200 relative group/card overflow-hidden min-h-[360px]"
                        >
                          {/* Accent bar */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

                          <div className="space-y-4">
                            {/* Header: Grade & Cycle */}
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-black text-slate-900 font-display group-hover/card:text-primary transition-colors leading-tight truncate" title={r.gradeName}>
                                  {r.gradeName}
                                </h4>
                                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[9px] font-bold border ${
                                  r.cycle === 'parvularia' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                                  r.cycle === '1' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                  r.cycle === '2' ? 'bg-sky-50 text-sky-700 border-sky-100' :
                                  r.cycle === '3' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                  'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                  {CYCLE_LABEL[r.cycle] || r.cycle}
                                </span>
                              </div>

                              <div className="shrink-0">
                                {r.nextGradeId === null ? (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-700 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-wider">
                                    <GraduationCap className="w-3 h-3 text-amber-600" />
                                    Egreso
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md block max-w-[85px] truncate" title={r.nextGradeName}>
                                    {r.nextGradeName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Enrollment flow - Source to Destination */}
                            <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span className="uppercase tracking-wider">Flujo de Alumnos</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Ingreso (+{r.incomingCount}):</span>
                                <span className="font-bold text-primary truncate max-w-[85px]" title={r.sourceGradeName}>{r.sourceGradeName}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-t border-slate-100/60 pt-1.5 mt-1">
                                <span className="text-slate-500 font-medium">Egreso ({r.outgoingCount}):</span>
                                <span className="font-bold text-slate-700 truncate max-w-[85px]" title={r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}>{r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}</span>
                              </div>
                            </div>

                            {/* Current Year Classrooms */}
                            <div className="space-y-1.5">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                Aulas en Curso
                              </div>
                              {r.currentSectionNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {r.currentSectionNames.map(n => (
                                    <span
                                      key={n}
                                      className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-slate-600 font-black font-mono text-[11px]"
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

                            {/* Next Year Planned Sections */}
                            <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                  Aulas Planificadas ({targetYear})
                                </span>
                                {isReconfigured && (
                                  <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
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
                                    className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
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
                                    className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
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
                                      className="w-8 h-8 text-center text-xs font-black uppercase input-crema bg-white text-primary p-0 rounded-lg border-slate-200 focus:border-primary"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Live student distribution */}
                            <div className="space-y-1.5 pt-1">
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                Distribución Proyectada
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(dist).map(([name, count]) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-200/80 transition-all duration-150 cursor-default"
                                  >
                                    <span className="text-[9px] text-slate-400 uppercase font-black tracking-wider">
                                      Secc. {name}
                                    </span>
                                    <span className="text-primary font-black font-mono text-[11px]">
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

      {/* Safety Info & Activation Banner */}
      <div className="card-crema p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider">
              Políticas de Preservación Histórica
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Toda la información académica de ciclos lectivos anteriores (secciones, asistencias y reportes) queda guardada en almacenamiento histórico aislado. Al aperturar el período, el sistema estructurará el año <span className="font-extrabold text-primary font-mono">{targetYear}</span> de forma limpia.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full lg:w-auto px-8 py-3.5 font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg transition-all duration-150 flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
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

      {/* Maintenance & Data Calibration Drawer */}
      <div className="bg-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left font-display text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
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
              <div className="px-6 py-6 border-t border-slate-200/80 space-y-5">
                <div className="p-4 bg-slate-50 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Atención: Consola de Diagnóstico de Datos
                    </h5>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Estas herramientas realizan operaciones profundas directamente sobre la base de datos. Úselas con precaución para corregir desalineaciones históricas de padrones o limpiar simulaciones de pruebas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Reset Pruebas */}
                  <div className="card-crema p-5 flex flex-col justify-between gap-4">
                    <div>
                      <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Reinicio de Matrícula y Pruebas
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Limpia las secciones temporales de prueba, restableciendo el año lectivo y permitiendo ejecutar múltiples flujos interactivos de simulación de migración escolar.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-[11px] font-bold py-2 px-4 self-start rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="card-crema p-5 flex flex-col justify-between gap-4">
                    <div>
                      <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider">
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Audita, recalcula y reconstruye cronológicamente año por año el historial completo de inscripciones de todo el alumnado activo del plantel desde su fecha de ingreso.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-[11px] font-bold py-2 px-4 self-start rounded-xl flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Firebase SDK Interactive Sync */}
                <div className="card-crema p-6 space-y-4">
                  <div>
                    <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider flex items-center gap-2">
                      Migrador Interactivo y Sincronización de Alumnos (Multi-Firebase SDK)
                    </h6>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Ingrese el JSON de configuración SDK de Firebase origen. Esta herramienta limpiará la colección local de alumnos y reconstruirá los registros e historiales desde el origen.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5">JSON Configuración Firebase Origen</label>
                      <textarea
                        rows={4}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                        className="w-full text-xs font-mono p-3 input-crema bg-white"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{migrationStatus}</span>
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
                      className="btn-primary text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 disabled:opacity-40 transition-all shadow-xs cursor-pointer"
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
