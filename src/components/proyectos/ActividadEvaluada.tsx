import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groqChat, isGroqAvailable } from '../../ai/providers/groq';
import { geminiChat, isGeminiAvailable } from '../../ai/providers/gemini';
import { mensajeIA } from '../../ai';
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
import WizardEvaluacion from './WizardEvaluacion';

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
  const [actividadWizard, setActividadWizard] = useState<ActividadEvaluadaType | null>(null);

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
                  onRubrica={() => setActividadWizard(a)}
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

      {/* Asistente de evaluación (3 pasos) */}
      {actividadWizard && (
        <WizardEvaluacion
          actividad={actividadWizard}
          onClose={() => setActividadWizard(null)}
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

function ActividadCard({ actividad, onEditar, onRubrica, onReset }: {
  actividad: ActividadEvaluadaType & { proyecto?: Proyecto }; onEditar: () => void; onRubrica: () => void; onReset: () => void;
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
          <button
            onClick={onRubrica}
            className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1"
          >
            <ClipboardCheck className="w-3 h-3" /> Rúbrica
          </button>
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
      setError('Error al generar descripción: ' + mensajeIA(e));
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
      setError('Error al sugerir herramientas: ' + mensajeIA(e));
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
      setError('Error al generar rúbrica: ' + mensajeIA(e));
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
        rubrica: actividadInicial?.rubrica ?? [],
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
