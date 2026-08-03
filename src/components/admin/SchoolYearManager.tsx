import React, { useCallback, useEffect, useState } from 'react';
import {
  Play,
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
import { Student, Grade, Section, BaccalaureateTypeDoc } from '../../types';
import {
  MigrationPlanRow,
  buildMigrationRows,
  resizeNames,
  distributeStudents,
  isActiveStudent
} from '../../lib/migration';

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
        getAllStudents(), getAllGrades(), getAllSections(), getAllBaccalaureateTypes(), getCurrentSchoolYear()
      ]);
      setStudents(stud);
      setCurrentYear(cy);
      setRows(buildMigrationRows(stud, gra, sec, bts, cy));
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const nextYear = currentYear ? currentYear + 1 : new Date().getFullYear();

  const updateCount = (gradeId: string, count: number) => {
    const c = Math.max(1, Math.min(6, count));
    setRows(prev => prev.map(r => r.gradeId === gradeId ? { ...r, newSectionNames: resizeNames(r.newSectionNames, c) } : r));
  };

  const updateName = (gradeId: string, index: number, value: string) => {
    setRows(prev => prev.map(r => r.gradeId === gradeId
      ? { ...r, newSectionNames: r.newSectionNames.map((n, i) => i === index ? value.toUpperCase() : n) }
      : r));
  };

  const totalIncoming = rows.reduce((sum, r) => sum + r.incomingCount, 0);
  const totalGraduates = rows.filter(r => r.nextGradeId === null).reduce((sum, r) => sum + r.outgoingCount, 0);
  const totalSections = rows.reduce((sum, r) => sum + r.newSectionNames.filter(n => n.trim()).length, 0);

  const getDistribution = (r: MigrationPlanRow) => {
    const sourceStudents = students.filter(s => isActiveStudent(s) && s.gradeId === r.sourceGradeId);
    const names = r.newSectionNames.filter(n => n.trim());
    return distributeStudents(sourceStudents, names).counts;
  };

  const handleStart = async () => {
    if (submitting) return;
    const year = nextYear;
    if (!confirm(`¿Iniciar año escolar ${year}? Se crearán las secciones nuevas y se migrarán los alumnos según la configuración anterior.`)) return;
    const config: YearSectionConfig[] = rows
      .filter(r => r.newSectionNames.some(n => n.trim()))
      .map(r => ({ gradeId: r.gradeId, sectionNames: r.newSectionNames.filter(n => n.trim()) }));
    setSubmitting(true);
    try {
      await startSchoolYear(year, config);
      toast.success(`Año escolar ${year} iniciado correctamente`);
      setLoading(true);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error('Error al iniciar año escolar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('¿Reset de pruebas? Se reiniciará el año escolar actual y se limpiarán datos de prueba.')) return;
    try {
      await resetTestData();
      toast.success('Reset de pruebas realizado');
      setLoading(true);
      await loadData();
    } catch (err) {
      toast.error('Error en reset de pruebas');
      console.error(err);
    }
  };

  const handleFixHistories = async () => {
    if (!confirm('¿Corregir historial de TODOS los alumnos? Se recalculará desde el año de ingreso según el carnet.')) return;
    try {
      await fixAllStudentHistories();
      toast.success('Historial corregido correctamente');
      setLoading(true);
      await loadData();
    } catch (err) {
      toast.error('Error al corregir historial');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-[#25855A] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500 font-display">Cargando planificación del año escolar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white/85 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300/60">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#25855A]/10 flex items-center justify-center text-[#25855A] shadow-2xs">
            <CalendarDays className="w-5.5 h-5.5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 font-display tracking-tight">Iniciar Nuevo Año Escolar</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              {currentYear ? (
                <>
                  Año en curso: <span className="font-extrabold text-[#25855A] font-mono bg-[#25855A]/10 px-2 py-0.5 rounded-md">{currentYear}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  Próximo año a planificar: <span className="font-extrabold text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">{nextYear}</span>
                </>
              ) : (
                <span className="text-amber-600 font-medium">Aún no se ha inicializado ningún año escolar en el sistema.</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50/60 border border-blue-100 rounded-full text-xs font-bold text-blue-700 shadow-3xs">
            <Sparkles className="w-3.5 h-3.5" />
            Planificación Interactiva
          </span>
        </div>
      </div>

      {/* Resumen de migración */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1: Alumnos a migrar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-[#25855A]/30 relative overflow-hidden flex items-center justify-between group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#25855A]/10 flex items-center justify-center text-[#25855A] transition-colors group-hover:bg-[#25855A]/15 shadow-3xs">
              <Users className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos a Migrar</span>
              <span className="block text-xs text-slate-500 mt-0.5">Promoción del ciclo actual</span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            {totalIncoming}
          </div>
        </div>

        {/* Card 2: Graduaciones */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-amber-500/30 relative overflow-hidden flex items-center justify-between group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 transition-colors group-hover:bg-amber-500/15 shadow-3xs">
              <GraduationCap className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Egresos</span>
              <span className="block text-xs text-slate-500 mt-0.5">Graduados de 11G/12T</span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-amber-600">
            {totalGraduates}
          </div>
        </div>

        {/* Card 3: Secciones Nuevas */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all hover:shadow-md hover:border-emerald-500/30 relative overflow-hidden flex items-center justify-between group">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 transition-colors group-hover:bg-emerald-500/15 shadow-3xs">
              <Layers className="w-5.5 h-5.5" />
            </div>
            <div>
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Aulas Planificadas</span>
              <span className="block text-xs text-slate-500 mt-0.5">Secciones a crear</span>
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-[#25855A]">
            {totalSections}
          </div>
        </div>
      </div>

      {/* Revisión por grado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-display">
              <GraduationCap className="w-5 h-5 text-[#25855A]" />
              Configuración de Migración y Secciones por Grado
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Modifica la cantidad de secciones por cada grado para el nuevo año escolar. El sistema distribuirá automáticamente a los alumnos en vivo.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400 font-mono bg-white border border-slate-200/60 px-2.5 py-1 rounded-lg">
            {rows.length} Grados activos
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3.5">Grado de Destino</th>
                <th className="px-6 py-3.5">Flujo de Promoción</th>
                <th className="px-6 py-3.5">Siguiente Paso</th>
                <th className="px-6 py-3.5">Secciones Actuales</th>
                <th className="px-6 py-3.5">Secciones {nextYear}</th>
                <th className="px-6 py-3.5">Distribución en Vivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70">
              {rows.map(r => {
                const dist = getDistribution(r);
                const changed = r.currentSectionNames.length !== r.newSectionNames.filter(n => n.trim()).length;
                return (
                  <tr key={r.gradeId} className="hover:bg-slate-50/20 transition-colors duration-150 align-top">
                    {/* Grado */}
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-slate-900 font-display text-sm">{r.gradeName}</div>
                      <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{r.outgoingCount} alumnos activos</div>
                    </td>

                    {/* Flujo de Promoción */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <span className="truncate max-w-[120px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded" title={r.sourceGradeName}>{r.sourceGradeName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#25855A] shrink-0" />
                          <span className="font-bold text-slate-800 bg-[#25855A]/5 px-1.5 py-0.5 rounded border border-[#25855A]/10 truncate max-w-[120px]" title={r.gradeName}>{r.gradeName}</span>
                        </div>
                        <div className="text-[11px] text-[#25855A] font-bold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#25855A]"></span>
                          +{r.incomingCount} alumnos a reubicar
                        </div>
                      </div>
                    </td>

                    {/* Siguiente paso */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <span className="font-semibold text-slate-700 truncate max-w-[110px]" title={r.gradeName}>{r.gradeName}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-600 truncate max-w-[110px]" title={r.nextGradeName}>{r.nextGradeName}</span>
                        </div>
                        {r.nextGradeId === null ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full w-fit">
                            Graduación / Egreso
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 mt-0.5">
                            {r.outgoingCount} promueven
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Secciones actuales */}
                    <td className="px-6 py-4.5">
                      {r.currentSectionNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.currentSectionNames.map(n => (
                            <span key={n} className="badge badge-slate px-2 py-0.5 font-bold font-mono text-[11px]">{n}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Ninguna sección</span>
                      )}
                    </td>

                    {/* Nuevas Secciones (Configurable) */}
                    <td className="px-6 py-4.5 space-y-2">
                      {/* Counter interactivo premium */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center inline-flex bg-slate-100 border border-slate-200 rounded-lg p-0.5 shadow-3xs">
                          <button
                            type="button"
                            onClick={() => updateCount(r.gradeId, r.newSectionNames.length - 1)}
                            disabled={r.newSectionNames.length <= 1}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors font-black text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-800 font-mono">
                            {r.newSectionNames.length}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCount(r.gradeId, r.newSectionNames.length + 1)}
                            disabled={r.newSectionNames.length >= 6}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 disabled:opacity-35 disabled:hover:bg-transparent transition-colors font-black text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">Aulas</span>
                      </div>

                      {/* Inputs de letras editables */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {r.newSectionNames.map((n, i) => (
                          <input
                            key={i}
                            value={n}
                            onChange={e => updateName(r.gradeId, i, e.target.value)}
                            maxLength={2}
                            title="Nombre de la sección"
                            className="w-9 h-9 text-center text-xs font-black uppercase bg-white border border-slate-200 rounded-lg text-primary focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none transition-all duration-150 shadow-3xs"
                          />
                        ))}
                      </div>

                      {changed && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                          Reconfigurada
                        </span>
                      )}
                    </td>

                    {/* Distribución de alumnos */}
                    <td className="px-6 py-4.5">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(dist).map(([name, count]) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#25855A]/5 border border-[#25855A]/15 rounded-xl text-xs font-semibold text-[#25855A] shadow-3xs hover:scale-[1.03] transition-all duration-150 cursor-default"
                          >
                            <span className="text-[10px] text-[#25855A]/70 uppercase font-bold">Secc.</span>
                            <span className="font-black text-slate-800">{name}</span>
                            <span className="bg-white text-primary px-1.5 py-0.5 rounded-md font-extrabold font-mono text-[10px] border border-primary/10 shadow-3xs">
                              {count}
                            </span>
                          </span>
                        ))}
                        {Object.keys(dist).length === 0 && (
                          <span className="text-xs text-slate-400 italic">Sin alumnos entrantes</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm font-medium">No hay grados configurados en el sistema.</div>
          )}
        </div>
      </div>

      {/* Acción final & Resguardo */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-5 transition-all hover:border-slate-300/60">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display">Garantía de Resguardo Histórico</h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Las secciones y registros de asistencia de años anteriores permanecerán completamente intactos. Al iniciar el año,
              el sistema creará las nuevas secciones para <span className="font-bold text-[#25855A] font-mono">{nextYear}</span>,
              promoverá a los estudiantes según la configuración indicada y asignará el estado <span className="font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded font-mono">GRADUADO</span> a quienes egresen.
            </p>
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={submitting}
          className="btn-primary shrink-0 w-full md:w-auto px-6 py-3 font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Procesando Migración...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Iniciar Año Escolar {nextYear}</span>
            </>
          )}
        </button>
      </div>

      {/* Panel de Utilidades Avanzadas de Mantenimiento (Collapsible) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl overflow-hidden transition-all duration-300">
        <button
          type="button"
          onClick={() => setMaintenanceOpen(!maintenanceOpen)}
          className="w-full px-5 py-4 flex items-center justify-between text-left font-display text-xs font-bold uppercase text-slate-500 hover:bg-slate-100/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <span>Opciones Avanzadas de Mantenimiento y Diagnóstico</span>
          </div>
          {maintenanceOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {maintenanceOpen && (
          <div className="px-6 py-5 border-t border-slate-200 bg-white/50 space-y-4 fade-in">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider">¡Atención: Panel de Control de Emergencia!</h5>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  Estas herramientas interactúan directamente con la base de datos de producción para calibraciones y pruebas.
                  Úselas con precaución únicamente si es necesario recalibrar registros o resetear escenarios de simulación.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reset Pruebas */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <h6 className="text-xs font-bold text-slate-900 font-display">Reiniciar Escenario de Pruebas</h6>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Restaura el año escolar al escenario inicial y limpia la simulación. Útil para verificar repetidamente los flujos de migración.
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="btn-secondary text-rose-600 border-rose-200 hover:bg-rose-50/50 hover:border-rose-300 text-xs py-1.5 px-3 self-start rounded-full flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset de pruebas</span>
                </button>
              </div>

              {/* Corregir Historial */}
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <h6 className="text-xs font-bold text-slate-900 font-display">Corregir Historiales de Inscripción</h6>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Recalcula y reconstruye cronológicamente el historial de inscripciones de TODOS los estudiantes activos, tomando como base su carnet/año de ingreso.
                  </p>
                </div>
                <button
                  onClick={handleFixHistories}
                  className="btn-secondary text-[#25855A] border-emerald-200 hover:bg-emerald-50/50 hover:border-emerald-300 text-xs py-1.5 px-3 self-start rounded-full flex items-center gap-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Corregir historial del alumnado</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
