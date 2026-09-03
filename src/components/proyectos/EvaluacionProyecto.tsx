import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProyectos } from '../../hooks/useProyectos';
import { groqChat, isGroqAvailable } from '../../ai/providers/groq';
import { geminiChat, isGeminiAvailable } from '../../ai/providers/gemini';
import {
  Proyecto, ActividadEvaluada as ActividadEvaluadaType, CriterioRubrica,
  Subject, TipoActividad, TIPOS_ACTIVIDAD, ESCALA_CALIFICACION
} from '../../types';
import {
  getActividadesByProyecto, createActividadEvaluada,
  updateActividadEvaluada, calificarActividad, getAllSubjects
} from '../../lib/firestore';
import {
  X, Sparkles, Plus, Trash2, Check, ChevronRight, ChevronLeft,
  ClipboardCheck, AlertTriangle, Lock, ArrowLeft, FileText, Search,
  Microscope, FlaskConical, Presentation, Code2, Globe, BarChart3, Megaphone, Cpu, Box, ClipboardList, BookOpen, GraduationCap, Crown
} from 'lucide-react';

const ESTADO_PROYECTO: Record<string, string> = {
  borrador: 'Borrador',
  registrado: 'Registrado',
  en_revision_materia: 'En revisión',
  materia_validada: 'Validado',
  reclasificar: 'Reclasificar',
  en_coordinacion: 'En coordinación',
  aprobado_oficial: 'Aprobado',
  rechazado_materia: 'Rechazado',
  rechazado_oficial: 'Rechazado',
};

const ESTADO_COLOR: Record<string, string> = {
  borrador: 'bg-slate-100 text-slate-600',
  registrado: 'bg-blue-100 text-blue-700',
  en_revision_materia: 'bg-amber-100 text-amber-700',
  materia_validada: 'bg-emerald-100 text-emerald-700',
  reclasificar: 'bg-orange-100 text-orange-700',
  en_coordinacion: 'bg-purple-100 text-purple-700',
  aprobado_oficial: 'bg-emerald-100 text-emerald-700',
  rechazado_materia: 'bg-red-100 text-red-700',
  rechazado_oficial: 'bg-red-100 text-red-700',
};

const ICONOS_TIPO: Record<string, any> = {
  investigacion: Microscope,
  experimento: FlaskConical,
  presentacion: Presentation,
  codigo: Code2,
  sitio_web: Globe,
  excel: BarChart3,
  escrito: FileText,
  expo_feria: Megaphone,
  arduino: Cpu,
  poo: Box,
  otro: ClipboardList,
};

export default function EvaluacionProyecto({
  proyectoId, onBack
}: {
  proyectoId: string;
  onBack?: () => void;
}) {
  const nav = useNavigate();
  const back = onBack ?? (() => nav(-1));
  const { userProfile } = useAuth();
  const { proyectos } = useProyectos();
  const proyecto = proyectos.find(p => p.id === proyectoId);

  const [actividad, setActividad] = useState<ActividadEvaluadaType | null>(null);
  const [loading, setLoading] = useState(true);

  // Paso 1: metadatos de la actividad
  const [tipoActividad, setTipoActividad] = useState<TipoActividad>('investigacion');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [herramientas, setHerramientas] = useState<string[]>([]);
  const [herramientaInput, setHerramientaInput] = useState('');
  const [detallesIA, setDetallesIA] = useState('');

  // Rúbrica (pasos 1-3)
  const [rubrica, setRubrica] = useState<CriterioRubrica[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [evalIdx, setEvalIdx] = useState(0);

  // Paso 4: evaluación
  const [scores, setScores] = useState<Record<string, number>>({});
  const [obs, setObs] = useState('');

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [materias, setMaterias] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiListo = isGroqAvailable() || isGeminiAvailable();

  const initedRef = useRef(false);
  useEffect(() => {
    if (initedRef.current || !proyecto) return;
    initedRef.current = true;
    getAllSubjects().then(setMaterias).catch(console.error);
    getActividadesByProyecto(proyectoId).then(data => {
      const a = data[0];
      if (a) {
        setActividad(a);
        setTipoActividad(a.tipo_actividad);
        setTitulo(proyecto.titulo ?? a.titulo);
        setDescripcion(proyecto.descripcion ?? a.descripcion);
        setDetallesIA(proyecto.descripcion ?? '');
        setInstrucciones(a.instrucciones ?? '');
        setHerramientas(a.herramientas_requeridas ?? []);
        setRubrica(normalizarPuntos(a.rubrica ?? []));
        const map: Record<string, number> = {};
        (a.calificaciones_criterios || []).forEach(c => { map[c.criterio_id] = c.puntuacion; });
        setScores(map);
        setObs(a.observaciones_calificacion ?? '');
        setStep(a.rubrica?.length ? 2 : 1);
      } else {
        setTitulo(proyecto.titulo ?? '');
        setDescripcion(proyecto.descripcion ?? '');
        setDetallesIA(proyecto.descripcion ?? '');
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [proyectoId, proyecto]);

  const sumaPesos = rubrica.reduce((s, c) => s + (Number(c.peso) || 0), 0);
  const evalC = rubrica.length ? rubrica[Math.min(evalIdx, rubrica.length - 1)] : null;
  const step1Done = !!titulo.trim() && !!descripcion.trim();
  const step2Done = rubrica.length > 0;
  const canGoTo = (n: 1 | 2 | 3) =>
    n === 1 ? true : n === 2 ? step1Done : step2Done;

  async function askAI(prompt: string): Promise<string> {
    if (isGroqAvailable()) return await groqChat([{ role: 'user', content: prompt }]);
    if (isGeminiAvailable()) return await geminiChat([{ role: 'user', parts: [{ text: prompt }] }]);
    throw new Error('No hay proveedor de IA configurado. Agrega VITE_GROQ_API_KEY o VITE_GEMINI_API_KEY en .env');
  }

  async function generarDescripcionIA() {
    if (!titulo.trim()) { setError('Escribe un título primero'); return; }
    setLoadingAI(true); setError(null);
    try {
      const materiaLabel = materias.find(m => m.id === proyecto?.materia_id)?.name || proyecto?.materia_nombre || '';
      const text = await askAI(`Genera una descripción corta (máximo 200 caracteres) para una actividad escolar evaluada.
Contexto:
- Materia: ${materiaLabel}
- Tipo: ${TIPOS_ACTIVIDAD[tipoActividad]?.label || tipoActividad}
- Título: ${titulo}
${detallesIA ? `- Detalles: ${detallesIA}` : ''}
Responde SOLO con la descripción.`);
      setDescripcion(text.trim().replace(/^["']|["']$/g, ''));
    } catch (e: any) { setError('Error al generar descripción: ' + mensajeIA(e)); }
    setLoadingAI(false);
  }

  async function sugerirHerramientasIA() {
    if (!titulo.trim()) { setError('Escribe un título primero'); return; }
    setLoadingAI(true); setError(null);
    try {
      const materiaLabel = materias.find(m => m.id === proyecto?.materia_id)?.name || proyecto?.materia_nombre || '';
      const text = await askAI(`Sugiere herramientas tecnológicas. Devuelve SOLO JSON: {"herramientas": ["h1","h2"]}
Contexto: Materia: ${materiaLabel}, Tipo: ${TIPOS_ACTIVIDAD[tipoActividad]?.label}, Título: ${titulo}, Descripción: ${descripcion || 'No'}.
Incluye gratuitas. NO texto fuera del JSON.`);
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        const r = JSON.parse(m[0]);
        if (Array.isArray(r.herramientas)) setHerramientas([...new Set([...herramientas, ...r.herramientas])].slice(0, 10));
      }
    } catch (e: any) { setError('Error al sugerir herramientas: ' + mensajeIA(e)); }
    setLoadingAI(false);
  }

  async function generarRubricaIA() {
    if (!titulo.trim()) { setError('Escribe un título primero'); return; }
    setLoadingAI(true); setError(null);
    try {
      const materiaLabel = materias.find(m => m.id === proyecto?.materia_id)?.name || proyecto?.materia_nombre || '';
      const categoria = TIPOS_ACTIVIDAD[tipoActividad]?.label || tipoActividad;
      const comentarios = [descripcion, detallesIA].filter(Boolean).join('\n');
      const text = await askAI(`Genera una rúbrica de evaluación escolar escala 1-5. Devuelve SOLO JSON:
[
  {"descripcion":"Criterio","peso":15,"descripcion_nivel1":"1 punto","descripcion_nivel2":"2","descripcion_nivel3":"3","descripcion_nivel4":"4","descripcion_nivel5":"5"}
]
REGLAS: exactamente 8 criterios. Asigna a cada criterio un "peso" de 1 (baja importancia) a 5 (alta importancia) según su relevancia; el sistema convertirá esos pesos a puntos sobre 100 (la suma de los 8 criterios será 100). Escala de cada criterio: 1=Deficiente, 2=En desarrollo, 3=Cumple parcialmente, 4=Cumple, 5=Superó expectativas; el nivel 5 vale el puntaje completo del criterio y el nivel 1 el mínimo.
Categoría de la actividad (lo que el estudiante debe realizar): ${categoria}.
Debes crear criterios acordes a esa categoría y a lo que se espera que demuestre el estudiante.
Comentarios y contexto del docente:
"""
${comentarios || 'No especificados'}
"""
Proyecto: ${proyecto?.titulo ?? 'No especificado'}. Materia: ${materiaLabel}.
Criterios sugeridos: Investigación y contenido, Creatividad e innovación, Calidad técnica/código/diseño, Presentación y comunicación, Uso de herramientas, Impacto y aplicabilidad, Trabajo en equipo, Cumplimiento de requisitos.
NO incluyas texto fuera del JSON.`);
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('Respuesta no válida');
      const generada = JSON.parse(jsonMatch[0]) as CriterioRubrica[];
      setRubrica(normalizarPuntos(generada).map((c, i) => ({
        id: `crit_${Date.now()}_${i}`, descripcion: c.descripcion, peso: c.peso, puntuacion_max: 5,
        descripcion_nivel1: c.descripcion_nivel1 || '', descripcion_nivel2: c.descripcion_nivel2 || '',
        descripcion_nivel3: c.descripcion_nivel3 || '', descripcion_nivel4: c.descripcion_nivel4 || '',
        descripcion_nivel5: c.descripcion_nivel5 || '',
      })));
    } catch (e: any) { setError('Error al generar rúbrica: ' + mensajeIA(e)); }
    setLoadingAI(false);
  }

  const COEF_NIVEL = [0.125, 0.25, 0.375, 0.75, 1];
  function puntosNivel(peso: number, n: number): number {
    return (Number(peso) || 0) * (COEF_NIVEL[(n - 1)] ?? 1);
  }
  function fmtPts(x: number): string {
    const r = Math.round(x * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  }

  function normalizarPuntos(r: CriterioRubrica[]): CriterioRubrica[] {
    if (!r.length) return r;
    const pesos = r.map(c => Math.max(1, Number(c.peso) || 1));
    const suma = pesos.reduce((s, v) => s + v, 0);
    const f = 100 / suma;
    const out = r.map((c, i) => ({ ...c, peso: Math.max(1, Math.round(pesos[i] * f)) }));
    const nv = out.reduce((s, c) => s + (Number(c.peso) || 0), 0);
    out[0].peso = Math.max(1, (Number(out[0].peso) || 1) + (100 - nv));
    return out;
  }

  function mensajeIA(e: any): string {
    const msg = String(e?.message || '');
    if (/rate limit|429|too many requests/i.test(msg)) return 'La IA alcanzó su límite de uso. Espera unos segundos y vuelve a intentarlo.';
    if (/no está configurada|no hay proveedor|no configurado/i.test(msg)) return 'No hay proveedor de IA configurado.';
    return msg.slice(0, 220);
  }

  function addCriterio() {
    const peso = 10;
    setRubrica(prev => [...prev, {
      id: `crit_${Date.now()}_${prev.length}`, descripcion: '', peso, puntuacion_max: 5,
      descripcion_nivel1: '', descripcion_nivel2: '', descripcion_nivel3: '',
      descripcion_nivel4: '', descripcion_nivel5: '',
    }]);
  }
  function updateCriterio(idx: number, field: keyof CriterioRubrica, value: any) {
    setRubrica(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }
  function removeCriterio(idx: number) { setRubrica(prev => prev.filter((_, i) => i !== idx)); }
  function addHerramienta() {
    const h = herramientaInput.trim();
    if (h && !herramientas.includes(h)) { setHerramientas(prev => [...prev, h]); setHerramientaInput(''); }
  }

  async function guardarActividadYRubrica(): Promise<boolean> {
    if (!titulo.trim()) { setError('El título es requerido'); return false; }
    setSaving(true); setError(null);
    try {
      const materia = materias.find(m => m.id === proyecto?.materia_id);
      const data: Omit<ActividadEvaluadaType, 'id' | 'created_at' | 'updated_at'> = {
        proyecto_id: proyectoId,
        materia_id: proyecto?.materia_id || '',
        materia_nombre: materia?.name ?? proyecto?.materia_nombre ?? '',
        docente_id: userProfile?.uid || '',
        docente_nombre: userProfile?.displayName || '',
        tipo_actividad: tipoActividad,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        instrucciones: instrucciones.trim() || null as any,
        herramientas_requeridas: herramientas,
        rubrica,
        fecha_asignacion: new Date().toISOString().slice(0, 10),
        fecha_limite: null as any,
        estado: 'publicada',
      };
      if (actividad?.id) {
        await updateActividadEvaluada(actividad.id, proyectoId, { ...data, rubrica });
        setActividad({ ...actividad, ...data, rubrica });
      } else {
        const id = await createActividadEvaluada(proyectoId, data);
        setActividad({ id, ...data, rubrica, created_at: '', updated_at: '' });
      }
      return true;
    } catch (e: any) { setError('Error al guardar: ' + (e.message || '')); return false; }
    finally { setSaving(false); }
  }

  function calcTotal() {
    let total = 0;
    for (const c of rubrica) total += puntosNivel(c.peso, scores[c.id] || 3);
    return Math.round(total * 10) / 10;
  }
  function calcNota() { return Math.round(calcTotal() / 10 * 10) / 10; }

  async function handleCalificar() {
    if (!actividad?.id) return;
    setSaving(true); setError(null);
    try {
      const criterios = rubrica.map(c => ({ criterio_id: c.id, puntuacion: scores[c.id] || 3 }));
      await calificarActividad(actividad.id, proyectoId, calcTotal(), calcNota(), obs || undefined, criterios);
      back();
    } catch (e: any) { setError('Error al calificar: ' + (e.message || '')); }
    setSaving(false);
  }

  const steps = [
    { n: 1 as const, label: 'Actividad Evaluada' },
    { n: 2 as const, label: 'Rúbrica' },
    { n: 3 as const, label: 'Evaluación' },
  ];

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!proyecto) {
    return <div className="text-center py-16 text-slate-400">Proyecto no encontrado.<button onClick={back} className="block mx-auto mt-3 text-indigo-600">Volver</button></div>;
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* Header del proyecto */}
        <div className="card-crema p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-start justify-between gap-3">
            <button onClick={back} className="btn-secondary rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1.5 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 shrink-0">
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${ESTADO_COLOR[proyecto.estado] ?? 'bg-slate-100 text-slate-600'}`}>
              {ESTADO_PROYECTO[proyecto.estado] ?? proyecto.estado}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{proyecto.titulo}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold dark:bg-indigo-500/15 dark:text-indigo-300">
              <BookOpen className="w-3.5 h-3.5" /> {proyecto.materia_nombre}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold dark:bg-slate-700 dark:text-slate-300">
              <GraduationCap className="w-3.5 h-3.5" /> {proyecto.grado} {proyecto.seccion}
            </span>
          </div>

          {proyecto.descripcion && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{proyecto.descripcion}</p>
          )}

          {proyecto.integrantes_detalle && proyecto.integrantes_detalle.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Integrantes ({proyecto.integrantes_detalle.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {proyecto.integrantes_detalle.map((int, idx) => (
                  <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-700/40 dark:border-slate-600">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {int.numero_lista || idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{int.nombre}</span>
                    {int.es_rep && <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase"><Crown className="w-3 h-3" /> Líder</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs rounded-xl px-3 py-2 border-l-2 border-red-300">{error}</div>
        )}

        {/* Stepper */}
        <div className="card-crema p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center">
            {steps.map((s, i) => {
              const active = step === s.n;
              const done = (s.n === 1 && step1Done) || (s.n < step);
              const locked = !canGoTo(s.n);
              return (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <button type="button" disabled={locked} onClick={() => !locked && setStep(s.n)}
                    className="flex flex-col items-center gap-1">
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      active ? 'bg-primary text-white ring-4 ring-primary/20'
                        : done ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}>
                      {locked ? <Lock className="w-4 h-4" /> : done && !active ? <Check className="w-4 h-4" /> : s.n}
                    </span>
                    <span className={`text-[10px] font-semibold text-center max-w-[80px] leading-tight ${active ? 'text-primary' : 'text-slate-400'}`}>{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full ${step > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenido del paso */}
        <div className="card-crema p-6 dark:border-slate-700 dark:bg-slate-800">
          {step === 1 && (
            <StepActividad
              proyecto={proyecto}
              tipoActividad={tipoActividad} setTipoActividad={setTipoActividad}
              titulo={titulo} setTitulo={setTitulo}
              descripcion={descripcion} setDescripcion={setDescripcion}
              instrucciones={instrucciones} setInstrucciones={setInstrucciones}
              herramientas={herramientas} setHerramientas={setHerramientas}
              herramientaInput={herramientaInput} setHerramientaInput={setHerramientaInput}
              detallesIA={detallesIA} setDetallesIA={setDetallesIA}
              loadingAI={loadingAI}
              onGenerarDescripcion={generarDescripcionIA}
              onSugerirHerramientas={sugerirHerramientasIA}
            />
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800">Generar rúbrica de evaluación</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Se genera con IA según la categoría y los comentarios del paso 1. Luego revisa cada criterio.
                </p>
              </div>

              <button type="button" onClick={generarRubricaIA} disabled={loadingAI || !aiListo}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {loadingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generar rúbrica con IA
              </button>
              {!aiListo && (
                <p className="text-[11px] text-amber-600 text-center">
                  IA no configurada. Agrega <code className="font-mono">VITE_GROQ_API_KEY</code> o <code className="font-mono">VITE_GEMINI_API_KEY</code> en <code className="font-mono">.env</code> para usar generación automática.
                </p>
              )}

              {rubrica.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-2">Aún no hay rúbrica generada.</p>
              ) : (
                (() => {
                  const idx = Math.min(reviewIdx, rubrica.length - 1);
                  const c: any = rubrica[idx];
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium ${sumaPesos === 100 ? 'text-slate-400' : 'text-amber-600'}`}>Criterio {idx + 1} de {rubrica.length} · Puntos asignados: {sumaPesos} / 100</span>
                        <button type="button" onClick={addCriterio} className="text-xs text-indigo-600 font-semibold flex items-center gap-1"><Plus className="w-3 h-3" /> Agregar</button>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 dark:bg-slate-700/40">
                        <div className="flex items-start gap-2">
                          <input value={c.descripcion} onChange={e => updateCriterio(idx, 'descripcion', e.target.value)}
                            className="flex-1 px-3 py-2 text-sm font-semibold border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Criterio" />
                          <button type="button" onClick={() => { removeCriterio(idx); setReviewIdx(i => Math.max(0, i - 1)); }}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Descripción por nivel (de N1 a N5 · puntos de este criterio)</div>
                          <div className="space-y-2">
                            {[1, 2, 3, 4, 5].map(l => (
                              <div key={l} className="flex items-start gap-2">
                                <div className="w-14 shrink-0 mt-1.5 text-center">
                                  <div className="text-xs font-extrabold text-slate-500">N{l}</div>
                                  <div className="text-[10px] text-slate-400">{fmtPts(puntosNivel(c.peso, l))} pts</div>
                                </div>
                                <textarea value={c['descripcion_nivel' + l] || ''} onChange={e => updateCriterio(idx, ('descripcion_nivel' + l) as any, e.target.value)}
                                  rows={2} className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 resize-none" placeholder={`Qué significa el nivel ${l}`} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs font-semibold text-slate-600">Puntos del criterio (sobre 100)</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateCriterio(idx, 'peso', Math.max(1, (Number(c.peso) || 1) - 1))}
                              className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 flex items-center justify-center">−</button>
                            <span className="w-10 text-center text-lg font-extrabold text-slate-800">{Number(c.peso) || 1}</span>
                            <button type="button" onClick={() => updateCriterio(idx, 'peso', (Number(c.peso) || 1) + 1)}
                              className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 font-bold hover:bg-slate-300 flex items-center justify-center">+</button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 dark:bg-slate-700/60">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sumatoria de puntos (pesos)</span>
                        <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{sumaPesos}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <button type="button" disabled={idx === 0} onClick={() => setReviewIdx(i => i - 1)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Anterior</button>
                        <span className="text-xs font-semibold text-slate-400">{idx + 1} / {rubrica.length}</span>
                        <button type="button" disabled={idx >= rubrica.length - 1} onClick={() => setReviewIdx(i => i + 1)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 flex items-center gap-1">Siguiente <ChevronRight className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}

          {step === 3 && !evalC ? (
            <p className="text-xs text-slate-400 text-center py-2">Aún no hay rúbrica generada.</p>
          ) : step === 3 && evalC && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-800">Califica el criterio</h4>
                <span className="text-xs font-semibold text-slate-400">{evalIdx + 1} / {rubrica.length}</span>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3 dark:bg-slate-700/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{evalIdx + 1}</span>
                    <span className="text-sm font-bold text-slate-800">{evalC.descripcion}</span>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">Puntos {evalC.peso}</span>
                </div>

                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(l => {
                    const sel = (scores[evalC.id] || 0) === l;
                    return (
                        <button key={l} type="button" onClick={() => setScores({ ...scores, [evalC.id]: l })}
                        className={`w-full text-left rounded-xl p-3 border transition-all ${
                          sel ? `${ESCALA_CALIFICACION[l].color} ring-2 ring-primary/30 border-transparent` : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-extrabold text-slate-700">N{l} · {ESCALA_CALIFICACION[l].label}</span>
                          <span className="text-xs font-bold text-slate-500">{fmtPts(puntosNivel(evalC.peso, l))} pts</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-snug">{evalC['descripcion_nivel' + l] || '—'}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 dark:bg-slate-700/60">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Puntaje de este criterio</span>
                  <span className="text-base font-extrabold text-slate-800 dark:text-slate-100">{(scores[evalC.id] || 0) ? fmtPts(puntosNivel(evalC.peso, scores[evalC.id] || 0)) : '—'} / {evalC.peso} pts</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button type="button" disabled={evalIdx === 0} onClick={() => setEvalIdx(i => i - 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 flex items-center gap-1">Anterior</button>
                <button type="button" disabled={evalIdx >= rubrica.length - 1} onClick={() => setEvalIdx(i => i + 1)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl disabled:opacity-40 flex items-center gap-1">Siguiente</button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">Observaciones (opcional)</label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="Comentarios sobre la evaluación..." />
              </div>
              <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-500">Total</span>
                <span className="font-bold text-slate-900">{calcTotal()} / 100 <span className="text-slate-400 mx-1">·</span>
                  <span className="text-primary font-extrabold">{calcNota()} / 10</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Footer de navegación */}
        <div className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1 dark:text-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:hover:bg-slate-600">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 1 && (
              <button type="button" disabled={!step1Done || saving} onClick={async () => { if (await guardarActividadYRubrica()) setStep(2); }}
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button type="button" disabled={!step2Done || saving} onClick={async () => { if (await guardarActividadYRubrica()) { setEvalIdx(0); setStep(3); } }}
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button type="button" disabled={saving} onClick={handleCalificar}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1.5">
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                Calificar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- Paso 1: Actividad Evaluada -------- */
function StepActividad({ proyecto, tipoActividad, setTipoActividad, titulo, setTitulo, descripcion, setDescripcion, instrucciones, setInstrucciones, herramientas, setHerramientas, herramientaInput, setHerramientaInput, detallesIA, setDetallesIA, loadingAI, onGenerarDescripcion, onSugerirHerramientas }: any) {
  const tipos = Object.entries(TIPOS_ACTIVIDAD);
  const aiListo = isGroqAvailable() || isGeminiAvailable();
  function updateH(h: string, val: string) { setHerramientas((prev: string[]) => prev.map(x => x === h ? val : x)); }
  function removeH(h: string) { setHerramientas((prev: string[]) => prev.filter(x => x !== h)); }
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-[11px] text-slate-500 dark:bg-slate-700/40">
        Clasifica el proyecto para generar la rúbrica con IA. Materia: <b>{proyecto.materia_nombre}</b> · Grado: <b>{proyecto.grado} {proyecto.seccion}</b>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Tipo de actividad *</label>
        <div className="grid grid-cols-3 gap-1.5">
          {tipos.map(([key, info]) => {
            const Icon = ICONOS_TIPO[key] || ClipboardList;
            return (
              <button key={key} type="button" onClick={() => setTipoActividad(key as TipoActividad)}
                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${tipoActividad === key ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] block leading-tight">{info.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Título *</label>
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
          className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Título de la actividad" />
      </div>

      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
        <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block mb-1">Detalles para IA (opcional)</label>
        <textarea value={detallesIA} onChange={e => setDetallesIA(e.target.value)} rows={2}
          className="w-full px-3 py-2 text-sm border border-indigo-200 rounded-lg bg-white min-h-[60px] resize-y focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Contexto, nivel de alumnos, requisitos..." />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción *</label>
          <button type="button" onClick={onGenerarDescripcion} disabled={loadingAI || !titulo.trim() || !aiListo}
            className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 disabled:opacity-40">
            {loadingAI ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />} Generar con IA
          </button>
        </div>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y" placeholder="Describe la actividad..." />
        {!aiListo && (
          <p className="text-[10px] text-amber-600 mt-1">IA no configurada: agrega VITE_GROQ_API_KEY o VITE_GEMINI_API_KEY en .env para generar con IA.</p>
        )}
      </div>

      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Instrucciones (opcional)</label>
        <textarea value={instrucciones} onChange={e => setInstrucciones(e.target.value)} rows={2}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-y" placeholder="Paso a paso, formato de entrega..." />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Herramientas</label>
          <button type="button" onClick={onSugerirHerramientas} disabled={loadingAI || !titulo.trim() || !aiListo}
            className="text-[10px] text-purple-600 font-medium flex items-center gap-1 disabled:opacity-40">
            {loadingAI ? <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />} Sugerir con IA
          </button>
        </div>
        <div className="flex gap-2">
          <input type="text" value={herramientaInput} onChange={e => setHerramientaInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); const h = herramientaInput.trim(); if (h && !herramientas.includes(h)) { setHerramientas([...herramientas, h]); setHerramientaInput(''); } } }}
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200" placeholder="Ej: Arduino, PowerPoint" />
          <button type="button" onClick={() => { const h = herramientaInput.trim(); if (h && !herramientas.includes(h)) { setHerramientas([...herramientas, h]); setHerramientaInput(''); } }}
            className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-medium hover:bg-slate-200"><Plus className="w-4 h-4" /></button>
        </div>
        {herramientas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {herramientas.map(h => (
              <span key={h} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                {h}
                <button type="button" onClick={() => removeH(h)} className="text-purple-400 hover:text-purple-700"><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------- Editor de criterios reutilizable -------- */
function RubricaEditor({ rubrica, onChange, onUpdate, onRemove }: {
  rubrica: CriterioRubrica[];
  onChange: (c: CriterioRubrica[]) => void;
  onUpdate: (idx: number, field: keyof CriterioRubrica, value: any) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      {rubrica.map((c, idx) => (
        <div key={c.id} className="bg-white rounded-xl p-3 space-y-2 border border-slate-200 shadow-sm">
          <div className="flex items-start gap-2">
            <span className="text-xs font-bold text-slate-400 mt-2">{idx + 1}.</span>
            <input type="text" value={c.descripcion} onChange={e => onUpdate(idx, 'descripcion', e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200" placeholder="Nombre del criterio" />
            <div className="flex items-center gap-1">
              <input type="number" min={1} max={100} value={c.peso} onChange={e => onUpdate(idx, 'peso', Number(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg font-bold focus:outline-none focus:ring-1 focus:ring-indigo-200" title="Puntos (suman 100)" />
              <span className="text-[9px] text-slate-400">pts</span>
            </div>
            {rubrica.length > 1 && (
              <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { nivel: 1, field: 'descripcion_nivel1' as const },
              { nivel: 2, field: 'descripcion_nivel2' as const },
              { nivel: 3, field: 'descripcion_nivel3' as const },
              { nivel: 4, field: 'descripcion_nivel4' as const },
              { nivel: 5, field: 'descripcion_nivel5' as const },
            ].map(n => (
              <div key={n.nivel} className="text-center">
                <div className="text-[8px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500">{n.nivel}</div>
                <textarea value={(c as any)[n.field] || ''} onChange={e => onUpdate(idx, n.field, e.target.value)}
                  className="w-full px-1.5 py-1 text-[9px] border border-slate-200 rounded mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-200 resize-none h-14" placeholder={`Nivel ${n.nivel}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
