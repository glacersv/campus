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
  Filter
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

  const getDistribution = (r: MigrationPlanRow) => {
    const sourceStudents = students.filter(
      s => isActiveStudent(s) && s.gradeId === r.sourceGradeId
    );
    const names = r.newSectionNames.filter(n => n.trim());
    return distributeStudents(sourceStudents, names).counts;
  };

  const handleStart = async () => {
    if (submitting) return;
    const year = nextYear;
    if (
      !confirm(
        `¿Confirmas el inicio del año escolar ${year}? \n\nEsta operación promoverá automáticamente a los estudiantes activos e inicializará el nuevo período lectivo.`
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
        <p className="text-xs font-bold text-secondary font-display animate-pulse uppercase tracking-wider">
          Cargando planificación del año escolar...
        </p>
      </div>
    );
  }

  // Group rows dynamically by educational cycle
  const cycleOrder: Cycle[] = ['parvularia', '1', '2', '3', '4'];
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
    if (!activeCycles.includes(c as Cycle)) {
      activeCycles.push(c as Cycle);
    }
  });

  const filteredCycles = activeCycles.filter(c => selectedCycle === 'all' || c === selectedCycle);

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-12">
      {/* Standard Module Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="module-title">Iniciar Año Escolar</h1>
            <p className="module-subtitle">
              Configuración de aulas y planificación de promoción para el nuevo ciclo lectivo
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Planificación en Vivo
          </span>
        </div>
      </div>

      {/* Active Year Lectivo Info Banner */}
      <div className="card-crema p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
            <CalendarDays className="w-5.5 h-5.5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Estado de Período Lectivo
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {currentYear ? (
                <>
                  <span className="text-xs font-bold text-slate-700">Actual:</span>
                  <span className="font-extrabold text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md text-xs">
                    {currentYear}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Aperturando:</span>
                  <span className="font-extrabold text-accent font-mono bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-md text-xs">
                    {nextYear}
                  </span>
                </>
              ) : (
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> Sin año lectivo activo.
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-slate-500 font-medium text-right md:text-right">
          <span>Total configurables: </span>
          <span className="font-bold text-slate-800 font-mono">{rows.length} Grados</span>
        </div>
      </div>

      {/* Standardized KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alumnos a promover */}
        <div className="stat-card relative overflow-hidden">
          <div className="stat-card-icon bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Alumnos a Promover</span>
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              Padrón lectivo entrante
            </span>
          </div>
          <div className="stat-card-value text-primary">
            {totalIncoming}
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="stat-card relative overflow-hidden">
          <div className="stat-card-icon bg-amber-500/10 text-amber-600">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Egresados a Graduar</span>
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              Salida de Bachillerato
            </span>
          </div>
          <div className="stat-card-value text-slate-700">
            {totalGraduates}
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="stat-card relative overflow-hidden">
          <div className="stat-card-icon bg-accent/10 text-accent">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Nuevas Aulas/Secciones</span>
            <span className="block text-[11px] text-slate-500 font-medium truncate">
              Apertura en {nextYear}
            </span>
          </div>
          <div className="stat-card-value text-slate-700">
            {totalSections}
          </div>
        </div>
      </div>

      {/* Main Configurations Section & Cycle Filter Bar */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
              <TrendingUp className="w-4.5 h-4.5 text-primary" />
              Estructura de Promoción y Aulas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajuste las secciones a aperturar para {nextYear}. El sistema distribuirá de forma equilibrada a los estudiantes.
            </p>
          </div>

          {/* Cycle Filter Pill Buttons */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex-wrap">
            <button
              type="button"
              onClick={() => setSelectedCycle('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCycle === 'all'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              Todos ({rows.length})
            </button>
            {CYCLE_KEYS.map(c => {
              const count = rows.filter(r => r.cycle === c).length;
              if (count === 0) return null;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCycle(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCycle === c
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  {CYCLE_LABEL[c]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="empty-state card-crema py-12">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
            <p className="text-sm font-medium text-slate-500">
              No se encontraron grados configurados en el sistema.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredCycles.map(cycleKey => {
              const cycleRows = groupedRows[cycleKey];
              if (!cycleRows || cycleRows.length === 0) return null;

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

                  {/* Responsive Grid of Interactive Migration Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
      </div>

      {/* Policies & Activation Call to Action */}
      <div className="card-crema p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider">
              Políticas de Preservación Histórica
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              La información académica de los ciclos lectivos anteriores queda resguardada en histórico. Al aperturar el año <span className="font-bold text-primary font-mono">{nextYear}</span>, el sistema creará las nuevas aulas limpias y promoverá a los alumnos en curso.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full lg:w-auto px-7 py-3.5 font-bold text-xs uppercase tracking-wider shrink-0 cursor-pointer shadow-md hover:shadow-lg transition-all"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Ejecutando Migración...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Aperturar Año Escolar {nextYear}</span>
            </>
          )}
        </button>
      </div>

      {/* Maintenance Drawer */}
      <div className="card-crema overflow-hidden">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-6 py-4 flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
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
              className="overflow-hidden border-t border-slate-100"
            >
              <div className="p-6 space-y-5">
                <div className="p-3.5 bg-slate-50 border-l-4 border-slate-400 rounded-r-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Atención: Consola de Diagnóstico
                    </h5>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Estas herramientas modifican registros de producción para corregir historiales o restablecer escenarios de simulación.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reset Pruebas */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Reinicio de Matrícula de Pruebas
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Limpia las secciones temporales de simulación, permitiendo volver a probar la migración.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-danger text-xs py-2 px-3.5 self-start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-3">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Audita y recalcula año a año el historial completo de inscripciones del alumnado desde su ingreso.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-xs py-2 px-3.5 self-start text-primary border-primary/20 hover:bg-primary/5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Multi-Firebase SDK Sincronizador Interactivo */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-4">
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Migrador Interactivo y Sincronización (Multi-Firebase SDK)
                    </h6>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Ingrese la configuración JSON de Firebase SDK de origen. La herramienta limpiará y sincronizará la colección de alumnos.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-3">
                    <div>
                      <label className="form-label">
                        Configuración SDK JSON de Origen
                      </label>
                      <textarea
                        rows={4}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "projectId": "..."\n}`}
                        className="input-crema text-xs font-mono"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-600">{migrationStatus}</span>
                          <span className="font-bold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
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
                      className="btn-primary text-xs py-2.5 px-5 disabled:opacity-40"
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card-crema p-5 flex flex-col justify-between relative overflow-hidden min-h-[380px] group/card"
    >
      {/* Subtle top border gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

      <div className="space-y-4">
        {/* Header: Grade & Cycle */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-slate-900 font-display group-hover/card:text-primary transition-colors leading-tight truncate" title={r.gradeName}>
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
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-wider">
                <GraduationCap className="w-3 h-3 text-slate-500" />
                Egreso
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md block max-w-[85px] truncate" title={r.nextGradeName}>
                {r.nextGradeName}
              </span>
            )}
          </div>
        </div>

        {/* Enrollment Flow Comparison */}
        <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
            <span className="uppercase tracking-wider">Flujo de Alumnos</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Ingreso (+{r.incomingCount}):</span>
            <span className="font-bold text-primary truncate max-w-[90px]" title={r.sourceGradeName}>{r.sourceGradeName}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-slate-200/50 pt-1.5 mt-1">
            <span className="text-slate-500 font-medium">Egreso ({r.outgoingCount}):</span>
            <span className="font-bold text-slate-700 truncate max-w-[90px]" title={r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}>{r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}</span>
          </div>
        </div>

        {/* Current Classrooms State */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Aulas en Curso
          </div>
          {r.currentSectionNames.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {r.currentSectionNames.map(n => (
                <span
                  key={n}
                  className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-mono font-bold text-[11px]"
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

        {/* Planned Sections for Next Year */}
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Aulas Planificadas ({nextYear})
            </span>
            {isReconfigured && (
              <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 border border-amber-200/60 px-1.5 py-0.5 rounded">
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
              <span className="w-6 text-center text-xs font-bold text-slate-800 font-mono">
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

            {/* Interactive Section Letter Inputs */}
            <div className="flex flex-wrap gap-1 items-center">
              {r.newSectionNames.map((n, i) => (
                <input
                  key={i}
                  value={n}
                  onChange={e => updateName(r.gradeId, i, e.target.value)}
                  maxLength={2}
                  placeholder="A"
                  title="Identificador de la sección"
                  className="w-8 h-8 text-center text-xs font-bold uppercase bg-white border border-slate-200 rounded-lg text-primary p-0 focus:border-primary focus:outline-none transition-all shadow-3xs"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Balance Distribution */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Distribución Proyectada
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(dist).map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-3xs"
              >
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">
                  Secc. {name}
                </span>
                <span className="text-primary font-mono font-extrabold text-[11px]">
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
}
