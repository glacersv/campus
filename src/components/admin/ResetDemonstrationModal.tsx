import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  X,
  ShieldAlert,
  Calendar,
  GraduationCap,
  ClipboardList,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  setDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { toast } from 'sonner';

interface ResetOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
  disabled?: boolean;
  warning?: string;
  dangerLevel: 'safe' | 'warning' | 'danger';
  countBadge?: string;
}

interface ResetDemonstrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetSchoolYear?: number;
}

export default function ResetDemonstrationModal({
  isOpen,
  onClose,
  onSuccess,
  targetSchoolYear = 2026
}: ResetDemonstrationModalProps) {
  const [loadingStats, setLoadingStats] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(targetSchoolYear);

  // Estadísticas reales en vivo
  const [stats, setStats] = useState({
    totalStudents: 0,
    students2027: 0,
    sections2027: 0,
    attendanceReports: 0,
    testStudents: 0,
  });

  const [options, setOptions] = useState<Record<string, boolean>>({
    fixEnrollmentYear: true,
    setSchoolYear: true,
    clean2027Sections: true,
    clearAttendance: true,
    cleanTestStudents: true,
  });

  // Cargar métricas en vivo para advertencias inteligentes
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      setLoadingStats(true);
      try {
        const [studSnap, secSnap, repSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'sections')),
          getDocs(collection(db, 'attendance_reports'))
        ]);

        let testCount = 0;
        let s2027Count = 0;
        studSnap.forEach(d => {
          const data = d.data();
          if (d.id.startsWith('test_') || String(data.carnet || '').startsWith('TEST') || String(data.carnet || '').startsWith('SEED-')) {
            testCount++;
          }
          if (data.enrollmentYear === 2027 || String(data.carnet || '').startsWith('2027')) {
            s2027Count++;
          }
        });

        let sec2027Count = 0;
        secSnap.forEach(d => {
          const data = d.data();
          if (data.schoolYear === 2027 || d.id.startsWith('2027-')) {
            sec2027Count++;
          }
        });

        setStats({
          totalStudents: studSnap.size,
          students2027: s2027Count,
          sections2027: sec2027Count,
          attendanceReports: repSnap.size,
          testStudents: testCount,
        });
      } catch (err) {
        console.error('Error cargando conteos:', err);
      } finally {
        setLoadingStats(false);
      }
    })();
  }, [isOpen]);

  const toggleOption = (id: string) => {
    setOptions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetItems: ResetOption[] = [
    {
      id: 'setSchoolYear',
      title: `Fijar Año Lectivo Oficial en ${selectedYear}`,
      description: `Establece school_year_status/current en ${selectedYear} como ciclo activo y crea la bitácora histórica.`,
      icon: Calendar,
      checked: options.setSchoolYear,
      dangerLevel: 'safe',
      countBadge: `Año: ${selectedYear}`
    },
    {
      id: 'fixEnrollmentYear',
      title: 'Calibrar Año de Ingreso Real por Carnet en Alumnos',
      description: `Analiza los primeros 4 dígitos del carnet de los ${stats.totalStudents} alumnos (ej. 2015, 2016...). Corrige enrollmentYear y regenera su historial limpio hasta ${selectedYear} en estado EN_CURSO.`,
      icon: GraduationCap,
      checked: options.fixEnrollmentYear,
      dangerLevel: 'safe',
      countBadge: `${stats.totalStudents} alumnos`
    },
    {
      id: 'clean2027Sections',
      title: 'Limpiar Secciones Forzadas de 2027',
      description: 'Elimina las aulas virtuales automáticas con prefijo "2027-". Conserva intactas las secciones y aulas de 2026.',
      icon: Layers,
      checked: options.clean2027Sections,
      dangerLevel: 'warning',
      countBadge: `${stats.sections2027} secciones encontradas`
    },
    {
      id: 'clearAttendance',
      title: 'Vaciar Reportes de Asistencia de Prueba',
      description: 'Limpia la colección attendance_reports para que en la reunión con Coordinación la bandeja de reportes de formación esté limpia.',
      icon: ClipboardList,
      checked: options.clearAttendance,
      dangerLevel: 'safe',
      countBadge: `${stats.attendanceReports} reportes`
    },
    {
      id: 'cleanTestStudents',
      title: 'Eliminar Alumnos de Prueba (SEED / TEST)',
      description: 'Elimina únicamente los estudiantes ficticios creados con fines de demo. Los 871 alumnos de Gestión Escolar no se tocan.',
      icon: ShieldAlert,
      checked: options.cleanTestStudents,
      dangerLevel: 'safe',
      countBadge: `${stats.testStudents} de prueba`
    }
  ];

  const handleExecute = async () => {
    const selectedCount = Object.values(options).filter(Boolean).length;
    if (selectedCount === 0) {
      toast.error('Selecciona al menos una acción para ejecutar');
      return;
    }

    if (!confirm(`¿Confirmas la ejecución de los ${selectedCount} módulos seleccionados para dejar la presentación limpia para Coordinación?`)) {
      return;
    }

    setExecuting(true);
    const toastId = toast.loading('Procesando calibración de datos en Firestore...');

    try {
      // 1. Fijar Año Lectivo
      if (options.setSchoolYear) {
        await setDoc(doc(db, 'school_year_status', 'current'), {
          year: selectedYear,
          startedAt: serverTimestamp(),
          updatedBy: 'admin@salesianosanjose.edu.sv',
          motivo: 'Ajuste oficial para presentación de Coordinaciones'
        });

        // Registrar en historial histórico
        await setDoc(doc(db, 'school_years_history', String(selectedYear)), {
          year: selectedYear,
          aperturadoEl: serverTimestamp(),
          estado: 'ACTIVO',
          descripcion: `Año escolar ${selectedYear} establecido formalmente`
        });
      }

      // 2. Limpiar secciones 2027
      if (options.clean2027Sections) {
        const secSnap = await getDocs(collection(db, 'sections'));
        const batchSec = writeBatch(db);
        let secCount = 0;
        secSnap.forEach(d => {
          const data = d.data();
          if (data.schoolYear === 2027 || d.id.startsWith('2027-')) {
            batchSec.delete(d.ref);
            secCount++;
          }
        });
        if (secCount > 0) await batchSec.commit();
      }

      // 3. Vaciar reportes de asistencia de prueba
      if (options.clearAttendance) {
        const repSnap = await getDocs(collection(db, 'attendance_reports'));
        const batchRep = writeBatch(db);
        let repCount = 0;
        repSnap.forEach(d => {
          batchRep.delete(d.ref);
          repCount++;
        });
        if (repCount > 0) await batchRep.commit();
      }

      // 4. Limpiar alumnos de prueba
      if (options.cleanTestStudents) {
        const studSnap = await getDocs(collection(db, 'students'));
        const batchTest = writeBatch(db);
        let tCount = 0;
        studSnap.forEach(d => {
          const data = d.data();
          const carnet = String(data.carnet || '');
          if (d.id.startsWith('test_') || carnet.startsWith('TEST') || carnet.startsWith('SEED-')) {
            batchTest.delete(d.ref);
            tCount++;
          }
        });
        if (tCount > 0) await batchTest.commit();
      }

      // 5. Calibrar años de ingreso e historial de alumnos
      if (options.fixEnrollmentYear) {
        const [studSnap, gradesSnap] = await Promise.all([
          getDocs(collection(db, 'students')),
          getDocs(collection(db, 'grades'))
        ]);

        const gradeMap = new Map<string, string>();
        gradesSnap.forEach(d => gradeMap.set(d.id, (d.data().name as string) || `${d.id}° Grado`));

        const BATCH_SIZE = 400;
        let batch = writeBatch(db);
        let batchOps = 0;

        for (const docSnap of studSnap.docs) {
          const data = docSnap.data();
          const carnet = String(data.carnet || '');
          const prefix = parseInt(carnet.slice(0, 4), 10);

          let realEntryYear = selectedYear;

          // Si el carnet codifica un año válido
          if (Number.isFinite(prefix) && prefix >= 2010 && prefix <= selectedYear) {
            realEntryYear = prefix;
          } else if (Number.isFinite(data.enrollmentYear) && data.enrollmentYear >= 2010 && data.enrollmentYear <= selectedYear) {
            realEntryYear = data.enrollmentYear;
          } else {
            // Deducción lógica según grado actual
            const currentGradeId = String(data.gradeId || '');
            const numStr = currentGradeId.replace(/[^0-9]/g, '');
            const currentGradeNum = parseInt(numStr, 10);
            if (Number.isFinite(currentGradeNum) && currentGradeNum >= 1) {
              realEntryYear = Math.max(2010, selectedYear - (currentGradeNum - 1));
            } else {
              realEntryYear = selectedYear;
            }
          }

          // Si tiene carnet 2027 (matrícula anticipada)
          if (prefix === 2027) {
            realEntryYear = 2027;
          }

          // Reconstrucción del historial hasta selectedYear
          const currentGradeId = String(data.gradeId || '');
          const numStr = currentGradeId.replace(/[^0-9]/g, '');
          const suffix = currentGradeId.toLowerCase().includes('t') ? 't' : currentGradeId.toLowerCase().includes('g') ? 'g' : '';
          let currentGradeNum = -1;

          if (currentGradeId === 'k4') currentGradeNum = -1;
          else if (currentGradeId === 'k5' || currentGradeId === 'k6') currentGradeNum = 0;
          else if (Number.isFinite(parseInt(numStr, 10))) currentGradeNum = parseInt(numStr, 10);

          const newHistory: Record<string, unknown>[] = [];
          if (currentGradeNum !== -1) {
            const startYear = Math.min(realEntryYear, selectedYear);
            for (let yr = startYear; yr <= selectedYear; yr++) {
              const diff = selectedYear - yr;
              const targetNum = currentGradeNum - diff;

              let gradeForYr = '';
              if (targetNum <= -1) gradeForYr = 'k4';
              else if (targetNum === 0) gradeForYr = 'k5';
              else gradeForYr = targetNum <= 9 ? String(targetNum) : `${targetNum}${suffix}`;

              const secId = data.sectionId || 'A';
              const cleanLetter = secId.split('-').pop()?.replace(/[0-9]/g, '').replace('G', '').replace('T', '').toLowerCase() || 'a';
              const histSectionId = `${yr}-${gradeForYr}-${cleanLetter}`;

              newHistory.push({
                year: yr,
                gradeId: gradeForYr,
                gradeName: gradeMap.get(gradeForYr) || `${gradeForYr}° Grado`,
                sectionId: histSectionId,
                sectionName: cleanLetter.toUpperCase(),
                status: yr === selectedYear ? 'EN_CURSO' : 'FINALIZADO'
              });
            }
          } else {
            newHistory.push({
              year: realEntryYear,
              gradeId: currentGradeId,
              gradeName: gradeMap.get(currentGradeId) || currentGradeId,
              sectionId: data.sectionId || '1a',
              status: 'EN_CURSO'
            });
          }

          const studentRef = doc(db, 'students', docSnap.id);
          batch.update(studentRef, {
            enrollmentYear: realEntryYear,
            enrollmentHistory: newHistory,
            status: 'ACTIVO',
            updatedAt: serverTimestamp()
          });

          batchOps++;
          if (batchOps >= BATCH_SIZE) {
            await batch.commit();
            batch = writeBatch(db);
            batchOps = 0;
          }
        }

        if (batchOps > 0) {
          await batch.commit();
        }
      }

      toast.success('¡Sistema restablecido y calibrado exitosamente!', { id: toastId });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      toast.error('Error durante el proceso de restablecimiento: ' + (err instanceof Error ? err.message : String(err)), { id: toastId });
    } finally {
      setExecuting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary p-6 text-white relative">
            <button
              onClick={onClose}
              disabled={executing}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-amber-300">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black font-display tracking-tight">
                  Calibración y Preparación de Demostración
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Selecciona con casillas qué deseas calibrar o poner a cero de forma segura.
                </p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Year Selector */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Año Lectivo en Curso Oficial:
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Define el período escolar activo para toda la institución
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <input
                  type="number"
                  min="2024"
                  max="2030"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value) || 2026)}
                  className="w-24 text-center font-black font-mono text-sm py-1.5 px-3 bg-white border border-primary/30 rounded-xl text-primary focus:ring-2 focus:ring-primary/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
                <span>Acciones a Ejecutar</span>
                <span>{loadingStats ? 'Calculando dependencias...' : 'Métricas actualizadas'}</span>
              </div>

              {resetItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <label
                    key={item.id}
                    className={`block p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      item.checked
                        ? 'bg-slate-50 border-primary/40 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleOption(item.id)}
                        disabled={executing || item.disabled}
                        className="mt-1 w-4.5 h-4.5 text-primary rounded-md border-slate-300 focus:ring-primary cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <IconComponent className="w-3.5 h-3.5 text-primary" />
                            {item.title}
                          </span>
                          {item.countBadge && (
                            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                              {item.countBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Integrity Guarantee Alert */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">Protección Institucional Garantizada:</span>
                <p className="mt-0.5 text-emerald-700 text-[11px]">
                  Materias, Descriptores Técnicos BTV, Cuentas de Acceso, Docentes Asignados y Edificios/Laboratorios están estrictamente blindados y nunca se alteran.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={executing}
              className="btn-secondary text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={executing || loadingStats}
              className="btn-primary text-xs font-black uppercase tracking-wider py-2.5 px-6 rounded-xl flex items-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              {executing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Calibrando Sistema...</span>
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  <span>Aplicar Calibración para Coordinación</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
