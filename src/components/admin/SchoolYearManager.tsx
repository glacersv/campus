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
  Database
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

  const loadData = useCallback(async () => {
    try {
      let stud: Student[] = [];
      let gra: Grade[] = [];
      let sec: Section[] = [];
      let bts: BaccalaureateTypeDoc[] = [];
      let cy: number | null = 2025;

      try {
        [stud, gra, sec, bts, cy] = await Promise.all([
          getAllStudents(),
          getAllGrades(),
          getAllSections(),
          getAllBaccalaureateTypes(),
          getCurrentSchoolYear()
        ]);
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('Firestore offline/bypass, loading mock fallback for visualization');
          gra = [
            { id: 'k4', name: 'Kinder 4', cycle: 'parvularia', status: 'ACTIVO' },
            { id: '1', name: '1° Grado', cycle: '1', status: 'ACTIVO' },
            { id: '2', name: '2° Grado', cycle: '1', status: 'ACTIVO' },
            { id: '7', name: '7° Grado', cycle: '3', status: 'ACTIVO' },
            { id: '10g', name: '1° Bachillerato General', cycle: '4', baccalaureateType: 'general', status: 'ACTIVO' },
            { id: '11g', name: '2° Bachillerato General', cycle: '4', baccalaureateType: 'general', status: 'ACTIVO' }
          ];
          sec = [
            { id: '2025-1-a', name: 'A', gradeId: '1', schoolYear: 2025 },
            { id: '2025-1-b', name: 'B', gradeId: '1', schoolYear: 2025 },
            { id: '2025-10g-a', name: 'A', gradeId: '10g', schoolYear: 2025 }
          ];
          stud = [
            { id: 'st1', carnet: '202501', name: 'Carlos López', firstName: 'Carlos', lastName: 'López', gender: 'M', gradeId: '1', sectionId: '2025-1-a', enrollmentYear: 2025, status: 'ACTIVO', enrollmentHistory: [] },
            { id: 'st2', carnet: '202502', name: 'Ana Gómez', firstName: 'Ana', lastName: 'Gómez', gender: 'F', gradeId: '1', sectionId: '2025-1-b', enrollmentYear: 2025, status: 'ACTIVO', enrollmentHistory: [] },
            { id: 'st3', carnet: '202503', name: 'María Rodríguez', firstName: 'María', lastName: 'Rodríguez', gender: 'F', gradeId: '10g', sectionId: '2025-10g-a', enrollmentYear: 2025, status: 'ACTIVO', enrollmentHistory: [] }
          ];
          cy = 2025;
        } else {
          throw e;
        }
      }

      setStudents(stud);
      setCurrentYear(cy);
      setRows(buildMigrationRows(stud, gra, sec, bts, cy));
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

  const nextYear = currentYear ? currentYear + 1 : 2026;

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

  const getDistribution = useCallback((r: MigrationPlanRow) => {
    const sourceStudents = students.filter(
      s => isActiveStudent(s) && s.gradeId === r.sourceGradeId
    );
    const names = r.newSectionNames.filter(n => n.trim());
    return distributeStudents(sourceStudents, names).counts;
  }, [students]);

  const handleStart = async () => {
    if (submitting) return;
    const year = nextYear;
    if (
      !confirm(
        `¿Confirmas el inicio del año escolar ${year}? \n\nEsta operación promoverá automáticamente a los estudiantes activos e inicialización del nuevo período lectivo.`
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
      await startSchoolYear(year, config);
      toast.success(`¡Año escolar ${year} iniciado exitosamente!`);
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
        else if (rawGrado.includes('1° Diseño') || rawGrado === '10t') gradeId = '10t';
        else if (rawGrado.includes('2° Diseño') || rawGrado === '11t') gradeId = '11t';
        else if (rawGrado.includes('3° Diseño') || rawGrado === '12t') gradeId = '12t';
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

  // Filter rows by cycle selection
  const filteredRows = selectedCycle === 'all'
    ? rows
    : rows.filter(r => r.cycle === selectedCycle);

  // Group rows dynamically by educational cycle
  const cycleOrder: Cycle[] = ['parvularia', '1', '2', '3', '4'];
  const groupedRows: Record<string, MigrationPlanRow[]> = {};
  filteredRows.forEach(r => {
    const cy = r.cycle || 'unknown';
    if (!groupedRows[cy]) {
      groupedRows[cy] = [];
    }
    groupedRows[cy].push(r);
  });

  const activeCycles = cycleOrder.filter(c => groupedRows[c] && groupedRows[c].length > 0);

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* Standardized Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Iniciar Año Escolar</h1>
            <p className="module-subtitle">
              Configuración de aulas lectivas y plan de promociones escolares {nextYear}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Lectivo actual:</span>
            <span className="text-xs font-black text-primary font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {currentYear || '---'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 font-medium">Planificación:</span>
            <span className="text-xs font-black text-amber-600 font-mono bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {nextYear}
            </span>
          </div>
          <button
            onClick={handleStart}
            disabled={submitting}
            className="btn-primary whitespace-nowrap shrink-0 px-4 py-2.5 text-xs"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Aperturar Año Escolar {nextYear}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Standardized KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alumnos a promover */}
        <div className="stat-card">
          <div className="stat-card-icon bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-card-value">{totalIncoming}</div>
            <div className="stat-card-label">Alumnos a Promover</div>
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="stat-card">
          <div className="stat-card-icon bg-amber-50 text-amber-600 border border-amber-200/60">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-card-value">{totalGraduates}</div>
            <div className="stat-card-label">Egresados a Graduar</div>
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="stat-card">
          <div className="stat-card-icon bg-blue-50 text-blue-600 border border-blue-200/60">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="stat-card-value">{totalSections}</div>
            <div className="stat-card-label">Nuevas Secciones</div>
          </div>
        </div>
      </div>

      {/* Filter Selector & Counter */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedCycle('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycle === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Todos
          </button>
          {CYCLE_KEYS.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCycle(c)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCycle === c
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              {CYCLE_LABEL[c] || c}
            </button>
          ))}
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200/80 px-3.5 py-1.5 rounded-xl shadow-3xs">
          {filteredRows.length} Grados {selectedCycle === 'all' ? 'totales' : 'filtrados'}
        </span>
      </div>

      {/* Main Configuration Section */}
      {filteredRows.length === 0 ? (
        <div className="empty-state card">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium text-slate-500">
            No se encontraron grados activos para el ciclo seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeCycles.map(cycleKey => {
            const cycleRows = groupedRows[cycleKey];
            return (
              <div key={cycleKey} className="space-y-4">
                {/* Cycle Section Header */}
                <div className="flex items-center gap-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {CYCLE_LABEL[cycleKey] || cycleKey}
                  </h4>
                  <span className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 text-slate-600 text-[10px] font-extrabold rounded-full font-mono">
                    {cycleRows.length} {cycleRows.length === 1 ? 'Grado' : 'Grados'}
                  </span>
                  <div className="flex-1 h-px bg-slate-200/80" />
                </div>

                {/* Grid of Modular Grade Migration Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {cycleRows.map(r => (
                    <GradeMigrationCard
                      key={r.gradeId}
                      r={r}
                      nextYear={nextYear}
                      getDistribution={getDistribution}
                      updateCount={updateCount}
                      updateName={updateName}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Primary Call to Action Banner & Policy Info */}
      <div className="card-crema p-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Preservación de Historiales Lectivos
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Toda la información académica de ciclos anteriores (aulas, directores, registros de control, asistencias y reportes) queda salvaguardada en el historial del alumnado. Al aperturar el año <span className="font-extrabold text-primary font-mono">{nextYear}</span>, el sistema promoverá el padrón y creará las aulas con las letras configuradas.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full md:w-auto px-6 py-3 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md hover:shadow-lg transition-all"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Ejecutando Promoción...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Aperturar Año Escolar {nextYear}</span>
            </>
          )}
        </button>
      </div>

      {/* Maintenance & Diagnostics Drawer */}
      <div className="card-crema overflow-hidden p-0">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4.5 h-4.5 text-slate-500" />
            <span>Herramientas del Sistema y Diagnóstico de Datos</span>
          </div>
          {maintenanceOpen ? (
            <ChevronUp className="w-4.5 h-4.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-4.5 h-4.5 text-slate-400" />
          )}
        </button>

        <AnimatePresence>
          {maintenanceOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-6 space-y-5 bg-slate-50/50">
                <div className="p-4 bg-white border border-amber-200 rounded-xl flex items-start gap-3 shadow-3xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Herramientas de Mantenimiento Avanzado
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Estas operaciones modifican directamente los registros de inscripciones y la base de datos de pruebas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reset Pruebas */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-3xs">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Reinicio de Matrícula y Pruebas
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Limpia las secciones temporales de prueba, restableciendo el año lectivo para simular nuevamente la migración escolar.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-[11px] font-bold py-2 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-3xs">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Audita y reconstruye cronológicamente el historial completo de inscripciones de todo el alumnado desde su fecha de ingreso.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-[11px] font-bold py-2 px-3.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Firebase SDK Sincronizador */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-3xs">
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Database className="w-4 h-4 text-slate-600" />
                      Migrador Interactivo y Sincronización (Multi-Firebase SDK)
                    </h6>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Pega el JSON de configuración de Firebase SDK de tu proyecto origen para importar y reconstruir alumnos directamente.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-3">
                    <textarea
                      rows={4}
                      value={migrationSdk}
                      onChange={e => setMigrationSdk(e.target.value)}
                      placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "appId": "..."\n}`}
                      className="w-full text-xs font-mono p-3 input-crema bg-slate-50"
                    />

                    {migrationStatus && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-700">{migrationStatus}</span>
                          <span className="font-bold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${migrationProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={runningMigration}
                      className="btn-primary text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      {runningMigration ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sincronizando...</span>
                        </>
                      ) : (
                        <>
                          <span>Iniciar Sincronización de Datos</span>
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
  nextYear: number;
  getDistribution: (r: MigrationPlanRow) => Record<string, number>;
  updateCount: (gradeId: string, count: number) => void;
  updateName: (gradeId: string, index: number, value: string) => void;
}

function GradeMigrationCard({
  r,
  nextYear,
  getDistribution,
  updateCount,
  updateName
}: GradeMigrationCardProps) {
  const dist = getDistribution(r);
  const isReconfigured = r.currentSectionNames.length !== r.newSectionNames.filter(n => n.trim()).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col justify-between hover:shadow-md transition-all duration-200 space-y-4">
      {/* Grade Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 leading-tight truncate" title={r.gradeName}>
              {r.gradeName}
            </h4>
            <span className="inline-block text-[10px] font-semibold text-slate-400 mt-0.5">
              {CYCLE_LABEL[r.cycle] || r.cycle}
            </span>
          </div>

          <div className="shrink-0">
            {r.nextGradeId === null ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full uppercase">
                <GraduationCap className="w-3 h-3 text-amber-600" />
                Egreso
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[85px] block" title={r.nextGradeName}>
                → {r.nextGradeName}
              </span>
            )}
          </div>
        </div>

        {/* Enrollment Flow (Census) */}
        <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100/80 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Flujo de Alumnos</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Ingreso (+{r.incomingCount}):</span>
            <span className="font-bold text-primary truncate max-w-[90px]" title={r.sourceGradeName}>
              {r.sourceGradeName}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-1">
            <span className="text-slate-500 font-medium">Egreso ({r.outgoingCount}):</span>
            <span className="font-bold text-slate-700 truncate max-w-[90px]" title={r.nextGradeName === 'Graduación' ? 'Graduación' : r.nextGradeName}>
              {r.nextGradeName === 'Graduación' ? 'Graduación' : r.nextGradeName}
            </span>
          </div>
        </div>

        {/* Current Classrooms State */}
        <div className="space-y-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Aulas en Curso
          </div>
          {r.currentSectionNames.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {r.currentSectionNames.map(n => (
                <span
                  key={n}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-slate-600 font-bold font-mono text-[11px]"
                >
                  {n}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Sin aulas asignadas</span>
          )}
        </div>

        {/* Next Year Section Settings Block */}
        <div className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-200/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Aulas ({nextYear})
            </span>
            {isReconfigured && (
              <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                Modificado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shrink-0 shadow-3xs">
              <button
                type="button"
                onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                disabled={r.newSectionNames.length <= 1}
                className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
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
                className="w-5.5 h-5.5 rounded-md flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Letter inputs */}
            <div className="flex flex-wrap gap-1 items-center">
              {r.newSectionNames.map((n, i) => (
                <input
                  key={i}
                  value={n}
                  onChange={e => updateName(r.gradeId, i, e.target.value)}
                  maxLength={2}
                  placeholder="A"
                  title="Identificador de sección"
                  className="w-7.5 h-7.5 text-center text-xs font-black uppercase bg-white text-primary rounded-lg border border-slate-200 focus:border-primary focus:outline-none transition-all"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Projections */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Distribución Proyectada
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(dist).map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 border border-primary/20 rounded-md text-[11px] font-bold text-primary"
              >
                <span className="text-[9px] text-slate-400 uppercase font-bold">Secc. {name}:</span>
                <span className="font-mono text-primary font-black">{count}</span>
              </span>
            ))}
            {Object.keys(dist).length === 0 && (
              <span className="text-[10px] text-slate-400 italic">Sin alumnos proyectados</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
