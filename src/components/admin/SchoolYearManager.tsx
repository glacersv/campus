import React, { useCallback, useEffect, useState } from 'react';
import { Play, RotateCcw, BookOpen, CalendarDays, Users, ArrowRight, GraduationCap, Save } from 'lucide-react';
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
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-display">Año Escolar</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentYear
                ? <>Año en curso: <span className="font-bold text-primary font-mono">{currentYear}</span> — próximo: <span className="font-bold font-mono">{nextYear}</span></>
                : 'Aún no se ha iniciado ningún año escolar'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="btn-secondary rounded-full">
            <RotateCcw className="w-4 h-4" /> Reset pruebas
          </button>
          <button onClick={handleFixHistories} className="btn-secondary rounded-full">
            <BookOpen className="w-4 h-4" /> Corregir historial
          </button>
        </div>
      </div>

      {/* Resumen de migración */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-5">
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalIncoming}</div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Alumnos a migrar</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalGraduates}</div>
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mt-1">Graduaciones</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="text-3xl font-extrabold text-slate-900 font-mono">{totalSections}</div>
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-1">Secciones nuevas</div>
        </div>
      </div>

      {/* Revisión por grado */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            Migración por Grado
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Revisa cómo migra cada grado y ajusta la cantidad y nombres de secciones antes de iniciar el año {nextYear}.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2.5">Grado</th>
                <th className="px-4 py-2.5">Recibe de</th>
                <th className="px-4 py-2.5">Migra hacia</th>
                <th className="px-4 py-2.5">Secciones actuales</th>
                <th className="px-4 py-2.5">Nuevas secciones</th>
                <th className="px-4 py-2.5">Distribución de alumnos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const dist = getDistribution(r);
                const changed = r.currentSectionNames.length !== r.newSectionNames.filter(n => n.trim()).length;
                return (
                  <tr key={r.gradeId} className="border-b border-slate-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{r.gradeName}</div>
                      <div className="text-[11px] text-slate-400">{r.outgoingCount} alumnos actuales</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{r.sourceGradeName}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{r.incomingCount} entrantes</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <ArrowRight className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">{r.nextGradeName}</span>
                      </div>
                      {r.nextGradeId === null && (
                        <span className="text-[11px] font-bold text-amber-600">Egreso / Finalizan</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {r.currentSectionNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.currentSectionNames.map(n => (
                            <span key={n} className="badge badge-slate">{n}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sin secciones</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={6}
                          value={r.newSectionNames.length}
                          onChange={e => updateCount(r.gradeId, parseInt(e.target.value) || 1)}
                          className="input w-16 text-center px-1 py-1"
                        />
                        <span className="text-xs text-slate-400">secciones</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.newSectionNames.map((n, i) => (
                          <input
                            key={i}
                            value={n}
                            onChange={e => updateName(r.gradeId, i, e.target.value)}
                            maxLength={2}
                            className="input w-12 text-center px-1 py-0.5 text-xs font-bold uppercase"
                          />
                        ))}
                      </div>
                      {changed && (
                        <span className="text-[10px] font-bold text-amber-600 mt-1 inline-block">Cambio en cantidad</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(dist).map(([name, count]) => (
                          <span key={name} className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                            {name}
                            <span className="font-mono text-slate-500">{count}</span>
                          </span>
                        ))}
                        {Object.keys(dist).length === 0 && (
                          <span className="text-xs text-slate-400">Sin entrantes</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-sm">No hay grados configurados</div>
          )}
        </div>
      </div>

      {/* Acción */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-slate-400 max-w-md">
          Las secciones de años anteriores permanecen intactas (historial inmutable). Al confirmar se crean las secciones
          nuevas, se promueven los alumnos y los egresados pasan a estado GRADUADO.
        </p>
        <button onClick={handleStart} disabled={submitting} className="btn-primary shrink-0">
          {submitting ? 'Procesando...' : (<><Save className="w-4 h-4" /> Iniciar Año Escolar {nextYear}</>)}
        </button>
      </div>
    </div>
  );
}
