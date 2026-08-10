import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import { Proyecto, SugerenciaOpcion, ComplementoInformatica } from '../../types';
import { Computer, PenLine, CheckCircle2 } from 'lucide-react';

interface Props {
  proyecto: Proyecto;
  onAsignado: () => void;
}

const TIPO_INFO: Record<string, { label: string; icon: string; color: string }> = {
  presentacion: { label: 'Presentación', icon: '📊', color: 'text-blue-700 bg-blue-100' },
  dashboard:    { label: 'Dashboard',    icon: '📈', color: 'text-emerald-700 bg-emerald-100' },
  app:          { label: 'Aplicación',   icon: '📱', color: 'text-purple-700 bg-purple-100' },
};

export default function SugerenciaInformatica({ proyecto, onAsignado }: Props) {
  const [opciones, setOpciones] = useState<SugerenciaOpcion[]>(proyecto.sugerencias_informatica ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [modoManual, setModoManual] = useState(false);

  const [manual, setManual] = useState({ tipo: 'presentacion', titulo: '', descripcion: '', alcance: '' });
  const [guardando, setGuardando] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const yaAsignado = !!proyecto.complemento_informatica;

  async function generarSugerencias() {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable(functions, 'sugerirComplementoInformatica');
      const res = await fn({ proyectoId: proyecto.id });
      const data = res.data as { opciones: SugerenciaOpcion[] };
      setOpciones(data.opciones);
    } catch (e: any) {
      setError(e.message ?? 'Error al generar sugerencias. Intenta de nuevo.');
    }
    setLoading(false);
  }

  async function asignar(opcion: SugerenciaOpcion | null) {
    setGuardando(true);
    setFeedback(null);
    try {
      const complemento: ComplementoInformatica = opcion
        ? { ...opcion, es_personalizado: false }
        : { ...manual, es_personalizado: true };

      const fn = httpsCallable(functions, 'asignarComplementoInformatica');
      await fn({ proyectoId: proyecto.id, complemento });

      setFeedback('Complemento asignado correctamente.');
      setTimeout(() => onAsignado(), 1200);
    } catch (e: any) {
      setFeedback(e.message ?? 'Error al asignar.');
    }
    setGuardando(false);
  }

  if (yaAsignado) {
    const c = proyecto.complemento_informatica!;
    const info = TIPO_INFO[c.tipo] ?? { label: c.tipo, icon: '📌', color: 'text-slate-700 bg-slate-100' };
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-3">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Computer className="w-4 h-4 text-indigo-500" /> Complemento de Informática asignado
        </h3>
        <div className="flex gap-3 items-start">
          <span className="text-2xl">{info.icon}</span>
          <div>
            <div className="font-semibold text-sm text-slate-900">{c.titulo}</div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>
            <div className="text-sm text-slate-600 mt-2">{c.descripcion}</div>
            <div className="text-xs text-slate-400 mt-2"><strong>Alcance:</strong> {c.alcance}</div>
            {c.herramientas_sugeridas && c.herramientas_sugeridas.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-2">
                {c.herramientas_sugeridas.map((h, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{h}</span>
                ))}
              </div>
            )}
            <div className="text-[10px] text-slate-300 mt-2">
              {c.es_personalizado ? 'Asignado manualmente' : 'Elegido de sugerencias IA'} por {c.asignado_por_nombre} · {c.fecha_asignacion?.slice(0, 10)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-3">
      <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
        <Computer className="w-4 h-4 text-indigo-500" /> Complemento de Informática
      </h3>
      <p className="text-xs text-slate-400 mb-3">
        Genera sugerencias con IA basadas en el tema del proyecto, o asigna una opción personalizada.
      </p>

      {opciones.length === 0 && !modoManual && (
        <div className="flex gap-2">
          <button className="form-input !w-auto bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
            onClick={generarSugerencias} disabled={loading}>
            {loading ? 'Generando...' : 'Generar sugerencias con IA'}
          </button>
          <button className="form-input !w-auto flex items-center gap-1.5"
            onClick={() => setModoManual(true)}>
            <PenLine className="w-3.5 h-3.5" /> Escribir manualmente
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2 mt-3 border-l-2 border-red-300">
          {error}
        </div>
      )}

      {opciones.length > 0 && !modoManual && (
        <div>
          {opciones.map((op, idx) => {
            const info = TIPO_INFO[op.tipo] ?? { label: op.tipo, icon: '📌', color: 'text-slate-700 bg-slate-100' };
            const isSel = seleccionada === idx;
            return (
              <div key={idx}
                className={`border rounded-xl p-3 mb-2 cursor-pointer transition-all ${
                  isSel ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
                onClick={() => setSeleccionada(idx)}>
                <div className="flex gap-3 items-start">
                  <span className="text-xl">{info.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-900">{op.titulo}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{op.descripcion}</div>
                    <div className="text-[11px] text-slate-400 mt-2"><strong>Alcance:</strong> {op.alcance}</div>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                      {op.herramientas_sugeridas.map((h, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{h}</span>
                      ))}
                    </div>
                  </div>
                  <input type="radio" checked={isSel} onChange={() => setSeleccionada(idx)} className="mt-1 accent-indigo-600" />
                </div>
              </div>
            );
          })}

          <div className="flex gap-2 mt-3">
            <button className="form-input !w-auto" onClick={generarSugerencias} disabled={loading}>
              Regenerar
            </button>
            <button className="form-input !w-auto" onClick={() => setModoManual(true)}>
              Escribir otra cosa
            </button>
            <button className="form-input !w-auto bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
              disabled={seleccionada === null || guardando}
              onClick={() => seleccionada !== null && asignar(opciones[seleccionada])}>
              <CheckCircle2 className="w-3.5 h-3.5" />
              {guardando ? 'Guardando...' : 'Asignar esta opción'}
            </button>
          </div>
        </div>
      )}

      {modoManual && (
        <div>
          <FormField label="Tipo">
            <select className="form-input" value={manual.tipo} onChange={e => setManual(m => ({ ...m, tipo: e.target.value }))}>
              <option value="presentacion">Presentación</option>
              <option value="dashboard">Dashboard</option>
              <option value="app">Aplicación</option>
            </select>
          </FormField>
          <FormField label="Título del complemento">
            <input className="form-input" value={manual.titulo} onChange={e => setManual(m => ({ ...m, titulo: e.target.value }))}
              placeholder="Ej: App en App Inventor para calcular ahorro energético" />
          </FormField>
          <FormField label="Descripción">
            <textarea className="form-input min-h-[70px] resize-y" value={manual.descripcion}
              onChange={e => setManual(m => ({ ...m, descripcion: e.target.value }))}
              placeholder="¿Qué deben construir los estudiantes?" />
          </FormField>
          <FormField label="Alcance / criterios de evaluación">
            <textarea className="form-input min-h-[60px] resize-y" value={manual.alcance}
              onChange={e => setManual(m => ({ ...m, alcance: e.target.value }))}
              placeholder="Qué tan completo debe ser, cuánto tiempo de clase, qué partes evaluar..." />
          </FormField>
          <div className="flex gap-2">
            <button className="form-input !w-auto" onClick={() => setModoManual(false)}>← Volver</button>
            <button className="form-input !w-auto bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
              disabled={!manual.titulo || !manual.descripcion || guardando}
              onClick={() => asignar(null)}>
              {guardando ? 'Guardando...' : 'Asignar este complemento'}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div className={`text-xs rounded-lg px-3 py-2 mt-3 ${
          feedback.includes('correctamente')
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback}
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
