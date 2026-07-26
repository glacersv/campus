import { useState } from 'react';
import { useValidadores } from '../../hooks/useCatalogos';
import { Proyecto, GRADOS_PROYECTO, MATERIAS_PROYECTO, ESTADOS_PROYECTO, EstadoProyecto } from '../../types';
import { Settings, Shield, BarChart3, Search } from 'lucide-react';

export default function AdminPanel({ proyectos }: { proyectos: Proyecto[] }) {
  const { asignaciones, docentes, loading, asignarValidador, quitarValidador } = useValidadores();

  const [tabAdmin, setTabAdmin] = useState<'validadores' | 'proyectos' | 'stats'>('validadores');
  const [form, setForm] = useState({ grado: '', materia_id: '', docente_id: '' });
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.grado || !form.materia_id || !form.docente_id) {
      setFeedback({ tipo: 'error', texto: 'Completa todos los campos.' });
      return;
    }
    const docente = docentes.find(d => d.uid === form.docente_id);
    const materia = MATERIAS_PROYECTO.find(m => m.id === form.materia_id);
    const res = await asignarValidador({
      grado: form.grado,
      materia_id: form.materia_id,
      materia_nombre: materia?.nombre ?? '',
      docente_id: form.docente_id,
      docente_nombre: docente?.displayName ?? '',
    });
    setFeedback(res.error ? { tipo: 'error', texto: res.error } : { tipo: 'ok', texto: 'Validador asignado.' });
    if (!res.error) setForm({ grado: '', materia_id: '', docente_id: '' });
    setTimeout(() => setFeedback(null), 3000);
  }

  const proyectosFiltrados = proyectos.filter(p => {
    const matchBusqueda = !busqueda ||
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.grado.includes(busqueda) ||
      p.representante_nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const conteo = Object.fromEntries(
    (Object.keys(ESTADOS_PROYECTO) as EstadoProyecto[]).map(e => [e, proyectos.filter(p => p.estado === e).length])
  );

  const STATUS_COLORS: Record<string, string> = {
    green: 'bg-emerald-100 text-emerald-800',
    blue: 'bg-blue-100 text-blue-800',
    amber: 'bg-amber-100 text-amber-800',
    purple: 'bg-purple-100 text-purple-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-slate-100 text-slate-600',
  };

  return (
    <div>
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
        {[
          { id: 'validadores', label: 'Validadores', icon: Shield },
          { id: 'proyectos', label: 'Todos los proyectos', icon: Settings },
          { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
        ].map(t => (
          <button key={t.id}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
              tabAdmin === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            }`}
            onClick={() => setTabAdmin(t.id as any)}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {tabAdmin === 'validadores' && (
        <div>
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-3">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Asignar docente validador</h3>
            <p className="text-xs text-slate-400 mb-3">Define qué docente valida proyectos de cada grado y materia.</p>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <FormField label="Grado">
                <select className="form-input text-sm" value={form.grado} onChange={e => setForm(f => ({ ...f, grado: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {GRADOS_PROYECTO.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </FormField>
              <FormField label="Materia">
                <select className="form-input text-sm" value={form.materia_id} onChange={e => setForm(f => ({ ...f, materia_id: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {MATERIAS_PROYECTO.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </FormField>
              <FormField label="Docente">
                <select className="form-input text-sm" value={form.docente_id} onChange={e => setForm(f => ({ ...f, docente_id: e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {docentes.map(d => <option key={d.uid} value={d.uid}>{d.displayName}</option>)}
                </select>
              </FormField>
            </div>

            {feedback && (
              <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${
                feedback.tipo === 'ok'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {feedback.tipo === 'ok' ? '✓' : '✕'} {feedback.texto}
              </div>
            )}

            <button className="form-input !w-auto bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
              onClick={handleAsignar}>Guardar asignación</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Asignaciones actuales</h3>
            {loading && <p className="text-sm text-slate-400">Cargando...</p>}
            {!loading && asignaciones.length === 0 && <p className="text-sm text-slate-400">No hay asignaciones configuradas aún.</p>}
            {asignaciones.map(a => (
              <div key={a.id} className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{a.grado}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">{a.materia_nombre}</span>
                  <span className="text-sm text-slate-600">{a.docente_nombre}</span>
                </div>
                <button className="text-xs px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100"
                  onClick={() => quitarValidador(a.id)}>Quitar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tabAdmin === 'proyectos' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input className="form-input !pl-9 text-sm" placeholder="Buscar por título, grado o representante..."
                value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            </div>
            <select className="form-input !w-auto text-sm" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span className="text-xs text-slate-400 self-center">
              {proyectosFiltrados.length} de {proyectos.length} proyectos
            </span>
          </div>

          {proyectosFiltrados.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No se encontraron proyectos.</p>
            </div>
          )}

          {proyectosFiltrados.map(p => {
            const est = ESTADOS_PROYECTO[p.estado];
            return (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200/80 p-3 mb-2">
                <div className="flex justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">{p.titulo}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {p.grado} {p.seccion} · {p.materia_nombre} · {p.integrantes_detalle?.length ?? 0} integrantes
                    </div>
                    <div className="text-[10px] text-slate-300 mt-1">
                      Rep: {p.representante_nombre} · {p.fecha_registro} · Intentos: {p.intentos_envio}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[est?.color ?? 'gray']}`}>
                    {est?.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tabAdmin === 'stats' && (
        <div>
          <div className="grid grid-cols-4 gap-3 mb-3">
            {[
              { num: proyectos.length, label: 'Total', color: 'text-slate-700' },
              { num: conteo.aprobado_oficial ?? 0, label: 'Aprobados', color: 'text-emerald-600' },
              { num: conteo.en_coordinacion ?? 0, label: 'En coordinación', color: 'text-purple-600' },
              { num: (conteo.rechazado_materia ?? 0) + (conteo.rechazado_oficial ?? 0), label: 'Rechazados', color: 'text-red-600' },
            ].map(({ num, label, color }) => (
              <div key={label} className="bg-white rounded-xl border border-slate-200/80 p-3 text-center">
                <div className={`text-2xl font-bold ${color}`}>{num}</div>
                <div className="text-[10px] text-slate-400 font-medium">{label}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-3">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Distribución por estado</h3>
            {Object.entries(ESTADOS_PROYECTO).map(([estado, info]) => {
              const count = conteo[estado] ?? 0;
              const pct = proyectos.length ? Math.round((count / proyectos.length) * 100) : 0;
              const BAR_COLORS: Record<string, string> = { green: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500', purple: 'bg-purple-500', red: 'bg-red-500', gray: 'bg-slate-400' };
              return (
                <div key={estado} className="mb-2.5 last:mb-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{info.label}</span>
                    <span className="font-medium text-slate-700">{count} ({pct}%)</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${BAR_COLORS[info.color]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Proyectos por grado</h3>
            {GRADOS_PROYECTO.map(g => {
              const count = proyectos.filter(p => p.grado === g).length;
              return (
                <div key={g} className="flex justify-between py-2 border-b border-slate-100 last:border-0 text-sm">
                  <span className="text-slate-500">{g}</span>
                  <strong className="text-slate-700">{count}</strong>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}
