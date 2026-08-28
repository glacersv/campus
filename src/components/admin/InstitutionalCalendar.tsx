import React, { useState, useRef } from 'react';
import { MonthStats, AcademicPeriod } from '../../types';
import { Table1SemanasLaborales } from './Table1SemanasLaborales';
import { SuspensionesManager } from './SuspensionesManager';
import {
  monthsData2026,
  academicPeriods2026,
  recuperacionExtraordinaria2026,
} from '../../data/calendarData';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  Layers,
  GraduationCap,
  Edit2,
  UploadCloud,
  Download,
  FileJson,
  FileSpreadsheet,
  AlertCircle,
  Trash2,
  Loader2,
  RotateCcw,
  CalendarX,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  parseExcelFile,
  parseWordFile,
  parseTextFile,
  parsePdfFile,
  parseJsonContent,
  analyzeExtractedText,
  generateExcelTemplateWorkbook,
} from '../../utils/fileImportParsers';
import { saveAs } from 'file-saver';

type CalendarSectionPart = 'todas' | 'parte1_semanas' | 'parte2_bimestres' | 'parte3_pausas' | 'parte4_per' | 'importar_exportar';

export default function InstitutionalCalendar() {
  const [months, setMonths] = useState<MonthStats[]>(() => JSON.parse(JSON.stringify(monthsData2026)));
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePart, setActivePart] = useState<CalendarSectionPart>('todas');
  const [selectedBimestreIdx, setSelectedBimestreIdx] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [showClearCalendarConfirm, setShowClearCalendarConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [activeMethod, setActiveMethod] = useState<'lector' | 'plantilla' | 'asistente'>('lector');
  const [activeUploadTab, setActiveUploadTab] = useState<'archivo' | 'texto' | 'json'>('archivo');
  const [pastedText, setPastedText] = useState('');
  const [pastedJson, setPastedJson] = useState('');

  const anoLectivo = '2026';
  const institucion = 'Colegio Salesiano San José';
  const totalSemanas = months.reduce((a, b) => a + (Number(b.semanas) || 0), 0);
  const totalDias = months.reduce((a, b) => a + (Number(b.dias) || 0), 0);
  const totalEventos = months.reduce((a, b) => a + (b.eventos?.length || 0), 0);

  const effectivePeriods: AcademicPeriod[] = academicPeriods2026;

  const handleUpdateMonths = (newMonths: MonthStats[]) => setMonths(newMonths);

  // Vaciar calendario - pone todos los meses a 0 semanas y 0 días
  const handleClearCalendar = () => {
    const emptyMonths: MonthStats[] = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ].map((month, idx) => ({
      month,
      name: month.charAt(0).toUpperCase() + month.slice(1),
      semanas: 0,
      dias: 0,
      feriadosDesc: '',
      eventos: [],
    }));
    setMonths(emptyMonths);
    setShowClearCalendarConfirm(false);
    setImportSuccess('¡Calendario vaciado! Todos los meses ahora tienen 0 semanas y 0 días.');
    setTimeout(() => setImportSuccess(null), 5000);
  };

  // Restaurar valores predeterminados
  const handleResetDefaults = () => {
    setMonths(JSON.parse(JSON.stringify(monthsData2026)));
    setImportSuccess('¡Calendario restaurado a valores predeterminados!');
    setTimeout(() => setImportSuccess(null), 4000);
  };

  // Export to Excel (3-sheet template)
  const handleExportExcel = () => {
    const wb = generateExcelTemplateWorkbook(months, academicPeriods2026);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `Calendario_Institucional_2026.xlsx`);
    setImportSuccess('¡Calendario exportado a Excel correctamente!');
    setTimeout(() => setImportSuccess(null), 4000);
  };

  // Export to JSON
  const handleExportJson = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      app: 'Calendario Institucional - Colegio Salesiano San José',
      anoLectivo: '2026',
      months,
      periods: academicPeriods2026,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, 'Calendario_Institucional_2026.json');
    setImportSuccess('¡Respaldo JSON descargado correctamente!');
    setTimeout(() => setImportSuccess(null), 4000);
  };

  // Import Excel/CSV - usa el parser inteligente multi-estrategia
  const handleImportExcel = async (file: File) => {
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await parseExcelFile(file);
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        const fields = result.summary.detectedFields.length > 0 ? ` (${result.summary.detectedFields.join(', ')})` : '';
        setImportSuccess(`¡${result.months.length} meses importados desde Excel/CSV!${fields}`);
      } else {
        setImportError('No se encontraron meses válidos en el archivo.');
      }
    } catch (err: any) {
      setImportError(`Error al leer el archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Import Word (.docx) - mammoth
  const handleImportWord = async (file: File) => {
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await parseWordFile(file);
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        const fields = result.summary.detectedFields.length > 0 ? ` (${result.summary.detectedFields.join(', ')})` : '';
        setImportSuccess(`¡${result.months.length} meses importados desde Word!${fields}`);
      } else {
        setImportError('No se encontraron datos de calendario en el documento Word. Use formato: Mes | Semanas | Días | Descansos');
      }
    } catch (err: any) {
      setImportError(`Error al leer Word: ${err.message}. Asegúrese de que el archivo no esté corrupto.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Import PDF - pdfjs-dist con worker jsdelivr
  const handleImportPdf = async (file: File) => {
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await parsePdfFile(file);
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        const fields = result.summary.detectedFields.length > 0 ? ` (${result.summary.detectedFields.join(', ')})` : '';
        setImportSuccess(`¡${result.months.length} meses detectados y cargados desde PDF!${fields}`);
      } else {
        setImportError('No se encontraron meses en el PDF. Asegúrese de que el documento contenga la sección de fechas con los meses (enero, febrero, etc.).');
      }
    } catch (err: any) {
      setImportError(`Error al leer PDF: ${err.message}. El archivo podría estar protegido.`);
    } finally {
      setIsLoading(false);
    }
  };

  // Import JSON
  const handleImportJson = async (file: File) => {
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const text = await file.text();
      const result = parseJsonContent(text, file.name, file.size);
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        setImportSuccess(`¡Calendario restaurado desde JSON! ${result.months.length} meses cargados.`);
      } else {
        setImportError('El archivo JSON no contiene un formato válido de calendario.');
      }
    } catch (err: any) {
      setImportError(`Error al leer JSON: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.toLowerCase().split('.').pop();
      if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        handleImportExcel(file);
      } else if (ext === 'json') {
        handleImportJson(file);
      } else if (ext === 'docx' || ext === 'doc') {
        handleImportWord(file);
      } else if (ext === 'pdf') {
        handleImportPdf(file);
      } else if (ext === 'txt' || ext === 'md') {
        handleImportText(file);
      } else {
        setImportError('Formato no soportado. Use Word (.docx), Excel (.xlsx), PDF (.pdf), JSON (.json), CSV o TXT.');
      }
    }
  };

  // Import Text/Markdown
  const handleImportText = async (file: File) => {
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = await parseTextFile(file);
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        const fields = result.summary.detectedFields.length > 0 ? ` (${result.summary.detectedFields.join(', ')})` : '';
        setImportSuccess(`¡${result.months.length} meses detectados en texto!${fields}`);
      } else {
        setImportError('No se encontraron fechas de calendario en el texto. Use formato: "Enero: 2 semanas, 10 días".');
      }
    } catch (err: any) {
      setImportError(`Error al leer el archivo: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  // Analizar texto/table pegado
  const handlePasteText = () => {
    if (!pastedText.trim()) {
      setImportError('Pegue el texto del calendario antes de analizar.');
      return;
    }
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = analyzeExtractedText('Texto pegado', pastedText.length, pastedText, 'text');
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        const fields = result.summary.detectedFields.length > 0 ? ` (${result.summary.detectedFields.join(', ')})` : '';
        setImportSuccess(`¡${result.months.length} meses detectados desde el texto!${fields}`);
        setPastedText('');
      } else {
        setImportError('No se encontraron fechas de calendario en el texto. Use formato: "Enero: 2 semanas, 10 días".');
      }
    } catch (err: any) {
      setImportError(`Error al analizar el texto: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar JSON pegado
  const handlePasteJson = () => {
    if (!pastedJson.trim()) {
      setImportError('Pegue el contenido JSON antes de cargar.');
      return;
    }
    setIsLoading(true);
    setImportError(null);
    setImportSuccess(null);
    try {
      const result = parseJsonContent(pastedJson, 'JSON pegado', pastedJson.length);
      if (result.months && result.months.length > 0) {
        setMonths(result.months);
        setImportSuccess(`¡Calendario restaurado desde JSON! ${result.months.length} meses cargados.`);
        setPastedJson('');
      } else {
        setImportError('El JSON no contiene un formato válido de calendario.');
      }
    } catch (err: any) {
      setImportError(`Error al leer JSON: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>CALENDARIO ACADÉMICO {anoLectivo}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Calendario Institucional {anoLectivo}
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Configuración oficial de <strong>{institucion}</strong> · Educación Media. 
                Semanas laborales, fechas de corte, pausas pedagógicas y periodo extraordinario.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Semanas Lectivas:</span>
              <strong className="text-base text-blue-400 font-extrabold">{totalSemanas} Semanas</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Días Hábiles:</span>
              <strong className="text-base text-emerald-400 font-extrabold">{totalDias} Días</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Períodos:</span>
              <strong className="text-base text-indigo-400 font-extrabold">{effectivePeriods.length} Bimestres</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Carga Técnica:</span>
              <strong className="text-base text-amber-400 font-extrabold">720 Horas (18h/sem)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Section Selector */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Navegación por Secciones</span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {([
            { key: 'importar_exportar', label: 'Importar/Exportar', color: 'bg-emerald-600 text-white border-emerald-600' },
            { key: 'todas', label: 'Ver Todo', color: 'bg-slate-900 text-white border-slate-900' },
            { key: 'parte1_semanas', label: 'Semanas y Días', color: 'bg-blue-600 text-white border-blue-600' },
            { key: 'parte2_bimestres', label: 'Bimestres & TBox', color: 'bg-indigo-600 text-white border-indigo-600' },
            { key: 'parte3_pausas', label: 'Pausas & Asuetos', color: 'bg-amber-600 text-white border-amber-600' },
            { key: 'parte4_per', label: 'P.E.R. & Graduación', color: 'bg-purple-600 text-white border-purple-600' },
          ] as const).map((item) => (
            <button key={item.key} onClick={() => setActivePart(item.key)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center border ${activePart === item.key ? item.color + ' shadow-xs' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Part 5: Import / Export — diseño igual a jornalizacion (sin módulos) */}
      {(activePart === 'todas' || activePart === 'importar_exportar') && (
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase mb-1">Parte 5</div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Importar y Exportar Calendario</h2>
            <p className="text-xs text-slate-500">Cargue datos desde archivos o descargue respaldos del calendario {anoLectivo}.</p>
          </div>

          {/* Notifications */}
          {importError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{importError}</span>
              <button onClick={() => setImportError(null)} className="ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          {/* Modal: Confirmar Vaciar Calendario */}
          {showClearCalendarConfirm && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-red-100 text-red-600">
                  <CalendarX className="w-6 h-6" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-base font-black text-slate-900">¿Vaciar Calendario Anual?</h3>
                  <p className="text-xs text-slate-600">
                    Todos los 12 meses quedarán en <strong>0 semanas</strong> y <strong>0 días lectivos</strong>.
                    Podrá cargar un nuevo calendario desde archivo o editar manualmente.
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                  💡 <strong>Nota:</strong> Esta acción no afecta bimestres, pausas ni periodos extraordinarios.
                  Solo pone semanas y días a 0 en los 12 meses.
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setShowClearCalendarConfirm(false)}
                    className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClearCalendar}
                    className="py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all bg-red-600 hover:bg-red-500"
                  >
                    Confirmar y Vaciar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-6xl mx-auto space-y-4">
            {/* Banner de Vaciar Calendario */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <CalendarX className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    <h2 className="font-bold text-slate-800">Vaciar Calendario Anual (12 Meses)</h2>
                    <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">{totalSemanas} sem • {totalDias} días</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">Pone todas las semanas y días a 0 para que pueda cargar un calendario nuevo con sus fechas y asuetos desde su archivo Excel, Word o PDF.</p>
                </div>
              </div>
              <button onClick={() => setShowClearCalendarConfirm(true)} className="bg-[#7C3AED] hover:bg-purple-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg flex items-center space-x-2 transition shrink-0 cursor-pointer">
                <CalendarX className="w-3.5 h-3.5" />
                <span>Vaciar Calendario</span>
              </button>
            </div>

            {/* Selección de Métodos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Método 1 */}
              <button onClick={() => setActiveMethod('lector')} className={`bg-white rounded-xl p-4 border-2 shadow-sm relative flex items-start space-x-3 cursor-pointer transition text-left ${activeMethod === 'lector' ? 'border-blue-500' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-blue-800 uppercase tracking-wide">MÉTODO 1</span>
                    <span className="bg-blue-100 text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">Recomendado</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mt-0.5">Lector Inteligente</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Excel, Word o PDF con calendario y bimestres</p>
                </div>
              </button>

              {/* Método 2 */}
              <button onClick={handleExportExcel} className={`bg-white rounded-xl p-4 border-2 shadow-sm relative flex items-start space-x-3 cursor-pointer transition text-left ${activeMethod === 'plantilla' ? 'border-emerald-500' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">MÉTODO 2</span>
                  <h3 className="font-bold text-slate-800 text-sm mt-0.5">Plantilla Excel Oficial</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Descargue la plantilla de 3 hojas y súbala</p>
                </div>
              </button>

              {/* Método 3 */}
              <button onClick={() => { setActiveMethod('asistente'); setIsEditMode(true); }} className={`bg-white rounded-xl p-4 border-2 shadow-sm relative flex items-start space-x-3 cursor-pointer transition text-left ${activeMethod === 'asistente' ? 'border-purple-500' : 'border-slate-200 hover:border-slate-300'}`}>
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">MÉTODO 3</span>
                  <h3 className="font-bold text-slate-800 text-sm mt-0.5">Edición Manual</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Edite semanas, días y bimestres directo en la tabla</p>
                </div>
              </button>
            </div>

            {/* Subir Archivo Container */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              {/* Pestañas */}
              <div className="flex items-center space-x-2 border-b border-slate-100 pb-4 flex-wrap gap-2">
                <button onClick={() => setActiveUploadTab('archivo')} className={`font-semibold text-xs px-4 py-2 rounded-lg border flex items-center space-x-2 transition ${activeUploadTab === 'archivo' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Subir Archivo Local</span>
                </button>
                <button onClick={() => setActiveUploadTab('texto')} className={`font-semibold text-xs px-4 py-2 rounded-lg border flex items-center space-x-2 transition ${activeUploadTab === 'texto' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Pegar Texto o Tabla</span>
                </button>
                <button onClick={() => setActiveUploadTab('json')} className={`font-semibold text-xs px-4 py-2 rounded-lg border flex items-center space-x-2 transition ${activeUploadTab === 'json' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'text-slate-500 border-transparent hover:text-slate-700'}`}>
                  <FileJson className="w-3.5 h-3.5" />
                  <span>JSON / Respaldo</span>
                </button>
              </div>

              {/* Tab: Subir Archivo Local */}
              {activeUploadTab === 'archivo' && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-10 text-center bg-blue-50/20 flex flex-col items-center justify-center space-y-4 cursor-pointer transition-all ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-blue-400 hover:border-blue-500'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".docx,.doc,.xlsx,.xls,.csv,.pdf,.json,.txt,.md"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        const ext = e.target.files[0].name.toLowerCase().split('.').pop();
                        if (ext === 'json') handleImportJson(e.target.files[0]);
                        else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') handleImportExcel(e.target.files[0]);
                        else if (ext === 'docx' || ext === 'doc') handleImportWord(e.target.files[0]);
                        else if (ext === 'pdf') handleImportPdf(e.target.files[0]);
                        else if (ext === 'txt' || ext === 'md') handleImportText(e.target.files[0]);
                        else setImportError('Formato no soportado.');
                      }
                    }}
                    className="hidden"
                  />
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-xs text-slate-600">Procesando archivo...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">
                        <UploadCloud className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-800 text-base">Arrastre y suelte su archivo aquí o haga clic para buscar</h3>
                        <p className="text-xs text-slate-500 max-w-lg mx-auto">
                          Detecta automáticamente hojas de <span className="font-semibold text-slate-700">Calendario Anual (12 Meses, Semanas y Días), Bimestres</span> desde Excel, Word o PDF.
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 pt-1 flex-wrap justify-center">
                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-semibold px-3 py-1 rounded-full">Excel (.xlsx, .xls)</span>
                        <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[11px] font-semibold px-3 py-1 rounded-full">Word (.docx, .doc)</span>
                        <span className="bg-red-50 text-red-500 border border-red-200 text-[11px] font-semibold px-3 py-1 rounded-full">PDF (.pdf)</span>
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold px-3 py-1 rounded-full">JSON / TXT</span>
                      </div>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-500/20 flex items-center space-x-2 transition mt-2 cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Seleccionar Archivo de su Computadora</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Tab: Pegar Texto o Tabla */}
              {activeUploadTab === 'texto' && (
                <div className="space-y-3">
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={'Pegue aquí el texto o tabla del calendario.\nEjemplo:\nEnero: 2 semanas, 10 días\nFebrero: 3 semanas, 14 días'}
                    className="w-full h-44 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                  <button onClick={handlePasteText} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer">
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Analizar y Cargar Texto</span>
                  </button>
                </div>
              )}

              {/* Tab: JSON / Respaldo */}
              {activeUploadTab === 'json' && (
                <div className="space-y-3">
                  <textarea
                    value={pastedJson}
                    onChange={(e) => setPastedJson(e.target.value)}
                    placeholder={'Pegue aquí el contenido JSON del respaldo.\n{"months": [ ... ], "periods": [ ... ]}'}
                    className="w-full h-44 p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={handlePasteJson} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer">
                      <FileJson className="w-3.5 h-3.5" />
                      <span>Cargar desde JSON</span>
                    </button>
                    <button onClick={() => jsonInputRef.current?.click()} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-5 py-2.5 rounded-xl flex items-center space-x-2 transition cursor-pointer">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Subir archivo .json</span>
                    </button>
                    <input
                      ref={jsonInputRef}
                      type="file"
                      accept=".json"
                      onChange={(e) => { if (e.target.files?.[0]) handleImportJson(e.target.files[0]); }}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer: Estado Actual y Respaldo */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Estado Actual en Memoria */}
              <div className="lg:col-span-7 bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">ESTADO ACTUAL EN MEMORIA</span>
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Semanas:</span>
                    <span className="text-xs font-bold text-blue-600 block">{totalSemanas} Semanas</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Días Hábiles:</span>
                    <span className="text-xs font-bold text-emerald-600 block">{totalDias} Días</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Bimestres:</span>
                    <span className="text-xs font-bold text-indigo-600 block">{effectivePeriods.length} Bimestres</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-medium">Pausas/Asuetos:</span>
                    <span className="text-xs font-bold text-amber-600 block">{totalEventos} Eventos</span>
                  </div>
                </div>
              </div>

              {/* Descargar y Respaldar */}
              <div className="lg:col-span-5 bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3 block">DESCARGAR Y RESPALDAR</span>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleExportJson} className="bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer">
                    <FileJson className="w-3.5 h-3.5" />
                    <span>Descargar Copia JSON</span>
                  </button>
                  <button onClick={handleExportExcel} className="bg-[#047857] hover:bg-emerald-800 text-white text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Descargar Excel Completo</span>
                  </button>
                </div>
                <button onClick={handleResetDefaults} className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 transition cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restaurar Valores Predeterminados</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Part 1: Semanas */}
      {(activePart === 'todas' || activePart === 'parte1_semanas') && (
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase mb-1">Parte 1</div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Semanas Laborales y Días Lectivos por Mes</h2>
              <p className="text-xs text-slate-500">Detalle mes a mes de las {totalSemanas} semanas lectivas ({totalDias} días) del calendario {anoLectivo}</p>
            </div>
            <button onClick={() => setIsEditMode(!isEditMode)} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isEditMode ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
              <Edit2 className="w-3.5 h-3.5" /><span>{isEditMode ? 'Finalizar Edición' : 'Editar Valores'}</span>
            </button>
          </div>
          <Table1SemanasLaborales months={months} anoLectivo={anoLectivo} isEditMode={isEditMode} onUpdateMonths={handleUpdateMonths} />
        </section>
      )}

      {/* Part 2: Bimestres */}
      {(activePart === 'todas' || activePart === 'parte2_bimestres') && (
        <section className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase mb-1">Parte 2</div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Los 4 Períodos Académicos y Cronograma de TBox {anoLectivo}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {effectivePeriods.map((p, idx) => {
              const isSelected = selectedBimestreIdx === idx;
              return (
                <div key={idx} onClick={() => setSelectedBimestreIdx(isSelected ? null : idx)} className={`rounded-2xl border p-4 shadow-xs transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>B{idx + 1}</div>
                      <h3 className="font-bold text-slate-900 text-xs">{p.nombre}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">10 sem</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                    <div className="flex justify-between"><span className="text-slate-400">Rango:</span><strong className="text-slate-800">{p.inicio} – {p.fin}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">Boletas:</span><strong className="text-emerald-700 font-bold">{p.entregaBoletas || '---'}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-400">Recuperación:</span><span className="text-amber-800 font-medium">{p.recuperacionOrdinaria || '---'}</span></div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-indigo-600 font-bold flex items-center justify-between">
                    <span>{isSelected ? 'Ocultar detalle' : 'Ver detalle'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail Tables */}
          <div className="space-y-6">
            {effectivePeriods.map((p, pIdx) => {
              if (selectedBimestreIdx !== null && selectedBimestreIdx !== pIdx) return null;
              return (
                <div key={pIdx} className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black text-xs">{pIdx + 1}</span>
                      <h3 className="font-bold text-sm text-slate-100">{p.nombre}</h3>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">{p.inicio} al {p.fin}</span>
                    </div>
                    <span className="text-xs text-slate-300">Boletas: <strong className="text-emerald-400">{p.entregaBoletas || 'Por definir'}</strong></span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3">Actividad / Evento</th>
                          <th className="p-3 w-32">Fecha Inicio</th>
                          <th className="p-3 w-32">Fecha Cierre</th>
                          <th className="p-3 w-36 text-indigo-900">Ingreso TBox</th>
                          <th className="p-3 w-28 text-center">Ponderación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {p.actividades.map((act, aIdx) => {
                          const isPO = act.porcentaje === '30%' || act.tipo === 'objetiva';
                          const isFormativa = act.porcentaje === '35%' || act.tipo === 'formativa';
                          let fechaIni = act.fechaInicio || '';
                          let fechaFin = act.fechaCierre || '';
                          if (!fechaIni && act.fechas) {
                            if (act.fechas.includes('–')) { const parts = act.fechas.split('–'); fechaIni = parts[0]?.trim() || ''; fechaFin = parts[1]?.trim() || ''; }
                            else { fechaIni = act.fechas; fechaFin = act.fechas; }
                          }
                          return (
                            <tr key={aIdx} className={`hover:bg-slate-50/80 transition-colors ${isPO ? 'bg-amber-50/40 font-medium' : isFormativa ? 'bg-blue-50/30' : ''}`}>
                              <td className="p-3 text-center text-slate-400 font-mono">{aIdx + 1}</td>
                              <td className="p-3 font-semibold text-slate-900">{act.nombre}</td>
                              <td className="p-3 text-slate-800 font-medium whitespace-nowrap">{fechaIni || '---'}</td>
                              <td className="p-3 text-slate-800 font-medium whitespace-nowrap">{fechaFin || '---'}</td>
                              <td className="p-3 whitespace-nowrap">
                                {act.ingresoTBox && act.ingresoTBox !== '------------' ? <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{act.ingresoTBox}</span> : <span className="text-slate-400 font-mono">------------</span>}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {act.porcentaje ? <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${isPO ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>{act.porcentaje}</span> : <span className="text-slate-400 font-mono text-[11px]">Formativo</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Part 3: Pausas */}
      {(activePart === 'todas' || activePart === 'parte3_pausas') && (
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase mb-1">Parte 3</div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pausas Pedagógicas, Descansos y Asuetos {anoLectivo}</h2>
            <p className="text-xs text-slate-500">Registro completo de pausas pedagógicas, feriados y actividades institucionales.</p>
          </div>
          <SuspensionesManager months={months} isEditMode={isEditMode} onUpdateMonths={handleUpdateMonths} />
        </section>
      )}

      {/* Part 4: P.E.R. */}
      {(activePart === 'todas' || activePart === 'parte4_per') && (
        <section className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold uppercase mb-1">Parte 4</div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">{recuperacionExtraordinaria2026.nombre}</h2>
            <p className="text-xs text-slate-500">Ponderación: <strong>40% Guía de Estudio + 60% Prueba Final</strong> · Artículos 89° y 90° de la Ley General de Educación.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-purple-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                <span>Cronograma del P.E.R.</span>
                <span className="text-[11px] text-purple-200">Noviembre {anoLectivo}</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {recuperacionExtraordinaria2026.eventos.map((ev, eIdx) => (
                  <div key={eIdx} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">{ev.detalle}</span>
                      <span className="text-slate-500 text-[11px]">Modalidad: {ev.tbox}</span>
                    </div>
                    <span className="font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs shrink-0">{ev.fecha}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" /><span>Graduaciones y Clausuras</span>
              </div>
              <div className="space-y-2.5">
                {recuperacionExtraordinaria2026.graduaciones.map((grad, gIdx) => (
                  <div key={gIdx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[11px] block">{grad.nivel}</span>
                    <strong className="text-slate-900 text-xs font-bold block mt-0.5">{grad.fecha}</strong>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block">Nota MINEDUCYT:</span>
                <p>Las pruebas extraordinarias aplican a estudiantes con promedio inferior a 6.0.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Summary Bar */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0"><CalendarDays className="w-5 h-5" /></div>
          <div>
            <h4 className="font-bold text-sm text-slate-900">Calendario Institucional {anoLectivo}</h4>
            <p className="text-xs text-slate-600">{totalSemanas} semanas · {totalDias} días hábiles · {effectivePeriods.length} bimestres</p>
          </div>
        </div>
      </div>
    </div>
  );
}
