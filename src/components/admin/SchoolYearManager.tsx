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
import { Student, Cycle } from '../../types';
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
        <p className="text-sm font-semibold text-secondary font-display animate-pulse">
          Cargando planificación del año escolar...
        </p>
      </div>
    );
  }

  // Filter rows by cycle
  const filteredRows = selectedCycle === 'all'
    ? rows
    : rows.filter(r => r.cycle === selectedCycle);

  // Group filtered rows dynamically by educational cycle
  const groupedRows: Record<string, MigrationPlanRow[]> = {};
  filteredRows.forEach(r => {
    const cy = r.cycle || 'unknown';
    if (!groupedRows[cy]) {
      groupedRows[cy] = [];
    }
    groupedRows[cy].push(r);
  });

  const activeCycles = CYCLE_ORDER.filter(c => groupedRows[c] && groupedRows[c].length > 0);
  Object.keys(groupedRows).forEach(c => {
    if (!activeCycles.includes(c as Cycle)) {
      activeCycles.push(c as Cycle);
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Module Header (Standardized) */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon">
            <CalendarDays className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Iniciar Año Escolar</h1>
            <p className="module-subtitle">
              Planificación del período lectivo y migración de matrículas
            </p>
          </div>
        </div>
      </div>

      {/* Year Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lectivo Activo:</span>
          <span className="font-extrabold text-primary font-mono bg-primary/10 px-3 py-1 rounded-lg text-xs">
            {currentYear ? currentYear : 'Sin Año Activo'}
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planificación:</span>
          <span className="font-extrabold text-accent font-mono bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg text-xs">
            {nextYear}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Planificación en Vivo
          </span>
        </div>
      </div>

      {/* KPI Banner Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Alumnos a promover */}
        <div className="stat-card">
          <div className="stat-card-icon bg-primary/10 text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Alumnos a Promover</span>
            <div className="stat-card-value text-primary">{totalIncoming}</div>
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="stat-card">
          <div className="stat-card-icon bg-secondary/10 text-secondary">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Egresados a Graduar</span>
            <div className="stat-card-value text-slate-800">{totalGraduates}</div>
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="stat-card">
          <div className="stat-card-icon bg-accent/10 text-accent">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="stat-card-label">Nuevas Secciones ({nextYear})</span>
            <div className="stat-card-value text-slate-800">{totalSections}</div>
          </div>
        </div>
      </div>

      {/* Cycle Filter Pills Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCycle('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCycle === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Todos
          </button>
          {CYCLE_ORDER.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCycle(c)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCycle === c
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              {CYCLE_LABEL[c]}
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-slate-500 font-mono bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
          {filteredRows.length} {filteredRows.length === 1 ? 'Grado' : 'Grados'}
        </span>
      </div>

      {/* Configurations Cards Grid */}
      {filteredRows.length === 0 ? (
        <div className="empty-state card-soft">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">
            No se encontraron grados configurados para el filtro seleccionado.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {activeCycles.map(cycleKey => {
            const cycleRows = groupedRows[cycleKey];
            return (
              <div key={cycleKey} className="space-y-4">
                {/* Cycle section heading */}
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

                {/* Grid of GradeMigrationCards */}
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

      {/* Activation Action Card */}
      <div className="card-crema p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:border-slate-300">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <CheckCircle2 className="w-5.5 h-5.5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">
              Políticas de Preservación Histórica
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Toda la información académica de ciclos lectivos anteriores queda estrictamente salvaguardada en almacenamiento histórico. Al iniciar el período, el sistema estructurará el año <span className="font-extrabold text-primary font-mono">{nextYear}</span> de forma limpia con las secciones planificadas.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full lg:w-auto px-8 py-3.5 font-black uppercase text-xs tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
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

      {/* Diagnostics / Maintenance Drawer */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
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
              <div className="px-6 py-6 border-t border-slate-200 space-y-5">
                <div className="p-4 bg-white border-l-4 border-slate-400 rounded-r-xl flex items-start gap-3.5 shadow-2xs">
                  <AlertTriangle className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      Atención: Consola de Diagnóstico de Datos
                    </h5>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Estas herramientas realizan operaciones profundas directamente sobre la base de datos de producción. Úselas con precaución para corregir desalineaciones históricas de padrones o limpiar simulaciones de pruebas.
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
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs font-bold py-2 px-4 self-start rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
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
                        Audita, recalcula y reconstruye cronológicamente año por año el historial completo de inscripciones de todo el alumnado activo del plantel desde su respectiva fecha de ingreso.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-xs font-bold py-2 px-4 self-start rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Sincronizador Interactivo de Firebase */}
                <div className="card-crema p-6 space-y-4">
                  <div>
                    <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider flex items-center gap-2">
                      Migrador Interactivo y Sincronización de Alumnos (Multi-Firebase SDK)
                    </h6>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      Pega el JSON de configuración de Firebase de tu proyecto de origen (las credenciales Web o de Cliente de Firebase SDK).
                      Esta herramienta <strong className="text-red-600 font-semibold">limpiará por completo la colección actual de alumnos</strong> e insertará y reconstruirá de manera inteligente
                      los historiales de la base de datos de origen directamente en este Firebase de destino.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-4">
                    <div>
                      <label className="form-label">JSON de Configuración SDK de Firebase de Origen</label>
                      <textarea
                        rows={4}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                        className="input-crema text-xs font-mono p-3"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-600">{migrationStatus}</span>
                          <span className="text-xs font-extrabold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${migrationProgress}%` }} />
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
                          <span>Sincronizando y reconstruyendo...</span>
                        </>
                      ) : (
                        <span>Iniciar Sincronización y Limpieza Completa</span>
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
      transition={{ duration: 0.25 }}
      className="card-crema p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[380px]"
    >
      <div className="space-y-4">
        {/* Header: Grade & Cycle */}
        <div className="flex items-start justify-between gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-black text-slate-900 font-display transition-colors leading-tight truncate" title={r.gradeName}>
              {r.gradeName}
            </h4>
            <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
              r.cycle === 'parvularia' ? 'bg-pink-50 text-pink-700 border-pink-200' :
              r.cycle === '1' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              r.cycle === '2' ? 'bg-sky-50 text-sky-700 border-sky-200' :
              r.cycle === '3' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              'bg-orange-50 text-orange-700 border-orange-200'
            }`}>
              {CYCLE_LABEL[r.cycle] || r.cycle}
            </span>
          </div>

          <div className="shrink-0">
            {r.nextGradeId === null ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-black text-secondary bg-slate-50 border border-slate-200 px-2 py-1 rounded-full uppercase tracking-wider">
                <GraduationCap className="w-3 h-3" />
                Egreso
              </span>
            ) : (
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md block max-w-[95px] truncate" title={r.nextGradeName}>
                {r.nextGradeName}
              </span>
            )}
          </div>
        </div>

        {/* Enrollment Flow Comparison */}
        <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Flujo de Alumnos
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Ingreso (+{r.incomingCount}):</span>
            <span className="font-bold text-primary truncate max-w-[100px]" title={r.sourceGradeName}>{r.sourceGradeName}</span>
          </div>
          <div className="flex justify-between items-center text-xs border-t border-slate-100/60 pt-1.5 mt-1">
            <span className="text-slate-500 font-medium">Egreso ({r.outgoingCount}):</span>
            <span className="font-bold text-slate-700 truncate max-w-[100px]" title={r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}>
              {r.nextGradeName === 'Graduación' ? 'Egreso' : r.nextGradeName}
            </span>
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
                  className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-slate-600 font-black font-mono text-[11px] shadow-2xs"
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
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Aulas Planificadas ({nextYear})
            </span>
            {isReconfigured && (
              <span className="text-[9px] font-black uppercase text-accent bg-accent/10 border border-accent/20 px-1.5 py-0.5 rounded">
                Modificado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs shrink-0">
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

            {/* Interactive inputs for section letters */}
            <div className="flex flex-wrap gap-1 items-center">
              {r.newSectionNames.map((n, i) => (
                <input
                  key={i}
                  value={n}
                  onChange={e => updateName(r.gradeId, i, e.target.value)}
                  maxLength={2}
                  placeholder="A"
                  title="Identificador de la sección"
                  className="w-8 h-8 text-center text-xs font-black uppercase input-crema bg-white text-primary p-0 rounded-lg border-slate-200"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Live Promotion/Balance Distribution Block */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Distribución Proyectada
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(dist).map(([name, count]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 shadow-2xs hover:scale-105 hover:bg-slate-200/80 transition-all duration-200 cursor-default"
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
}
