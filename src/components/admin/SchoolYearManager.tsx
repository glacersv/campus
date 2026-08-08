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
  Sparkles,
  Layers,
  TrendingUp,
  Award,
  ChevronRight
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
import { Student, Grade, Section, BaccalaureateTypeDoc } from '../../types';
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

export default function SchoolYearManager() {
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [rows, setRows] = useState<MigrationPlanRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);

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
        <p className="text-sm font-semibold text-slate-500 font-display animate-pulse">
          Cargando planificación del año escolar...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in max-w-7xl mx-auto pb-12">
      {/* Premium Header */}
      <div className="relative bg-white/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-xs overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-slate-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 shadow-inner transition-transform hover:scale-105 duration-300">
            <CalendarDays className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 font-display tracking-tight leading-tight">
              Apertura del Período Lectivo
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              {currentYear ? (
                <>
                  <span>Lectivo actual:</span>
                  <span className="font-extrabold text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md">
                    {currentYear}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Planificación próximo año:</span>
                  <span className="font-extrabold text-accent font-mono bg-accent/10 border border-accent/20 px-2.5 py-0.5 rounded-md">
                    {nextYear}
                  </span>
                </>
              ) : (
                <span className="text-amber-600 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Sin año lectivo activo. Por favor, inicialice el sistema.
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/10 border border-primary/20 rounded-full text-xs font-bold text-primary shadow-3xs">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-spin-slow" />
            Planificación en Vivo
          </span>
        </div>
      </div>

      {/* Premium KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Card 1: Alumnos a promover */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-md hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary rounded-l-2xl transition-all duration-300 group-hover:w-2" />
          <div className="flex items-center gap-4 pl-1">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors shadow-3xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Alumnos a Promover
              </span>
              <span className="block text-xs text-slate-500 mt-0.5 font-medium">
                Padrón activo para próximo ciclo
              </span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
            {totalIncoming}
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-md hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary rounded-l-2xl transition-all duration-300 group-hover:w-2" />
          <div className="flex items-center gap-4 pl-1">
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-secondary/20 transition-colors shadow-3xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Egresados a Graduar
              </span>
              <span className="block text-xs text-slate-500 mt-0.5 font-medium">
                Saldrán del sistema (11G / 12T)
              </span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-700 font-mono bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
            {totalGraduates}
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="group bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs hover:shadow-md hover:border-slate-300/80 hover:-translate-y-1 transition-all duration-300 flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-accent rounded-l-2xl transition-all duration-300 group-hover:w-2" />
          <div className="flex items-center gap-4 pl-1">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent/20 transition-colors shadow-3xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-[11px] font-black text-slate-400 uppercase tracking-wider">
                Nuevas Secciones
              </span>
              <span className="block text-xs text-slate-500 mt-0.5 font-medium">
                Aulas virtuales a generar
              </span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-700 font-mono bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
            {totalSections}
          </div>
        </div>
      </div>

      {/* Main Configurations Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 font-display">
              <TrendingUp className="w-5.5 h-5.5 text-primary" />
              Estructura de Promoción y Aulas
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Configure las secciones que estarán disponibles para el período lectivo {nextYear}. El sistema distribuirá de forma óptima a los alumnos.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 font-mono bg-white border border-slate-200/80 px-4 py-2 rounded-xl shadow-3xs self-start sm:self-auto">
            {rows.length} Grados Configurables
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl text-slate-400 shadow-3xs">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No se encontraron grados activos configurados en el sistema.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rows.map((r, rowIndex) => {
              const dist = getDistribution(r);
              const isReconfigured =
                r.currentSectionNames.length !==
                r.newSectionNames.filter(n => n.trim()).length;
              return (
                <motion.div
                  key={r.gradeId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: rowIndex * 0.02 }}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-300 relative group/card overflow-hidden min-h-[360px]"
                >
                  {/* Decorative corner accent bar based on Cycle */}
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                    r.cycle === 'parvularia' ? 'from-pink-400 to-pink-500' :
                    r.cycle === '1' ? 'from-emerald-400 to-emerald-500' :
                    r.cycle === '2' ? 'from-blue-400 to-blue-500' :
                    r.cycle === '3' ? 'from-purple-400 to-purple-500' :
                    'from-amber-400 to-amber-500'
                  }`} />

                  <div className="space-y-4">
                    {/* Header: Grade & Cycle */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-base font-black text-slate-900 font-display group-hover/card:text-primary transition-colors">
                          {r.gradeName}
                        </h4>
                        <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          r.cycle === 'parvularia' ? 'bg-pink-50 text-pink-700 border-pink-100' :
                          r.cycle === '1' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          r.cycle === '2' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                          r.cycle === '3' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {CYCLE_LABEL[r.cycle] || r.cycle}
                        </span>
                      </div>

                      {r.nextGradeId === null ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          <GraduationCap className="w-3.5 h-3.5" />
                          Egreso
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">
                          {r.nextGradeName}
                        </span>
                      )}
                    </div>

                    {/* Flow / Matrícula Entrante */}
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
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Padrón actual en grado:</span>
                        <span className="font-bold text-slate-600">{r.outgoingCount} alumnos</span>
                      </div>
                    </div>

                    {/* Aulas en Curso (Año actual) */}
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

                    {/* Nuevas Secciones (Planificadas) */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Aulas Planificadas ({nextYear})
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

                    {/* LIVE Distribution counts */}
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
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Safety Info & Activation Call to Action */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-6 transition-all hover:border-slate-300">
        <div className="flex items-start gap-4 max-w-3xl">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <CheckCircle2 className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-900 font-display uppercase tracking-wider">
              Políticas de Preservación Histórica
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Toda la información académica de ciclos lectivos anteriores (secciones, directores, registros de control, asistencias y reportes) queda estrictamente salvaguardada en almacenamiento histórico aislado. Al iniciar el período, el sistema estructurará el año <span className="font-extrabold text-primary font-mono">{nextYear}</span> de forma completamente limpia.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary w-full lg:w-auto px-8 py-4 font-black uppercase text-xs tracking-widest shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-3 shrink-0 cursor-pointer"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Ejecutando Migración...</span>
            </>
          ) : (
            <>
              <Save className="w-4.5 h-4.5" />
              <span>Aperturar Año Escolar {nextYear}</span>
            </>
          )}
        </button>
      </div>

      {/* Maintenance Drawer */}
      <div className="bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-6 py-4.5 flex items-center justify-between text-left font-display text-xs font-black uppercase tracking-wider text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Wrench className="w-4.5 h-4.5 text-slate-500" />
            <span>Herramientas del Sistema y Calibración de Datos</span>
          </div>
          {maintenanceOpen ? (
            <ChevronUp className="w-4.5 h-4.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-4.5 h-4.5 text-slate-500" />
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
              <div className="px-6 py-6 border-t border-slate-200 bg-white/50 space-y-5">
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl flex items-start gap-3.5">
                  <AlertTriangle className="w-5.5 h-5.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                      Atención: Consola de Diagnóstico de Datos
                    </h5>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      Estas herramientas realizan operaciones profundas directamente sobre la base de datos de producción. Úselas con precaución para corregir desalineaciones históricas de padrones o limpiar simulaciones de pruebas.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Reset Pruebas */}
                  <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-3xs hover:border-slate-300 transition-all hover:scale-[1.005] duration-200">
                    <div>
                      <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        Reinicio de Matrícula y Pruebas
                      </h6>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Limpia las secciones temporales de prueba, restableciendo el año lectivo y permitiendo ejecutar múltiples flujos interactivos de simulación de migración escolar.
                      </p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-[11px] font-bold py-2.5 px-4 self-start rounded-xl flex items-center gap-2 shadow-3xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Resetear Escenario</span>
                    </button>
                  </div>

                  {/* Corregir Historial */}
                  <div className="bg-white border border-slate-200/80 p-5 rounded-xl flex flex-col justify-between gap-4 shadow-3xs hover:border-slate-300 transition-all hover:scale-[1.005] duration-200">
                    <div>
                      <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider">
                        Reconstrucción Académica de Historiales
                      </h6>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Audita, recalcula y reconstruye cronológicamente año por año el historial completo de inscripciones de todo el alumnado activo del plantel desde su respectiva fecha de ingreso.
                      </p>
                    </div>
                    <button
                      onClick={handleFixHistories}
                      className="btn-secondary text-primary border-primary/20 hover:bg-primary/5 hover:border-primary/30 text-[11px] font-bold py-2.5 px-4 self-start rounded-xl flex items-center gap-2 shadow-3xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>Reconstruir Historial Alumnos</span>
                    </button>
                  </div>
                </div>

                {/* Sincronizador Interactivo de Firebase */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-3xs hover:border-slate-300 transition-all">
                  <div>
                    <h6 className="text-xs font-black text-slate-900 font-display uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-primary" />
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
                      <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1.5">JSON de Configuración SDK de Firebase de Origen</label>
                      <textarea
                        rows={5}
                        value={migrationSdk}
                        onChange={e => setMigrationSdk(e.target.value)}
                        placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
                        className="w-full text-xs font-mono p-4 border border-slate-200 rounded-2xl bg-slate-50/80 focus:ring-4 focus:ring-primary/15 focus:border-primary focus:outline-none transition-all shadow-3xs"
                      />
                    </div>

                    {migrationStatus && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-3xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-slate-600">{migrationStatus}</span>
                          <span className="text-[11px] font-extrabold text-primary font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300" style={{ width: `${migrationProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={runningMigration}
                      className="btn-primary text-xs py-3 px-6 rounded-2xl flex items-center gap-2 disabled:opacity-40 transition-all shadow-3xs cursor-pointer"
                    >
                      {runningMigration ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Sincronizando y reconstruyendo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
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
