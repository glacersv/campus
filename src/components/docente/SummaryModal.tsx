import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, FileJson, CheckCircle2, RefreshCw, Check, CloudLightning, Loader2, Database, Printer } from 'lucide-react';
import { Student, Teacher, Grade, StudentSessionState } from '../../types';
import { saveAttendanceReport, type AttendanceReportData } from '../../firebase';
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

  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permite ventanas emergentes para exportar el reporte');
      return;
    }

    const sectionName = teacher.guideSectionId ? teacher.guideSectionId.toUpperCase() : 'A';
    const activeDateStr = new Date().toLocaleDateString('es-SV', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const observedRows = observedStudents.map(({ student, status, arrivalTime, infractions }) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 8px; font-weight: 500; font-size: 13px;">${student.name}</td>
        <td style="padding: 10px 8px; font-family: monospace; font-size: 13px; color: #475569;">${student.carnet || '—'}</td>
        <td style="padding: 10px 8px; font-size: 13px;">
          <span style="font-weight: bold; color: ${status === 'Tarde' ? '#b45309' : '#0f172a'}">
            ${status === 'Tarde' ? `Llegada Tarde (${arrivalTime || '06:45'})` : 'Presente'}
          </span>
        </td>
        <td style="padding: 10px 8px;">
          ${infractions.map(inf => `
            <span style="display: inline-block; background: #fee2e2; color: #991b1b; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-right: 4px; margin-bottom: 2px;">
              ${inf}
            </span>
          `).join('') || '<span style="color:#94a3b8; font-size: 12px;">Sin observaciones</span>'}
        </td>
      </tr>
    `).join('');

    const htmlContent = `
      <html>
        <head>
          <title>Reporte de Asistencia - ${activeGrade.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .title-section {
              text-align: left;
            }
            .title-main {
              font-size: 24px;
              font-weight: 800;
              color: #12562E;
              text-transform: uppercase;
              margin: 0;
            }
            .title-sub {
              font-size: 12px;
              color: #64748b;
              font-weight: 600;
              letter-spacing: 1px;
              margin: 5px 0 0 0;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 20px;
            }
            .meta-item {
              font-size: 13px;
            }
            .meta-label {
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              font-size: 10px;
              letter-spacing: 0.5px;
              display: block;
              margin-bottom: 3px;
            }
            .meta-val {
              color: #0f172a;
              font-weight: 600;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-cols: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 40px;
            }
            .stat-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              text-align: center;
            }
            .stat-label {
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              display: block;
              margin-bottom: 5px;
            }
            .stat-val {
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
            }
            .section-title {
              font-size: 14px;
              font-weight: 700;
              color: #0f172a;
              margin-bottom: 15px;
              border-bottom: 2px solid #12562E;
              padding-bottom: 6px;
              text-transform: uppercase;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
              font-size: 12px;
            }
            .table th {
              background: #f1f5f9;
              text-align: left;
              padding: 10px 8px;
              font-weight: 700;
              color: #475569;
              text-transform: uppercase;
              font-size: 10px;
            }
            .signature-section {
              margin-top: 60px;
              display: grid;
              grid-template-cols: repeat(2, 1fr);
              gap: 80px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #94a3b8;
              padding-top: 10px;
              font-size: 12px;
              font-weight: 600;
              color: #475569;
            }
            @media print {
              body { margin: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td style="width: 80px; vertical-align: middle;">
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="48" stroke="#12562E" stroke-width="4" fill="none"/>
                  <path d="M50 15 L20 40 L30 40 L30 80 L70 80 L70 40 L80 40 Z" fill="#12562E"/>
                  <path d="M42 50 L58 50 M50 42 L50 58" stroke="#FAB700" stroke-width="6"/>
                </svg>
              </td>
              <td class="title-section" style="vertical-align: middle; padding-left: 15px;">
                <h1 class="title-main">Colegio Salesiano San José</h1>
                <p class="title-sub">Reporte Oficial de Asistencia y Disciplina</p>
              </td>
            </tr>
          </table>

          <div class="meta-grid">
            <div class="meta-item">
              <span class="meta-label">Fecha del Reporte</span>
              <span class="meta-val">${activeDateStr}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Grado y Sección</span>
              <span class="meta-val">${activeGrade.name} "${sectionName}"</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Tutor / Docente Responsable</span>
              <span class="meta-val">${teacher.name}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Modalidad de Toma</span>
              <span class="meta-val">${civicAct ? 'Acto Cívico' : 'Buenos Días'}</span>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card" style="border-left: 4px solid #64748b;">
              <span class="stat-label">Inscritos</span>
              <span class="stat-val">${totalStudents}</span>
            </div>
            <div class="stat-card" style="border-left: 4px solid #10b981;">
              <span class="stat-label">Presentes</span>
              <span class="stat-val">${presentCount}</span>
            </div>
            <div class="stat-card" style="border-left: 4px solid #f59e0b;">
              <span class="stat-label">Llegadas Tarde</span>
              <span class="stat-val">${tardyCount}</span>
            </div>
            <div class="stat-card" style="border-left: 4px solid #ef4444;">
              <span class="stat-label">Ausentes</span>
              <span class="stat-val">${absentCount}</span>
            </div>
          </div>

          <h2 class="section-title">Resumen de Incidencias de Disciplina</h2>
          <table class="table">
            <thead>
              <tr>
                <th style="width: 33%;">Cabello Fuera de Norma</th>
                <th style="width: 33%;">Uñas Pintadas / Acrílicas</th>
                <th style="width: 34%;">Uniforme Incorrecto</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="padding: 15px 8px; font-size: 16px; font-weight: bold; color: ${cabelloLargoCount > 0 ? '#b45309' : '#1e293b'}">${cabelloLargoCount} casos</td>
                <td style="padding: 15px 8px; font-size: 16px; font-weight: bold; color: ${unasPintadasCount > 0 ? '#b45309' : '#1e293b'}">${unasPintadasCount} casos</td>
                <td style="padding: 15px 8px; font-size: 16px; font-weight: bold; color: ${uniformeIncorrectoCount > 0 ? '#b45309' : '#1e293b'}">${uniformeIncorrectoCount} casos</td>
              </tr>
            </tbody>
          </table>

          <h2 class="section-title">Nómina de Alumnos Observados (Retardos y Uniforme)</h2>
          ${observedStudents.length === 0 ? `
            <p style="font-size: 13px; color: #10b981; font-weight: 600; background: #ecfdf5; border: 1px dashed #a7f3d0; padding: 15px; border-radius: 8px; text-align: center;">
              ¡Excelente! No se registraron alumnos con incidencias en este reporte.
            </p>
          ` : `
            <table class="table">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 10px 8px; font-size: 11px;">Alumno</th>
                  <th style="text-align: left; padding: 10px 8px; font-size: 11px;">Carnet</th>
                  <th style="text-align: left; padding: 10px 8px; font-size: 11px;">Asistencia</th>
                  <th style="text-align: left; padding: 10px 8px; font-size: 11px;">Infracciones de Uniforme</th>
                </tr>
              </thead>
              <tbody>
                ${observedRows}
              </tbody>
            </table>
          `}

          <div class="signature-section">
            <div>
              <div style="height: 60px;"></div>
              <div class="signature-line">${teacher.name}<br/><span style="font-size:10px; color:#64748b; font-weight:normal;">Tutor de Grado</span></div>
            </div>
            <div>
              <div style="height: 60px;"></div>
              <div class="signature-line">Coordinación de Convivencia<br/><span style="font-size:10px; color:#64748b; font-weight:normal;">Sello y Firma Oficial</span></div>
            </div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
                onClick={handleExportPDF}
                className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-4 h-4 text-white" />
                Descargar PDF
              </button>

              <button
                onClick={handleExportCSV}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-full text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Descargar CSV
              </button>

              <button
                onClick={handleExportJSON}
                className="py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-full text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileJson className="w-4 h-4 text-white/80" />
                Descargar JSON
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
