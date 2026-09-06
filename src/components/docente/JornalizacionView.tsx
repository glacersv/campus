import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LMSModule, ModuloCronograma, MonthStats } from '../../types';
import { generarCronogramaTecnico, calcularTotalSemanas } from '../../utils/cronogramaHelper';
import { formatDateSpanish } from '../../utils/jornalizacionHelper';
import { toast } from 'sonner';
import { Calendar, Play, Pause, CheckCircle2, Clock, ChevronRight, Zap, AlertTriangle } from 'lucide-react';

export default function JornalizacionView() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cronograma, setCronograma] = useState<ModuloCronograma[] | null>(null);

  // Form state para generar cronograma
  const [fechaInicio, setFechaInicio] = useState('2026-01-19');
  const [anoAcademico, setAnoAcademico] = useState('2026');

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadModules();
  }, [userProfile]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lms_modules'), where('teacherId', '==', userProfile?.teacherId || userProfile?.uid));
      const snap = await getDocs(q);

      if (snap.empty) {
        const allQ = query(collection(db, 'lms_modules'));
        const allSnap = await getDocs(allQ);
        setModules(allSnap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule)));
      } else {
        setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule)));
      }

      // Cargar cronograma existente si hay
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

  const handleGenerate = async () => {
    if (modules.length === 0) {
      toast.error('No hay módulos asignados');
      return;
    }

    setGenerating(true);
    try {
      // Placeholder: suspensiones vacías por ahora
      const suspensiones: MonthStats[] = [];

      const result = generarCronogramaTecnico({
        startDate: fechaInicio,
        year: anoAcademico,
        modules,
        suspensiones,
      });

      // Guardar en Firestore
      for (const mod of result.modulos) {
        const moduleRef = doc(db, 'lms_modules', mod.moduleId);
        await updateDoc(moduleRef, {
          jornalizacion: mod.jornalizacion,
          updatedAt: new Date().toISOString(),
        });
      }

      setCronograma(result.modulos);
      setShowGenerateModal(false);
      toast.success(`Cronograma generado: ${result.modulos.length} módulos, ${result.totalDias} días hábiles`);
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

  const modulosConCronograma = cronograma || [];
  const modulosSinCronograma = modules.filter(m => !m.jornalizacion || m.jornalizacion.length === 0);
  const totalSemanas = modulosConCronograma.length > 0
    ? calcularTotalSemanas({ modulos: modulosConCronograma, totalDias: 0, totalHoras: 0, fechaInicio: '', fechaFin: '' })
    : 0;

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
        <button
          onClick={() => setShowGenerateModal(true)}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <Zap size={16} />
          Generar Cronograma
        </button>
      </div>

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
            Genera tu cronograma para asignar fechas a tus módulos técnicos
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            Generar Cronograma
          </button>
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Fecha de inicio del año
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Año académico
                </label>
                <select
                  value={anoAcademico}
                  onChange={e => setAnoAcademico(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="2025">2025</option>
                  <option value="2026">2026</option>
                  <option value="2027">2027</option>
                </select>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600">
                <p>Se generarán fechas correlativas para <strong>{modules.length} módulos</strong> iniciando desde {formatDateSpanish(fechaInicio)}.</p>
                <p className="text-xs text-slate-400 mt-1">Las fechas se calcularán respetando días hábiles.</p>
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
                disabled={generating}
                className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
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
