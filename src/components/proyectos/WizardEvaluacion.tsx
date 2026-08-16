import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { groqChat, isGroqAvailable } from '../../ai/providers/groq';
import { geminiChat, isGeminiAvailable } from '../../ai/providers/gemini';
import { mensajeIA } from '../../ai';
import {
  Proyecto, ActividadEvaluada as ActividadEvaluadaType, CriterioRubrica,
  Subject, TIPOS_ACTIVIDAD, ESCALA_CALIFICACION
} from '../../types';
import { updateActividadEvaluada, calificarActividad, getAllSubjects } from '../../lib/firestore';
import {
  X, Sparkles, Plus, Trash2, Check, ChevronRight, ChevronLeft,
  ClipboardCheck, AlertTriangle, Lock, FileText
} from 'lucide-react';

export default function WizardEvaluacion({
  actividad, onClose, onSaved
}: {
  actividad: ActividadEvaluadaType & { proyecto?: Proyecto };
  onClose: () => void;
  onSaved: () => void;
}) {
  const { userProfile } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(actividad.rubrica?.length ? 2 : 1);
  const [rubrica, setRubrica] = useState<CriterioRubrica[]>(actividad.rubrica ?? []);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    (actividad.calificaciones_criterios || []).forEach(c => { map[c.criterio_id] = c.puntuacion; });
    return map;
  });
  const [obs, setObs] = useState(actividad.observaciones_calificacion ?? '');
  const [materias, setMaterias] = useState<Subject[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRubrica, setSavedRubrica] = useState(false);

  useEffect(() => { getAllSubjects().then(setMaterias).catch(console.error); }, []);

  const sumaPesos = rubrica.reduce((s, c) => s + (Number(c.peso) || 0), 0);
  const step1Done = rubrica.length > 0;
  const step2Done = sumaPesos === 100;
  const canGoTo = (n: 1 | 2 | 3) =>
    n === 1 ? true : n === 2 ? step1Done : step1Done && step2Done;

  async function askAI(prompt: string): Promise<string> {
    if (isGroqAvailable()) return await groqChat([{ role: 'user', content: prompt }]);
    if (isGeminiAvailable()) return await geminiChat([{ role: 'user', parts: [{ text: prompt }] }]);
    throw new Error('No hay proveedor de IA configurado. Agrega VITE_GROQ_API_KEY o VITE_GEMINI_API_KEY en .env');
  }

  async function generarRubricaIA() {
    if (!actividad.titulo.trim()) { setError('Escribe un título para generar la rúbrica'); return; }
    setLoadingAI(true); setError(null);
    try {
      const tipoLabel = TIPOS_ACTIVIDAD[actividad.tipo_actividad]?.label || actividad.tipo_actividad;
      const materiaLabel = materias.find(m => m.id === actividad.materia_id)?.name || actividad.materia_nombre;
      const text = await askAI(`Genera una rúbrica de evaluación escolar con escala 1-5. Devuelve SOLO un JSON válido:
[
  {
    "descripcion": "Nombre del criterio",
    "peso": 15,
    "descripcion_nivel1": "Qué significa 1 punto (deficiente)",
    "descripcion_nivel2": "Qué significa 2 puntos (en desarrollo)",
    "descripcion_nivel3": "Qué significa 3 puntos (cumple parcialmente)",
    "descripcion_nivel4": "Qué significa 4 puntos (cumple)",
    "descripcion_nivel5": "Qué significa 5 puntos (superó expectativas)"
  }
]

REGLAS IMPORTANTES:
- Genera ENTRE 6 Y 8 criterios
- El campo "peso" son los puntos que vale cada criterio (DEBEN SUMAR 100 EN TOTAL)
- Escala: 1=Deficiente, 2=En desarrollo, 3=Cumple parcialmente, 4=Cumple, 5=Superó expectativas

Contexto:
- Materia: ${materiaLabel}
- Tipo: ${tipoLabel}
- Título: ${actividad.titulo}
- Descripción: ${actividad.descripcion || 'No especificada'}
- Proyecto: ${actividad.proyecto?.titulo ?? 'No especificado'}

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
      const generada = JSON.parse(jsonMatch[0]) as CriterioRubrica[];
      const suma = generada.reduce((s, c) => s + (c.peso || 0), 0);
      if (suma !== 100) {
        const factor = 100 / suma;
        generada.forEach(c => { c.peso = Math.round(c.peso * factor); });
        const nueva = generada.reduce((s, c) => s + c.peso, 0);
        generada[generada.length - 1].peso += (100 - nueva);
      }
      setRubrica(generada.map((c, i) => ({
        id: `crit_${Date.now()}_${i}`,
        descripcion: c.descripcion,
        peso: c.peso,
        puntuacion_max: 5,
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
    const peso = Math.max(5, 100 - sumaPesos);
    setRubrica(prev => [...prev, {
      id: `crit_${Date.now()}_${prev.length}`,
      descripcion: '', peso, puntuacion_max: 5,
      descripcion_nivel1: '', descripcion_nivel2: '', descripcion_nivel3: '',
      descripcion_nivel4: '', descripcion_nivel5: '',
    }]);
  }
  function updateCriterio(idx: number, field: keyof CriterioRubrica, value: any) {
    setRubrica(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  }
  function removeCriterio(idx: number) {
    setRubrica(prev => prev.filter((_, i) => i !== idx));
  }

  async function guardarRubrica(): Promise<boolean> {
    setSaving(true); setError(null);
    try {
      await updateActividadEvaluada(actividad.id, actividad.proyecto_id, { rubrica });
      setSavedRubrica(true);
      return true;
    } catch (e: any) {
      setError('Error al guardar la rúbrica: ' + (e.message || 'Intenta de nuevo'));
      return false;
    } finally { setSaving(false); }
  }

  function calcTotal() {
    let total = 0;
    for (const c of rubrica) {
      const score = scores[c.id] || 3;
      total += (c.peso / 5) * score;
    }
    return Math.round(total * 10) / 10;
  }
  function calcNota() { return Math.round(calcTotal() / 10 * 10) / 10; }

  async function handleCalificar() {
    setSaving(true); setError(null);
    try {
      const criterios = rubrica.map(c => ({ criterio_id: c.id, puntuacion: scores[c.id] || 3 }));
      await calificarActividad(actividad.id, actividad.proyecto_id, calcTotal(), calcNota(), obs || undefined, criterios);
      onSaved();
    } catch (e: any) {
      setError('Error al calificar: ' + (e.message || 'Intenta de nuevo'));
    }
    setSaving(false);
  }

  const steps = [
    { n: 1 as const, label: 'Revisión y asignación' },
    { n: 2 as const, label: 'Criterios de evaluación' },
    { n: 3 as const, label: 'La evaluación' },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header shrink-0">
          <div>
            <h3 className="modal-title">Evaluar Actividad</h3>
            <p className="text-xs text-slate-400 mt-0.5">{actividad.titulo}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>

        {/* Stepper */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center">
            {steps.map((s, i) => {
              const active = step === s.n;
              const done = (s.n === 1 && step1Done) || (s.n === 2 && step2Done) || (s.n < step);
              const locked = !canGoTo(s.n);
              return (
                <div key={s.n} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setStep(s.n)}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      active ? 'bg-primary text-white ring-4 ring-primary/20'
                        : done ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'}`}>
                      {locked ? <Lock className="w-4 h-4" /> : done && !active ? <Check className="w-4 h-4" /> : s.n}
                    </span>
                    <span className={`text-[9px] font-semibold text-center max-w-[80px] leading-tight ${
                      active ? 'text-primary' : 'text-slate-400'
                    }`}>{s.label}</span>
                  </button>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded-full ${step > s.n ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mx-6 mb-2 bg-red-50 text-red-700 text-xs rounded-xl px-3 py-2 border-l-2 border-red-300">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {step === 1 && (
            <StepRevision
              actividad={actividad}
              rubrica={rubrica}
              loadingAI={loadingAI}
              onGenerarIA={generarRubricaIA}
              onAdd={addCriterio}
              onChange={setRubrica}
              onUpdate={updateCriterio}
              onRemove={removeCriterio}
            />
          )}

          {step === 2 && (
            <StepCriterios
              rubrica={rubrica}
              sumaPesos={sumaPesos}
              onAdd={addCriterio}
              onChange={setRubrica}
              onUpdate={updateCriterio}
              onRemove={removeCriterio}
            />
          )}

          {step === 3 && (
            <StepEvaluacion
              rubrica={rubrica}
              scores={scores}
              setScores={setScores}
              obs={obs}
              setObs={setObs}
              calcTotal={calcTotal}
              calcNota={calcNota}
            />
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer shrink-0">
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button type="button" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step === 1 && (
              <button type="button" disabled={!step1Done || saving}
                onClick={async () => { if (await guardarRubrica()) setStep(2); }}
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <button type="button" disabled={!step2Done || saving}
                onClick={async () => { if (await guardarRubrica()) setStep(3); }}
                className="px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                Continuar <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 3 && (
              <button type="button" disabled={saving}
                onClick={handleCalificar}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
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

/* ---------------- Paso 1: Revisión y asignación ---------------- */
function StepRevision({ actividad, rubrica, loadingAI, onGenerarIA, onAdd, onChange, onUpdate, onRemove }: {
  actividad: ActividadEvaluadaType & { proyecto?: Proyecto };
  rubrica: CriterioRubrica[];
  loadingAI: boolean;
  onGenerarIA: () => void;
  onAdd: () => void;
  onChange: (c: CriterioRubrica[]) => void;
  onUpdate: (idx: number, field: keyof CriterioRubrica, value: any) => void;
  onRemove: (idx: number) => void;
}) {
  const tipoInfo = TIPOS_ACTIVIDAD[actividad.tipo_actividad] ?? TIPOS_ACTIVIDAD.otro;
  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{tipoInfo.icon}</span>
          <span className="text-sm font-bold text-slate-800">{actividad.titulo}</span>
        </div>
        <div className="text-[11px] text-slate-500">{actividad.materia_nombre} · {tipoInfo.label}</div>
        {actividad.descripcion && <p className="text-xs text-slate-600 leading-relaxed">{actividad.descripcion}</p>}
        {actividad.herramientas_requeridas?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {actividad.herramientas_requeridas.map(h => (
              <span key={h} className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">{h}</span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Rúbrica de evaluación</h4>
          <p className="text-[10px] text-slate-400">Asigna o genera la rúbrica con IA. Escala 1-5.</p>
        </div>
        <button type="button" onClick={onGenerarIA} disabled={loadingAI}
          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-40">
          {loadingAI ? <div className="w-3 h-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Generar con IA
        </button>
      </div>

      {rubrica.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
          <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-xs">Aún no hay rúbrica asignada</p>
          <button type="button" onClick={onAdd}
            className="mt-2 text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1">
            <Plus className="w-3 h-3" /> Agregar criterio manual
          </button>
        </div>
      ) : (
        <RubricaEditor rubrica={rubrica} onChange={onChange} onUpdate={onUpdate} onRemove={onRemove} />
      )}
    </div>
  );
}

/* ---------------- Paso 2: Criterios de evaluación ---------------- */
function StepCriterios({ rubrica, sumaPesos, onAdd, onChange, onUpdate, onRemove }: {
  rubrica: CriterioRubrica[];
  sumaPesos: number;
  onAdd: () => void;
  onChange: (c: CriterioRubrica[]) => void;
  onUpdate: (idx: number, field: keyof CriterioRubrica, value: any) => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Criterios de evaluación</h4>
          <p className="text-[10px] text-slate-400">Revisa y corrige. Los pesos deben sumar 100.</p>
        </div>
        <button type="button" onClick={onAdd}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1">
          <Plus className="w-3 h-3" /> Agregar
        </button>
      </div>

      <div className={`text-[11px] px-3 py-1.5 rounded-lg font-medium ${
        sumaPesos === 100 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        Total: {sumaPesos} / 100 puntos
        {sumaPesos !== 100 && <span className="ml-1">(ajusta para continuar)</span>}
      </div>

      <RubricaEditor rubrica={rubrica} onChange={onChange} onUpdate={onUpdate} onRemove={onRemove} />
    </div>
  );
}

/* ---------------- Paso 3: La evaluación ---------------- */
function StepEvaluacion({ rubrica, scores, setScores, obs, setObs, calcTotal, calcNota }: {
  rubrica: CriterioRubrica[];
  scores: Record<string, number>;
  setScores: (s: Record<string, number>) => void;
  obs: string;
  setObs: (v: string) => void;
  calcTotal: () => number;
  calcNota: () => number;
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-slate-800">Califica según la rúbrica</h4>
      <div className="space-y-3">
        {rubrica.map((c, idx) => {
          const score = scores[c.id] || 3;
          const pts = Math.round((c.peso / 5) * score * 10) / 10;
          return (
            <div key={c.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                  <span className="text-sm font-bold text-slate-800">{c.descripcion}</span>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{c.peso} pts</span>
              </div>
              <div className="flex gap-2 mb-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setScores({ ...scores, [c.id]: n })}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                      score === n ? `${ESCALA_CALIFICACION[n].color} ring-2 ring-primary/30`
                        : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`${ESCALA_CALIFICACION[score].color} px-2 py-0.5 rounded-lg font-medium`}>
                  {ESCALA_CALIFICACION[score].label}
                </span>
                <span className="font-bold text-slate-600">{pts} / {c.peso} pts</span>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <label className="text-xs font-bold text-slate-600 mb-1 block">Observaciones (opcional)</label>
        <textarea value={obs} onChange={e => setObs(e.target.value)}
          placeholder="Comentarios sobre la evaluación..."
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          rows={2} />
      </div>

      <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
        <span className="text-sm text-slate-500">Total</span>
        <span className="font-bold text-slate-900">{calcTotal()} / 100 <span className="text-slate-400 mx-1">·</span>
          <span className="text-primary font-extrabold">{calcNota()} / 10</span></span>
      </div>
    </div>
  );
}

/* ---------------- Editor reutilizable de criterios ---------------- */
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
            <input type="text" value={c.descripcion}
              onChange={e => onUpdate(idx, 'descripcion', e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200"
              placeholder="Nombre del criterio" />
            <div className="flex items-center gap-1">
              <input type="number" min={1} max={100} value={c.peso}
                onChange={e => onUpdate(idx, 'peso', Number(e.target.value) || 0)}
                className="w-16 px-2 py-1.5 text-xs text-center border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-200 font-bold"
                title="Puntos (deben sumar 100)" />
              <span className="text-[9px] text-slate-400">pts</span>
            </div>
            {rubrica.length > 1 && (
              <button type="button" onClick={() => onRemove(idx)} className="text-slate-400 hover:text-red-500 p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { nivel: 1, label: '1', field: 'descripcion_nivel1' as const },
              { nivel: 2, label: '2', field: 'descripcion_nivel2' as const },
              { nivel: 3, label: '3', field: 'descripcion_nivel3' as const },
              { nivel: 4, label: '4', field: 'descripcion_nivel4' as const },
              { nivel: 5, label: '5', field: 'descripcion_nivel5' as const },
            ].map(n => (
              <div key={n.nivel} className="text-center">
                <div className="text-[8px] font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-500">{n.label}</div>
                <textarea value={(c as any)[n.field] || ''}
                  onChange={e => onUpdate(idx, n.field, e.target.value)}
                  className="w-full px-1.5 py-1 text-[9px] border border-slate-200 rounded mt-1 focus:outline-none focus:ring-1 focus:ring-indigo-200 resize-none h-14"
                  placeholder={`Nivel ${n.nivel}...`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
