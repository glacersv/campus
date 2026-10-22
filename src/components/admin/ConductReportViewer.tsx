import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Award,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  AccompanimentPeriod,
  StudentConductIncident,
  StudentConductSummary,
} from '../../types';
import {
  TECHNICIAN_STUDENTS_CONDUCT_2026,
  seedTechnicianConductFromPdf,
  getStudentConductSummary,
  saveStudentConductSummary,
  getSectionConductIncidents,
  getAllGrades,
  getAllSections,
} from '../../lib/firestore';
import InstitutionLogo from '../shared/InstitutionLogo';

export default function ConductReportViewer() {
  const [selectedPeriod, setSelectedPeriod] = useState<AccompanimentPeriod>('PIV');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedGradeName, setSelectedGradeName] = useState<string>('Segundo Técnico A');
  const [studentsData, setStudentsData] = useState<StudentConductSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Intentar cargar resúmenes existentes
      const list: StudentConductSummary[] = [];
      for (const item of TECHNICIAN_STUDENTS_CONDUCT_2026) {
        let summary = await getStudentConductSummary(item.carnet, selectedPeriod, selectedYear);
        if (!summary) {
          // Si no existe, crear con base 8.5
          summary = {
            studentId: item.carnet,
            studentName: item.name,
            carnet: item.carnet,
            gradeName: selectedGradeName,
            sectionName: 'A',
            period: selectedPeriod,
            year: selectedYear,
            baseScore: 8.5,
            finalScore: 8.5,
            totalPositives: 0,
            totalNegatives: 0,
            incidents: [],
          };
          await saveStudentConductSummary(summary);
        }
        list.push(summary);
      }
      setStudentsData(list);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar conducta de estudiantes.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedYear]);

  const handleSyncFirebase = async () => {
    setSeeding(true);
    try {
      await seedTechnicianConductFromPdf('11t', 'sec_11t_a', selectedPeriod, selectedYear);
      await loadData();
      setMessage({ type: 'success', text: `Conducta base (8.5) de 2° Técnico guardada en Firebase exitosamente.` });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al sincronizar conducta en Firebase.' });
    } finally {
      setSeeding(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controles de la barra superior (Ocultos al imprimir) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              Reporte Oficial de Indicadores de Conducta
            </h1>
            <p className="text-xs text-slate-500">
              Formato institucional con Conducta Base (8.5), foto y códigos asignados por periodo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as AccompanimentPeriod)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="PI">Periodo I</option>
            <option value="PII">Periodo II</option>
            <option value="PIII">Periodo III</option>
            <option value="PIV">Periodo IV (Actual)</option>
          </select>

          <button
            onClick={handleSyncFirebase}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300 text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            Asegurar en Firebase
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            Imprimir Reporte (PDF)
          </button>
        </div>
      </div>

      {message && (
        <div className="print:hidden p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {message.text}
          </div>
          <button onClick={() => setMessage(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Contenedor Imprimible: Genera una página por estudiante */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <span className="text-xs font-semibold">Cargando reporte oficial...</span>
        </div>
      ) : (
        <div ref={printRef} className="space-y-8 print:space-y-0">
          {studentsData.map((student, idx) => {
            const photoUrl = `/students/${student.carnet}.png`;
            const hasIncidents = student.incidents && student.incidents.length > 0;

            return (
              <div
                key={student.carnet || idx}
                className="bg-white text-slate-900 border border-slate-200 p-8 rounded-2xl shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:break-after-page max-w-4xl mx-auto"
                style={{ minHeight: '800px' }}
              >
                {/* Header idéntico al PDF */}
                <div className="relative flex items-start justify-between pb-4">
                  {/* Foto izquierda */}
                  <div className="w-24 h-28 border border-slate-200 rounded-md overflow-hidden bg-slate-50 shrink-0 shadow-sm flex items-center justify-center">
                    <img
                      src={photoUrl}
                      alt={student.studentName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback si no carga imagen
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Títulos centrales */}
                  <div className="flex-1 text-center px-4 pt-2">
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      Colegio Salesiano San José
                    </h2>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      Año Escolar {selectedYear}
                    </p>
                    <p className="text-xs font-bold text-slate-900 mt-1">
                      Reporte de indicadores de conducta-
                    </p>
                  </div>

                  {/* Logo derecho */}
                  <div className="w-20 shrink-0 flex justify-end">
                    <img
                      src="/logo-salesiano.png"
                      alt="Logo Salesiano"
                      className="w-16 h-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Info del Estudiante y Grado */}
                <div className="flex justify-between items-center text-xs font-bold text-slate-900 py-3 border-b border-slate-900/10 mb-4">
                  <div>
                    Estudiante: <span className="font-semibold">{student.studentName}</span>
                  </div>
                  <div>
                    Grado: <span className="font-semibold">{student.gradeName || selectedGradeName}</span>
                  </div>
                </div>

                {/* Tabla de Conducta Oficial */}
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-50 font-bold border-b border-slate-900 text-center">
                      <th className="border-r border-slate-900 py-2 px-2 w-10">#</th>
                      <th className="border-r border-slate-900 py-2 px-3 w-28">Fecha</th>
                      <th className="border-r border-slate-900 py-2 px-4 w-36">Materia</th>
                      <th className="border-r border-slate-900 py-2 px-4 text-left">Código asignado</th>
                      <th className="border-r border-slate-900 py-2 px-3 w-20">Valor</th>
                      <th className="py-2 px-3 w-24">Nota final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Fila de Conducta Base siempre presente */}
                    <tr className="border-b border-slate-900">
                      <td colSpan={5} className="py-2.5 px-3 font-bold border-r border-slate-900">
                        Conducta base
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {student.baseScore.toFixed(1)}
                      </td>
                    </tr>

                    {/* Incidencias / Códigos si existen */}
                    {hasIncidents &&
                      student.incidents.map((inc, i) => (
                        <tr key={inc.id || i} className="border-b border-slate-900">
                          <td className="py-2 px-2 text-center border-r border-slate-900">{i + 1}</td>
                          <td className="py-2 px-3 text-center border-r border-slate-900">{inc.date}</td>
                          <td className="py-2 px-4 text-center border-r border-slate-900 font-semibold">{inc.subjectName}</td>
                          <td className="py-2 px-4 border-r border-slate-900">
                            <strong>[{inc.code}]</strong> {inc.indicatorName || inc.description}
                          </td>
                          <td className="py-2 px-3 text-center font-bold border-r border-slate-900">
                            {inc.value > 0 ? `+${inc.value}` : inc.value}
                          </td>
                          <td className="py-2 px-3 text-center font-semibold text-slate-500">-</td>
                        </tr>
                      ))}

                    {/* Fila de Nota Final */}
                    <tr className="font-bold bg-slate-50/50">
                      <td colSpan={5} className="py-2.5 px-3 border-r border-slate-900">
                        Nota final
                      </td>
                      <td className="py-2.5 px-3 text-center text-sm font-extrabold">
                        {student.finalScore.toFixed(1)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
