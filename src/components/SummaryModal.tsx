import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, FileJson, CheckCircle2, RefreshCw, Check, CloudLightning, Loader2, Database } from 'lucide-react';
import { Student, Teacher, Grade, StudentSessionState } from '../types';
import { saveAttendanceReport, type AttendanceReportData } from '../firebase';
import { toast } from 'sonner';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher;
  activeGrade: Grade;
  civicAct: boolean;
  records: Record<string, StudentSessionState>;
  onReset: () => void;
  students: Student[];
}

export default function SummaryModal({
  isOpen,
  onClose,
  teacher,
  activeGrade,
  civicAct,
  records,
  onReset,
  students
}: SummaryModalProps) {
  if (!isOpen) return null;

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [reportId, setReportId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Compute stats
  const totalStudents = students.length;
  let presentCount = 0;
  let tardyCount = 0;
  let absentCount = 0;

  let cabelloLargoCount = 0;
  let unasPintadasCount = 0;
  let uniformeIncorrectoCount = 0;

  const observedStudents: Array<{
    student: Student;
    status: string;
    arrivalTime?: string;
    infractions: string[];
  }> = [];

  students.forEach((student) => {
    const record = records[student.id] || {
      studentId: student.id,
      status: 'Ausente',
      discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
    };

    if (record.status === 'Presente') presentCount++;
    else if (record.status === 'Tarde') {
      presentCount++;
      tardyCount++;
    } else if (record.status === 'Ausente') absentCount++;

    const infractions: string[] = [];
    if (record.discipline.cabelloLargo) {
      cabelloLargoCount++;
      infractions.push('Cabello Largo');
    }
    if (record.discipline.unasPintadas) {
      unasPintadasCount++;
      infractions.push('Uñas Pintadas/Acrílicas');
    }
    if (record.discipline.uniformeIncorrecto) {
      uniformeIncorrectoCount++;
      infractions.push('Uniforme Incorrecto');
    }

    if (record.status === 'Tarde' || infractions.length > 0) {
      observedStudents.push({
        student,
        status: record.status,
        arrivalTime: record.arrivalTime,
        infractions
      });
    }
  });

  const performFirebaseSync = async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    try {
      const exportData = {
        colegio: 'Colegio Salesiano San José',
        fecha: new Date().toLocaleDateString('es-SV'),
        grado: activeGrade.name,
        gradoId: activeGrade.id,
        tutor: teacher.name,
        tutorId: teacher.id,
        modalidad: civicAct ? 'Acto Cívico' : 'Buenos Días',
        estadisticas: {
          totalEstudiantes: totalStudents,
          presentes: presentCount,
          llegadasTarde: tardyCount,
          ausentes: absentCount,
          disciplina: {
            cabelloLargo: cabelloLargoCount,
            unasPintadas: unasPintadasCount,
            uniformeIncorrecto: uniformeIncorrectoCount
          }
        },
        detalles: students.map((s) => {
          const rec = records[s.id] || {
            studentId: s.id,
            status: 'Ausente',
            discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
          };
          return {
            id: s.id,
            nombre: s.name,
            genero: s.gender,
            asistencia: rec.status,
            horaLlegada: rec.arrivalTime || null,
            disciplina: rec.discipline
          };
        })
      };

      const docId = await saveAttendanceReport(exportData);
      if (docId) {
        setSyncStatus('success');
        setReportId(docId);
        toast.success('Asistencia guardada correctamente');
      } else {
        setSyncStatus('error');
        setSyncError('Error al guardar reporte');
        toast.error('Error al guardar el reporte');
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setSyncError(err?.message || 'Error de conexión o permisos insuficientes.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      performFirebaseSync();
    }
  }, [isOpen]);

  // Export functions
  const handleExportCSV = () => {
    const headers = ['ID Alumno', 'Nombre Completo', 'Género', 'Grado', 'Sección', 'Estado Asistencia', 'Hora Llegada', 'Cabello Largo', 'Uñas Pintadas', 'Uniforme Incorrecto'];
    const sectionName = teacher.guideSectionId ?? '';
    const rows = students.map((s) => {
      const rec = records[s.id] || {
        studentId: s.id,
        status: 'Ausente',
        arrivalTime: undefined,
        discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
      };
      return [
        s.id,
        s.name,
        s.gender === 'M' ? 'Masculino' : 'Femenino',
        activeGrade.name,
        sectionName,
        rec.status,
        rec.arrivalTime || '',
        rec.discipline.cabelloLargo ? 'SÍ' : 'NO',
        rec.discipline.unasPintadas ? 'SÍ' : 'NO',
        rec.discipline.uniformeIncorrecto ? 'SÍ' : 'NO'
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_asistencia_${activeGrade.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const exportData = {
      colegio: 'Colegio Salesiano San José',
      fecha: new Date().toLocaleDateString(),
      grado: activeGrade.name,
      seccion: teacher.guideSectionId ?? '',
      tutor: teacher.name,
      modalidad: civicAct ? 'Acto Cívico' : 'Buenos Días',
      estadisticas: {
        totalEstudiantes: totalStudents,
        presentes: presentCount,
        llegadasTarde: tardyCount,
        ausentes: absentCount,
        disciplina: {
          cabelloLargo: cabelloLargoCount,
          unasPintadas: unasPintadasCount,
          uniformeIncorrecto: uniformeIncorrectoCount
        }
      },
      detalles: students.map((s) => {
        const rec = records[s.id] || {
          studentId: s.id,
          status: 'Ausente',
          arrivalTime: undefined,
          discipline: { cabelloLargo: false, unasPintadas: false, uniformeIncorrecto: false }
        };
        return {
          id: s.id,
          nombre: s.name,
          genero: s.gender,
          asistencia: rec.status,
          horaLlegada: rec.arrivalTime || null,
          disciplina: rec.discipline
        };
      })
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', `reporte_asistencia_${activeGrade.id}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-white border border-slate-300 rounded-xl shadow-premium-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-salesiano-green text-white p-5 flex justify-between items-center shrink-0">
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-salesiano-yellow" />
                Resumen de Jornada Finalizado
              </h2>
              <p className="text-xs text-emerald-100 font-medium tracking-wider uppercase mt-1">
                {activeGrade.name} {teacher.guideSectionId ? `"${teacher.guideSectionId.toUpperCase()}"` : ''} &bull; {civicAct ? 'Acto Cívico' : 'Buenos Días'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-salesiano-green-dark rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Inscritos</span>
                <span className="text-2xl font-bold text-slate-800 font-mono">{totalStudents}</span>
              </div>
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                <span className="block text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Presentes</span>
                <span className="text-2xl font-bold text-emerald-800 font-mono">{presentCount}</span>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg text-center">
                <span className="block text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Tardes</span>
                <span className="text-2xl font-bold text-amber-800 font-mono">{tardyCount}</span>
              </div>
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-center">
                <span className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Ausentes</span>
                <span className="text-2xl font-bold text-red-800 font-mono">{absentCount}</span>
              </div>
            </div>

            {/* Discipline Infractions count */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Incidencias de Uniforme y Disciplina Registradas
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded text-xs">
                  <span className="font-semibold text-slate-600">Cabello Largo:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${cabelloLargoCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {cabelloLargoCount}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded text-xs">
                  <span className="font-semibold text-slate-600">Uñas Pintadas/Acríl:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${unasPintadasCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {unasPintadasCount}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded text-xs">
                  <span className="font-semibold text-slate-600">Uniforme Incorrecto:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${uniformeIncorrectoCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                    {uniformeIncorrectoCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Sincronización en la Nube con Firebase (Proyecto: campus-27248) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-salesiano-green" />
                  Sincronización en Firebase Firestore (Nube)
                </h3>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-mono px-2 py-0.5 rounded font-bold">
                  Proyecto: campus-27248
                </span>
              </div>

              {syncStatus === 'syncing' && (
                <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold block">Guardando reporte en Firestore...</span>
                    <span className="text-[10px] text-blue-600 block">Enviando estadísticas y nómina a la colección 'attendance_reports'</span>
                  </div>
                </div>
              )}

              {syncStatus === 'success' && (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                  <Check className="w-5 h-5 text-emerald-600 shrink-0 bg-emerald-200 rounded-full p-0.5 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-emerald-900">¡Sincronizado exitosamente con Firebase!</span>
                    <span className="text-[10px] text-emerald-600 block mt-0.5">El reporte se ha guardado permanentemente en la nube de tu proyecto.</span>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        Colección: attendance_reports
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold border border-emerald-200 truncate max-w-xs">
                        ID: {reportId}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {syncStatus === 'error' && (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium">
                  <CloudLightning className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-red-900">Fallo en la sincronización automática</span>
                    <span className="text-[10px] text-red-600 block mt-0.5">Detalle: {syncError}</span>
                    <button
                      onClick={performFirebaseSync}
                      className="mt-2.5 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md text-[10px] flex items-center gap-1 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Reintentar Guardar en Firebase
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Observed Students Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Alumnos Observados con Retardo o Faltas de Uniforme ({observedStudents.length})
              </h3>
              {observedStudents.length === 0 ? (
                <div className="p-4 bg-emerald-50 border border-dashed border-emerald-200 rounded-lg text-center text-xs text-emerald-800 font-medium">
                  Excelente: ¡No se registraron alumnos con retardos ni faltas de uniforme!
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-sm max-h-[180px] overflow-y-auto">
                  {observedStudents.map(({ student, status, arrivalTime, infractions }) => (
                    <div key={student.id} className="p-3 bg-white hover:bg-slate-50 flex justify-between items-start gap-4">
                      <div>
                        <span className="font-semibold text-slate-800 block">{student.name}</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {status === 'Tarde' && (
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                              Llegada Tarde ({arrivalTime || '06:45 AM'})
                            </span>
                          )}
                          {infractions.map((inf) => (
                            <span key={inf} className="text-[10px] font-bold bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded">
                              {inf}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono font-semibold uppercase">{student.gender === 'M' ? 'Varón' : 'Señorita'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 shrink-0 flex flex-wrap justify-between items-center gap-4">
            <button
              onClick={onReset}
              className="py-2.5 px-4 border-2 border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-slate-500" />
              Nueva Jornada
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleExportCSV}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Descargar CSV
              </button>

              <button
                onClick={handleExportJSON}
                className="py-2.5 px-4 bg-salesiano-blue hover:bg-blue-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileJson className="w-4 h-4 text-blue-200" />
                Descargar JSON
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
