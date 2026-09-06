import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LMSModule, ModuloCronograma, MonthStats, AcademicPeriod } from '../../types';
import { generarCronogramaTecnico, calcularTotalSemanas, validarCronogramaContraCalendario, CronogramaResult } from '../../utils/cronogramaHelper';
import { formatDateSpanish } from '../../utils/jornalizacionHelper';
import { getInstitutionalCalendar } from '../../lib/calendarFirestore';
import { toast } from 'sonner';
import { Calendar, Play, Pause, CheckCircle2, Clock, ChevronRight, Zap, AlertTriangle, Info, Trash2, CalendarOff } from 'lucide-react';

export default function JornalizacionView() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [allModules, setAllModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cronograma, setCronograma] = useState<ModuloCronograma[] | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Calendario
  const [calendarMonths, setCalendarMonths] = useState<MonthStats[]>([]);
  const [calendarPeriods, setCalendarPeriods] = useState<AcademicPeriod[]>([]);
  const [calendarLoaded, setCalendarLoaded] = useState(false);

  // Filtros
  const [selectedYears, setSelectedYears] = useState<string[]>(['1', '2', '3']);
  const [anoAcademico, setAnoAcademico] = useState('2026');

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadModules();
    loadCalendarData();
  }, [userProfile]);

  const loadCalendarData = async () => {
    try {
      const calendar = await getInstitutionalCalendar(anoAcademico);
      if (calendar) {
        setCalendarMonths(calendar.months || []);
        setCalendarPeriods(calendar.periodsMedia || []);
        setCalendarLoaded(true);
      } else {
        setCalendarLoaded(false);
      }
    } catch (e) {
      console.error('Error loading calendar:', e);
      setCalendarLoaded(false);
    }
  };

  // Obtener fecha de inicio del primer bimestre
  const getFechaInicioFromCalendar = (): string => {
    if (calendarPeriods.length === 0) return '';
    const firstPeriod = calendarPeriods[0];
    // El formato es "19 enero" — convertir a YYYY-MM-DD
    const parts = firstPeriod.inicio.split(' ');
    if (parts.length < 2) return '';
    const day = parts[0].padStart(2, '0');
    const monthMap: Record<string, string> = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    };
    const monthNum = monthMap[parts[1].toLowerCase()];
    if (!monthNum) return '';
    return `${anoAcademico}-${monthNum}-${day}`;
  };

  // Obtener fecha de fin del año escolar (último bimestre)
  const getFechaFinFromCalendar = (): string => {
    if (calendarPeriods.length === 0) return '';
    const lastPeriod = calendarPeriods[calendarPeriods.length - 1];
    const parts = lastPeriod.fin.split(' ');
    if (parts.length < 2) return '';
    const day = parts[0].padStart(2, '0');
    const monthMap: Record<string, string> = {
      'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
      'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
      'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
    };
    const monthNum = monthMap[parts[1].toLowerCase()];
    if (!monthNum) return '';
    return `${anoAcademico}-${monthNum}-${day}`;
  };

  const loadModules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lms_modules'), where('teacherId', '==', userProfile?.teacherId || userProfile?.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        const allQ = query(collection(db, 'lms_modules'));
        const allSnap = await getDocs(allQ);
        setAllModules(allSnap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule)));
      } else {
        setAllModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule)));
      }

      // Cargar cronograma existente
      const existingCronograma = snap.empty ? [] : snap.docs
        .map(d => ({ id: d.id, ...d.data() } as LMSModule))
        .filter(m => m.jornalizacion && m.jornalizacion.length > 0)
        .map(m => ({
          moduleId: m.id,
          codigo: m.code,
          nombre: m.name,
          year: m.technicalYear,
          fechaInicio: m.jornalizacion![0].startDate,
          fechaFin: m.jornalizacion![m.jornalizacion!.length - 1].endDate,
          horasTotales: m.hours,
          semanasTotales: m.weeks,
          diasHabilesNecesarios: Math.ceil(m.hours / 18) * 5,
          projectDeliveryDate: '',
          jornalizacion: m.jornalizacion!,
          estado: 'programado' as const,
        }));

      if (existingCronograma.length > 0) {
        setCronograma(existingCronograma);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Módulos filtrados por año técnico seleccionado
  const modules = allModules.filter(m => selectedYears.includes(m.technicalYear));

  // Grados disponibles
  const availableYears = [...new Set(allModules.map(m => m.technicalYear))].sort();

  const handleClearCronograma = async () => {
    if (!confirm('¿Está seguro de limpiar todo el cronograma? Esta acción no se puede deshacer.')) return;

    try {
      const q = query(collection(db, 'lms_modules'));
      const snap = await getDocs(q);
      
      for (const d of snap.docs) {
        const data = d.data();
        if (data.jornalizacion && data.jornalizacion.length > 0) {
          await updateDoc(doc(db, 'lms_modules', d.id), {
            jornalizacion: [],
            updatedAt: new Date().toISOString(),
          });
        }
      }

      setCronograma(null);
      setWarnings([]);
      toast.success('Cronograma limpiado correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al limpiar cronograma');
    }
  };

  // Vaciar solo los años seleccionados
  const handleClearSelectedYears = async () => {
    const yearsLabel = selectedYears.map(y => y + '° Año').join(', ');
    if (!confirm(`¿Limpiar cronograma de ${yearsLabel}? Los módulos de otros años se mantendrán.`)) return;

    try {
      const modulesToClear = allModules.filter(m => selectedYears.includes(m.technicalYear));
      
      for (const mod of modulesToClear) {
        await updateDoc(doc(db, 'lms_modules', mod.id), {
          jornalizacion: [],
          updatedAt: new Date().toISOString(),
        });
      }

      // Actualizar estado local
      if (cronograma) {
        const remaining = cronograma.filter(c => !modulesToClear.some(m => m.id === c.moduleId));
        setCronograma(remaining.length > 0 ? remaining : null);
      }
      setWarnings([]);
      toast.success(`${yearsLabel} limpiado correctamente`);
    } catch (e) {
      console.error(e);
      toast.error('Error al limpiar años seleccionados');
    }
  };

  const handleGenerate = async () => {
    if (!calendarLoaded) {
      toast.error('No hay calendario institucional cargado. Solicite al administrador que cargue el calendario.');
      return;
    }

    const fechaInicio = getFechaInicioFromCalendar();
    if (!fechaInicio) {
      toast.error('No se pudo determinar la fecha de inicio del año desde el calendario.');
      return;
    }

    if (selectedYears.length === 0) {
      toast.error('Seleccione al menos un año técnico');
      return;
    }

    if (modules.length === 0) {
      toast.error(`No hay módulos para ${selectedYears.map(y => y + '°').join(', ')} Año`);
      return;
    }

    setGenerating(true);
    try {
      const allModulos: ModuloCronograma[] = [];
      const allWarnings: string[] = [];

      // Todos los años corren en PARALELO dentro del mismo año escolar
      // Cada año empieza en la misma fecha pero con sus propios módulos
      for (const yearNum of selectedYears) {
        const yearModules = modules.filter(m => m.technicalYear === yearNum);
        if (yearModules.length === 0) continue;

        const result = generarCronogramaTecnico({
          startDate: fechaInicio,
          endDate: getFechaFinFromCalendar(),
          year: anoAcademico,
          modules: yearModules,
          suspensiones: calendarMonths,
        });

        allModulos.push(...result.modulos);
        allWarnings.push(...result.warnings);
      }

      // Guardar en Firestore
      for (const mod of allModulos) {
        const moduleRef = doc(db, 'lms_modules', mod.moduleId);
        await updateDoc(moduleRef, {
          jornalizacion: mod.jornalizacion,
          updatedAt: new Date().toISOString(),
        });
      }

      // Mantener módulos de años no seleccionados
      const otherYearMods = (cronograma || []).filter(c => 
        !allModulos.some(r => r.moduleId === c.moduleId)
      );
      setCronograma([...otherYearMods, ...allModulos]);

      // Validar contra calendario (200 días, 40 semanas)
      const cronogramaResult: CronogramaResult = {
        modulos: allModulos,
        totalDias: allModulos.reduce((sum, m) => sum + m.diasHabilesNecesarios, 0),
        totalHoras: allModulos.reduce((sum, m) => sum + m.horasTotales, 0),
        fechaInicio: allModulos[0]?.fechaInicio || '',
        fechaFin: allModulos[allModulos.length - 1]?.fechaFin || '',
        warnings: [],
      };
      const validationWarnings = validarCronogramaContraCalendario(cronogramaResult);
      
      // Combinar advertencias de generación y validación
      const combinedWarnings = [...allWarnings, ...validationWarnings];
      
      // Mostrar advertencias si las hay
      if (combinedWarnings.length > 0) {
        setWarnings(combinedWarnings);
        combinedWarnings.forEach(w => toast.warning(w, { duration: 6000 }));
      } else {
        setWarnings([]);
      }

      setShowGenerateModal(false);
      toast.success(`Cronograma generado: ${allModulos.length} módulos en ${selectedYears.length} años`);
    } catch (e) {
      console.error(e);
      toast.error('Error al generar cronograma');
    } finally {
      setGenerating(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'programado':
        return <span className="badge-jornal badge-jornal-blue"><Clock size={12} /> Programado</span>;
      case 'en_ejecucion':
        return <span className="badge-jornal badge-jornal-teal"><Play size={12} /> En ejecución</span>;
      case 'pausado':
        return <span className="badge-jornal badge-jornal-amber"><Pause size={12} /> Pausado</span>;
      case 'completado':
        return <span className="badge-jornal badge-jornal-emerald"><CheckCircle2 size={12} /> Completado</span>;
      default:
        return <span className="badge-jornal badge-jornal-purple">Sin programa</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const modulosConCronograma = (cronograma || []).filter(c => modules.some(m => m.id === c.moduleId));
  const modulosSinCronograma = modules.filter(m => !m.jornalizacion || m.jornalizacion.length === 0);
  const totalSemanas = modulosConCronograma.length > 0
    ? calcularTotalSemanas({ modulos: modulosConCronograma, totalDias: 0, totalHoras: 0, fechaInicio: '', fechaFin: '' })
    : 0;

  const fechaInicioCalendar = getFechaInicioFromCalendar();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-primary" size={28} />
            Jornalización Técnica
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Cronograma de módulos y etapas de la acción completa
          </p>
        </div>
        <div className="flex items-center gap-2">
          {cronograma && cronograma.length > 0 && (
            <>
              <button
                onClick={handleClearSelectedYears}
                className="px-3 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2"
              >
                <CalendarOff size={16} />
                Vaciar Año{selectedYears.length > 1 ? 's' : ''}
              </button>
              <button
                onClick={handleClearCronograma}
                className="px-3 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Vaciar Todo
              </button>
            </>
          )}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
          >
            <Zap size={16} />
            Generar Cronograma
          </button>
        </div>
      </div>

      {/* Alerta: sin calendario */}
      {!calendarLoaded && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Info className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="font-bold text-amber-800 text-sm">Calendario no disponible</h4>
            <p className="text-xs text-amber-700 mt-1">
              El calendario institucional no está cargado. Solicite al administrador que cargue el calendario
              antes de generar el cronograma.
            </p>
          </div>
        </div>
      )}

      {/* Filtro por año — toggle buttons */}
      {allModules.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Año técnico:</span>
          <div className="flex gap-2">
            {availableYears.map(y => {
              const isSelected = selectedYears.includes(y);
              const count = allModules.filter(m => m.technicalYear === y).length;
              return (
                <button
                  key={y}
                  onClick={() => {
                    setSelectedYears(prev =>
                      isSelected ? prev.filter(x => x !== y) : [...prev, y]
                    );
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {y}° Año ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {modulosConCronograma.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-slate-900">{modulosConCronograma.length}</div>
            <div className="text-xs text-slate-500 font-medium">Módulos programados</div>
          </div>
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-emerald-600">{totalSemanas}</div>
            <div className="text-xs text-slate-500 font-medium">Semanas totales</div>
          </div>
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-blue-600">
              {modulosConCronograma.reduce((sum, m) => sum + m.horasTotales, 0)}h
            </div>
            <div className="text-xs text-slate-500 font-medium">Horas totales</div>
          </div>
          <div className="card-crema p-4 rounded-xl border border-slate-100">
            <div className="text-2xl font-bold text-amber-600">{modulosSinCronograma.length}</div>
            <div className="text-xs text-slate-500 font-medium">Sin cronograma</div>
          </div>
        </div>
      )}

      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Advertencias del Cronograma</span>
          </div>
          {warnings.map((w, i) => (
            <p key={i} className="text-amber-700 text-sm">{w}</p>
          ))}
        </div>
      )}

      {/* Tabla de cronograma */}
      {modulosConCronograma.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Código</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Módulo</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700">Año</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700">Horas</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700">Semanas</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Inicio</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-700">Fin</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700">Estado</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-700">Etapas</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {modulosConCronograma.map((mod, idx) => (
                  <tr
                    key={mod.moduleId}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    onClick={() => navigate(`/docente/jornalizacion/${mod.moduleId}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold text-white px-2 py-1 rounded-md" style={{ backgroundColor: '#0D71B9' }}>
                        {mod.codigo}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{mod.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {mod.year}°
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700">{mod.horasTotales}h</td>
                    <td className="px-4 py-3 text-center text-slate-600">{mod.semanasTotales} sem</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateSpanish(mod.fechaInicio)}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateSpanish(mod.fechaFin)}</td>
                    <td className="px-4 py-3 text-center">{getEstadoBadge(mod.estado)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-slate-500">{mod.jornalizacion.length}/6</span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight size={16} className="text-slate-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-amber-500" size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">Sin cronograma generado</h3>
          <p className="text-slate-500 mb-4">
            {calendarLoaded
              ? 'Genera tu cronograma para asignar fechas a tus módulos técnicos'
              : 'El calendario institucional no está cargado. Solicite al administrador.'}
          </p>
          {calendarLoaded && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              Generar Cronograma
            </button>
          )}
        </div>
      )}

      {/* Módulos sin cronograma */}
      {modulosConCronograma.length > 0 && modulosSinCronograma.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <h4 className="font-bold text-amber-800 text-sm mb-2">
            {modulosSinCronograma.length} módulo(s) sin cronograma
          </h4>
          <div className="flex flex-wrap gap-2">
            {modulosSinCronograma.map(m => (
              <span key={m.id} className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                {m.code} — {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Modal Generar Cronograma */}
      {showGenerateModal && (
        <div className="modal-backdrop" onClick={() => setShowGenerateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap className="text-emerald-600" size={20} />
              Generar Cronograma
            </h3>

            <div className="space-y-4">
              {/* Año técnico — toggle buttons */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Año técnico a generar
                </label>
                <div className="flex gap-2">
                  {availableYears.map(y => {
                    const isSelected = selectedYears.includes(y);
                    const count = allModules.filter(m => m.technicalYear === y).length;
                    return (
                      <button
                        key={y}
                        onClick={() => {
                          setSelectedYears(prev =>
                            isSelected ? prev.filter(x => x !== y) : [...prev, y]
                          );
                        }}
                        className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-primary text-white shadow-sm ring-2 ring-primary/30'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {y}° Año
                        <span className="block text-[10px] font-normal mt-0.5">{count} módulos</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info del calendario */}
              <div className={`rounded-xl p-3 text-sm ${calendarLoaded ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                {calendarLoaded ? (
                  <>
                    <p className="font-bold">Calendario cargado</p>
                    <p className="text-xs mt-1">
                      Fecha inicio: <strong>{fechaInicioCalendar ? formatDateSpanish(fechaInicioCalendar) : 'No disponible'}</strong>
                    </p>
                    <p className="text-xs">
                      Suspensiones: <strong>{calendarMonths.reduce((sum, m) => sum + (m.eventos?.length || 0), 0)} eventos</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-bold">Sin calendario</p>
                    <p className="text-xs mt-1">El administrador debe cargar el calendario institucional primero.</p>
                  </>
                )}
              </div>

              {/* Resumen */}
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
                <p>Se generarán fechas correlativas para <strong>{modules.length} módulos</strong>.</p>
                {fechaInicioCalendar && (
                  <p className="text-xs text-slate-400 mt-1">
                    Inicio: {formatDateSpanish(fechaInicioCalendar)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !calendarLoaded}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
