import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groqChat, isGroqAvailable } from '../../ai/providers/groq';
import { geminiChat, isGeminiAvailable } from '../../ai/providers/gemini';
import {
  Proyecto, ActividadEvaluada as ActividadEvaluadaType, TipoActividad,
  TIPOS_ACTIVIDAD, CriterioRubrica, Subject, ESCALA_CALIFICACION
} from '../../types';
import {
  getProyectosAprobadosByDocente, createActividadEvaluada,
  updateActividadEvaluada, getActividadesByDocente, getAllSubjects, getTeacher,
  calificarActividad, resetCalificacion
} from '../../lib/firestore';
import {
  ClipboardCheck, Plus, X, Search, ChevronDown, CheckCircle2,
  Edit3, Trash2, Eye, Calendar, Star, Sparkles, RotateCcw
} from 'lucide-react';

interface CriterioForm {
  descripcion: string;
  peso: string;
  puntuacion_max: string;
  descripcion_nivel1?: string;
  descripcion_nivel2?: string;
  descripcion_nivel3?: string;
  descripcion_nivel4?: string;
  descripcion_nivel5?: string;
}

export default function ActividadEvaluada({ proyectoInicial }: { proyectoInicial?: Proyecto }) {
  const { userProfile } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [actividades, setActividades] = useState<ActividadEvaluadaType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroMateria, setFiltroMateria] = useState<string>('');
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState<Proyecto | null>(null);
  const [proyectoFiltro, setProyectoFiltro] = useState<Proyecto | null>(proyectoInicial ?? null);
  const [showForm, setShowForm] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<ActividadEvaluadaType | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [materias, setMaterias] = useState<Subject[]>([]);
  const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
  const [tab, setTab] = useState<'proyectos' | 'actividades'>(proyectoInicial ? 'actividades' : 'proyectos');
  const [actividadCalificar, setActividadCalificar] = useState<ActividadEvaluadaType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [allMaterias, teacher] = await Promise.all([
        getAllSubjects(),
        userProfile?.teacherId ? getTeacher(userProfile.teacherId) : null
      ]);
      
      setMaterias(allMaterias);
      
      if (teacher?.subjects && teacher.subjects.length > 0) {
        setTeacherSubjects(teacher.subjects);
      }
      
      const [proyectosData, actividadesData] = await Promise.all([
        getProyectosAprobadosByDocente(userProfile?.uid || ''),
        getActividadesByDocente(userProfile?.uid || '')
      ]);
      
      setProyectos(proyectosData);
      setActividades(actividadesData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const proyectosFiltrados = proyectos.filter(p => {
    const matchBusqueda = !busqueda ||
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.representante_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.grado?.includes(busqueda);
    const matchMateria = !filtroMateria ||
      p.materia_id === filtroMateria ||
      p.materias_secundarias?.includes(filtroMateria);
    return matchBusqueda && matchMateria;
  });

  const actividadesConProyecto = actividades.map(a => ({
    ...a,
    proyecto: proyectos.find(p => p.id === a.proyecto_id)
  }));

  const actividadesMostradas = proyectoFiltro
    ? actividadesConProyecto.filter(a => a.proyecto_id === proyectoFiltro.id)
    : actividadesConProyecto;

  const handleCreateActividad = (proyecto: Proyecto) => {
    setProyectoSeleccionado(proyecto);
    setActividadEditar(null);
    setShowForm(true);
  };

  const handleEditActividad = (actividad: ActividadEvaluadaType) => {
    setActividadEditar(actividad);
    setProyectoSeleccionado(proyectos.find(p => p.id === actividad.proyecto_id) || null);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setProyectoSeleccionado(null);
    setActividadEditar(null);
    setMsg({ tipo: 'ok', texto: actividadEditar ? 'Actividad actualizada' : 'Actividad creada correctamente' });
    setTimeout(() => setMsg(null), 3000);
    loadData();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-bold text-slate-900">Actividades Evaluadas</h2>
          <p className="text-[10px] text-slate-400">
            Crea actividades de evaluación para tus proyectos por materia
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        <button
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'proyectos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('proyectos')}>
          Proyectos Aprobados
        </button>
        <button
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            tab === 'actividades' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setTab('actividades')}>
          Mis Actividades ({actividades.length})
        </button>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          msg.tipo === 'ok'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {msg.tipo === 'ok' ? '✓' : '✕'} {msg.texto}
        </div>
      )}

      {/* Tab Proyectos */}
      {tab === 'proyectos' && (
        <>
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por título, representante o grado..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFiltroMateria('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !filtroMateria ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas
              </button>
              {materias.filter(m => teacherSubjects.length === 0 || teacherSubjects.includes(m.id)).map(m => (
                <button
                  key={m.id}
                  onClick={() => setFiltroMateria(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    filtroMateria === m.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Project list */}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : proyectosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No hay proyectos aprobados disponibles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {proyectosFiltrados.map(p => {
                const actividadesDelProyecto = actividades.filter(a => a.proyecto_id === p.id);
                return (
                  <ProyectoCard
                    key={p.id}
                    proyecto={p}
                    materias={materias}
                    actividades={actividadesDelProyecto}
                    onCrearActividad={() => handleCreateActividad(p)}
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Tab Actividades */}
      {tab === 'actividades' && (
        <>
          {proyectoFiltro && (
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:border-indigo-500/30 dark:text-indigo-300">
              <ClipboardCheck className="w-4 h-4" />
              <span className="truncate">Proyecto: {proyectoFiltro.titulo}</span>
              <button
                onClick={() => { setProyectoFiltro(null); setTab('proyectos'); }}
                className="ml-auto text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-200"
              >
                Quitar filtro
              </button>
            </div>
          )}
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : actividadesMostradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400 dark:bg-slate-800 dark:border-slate-700">
              <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {proyectoFiltro ? 'Este proyecto aún no tiene actividades evaluadas' : 'No has creado actividades evaluadas aún'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {actividadesMostradas.map(a => (
                <ActividadCard
                  key={a.id}
                  actividad={a}
                  onEditar={() => handleEditActividad(a)}
                  onCalificar={() => setActividadCalificar(a)}
                  onReset={async () => {
                    if (confirm('¿Restablecer esta calificación? Se eliminarán las notas.')) {
                      await resetCalificacion(a.id, a.proyecto_id);
                      handleSaved();
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Modal formulario */}
      {showForm && proyectoSeleccionado && (
        <FormActividad
          proyecto={proyectoSeleccionado}
          actividadInicial={actividadEditar}
          onClose={() => { setShowForm(false); setProyectoSeleccionado(null); setActividadEditar(null); }}
          onSaved={handleSaved}
        />
      )}

      {/* Modal calificación */}
      {actividadCalificar && (
        <ModalCalificacion
          actividad={actividadCalificar}
          onClose={() => setActividadCalificar(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ProyectoCard({ proyecto: p, materias, actividades, onCrearActividad }: {
  proyecto: Proyecto; materias: Subject[]; actividades: ActividadEvaluadaType[]; onCrearActividad: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:shadow-xs transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{p.titulo}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {p.grado} {p.seccion} · Rep: {p.representante_nombre}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-bold">
              {p.materia_nombre}
            </span>
            {p.materias_secundarias?.map(mId => {
              const mat = materias.find(m => m.id === mId);
              return mat ? (
                <span key={mId} className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[9px] font-medium">
                  {mat.name}
                </span>
              ) : null;
            })}
          </div>
          {actividades.length > 0 && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600">
              <CheckCircle2 className="w-3 h-3" />
              {actividades.length} actividad(es) asignada(s)
            </div>
          )}
        </div>
        <button
          onClick={onCrearActividad}
          className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3 h-3" /> Evaluar
        </button>
      </div>
    </div>
  );
}

function ActividadCard({ actividad, onEditar, onCalificar, onReset }: {
  actividad: ActividadEvaluadaType & { proyecto?: Proyecto }; onEditar: () => void; onCalificar: () => void; onReset: () => void;
}) {
  const tipoInfo = TIPOS_ACTIVIDAD[actividad.tipo_actividad] ?? TIPOS_ACTIVIDAD.otro;
  const estadoColors: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-600',
    publicada: 'bg-blue-100 text-blue-700',
    entregada: 'bg-amber-100 text-amber-700',
    calificada: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 hover:shadow-xs transition-shadow">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{tipoInfo.icon}</span>
            <div className="text-sm font-bold text-slate-900 truncate">{actividad.titulo}</div>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {actividad.proyecto?.titulo ?? 'Proyecto'} · {actividad.materia_nombre}
          </div>
          <div className="text-xs text-slate-500 mt-1 line-clamp-2">{actividad.descripcion}</div>
          <div className="flex items-center gap-3 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${estadoColors[actividad.estado] ?? 'bg-slate-100 text-slate-600'}`}>
              {actividad.estado.charAt(0).toUpperCase() + actividad.estado.slice(1)}
            </span>
            {actividad.rubrica && (
              <span className="text-[10px] text-slate-400">
                {actividad.rubrica.length} criterios · {actividad.rubrica.reduce((sum, c) => sum + c.peso, 0)} pts
              </span>
            )}
            {actividad.calificacion_nota != null && (
              <span className="text-[10px] text-emerald-600 font-medium">
                Nota: {actividad.calificacion_nota}/10
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {actividad.estado === 'calificada' && (
            <button
              onClick={onReset}
              className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-1"
              title="Restablecer calificación"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
          {actividad.estado !== 'calificada' && (
            <button
              onClick={onCalificar}
              className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
            >
              <Star className="w-3 h-3" /> Calificar
            </button>
          )}
          <button
            onClick={onEditar}
            className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1"
          >
            <Edit3 className="w-3 h-3" /> Editar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalCalificacion({ actividad, onClose, onSaved }: {
  actividad: ActividadEvaluadaType & { proyecto?: Proyecto };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [scores, setScores] = useState<Record<string, number>>(
    () => Object.fromEntries((actividad.rubrica || []).map(c => [c.id, 3]))
  );
  const [obs, setObs] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const rubrica = actividad.rubrica || [];

  function calcTotal() {
    let total = 0;
    for (const c of rubrica) {
      const score = scores[c.id] || 3;
      total += (c.peso / 5) * score;
    }
    return Math.round(total * 10) / 10;
  }

  function calcNota() {
    return Math.round(calcTotal() / 10 * 10) / 10;
  }

  async function handleCalificar() {
    setSaving(true);
    try {
      const criterios = rubrica.map(c => ({
        criterio_id: c.id,
        puntuacion: scores[c.id] || 3,
      }));
      await calificarActividad(
        actividad.id,
        actividad.proyecto_id,
        calcTotal(),
        calcNota(),
        obs || undefined,
        criterios
      );
      onSaved();
    } catch (e: any) {
      setMsg({ tipo: 'error', texto: e.message });
    }
    setSaving(false);
  }

  const escalaCalificacion: Record<number, { label: string; color: string }> = {
    1: { label: 'Deficiente', color: 'text-red-600 bg-red-50' },
    2: { label: 'En desarrollo', color: 'text-orange-600 bg-orange-50' },
    3: { label: 'Cumple parcialmente', color: 'text-amber-600 bg-amber-50' },
    4: { label: 'Cumple', color: 'text-emerald-600 bg-emerald-50' },
    5: { label: 'Superó expectativas', color: 'text-green-600 bg-green-50' },
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900">Calificar Actividad</h3>
            <p className="text-xs text-slate-400 mt-0.5">{actividad.titulo}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {rubrica.map((criterio, idx) => {
            const score = scores[criterio.id] || 3;
            const pts = Math.round((criterio.peso / 5) * score * 10) / 10;
            return (
              <div key={criterio.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                    <span className="text-sm font-bold text-slate-800">{criterio.descripcion}</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{criterio.peso} pts</span>
                </div>

                {/* Score selector */}
                <div className="flex gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setScores(prev => ({ ...prev, [criterio.id]: n }))}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                        score === n
                          ? `${escalaCalificacion[n].color} ring-2 ring-primary/30`
                          : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`${escalaCalificacion[score].color} px-2 py-0.5 rounded-lg font-medium`}>
                    {escalaCalificacion[score].label}
                  </span>
                  <span className="font-bold text-slate-600">{pts} / {criterio.peso} pts</span>
                </div>
              </div>
            );
          })}

          {/* Observaciones */}
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Observaciones (opcional)</label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Comentarios sobre la evaluación..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              rows={2}
            />
          </div>

          {msg && (
            <div className={`text-xs p-2 rounded-lg ${msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              {msg.texto}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-sm">
            <span className="text-slate-500">Total: </span>
            <span className="font-bold text-slate-900">{calcTotal()} / 100</span>
            <span className="text-slate-400 mx-2">·</span>
            <span className="font-bold text-primary">{calcNota()} / 10</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
            <button
              onClick={handleCalificar}
              disabled={saving}
              className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Star className="w-4 h-4" />}
              Calificar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormActividad({ proyecto, actividadInicial, onClose, onSaved }: {
  proyecto: Proyecto;
  actividadInicial: ActividadEvaluadaType | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { userProfile } = useAuth();
  const [tipoActividad, setTipoActividad] = useState<TipoActividad>(actividadInicial?.tipo_actividad ?? 'investigacion');
  const [titulo, setTitulo] = useState(actividadInicial?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(actividadInicial?.descripcion ?? '');
  const [instrucciones, setInstrucciones] = useState(actividadInicial?.instrucciones ?? '');
  const [herramientas, setHerramientas] = useState<string[]>(actividadInicial?.herramientas_requeridas ?? []);
  const [herramientaInput, setHerramientaInput] = useState('');
  const [showToolSuggestions, setShowToolSuggestions] = useState(false);
  const [detallesIA, setDetallesIA] = useState('');

  const TOOL_SUGGESTIONS = [
    'Google Docs', 'Google Sheets', 'Google Slides',
    'Word', 'Excel', 'PowerPoint',
    'Canva', 'Figma', 'Photoshop',
    'Arduino', 'Scratch', 'Python', 'JavaScript', 'HTML/CSS',
    'VS Code', 'Thonny', 'Tinkercad',
    'Drive', 'OneDrive', 'YouTube',
    'Prezi', 'Genially', 'Notion',
    'Excel', 'Calculadora', 'Diagrama de flujo',
  ];
  const [rubrica, setRubrica] = useState<CriterioForm[]>(
    actividadInicial?.rubrica?.map(c => ({
      descripcion: c.descripcion,
      peso: String(c.peso),
      puntuacion_max: '5',
      descripcion_nivel1: c.descripcion_nivel1 || '',
      descripcion_nivel2: c.descripcion_nivel2 || '',
      descripcion_nivel3: c.descripcion_nivel3 || '',
      descripcion_nivel4: c.descripcion_nivel4 || '',
      descripcion_nivel5: c.descripcion_nivel5 || '',
    })) ?? [
      { descripcion: '', peso: '15', puntuacion_max: '5', descripcion_nivel1: '', descripcion_nivel2: '', descripcion_nivel3: '', descripcion_nivel4: '', descripcion_nivel5: '' }
    ]
  );
  const [fechaLimite, setFechaLimite] = useState(actividadInicial?.fecha_limite ?? '');
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [materias, setMaterias] = useState<Subject[]>([]);

  useEffect(() => {
    getAllSubjects().then(setMaterias).catch(console.error);
  }, []);

  async function askAI(prompt: string): Promise<string> {
    // Intentar Groq primero (gratis y rápido)
    if (isGroqAvailable()) {
      return await groqChat([{ role: 'user', content: prompt }]);
    }
    // Fallback a Gemini
    if (isGeminiAvailable()) {
      return await geminiChat([{ role: 'user', parts: [{ text: prompt }] }]);
    }
    throw new Error('No hay proveedor de IA configurado. Agrega VITE_GROQ_API_KEY o VITE_GEMINI_API_KEY en .env');
  }

  async function generarDescripcionIA() {
    if (!titulo.trim()) { setError('Escribe un título primero para generar la descripción'); return; }
    setLoadingAI(true);
    setError(null);
    try {
      const tipoLabel = TIPOS_ACTIVIDAD[tipoActividad]?.label || tipoActividad;
      const materiaLabel = materias.find(m => m.id === proyecto.materia_id)?.name || proyecto.materia_nombre;
      const text = await askAI(`Genera una descripción corta (máximo 200 caracteres) para una actividad escolar evaluada.
Contexto:
- Materia: ${materiaLabel}
- Tipo de actividad: ${tipoLabel}
- Título: ${titulo}
- Proyecto: ${proyecto.titulo}
${detallesIA ? `- Detalles del docente: ${detallesIA}` : ''}

Responde SOLO con la descripción, sin comillas ni texto adicional.`);
      const desc = text.trim().replace(/^["']|["']$/g, '');
      setDescripcion(desc);
    } catch (e: any) {
      setError('Error al generar descripción: ' + (e.message || 'Intenta de nuevo'));
    }
    setLoadingAI(false);
  }

  async function sugerirHerramientasIA() {
    if (!titulo.trim()) { setError('Escribe un título primero para sugerir herramientas'); return; }
    setLoadingAI(true);
    setError(null);
    try {
      const tipoLabel = TIPOS_ACTIVIDAD[tipoActividad]?.label || tipoActividad;
      const materiaLabel = materias.find(m => m.id === proyecto.materia_id)?.name || proyecto.materia_nombre;
      const text = await askAI(`Sugiere herramientas tecnológicas para una actividad escolar. Devuelve SOLO un JSON con este formato:
{"herramientas": ["Herramienta 1", "Herramienta 2", "Herramienta 3", "Herramienta 4", "Herramienta 5"]}

Contexto:
- Materia: ${materiaLabel}
- Tipo: ${tipoLabel}
- Título: ${titulo}
- Descripción: ${descripcion || 'No especificada'}
${detallesIA ? `- Detalles del docente: ${detallesIA}` : ''}

Incluye herramientas gratuitas y accesibles para estudiantes. Ejemplos: Google Docs, Canva, PowerPoint, Excel, Arduino, Scratch, Python, VS Code, Figma, etc. NO incluyas texto fuera del JSON.`);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Respuesta no válida');
      const resultado = JSON.parse(jsonMatch[0]);
      if (resultado.herramientas && Array.isArray(resultado.herramientas)) {
        const nuevasHerramientas = [...new Set([...herramientas, ...resultado.herramientas])];
        setHerramientas(nuevasHerramientas.slice(0, 10)); // Max 10 herramientas
      }
    } catch (e: any) {
      setError('Error al sugerir herramientas: ' + (e.message || 'Intenta de nuevo'));
    }
    setLoadingAI(false);
  }

  async function generarRubricaIA() {
    if (!titulo.trim()) { setError('Escribe un título primero para generar la rúbrica'); return; }
    setLoadingAI(true);
    setError(null);
    try {
      const tipoLabel = TIPOS_ACTIVIDAD[tipoActividad]?.label || tipoActividad;
      const materiaLabel = materias.find(m => m.id === proyecto.materia_id)?.name || proyecto.materia_nombre;
      const text = await askAI(`Genera una rúbrica de evaluación escolar con escala 1-5. Devuelve SOLO un JSON válido:
[
  {
    "descripcion": "Nombre del criterio",
    "peso": 15,
    "descripcion_nivel1": "Qué significa获得1 punto (deficiente)",
    "descripcion_nivel2": "Qué significa获得2 puntos (en desarrollo)",
    "descripcion_nivel3": "Qué significa获得3 puntos (cumple parcialmente)",
    "descripcion_nivel4": "Qué significa获得4 puntos (cumple)",
    "descripcion_nivel5": "Qué significa获得5 puntos (superó expectativas)"
  }
]

REGLAS IMPORTANTES:
- Genera ENTRE 6 Y 8 criterios
- El campo "peso" son los puntos que vale cada criterio (DEBEN SUMAR 100 EN TOTAL)
- Ejemplo: si son 6 criterios, pueden ser 15+15+20+15+20+15 = 100
- Las descripciones de cada nivel deben ser específicas y medibles
- Escala: 1=Deficiente, 2=En desarrollo, 3=Cumple parcialmente, 4=Cumple, 5=Superó expectativas

Contexto:
- Materia: ${materiaLabel}
- Tipo: ${tipoLabel}
- Título: ${titulo}
- Descripción: ${descripcion || 'No especificada'}
- Proyecto: ${proyecto.titulo}
${detallesIA ? `- Detalles del docente: ${detallesIA}` : ''}

Criterios sugeridos (incluye todos estos y otros relevantes):
1. Investigación y contenido
2. Creatividad e innovación
3. Calidad técnica / código / diseño
4. Presentación y comunicación
5. Uso de herramientas tecnológicas
6. Impacto y aplicabilidad
7. Trabajo en equipo (si aplica)
8. Cumplimiento de requisitos

NO incluyas texto fuera del JSON.`);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Respuesta no válida');
      const rubricaGenerada = JSON.parse(jsonMatch[0]) as CriterioRubrica[];
      
      // Validar que los pesos sumen 100
      const sumaPesos = rubricaGenerada.reduce((sum, c) => sum + (c.peso || 0), 0);
      if (sumaPesos !== 100) {
        // Ajustar proporcionalmente
        const factor = 100 / sumaPesos;
        rubricaGenerada.forEach(c => {
          c.peso = Math.round(c.peso * factor);
        });
        // Ajustar el último para que sume exacto 100
        const nuevaSuma = rubricaGenerada.reduce((sum, c) => sum + c.peso, 0);
        rubricaGenerada[rubricaGenerada.length - 1].peso += (100 - nuevaSuma);
      }
      
      setRubrica(rubricaGenerada.map(c => ({
        descripcion: c.descripcion,
        peso: String(c.peso),
        puntuacion_max: '5', // Escala 1-5
        descripcion_nivel1: c.descripcion_nivel1 || '',
        descripcion_nivel2: c.descripcion_nivel2 || '',
        descripcion_nivel3: c.descripcion_nivel3 || '',
        descripcion_nivel4: c.descripcion_nivel4 || '',
        descripcion_nivel5: c.descripcion_nivel5 || '',
      })));
    } catch (e: any) {
      setError('Error al generar rúbrica: ' + (e.message || 'Intenta de nuevo'));
    }
    setLoadingAI(false);
  }

  function addCriterio() {
    // Calcular cuánto falta para llegar a 100
    const sumaActual = rubrica.reduce((sum, c) => sum + (Number(c.peso) || 0), 0);
    const pesoDefault = Math.max(10, 100 - sumaActual); // Al menos 10 puntos
    setRubrica(prev => [...prev, { 
      descripcion: '', 
      peso: String(Math.min(pesoDefault, 100 - sumaActual)), 
      puntuacion_max: '5',
      descripcion_nivel1: '',
      descripcion_nivel2: '',
      descripcion_nivel3: '',
      descripcion_nivel4: '',
      descripcion_nivel5: '',
    }]);
  }

  function removeCriterio(idx: number) {
    setRubrica(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCriterio(idx: number, field: keyof CriterioForm, value: string) {
    setRubrica(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }

  function addHerramienta() {
    const h = herramientaInput.trim();
    if (h && !herramientas.includes(h)) {
      setHerramientas(prev => [...prev, h]);
      setHerramientaInput('');
    }
  }

  async function handleSubmit() {
    if (!titulo.trim()) { setError('El título de la actividad es requerido'); return; }
    if (!descripcion.trim()) { setError('La descripción es requerida'); return; }

    const rubricaData: CriterioRubrica[] = rubrica
      .filter(c => c.descripcion.trim())
      .map((c, i) => ({
        id: `crit_${Date.now()}_${i}`,
        descripcion: c.descripcion.trim(),
        peso: Number(c.peso) || 15,
        puntuacion_max: 5, // Siempre escala 1-5
        descripcion_nivel1: c.descripcion_nivel1?.trim() || null as any,
        descripcion_nivel2: c.descripcion_nivel2?.trim() || null as any,
        descripcion_nivel3: c.descripcion_nivel3?.trim() || null as any,
        descripcion_nivel4: c.descripcion_nivel4?.trim() || null as any,
        descripcion_nivel5: c.descripcion_nivel5?.trim() || null as any,
      }));

    if (rubricaData.length === 0) {
      setError('Agrega al menos un criterio de evaluación');
      return;
    }

    // Validar que los pesos sumen 100
    const sumaPesos = rubricaData.reduce((sum, c) => sum + c.peso, 0);
    if (sumaPesos !== 100) {
      setError(`Los pesos de los criterios deben sumar 100 puntos (actualmente suman ${sumaPesos})`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const materia = materias.find(m => m.id === proyecto.materia_id);
      const actividadData: Omit<ActividadEvaluadaType, 'id' | 'created_at' | 'updated_at'> = {
        proyecto_id: proyecto.id,
        materia_id: proyecto.materia_id,
        materia_nombre: materia?.name ?? proyecto.materia_nombre,
        docente_id: userProfile?.uid || '',
        docente_nombre: userProfile?.displayName || '',
        tipo_actividad: tipoActividad,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        instrucciones: instrucciones.trim() || null as any,
        herramientas_requeridas: herramientas,
        rubrica: rubricaData,
        fecha_asignacion: new Date().toISOString().slice(0, 10),
        fecha_limite: fechaLimite || null as any,
        estado: 'publicada',
      };

      if (actividadInicial?.id) {
        await updateActividadEvaluada(actividadInicial.id, proyecto.id, actividadData);
      } else {
        await createActividadEvaluada(proyecto.id, actividadData);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  // Filtrar tipos de actividad según la materia del proyecto
  const tiposFiltrados = Object.entries(TIPOS_ACTIVIDAD).filter(([_, info]) => {
    if (info.materias.includes('todas')) return true;
    if (info.materias.includes(proyecto.materia_id)) return true;
    // Si la materia del proyecto no está en la lista, mostrar todos
    return false;
  });
  // Si no hay tipos filtrados (materia no reconocida), mostrar todos
  const tiposAMostrar = tiposFiltrados.length > 0 ? tiposFiltrados : Object.entries(TIPOS_ACTIVIDAD);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">{actividadInicial ? 'Editar' : 'Crear'} Actividad Evaluada</h3>
            <p className="text-xs text-slate-400 mt-0.5">{proyecto.titulo}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="modal-body space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-xs rounded-xl px-3 py-2 border-l-2 border-red-300">
              {error}
            </div>
          )}

          {/* Tipo de actividad */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Tipo de actividad *
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {tiposAMostrar.map(([key, info]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipoActividad(key as TipoActividad)}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                    tipoActividad === key
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-base block">{info.icon}</span>
                  <span className="text-[9px] block mt-0.5">{info.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Título de la actividad *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ej: Reporte de investigación científica"
            />
          </div>

          {/* Detalles para IA - Solo docente */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
            <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">
              Detalles para generar con IA (opcional)
            </label>
            <textarea
              value={detallesIA}
              onChange={e => setDetallesIA(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[70px] resize-y bg-white"
              placeholder="Describe requisitos específicos, contexto del proyecto, nivel de los alumnos... La IA usará esto para generar descripción, instrucciones, rúbrica y herramientas."
            />
            <p className="text-[10px] text-indigo-500 mt-1">Este campo no se muestra a los alumnos, solo se usa para generar contenido con IA.</p>
          </div>

          {/* Descripción */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Descripción *
              </label>
              <button type="button" onClick={generarDescripcionIA} disabled={loadingAI || !titulo.trim()}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                {loadingAI ? (
                  <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Generar con IA
              </button>
            </div>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[80px] resize-y"
              placeholder="Describe brevemente la actividad..."
            />
          </div>

          {/* Instrucciones */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Instrucciones detalladas (opcional)
            </label>
            <textarea
              value={instrucciones}
              onChange={e => setInstrucciones(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200 min-h-[100px] resize-y"
              placeholder="Paso a paso, requisitos específicos, formato de entrega..."
            />
          </div>

          {/* Herramientas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Herramientas requeridas
              </label>
              <button type="button" onClick={sugerirHerramientasIA} disabled={loadingAI || !titulo.trim()}
                className="text-[10px] text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                {loadingAI ? (
                  <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3 h-3" />
                )}
                Sugerir con IA
              </button>
            </div>
            <div className="flex gap-2 relative">
              <input
                type="text"
                value={herramientaInput}
                onChange={e => {
                  setHerramientaInput(e.target.value);
                  setShowToolSuggestions(e.target.value.length > 0);
                }}
                onFocus={() => herramientaInput.length > 0 && setShowToolSuggestions(true)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addHerramienta();
                    setShowToolSuggestions(false);
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="Ej: Arduino, PowerPoint, Scratch"
              />
              <button type="button" onClick={addHerramienta}
                className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-medium hover:bg-slate-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
              {/* Suggestions dropdown */}
              {showToolSuggestions && herramientaInput.length > 0 && (
                <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {TOOL_SUGGESTIONS
                    .filter(t => t.toLowerCase().includes(herramientaInput.toLowerCase()) && !herramientas.includes(t))
                    .slice(0, 8)
                    .map(tool => (
                      <button
                        key={tool}
                        type="button"
                        onClick={() => {
                          if (!herramientas.includes(tool)) {
                            setHerramientas(prev => [...prev, tool]);
                          }
                          setHerramientaInput('');
                          setShowToolSuggestions(false);
                        }}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        {tool}
                      </button>
                    ))}
                  {TOOL_SUGGESTIONS.filter(t => t.toLowerCase().includes(herramientaInput.toLowerCase()) && !herramientas.includes(t)).length === 0 && (
                    <button
                      type="button"
                      onClick={() => { addHerramienta(); setShowToolSuggestions(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-purple-50 text-slate-500"
                    >
                      + Agregar "{herramientaInput}"
                    </button>
                  )}
                </div>
              )}
            </div>
            {herramientas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {herramientas.map(h => (
                  <span key={h} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    {h}
                    <button type="button" onClick={() => setHerramientas(prev => prev.filter(x => x !== h))}
                      className="text-purple-400 hover:text-purple-700">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Fecha límite */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Fecha límite (opcional)
            </label>
            <input
              type="date"
              value={fechaLimite}
              onChange={e => setFechaLimite(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Rúbrica */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Rúbrica de evaluación *
                </label>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  Escala 1-5 · Pesos deben sumar 100 puntos
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={generarRubricaIA} disabled={loadingAI || !titulo.trim()}
                  className="text-[10px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed">
                  {loadingAI ? (
                    <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Generar con IA
                </button>
                <button type="button" onClick={addCriterio}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              </div>
            </div>
            
            {/* Resumen de pesos */}
            <div className={`text-[10px] px-3 py-1.5 rounded-lg mb-2 font-medium ${
              rubrica.reduce((sum, c) => sum + (Number(c.peso) || 0), 0) === 100
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              Total: {rubrica.reduce((sum, c) => sum + (Number(c.peso) || 0), 0)} / 100 puntos
            </div>

            <div className="space-y-3">
              {rubrica.map((c, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 space-y-3 border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-slate-400 mt-1.5">{idx + 1}.</span>
                    <input
                      type="text"
                      value={c.descripcion}
                      onChange={e => updateCriterio(idx, 'descripcion', e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200"
                      placeholder="Nombre del criterio (ej: Investigación y contenido)"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={c.peso}
                        onChange={e => updateCriterio(idx, 'peso', e.target.value)}
                        className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 font-bold"
                        title="Puntos que vale este criterio (deben sumar 100)"
                      />
                      <span className="text-[9px] text-slate-400">pts</span>
                    </div>
                    {rubrica.length > 1 && (
                      <button type="button" onClick={() => removeCriterio(idx)}
                        className="text-slate-400 hover:text-red-500 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Descripción de niveles */}
                  <div className="grid grid-cols-5 gap-1.5 mt-2">
                    {[
                      { nivel: 1, label: '1 - Deficiente', color: 'red', field: 'descripcion_nivel1' },
                      { nivel: 2, label: '2 - En desarrollo', color: 'orange', field: 'descripcion_nivel2' },
                      { nivel: 3, label: '3 - Cumple parcial', color: 'amber', field: 'descripcion_nivel3' },
                      { nivel: 4, label: '4 - Cumple', color: 'emerald', field: 'descripcion_nivel4' },
                      { nivel: 5, label: '5 - Superó', color: 'green', field: 'descripcion_nivel5' },
                    ].map(n => (
                      <div key={n.nivel} className="text-center">
                        <div className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                          n.color === 'red' ? 'bg-red-100 text-red-700' :
                          n.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                          n.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                          n.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {n.label}
                        </div>
                        <textarea
                          value={(c as any)[n.field] || ''}
                          onChange={e => updateCriterio(idx, n.field as any, e.target.value)}
                          className="w-full px-1.5 py-1 text-[9px] border border-slate-200 rounded mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-200 resize-none h-16"
                          placeholder={`Qué significa获得${n.nivel} punto...`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            {loading ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            {loading ? 'Guardando...' : (actividadInicial ? 'Actualizar' : 'Crear Actividad')}
          </button>
        </div>
      </div>
    </div>
  );
}
