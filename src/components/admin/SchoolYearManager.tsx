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
  Sparkles,
  RefreshCw
} from 'lucide-react';
import ResetDemonstrationModal from './ResetDemonstrationModal';
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
  const [showDemoResetModal, setShowDemoResetModal] = useState(false);

  // Educational cycle filter state
  const [selectedCycle, setSelectedCycle] = useState<Cycle | 'all'>('all');

  // Manual target year state
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

  // Validate manual year input and establish warnings
  useEffect(() => {
    const yearInt = parseInt(manualYear, 10);
    if (!manualYear || isNaN(yearInt)) {
      setYearWarning({ type: 'error', message: 'Ingrese un año lectivo válido' });
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

  const handleYearIncrement = (delta: number) => {
    const curr = parseInt(manualYear, 10) || (currentYear ? currentYear + 1 : new Date().getFullYear());
    const nextVal = Math.max(2020, curr + delta);
    setManualYear(String(nextVal));
  };

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

  // Filter rows by cycle
  const visibleRows = rows.filter(r => selectedCycle === 'all' || r.cycle === selectedCycle);

  const totalIncoming = visibleRows.reduce((sum, r) => sum + r.incomingCount, 0);
  const totalGraduates = visibleRows
    .filter(r => r.nextGradeId === null)
    .reduce((sum, r) => sum + r.outgoingCount, 0);
  const totalSections = visibleRows.reduce(
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
        `¿Confirmas la apertura e inicio del año escolar ${yearInt}? \n\nEsta operación promoverá automáticamente a los estudiantes activos e inicializará el nuevo período lectivo.`
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

  // State for interactive migration & data cleanup tool
  const [migrationSdk, setMigrationSdk] = useState('');
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [runningMigration, setRunningMigration] = useState(false);

  const handleInteractiveMigration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrationSdk.trim()) {
      toast.error('Por favor, ingresa la Configuración JSON SDK válida.');
      return;
    }

    let parsedConfig;
    try {
      parsedConfig = JSON.parse(migrationSdk);
    } catch (err) {
      toast.error('La configuración SDK ingresada no es un JSON válido.');
      return;
    }

    if (
      !confirm(
        'Esta operación borrará la colección de alumnos del Firebase destino activo e insertará los registros del Firebase origen. ¿Deseas continuar?'
      )
    )
      return;

    setRunningMigration(true);
    setMigrationProgress(10);
    setMigrationStatus('Inicializando conexión con Firebase de origen...');

    try {
      const { initializeApp: initClientApp, deleteApp, getApp } = await import('firebase/app');
      const { getFirestore: getClientFirestore, collection: getClientCollection, getDocs: getClientDocs } = await import(
        'firebase/firestore'
      );

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
  const groupedRows: Record<string, MigrationPlanRow[]> = {};
  visibleRows.forEach(r => {
    const cy = r.cycle || 'unknown';
    if (!groupedRows[cy]) {
      groupedRows[cy] = [];
    }
    groupedRows[cy].push(r);
  });

  const activeCycles = CYCLE_KEYS.filter(c => groupedRows[c] && groupedRows[c].length > 0);
  Object.keys(groupedRows).forEach(c => {
    if (!activeCycles.includes(c as Cycle)) {
      activeCycles.push(c as Cycle);
    }
  });

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto pb-12">
      {/* Standardized Module Header */}
      <div className="module-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="module-title-group">
          <div className="module-icon">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Apertura del Período Lectivo</h1>
            <p className="module-subtitle">
              Configuración de la estructura de aulas y promociones automáticas
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Target Year Selector Pill */}
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-3xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Año Lectivo Actual:
            </span>
            <span className="font-extrabold text-primary font-mono text-xs bg-primary/10 px-2 py-0.5 rounded-md">
              {currentYear || 'Sin Iniciar'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-0.5" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Próximo:
            </span>
            <div className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-3xs">
              <button
                type="button"
                onClick={() => handleYearIncrement(-1)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all font-bold cursor-pointer"
                title="Año anterior"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                value={manualYear}
                onChange={e => setManualYear(e.target.value)}
                className="w-14 text-center font-black text-xs text-primary font-mono bg-transparent focus:outline-none"
                min={2020}
                max={2035}
              />
              <button
                type="button"
                onClick={() => handleYearIncrement(1)}
                className="w-5 h-5 rounded flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white transition-all font-bold cursor-pointer"
                title="Año siguiente"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowDemoResetModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-100" />
            <span>Calibrar Coordinación</span>
          </button>
        </div>
      </div>

      {/* Educational Cycle Filter Selector */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedCycle('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedCycle === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Todos ({rows.length})
          </button>
          {(Object.keys(CYCLE_NAMES) as Cycle[]).map(c => {
            const count = rows.filter(r => r.cycle === c).length;
            if (count === 0) return null;
            return (
              <button
                key={c}
                onClick={() => setSelectedCycle(c)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedCycle === c
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {CYCLE_NAMES[c]} ({count})
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData()}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl transition-all shadow-3xs cursor-pointer"
            title="Recargar datos de planificación"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Year Warning Banner */}
      {yearWarning && (
        <div
          className={`rounded-xl p-3.5 border flex items-center gap-3 text-xs font-medium ${
            yearWarning.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : yearWarning.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          {yearWarning.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          ) : yearWarning.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{yearWarning.message}</span>
        </div>
      )}

      {/* Key KPI Statistics Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">
              Alumnos a Promover
            </span>
            <span className="text-base font-extrabold text-slate-800 font-display">
              {totalIncoming} alumnos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">
              Egresados a Graduar
            </span>
            <span className="text-base font-extrabold text-slate-800 font-display">
              {totalGraduates} egresados
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5 text-accent" />
          </div>
          <div>
            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">
              Aulas Planificadas
            </span>
            <span className="text-base font-extrabold text-slate-800 font-display">
              {totalSections} secciones
            </span>
          </div>
        </div>
      </div>

      {/* Main Configurations Section */}
      <div className="space-y-6">
        {visibleRows.length === 0 ? (
          <div className="text-center py-16 card-crema text-tertiary">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">
              No se encontraron grados configurados para este filtro.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeCycles.map(cycleKey => {
              const cycleRows = groupedRows[cycleKey];
              if (!cycleRows || cycleRows.length === 0) return null;
              return (
                <div key={cycleKey} className="space-y-4">
                  {/* Cycle Header Divider */}
                  <div className="flex items-center gap-3 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 font-display flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      {CYCLE_LABEL[cycleKey] || cycleKey}
                    </h4>
                    <span className="px-2.5 py-0.5 bg-slate-200/60 border border-slate-300/30 text-slate-700 text-[10px] font-black rounded-full font-mono">
                      {cycleRows.length} {cycleRows.length === 1 ? 'Grado' : 'Grados'}
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>

                  {/* Responsive Grid Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
                          transition={{ delay: rowIndex * 0.02, duration: 0.3 }}
                          className="card-crema p-5 flex flex-col justify-between transition-all duration-300 relative group/card overflow-hidden"
                        >
                          {/* Accent bar */}
                          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

                          <div className="space-y-4">
                            {/* Header: Full-width Grade Title & Badges Row */}
                            <div className="space-y-1.5">
                              <h4
                                className="text-base font-black text-slate-900 font-display group-hover/card:text-primary transition-colors leading-tight"
                                title={r.gradeName}
                              >
                                {r.gradeName}
                              </h4>

                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200">
                                  {CYCLE_LABEL[r.cycle] || r.cycle}
                                </span>

                                <div>
                                  {r.nextGradeId === null ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-secondary bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                      <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                                      Egreso
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-100 px-2.5 py-0.5 rounded-md block"
                                      title={r.nextGradeName}
                                    >
                                      DESTINO: {r.nextGradeName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Enrollment Flow Comparison */}
                            <div className="space-y-1.5 bg-slate-50/80 border border-slate-100 rounded-xl p-3">
                              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                                <span className="uppercase tracking-wider">Flujo de Alumnos</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-500 font-medium">Matrícula Entrante:</span>
                                <span className="font-extrabold text-primary font-mono text-xs">
                                  +{r.incomingCount}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-1.5 mt-1 text-slate-500">
                                <span>Padrón actual en grado:</span>
                                <span className="font-bold text-slate-700">{r.outgoingCount} alumnos</span>
                              </div>
                            </div>

                            {/* Aulas en Curso */}
                            <div className="space-y-1">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Aulas en Curso ({currentYear || 'Actual'})
                              </div>
                              {r.currentSectionNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {r.currentSectionNames.map(n => (
                                    <span
                                      key={n}
                                      className="px-2.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-slate-600 font-bold font-mono text-[11px]"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Sin aulas asignadas
                                </span>
                              )}
                            </div>

                            {/* Next Year Planned Sections Block */}
                            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                  Aulas Planificadas ({targetYear})
                                </span>
                                {isReconfigured && (
                                  <span className="text-[9px] font-bold uppercase text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    Modificado
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="inline-flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-3xs shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                                    disabled={r.newSectionNames.length <= 1}
                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-xs font-black text-slate-800 font-mono">
                                    {r.newSectionNames.length}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCount(r.gradeId, r.newSectionNames.length + 1)}
                                    disabled={r.newSectionNames.length >= 6}
                                    className="w-6 h-6 rounded flex items-center justify-center text-slate-500 hover:bg-primary hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {r.newSectionNames.map((n, i) => (
                                    <input
                                      key={i}
                                      value={n}
                                      onChange={e => updateName(r.gradeId, i, e.target.value)}
                                      maxLength={2}
                                      placeholder="A"
                                      title="Identificador de la sección"
                                      className="w-7.5 h-7.5 text-center text-xs font-black uppercase bg-white text-primary rounded-md border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Balance Distribution Projections */}
                            <div className="space-y-1.5 pt-0.5">
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Distribución Proyectada
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(dist).map(([name, count]) => (
                                  <span
                                    key={name}
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/5 border border-primary/10 rounded-md text-[11px] font-bold text-primary"
                                  >
                                    <span className="text-[9px] text-slate-500 uppercase font-bold">
                                      Secc. {name}:
                                    </span>
                                    <span className="font-mono text-primary font-black">
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

      {/* Safety Info & Confirmation Banner */}
      <div className="card-crema p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 transition-all">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
              Políticas de Preservación Histórica
            </h4>
            <p className="text-xs text-secondary mt-0.5 leading-relaxed">
              Toda la información académica de ciclos lectivos anteriores queda resguardada intacta. Al aperturar el año <span className="font-extrabold text-primary font-mono">{targetYear}</span>, el sistema creará únicamente las nuevas aulas necesarias y actualizará el padrón en curso.
            </p>
          </div>
        </div>

        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full sm:w-auto px-6 py-3 font-bold uppercase text-xs tracking-wider shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Aperturando Año...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Aperturar Año Escolar {targetYear}</span>
            </>
          )}
        </button>
      </div>

      {/* Diagnostics & Maintenance Drawer */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-left font-display text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-secondary" />
            <span>Herramientas del Sistema y Calibración de Datos</span>
          </div>
          {maintenanceOpen ? (
            <ChevronUp className="w-4 h-4 text-secondary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-secondary" />
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
              <div className="px-5 py-5 border-t border-slate-200 space-y-4">
                <div className="p-3.5 bg-slate-50 border-l-4 border-slate-400 rounded-r-xl flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Consola de Diagnóstico de Datos
                    </h5>
                    <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                      Herramientas de mantenimiento para auditar, recalcular o restablecer escenarios de prueba.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Reset Pruebas */}
                  <div className="card-crema p-4 flex flex-col justify-between gap-3">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Reinicio de Matrícula y Pruebas
                      </h6>
                      <p className="text-[11px] text-tertiary mt-1 leading-relaxed">
                        Restablece las secciones temporales de prueba para simular la migración escolar.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-[11px] font-bold py-2 px-3.5 self-start rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="card-crema p-4 flex flex-col justify-between gap-3">
                    <div>
                      <h6 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-[11px] text-tertiary mt-1 leading-relaxed">
                        Recalcula y reconstruye cronológicamente el historial de inscripciones de todo el alumnado activo.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 text-[11px] font-bold py-2 px-3.5 self-start rounded-xl flex items-center gap-2 cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Sincronizador Interactivo Multi-Firebase SDK */}
                <div className="card-crema p-5 space-y-3">
                  <div>
                    <h6 className="text-xs font-bold text-slate-900 font-display uppercase tracking-wider">
                      Migrador Interactivo y Sincronización (Multi-Firebase SDK)
                    </h6>
                    <p className="text-[11px] text-secondary mt-1 leading-relaxed">
                      Pega el JSON de configuración de Firebase de tu proyecto de origen para sincronizar y limpiar datos.
                    </p>
                  </div>

                  <form onSubmit={handleInteractiveMigration} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-tertiary uppercase tracking-wider mb-1">
                        JSON Configuración SDK Firebase Origen
                      </label>
                      <textarea
                        rows={4}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "..."\n}`}
                        className="w-full text-xs font-mono p-3 input-crema"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-slate-700">{migrationStatus}</span>
                          <span className="font-extrabold text-primary font-mono">{migrationProgress}%</span>
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
                      className="btn-primary text-xs py-2.5 px-5 rounded-xl flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                    >
                      {runningMigration ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

      {/* Demonstration Reset Modal */}
      <ResetDemonstrationModal
        isOpen={showDemoResetModal}
        onClose={() => setShowDemoResetModal(false)}
        onSuccess={() => {
          loadData();
        }}
        targetSchoolYear={2026}
      />
    </div>
  );
}
