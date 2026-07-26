import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProyectos } from '../../hooks/useProyectos';
import {
  Proyecto, Integrante, GRADOS_PROYECTO, SECCIONES_POR_GRADO_PROYECTO,
  MATERIAS_PROYECTO, FECHA_LIMITE_REGISTRO
} from '../../types';
import { FileText, Users, AlertCircle } from 'lucide-react';

interface Props {
  proyectoInicial: Proyecto | null;
  onCancel: () => void;
  onSuccess: () => void;
}

interface IntegranteForm {
  nombre: string;
  numero_lista: string;
  es_rep: boolean;
  uid: string;
}

export default function FormularioProyecto({ proyectoInicial, onCancel, onSuccess }: Props) {
  const { userProfile } = useAuth();
  const { crearProyecto, guardarBorrador, enviarAValidacion } = useProyectos();
  const esEdicion = !!proyectoInicial;

  const [titulo, setTitulo] = useState(proyectoInicial?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion ?? '');
  const [grado, setGrado] = useState(proyectoInicial?.grado ?? '');
  const [seccion, setSeccion] = useState(proyectoInicial?.seccion ?? '');
  const [materiaId, setMateriaId] = useState(proyectoInicial?.materia_id ?? '');

  const [integrantes, setIntegrantes] = useState<IntegranteForm[]>(
    proyectoInicial?.integrantes_detalle?.map(i => ({
      nombre: i.nombre, numero_lista: String(i.numero_lista), es_rep: i.es_rep, uid: i.uid
    })) ??
    Array.from({ length: 5 }, (_, idx) => ({
      nombre: '', numero_lista: '', es_rep: idx === 0, uid: ''
    }))
  );

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  const secciones = SECCIONES_POR_GRADO_PROYECTO[grado] ?? [];

  useEffect(() => {
    if (grado && !secciones.includes(seccion)) setSeccion('');
  }, [grado]);

  function updateIntegrante(idx: number, field: keyof IntegranteForm, value: string | boolean) {
    setIntegrantes(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  function setRepresentante(idx: number) {
    setIntegrantes(prev => prev.map((it, i) => ({ ...it, es_rep: i === idx })));
  }

  function agregarIntegrante() {
    if (integrantes.length >= 6) return;
    setIntegrantes(prev => [...prev, { nombre: '', numero_lista: '', es_rep: false, uid: `pendiente-${Date.now()}` }]);
  }

  function quitarIntegrante(idx: number) {
    if (integrantes.length <= 5) return;
    setIntegrantes(prev => prev.filter((_, i) => i !== idx));
  }

  function validar(): boolean {
    const errs: Record<string, string> = {};
    const hoy = new Date().toISOString().slice(0, 10);

    if (hoy > FECHA_LIMITE_REGISTRO) errs.global = 'La fecha límite de registro (17 de junio) ya pasó.';
    if (!grado) errs.grado = 'Selecciona el grado.';
    if (!seccion) errs.seccion = 'Selecciona la sección.';
    if (!materiaId) errs.materia = 'Selecciona la materia base.';
    if (titulo.length < 5 || titulo.length > 100) errs.titulo = 'El título debe tener entre 5 y 100 caracteres.';
    if (!descripcion.trim() || descripcion.length > 300) errs.descripcion = 'Descripción requerida (máx 300 caracteres).';

    const llenadosOk = integrantes.every(i => i.nombre.trim() && i.numero_lista);
    if (!llenadosOk) errs.integrantes = 'Completa nombre y número de lista de todos los integrantes.';

    const listas = integrantes.map(i => i.numero_lista);
    if (new Set(listas).size !== listas.length) errs.integrantes = 'Los números de lista deben ser únicos.';

    if (!integrantes.some(i => i.es_rep)) errs.representante = 'Debes marcar un representante del equipo.';

    setErrores(errs);
    return Object.keys(errs).length === 0;
  }

  function buildIntegrantesDetalle(): Integrante[] {
    return integrantes.map((i, idx) => ({
      uid: i.es_rep && userProfile ? userProfile.uid : (i.uid || `temp-${idx}-${Date.now()}`),
      nombre: i.nombre.trim(),
      numero_lista: Number(i.numero_lista),
      es_rep: i.es_rep,
    }));
  }

  async function handleBorrador() {
    if (!grado || !materiaId || !titulo) {
      setFeedback({ tipo: 'error', texto: 'Completa al menos: grado, materia y título.' });
      return;
    }
    setLoading(true);
    if (esEdicion && proyectoInicial) {
      const res = await guardarBorrador(proyectoInicial.id, {
        titulo, descripcion, grado, seccion, materia_id: materiaId,
        integrantes_detalle: buildIntegrantesDetalle(),
        integrantes: buildIntegrantesDetalle().map(i => i.uid),
      });
      setFeedback(res.error ? { tipo: 'error', texto: res.error } : { tipo: 'ok', texto: 'Borrador guardado.' });
    } else {
      const detalle = buildIntegrantesDetalle();
      const res = await crearProyecto({ titulo, descripcion, grado, seccion, materia_id: materiaId, integrantes: detalle });
      setFeedback(res.error ? { tipo: 'error', texto: res.error } : { tipo: 'ok', texto: 'Borrador guardado.' });
    }
    setLoading(false);
  }

  async function handleEnviar() {
    if (!validar()) return;
    setLoading(true);

    if (esEdicion && proyectoInicial) {
      await guardarBorrador(proyectoInicial.id, {
        titulo, descripcion, grado, seccion, materia_id: materiaId,
        integrantes_detalle: buildIntegrantesDetalle(),
        integrantes: buildIntegrantesDetalle().map(i => i.uid),
      });
      const res = await enviarAValidacion(proyectoInicial.id);
      if (res.error) { setFeedback({ tipo: 'error', texto: res.error }); setLoading(false); return; }
    } else {
      const detalle = buildIntegrantesDetalle();
      const res = await crearProyecto({ titulo, descripcion, grado, seccion, materia_id: materiaId, integrantes: detalle });
      if (res.error || !res.id) { setFeedback({ tipo: 'error', texto: res.error ?? 'Error al crear proyecto.' }); setLoading(false); return; }
      await enviarAValidacion(res.id);
    }
    setLoading(false);
    onSuccess();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-bold text-slate-900">
          {esEdicion ? 'Editar proyecto' : 'Registrar nuevo proyecto'}
        </h2>
        <button className="form-input !w-auto" onClick={onCancel}>← Cancelar</button>
      </div>

      <div className="bg-blue-50 text-blue-800 border border-blue-200 rounded-xl px-4 py-3 text-sm mb-4">
        <AlertCircle className="w-4 h-4 inline mr-1.5" />
        El equipo debe tener entre 5 y 6 integrantes. Fecha límite de registro: <strong>17 de junio de 2026</strong>.
      </div>

      {feedback && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium mb-3 ${
          feedback.tipo === 'ok'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {feedback.tipo === 'ok' ? '✓' : '✕'} {feedback.texto}
        </div>
      )}

      {errores.global && (
        <div className="bg-red-50 text-red-800 border border-red-200 rounded-xl px-4 py-3 text-sm mb-3">
          {errores.global}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-3">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-500" /> Datos del proyecto
        </h3>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <FormField label="Grado *" error={errores.grado}>
            <select className="form-input" value={grado} onChange={e => setGrado(e.target.value)}>
              <option value="">Seleccionar...</option>
              {GRADOS_PROYECTO.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </FormField>
          <FormField label="Sección *" error={errores.seccion}>
            <select className="form-input" value={seccion} onChange={e => setSeccion(e.target.value)} disabled={!grado}>
              <option value="">{grado ? 'Seleccionar...' : 'Primero elige grado'}</option>
              {secciones.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </FormField>
        </div>

        <FormField label="Materia base *" error={errores.materia}>
          <select className="form-input" value={materiaId} onChange={e => setMateriaId(e.target.value)}>
            <option value="">Seleccionar materia...</option>
            {MATERIAS_PROYECTO.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </FormField>

        <FormField label={`Título del proyecto * (${titulo.length}/100)`} error={errores.titulo}>
          <input className="form-input" type="text" value={titulo} maxLength={100}
            onChange={e => setTitulo(e.target.value)} placeholder="Mínimo 5 caracteres, máximo 100" />
        </FormField>

        <FormField label={`Descripción breve * (${descripcion.length}/300)`} error={errores.descripcion}>
          <textarea className="form-input min-h-[80px] resize-y" value={descripcion} maxLength={300}
            onChange={e => setDescripcion(e.target.value)} placeholder="Explica brevemente el proyecto..." />
        </FormField>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 mb-3">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" /> Integrantes del equipo
          <span className="text-xs font-normal text-slate-400 ml-1">
            ({integrantes.length}/6) — mínimo 5, máximo 6
          </span>
        </h3>

        {errores.integrantes && <ErrMsg msg={errores.integrantes} />}
        {errores.representante && <ErrMsg msg={errores.representante} />}

        <div className="grid grid-cols-[1fr_80px_60px_32px] gap-2 mb-2 text-[10px] text-slate-400 font-medium">
          <span>Nombre completo</span><span className="text-center">N° lista</span><span className="text-center">Rep.</span><span></span>
        </div>

        {integrantes.map((int, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_80px_60px_32px] gap-2 mb-2 items-center">
            <input className="form-input text-sm" type="text" placeholder={`Integrante ${idx + 1}`}
              value={int.nombre} onChange={e => updateIntegrante(idx, 'nombre', e.target.value)} />
            <input className="form-input text-sm text-center" type="number" min={1} max={40} placeholder="00"
              value={int.numero_lista} onChange={e => updateIntegrante(idx, 'numero_lista', e.target.value)} />
            <div className="flex justify-center">
              <input type="radio" name="representante" checked={int.es_rep}
                onChange={() => setRepresentante(idx)} className="w-4 h-4 cursor-pointer accent-indigo-600" />
            </div>
            <button className="text-slate-300 hover:text-red-500 text-lg p-1"
              onClick={() => quitarIntegrante(idx)}
              disabled={integrantes.length <= 5} title="Quitar">×</button>
          </div>
        ))}

        {integrantes.length < 6 && (
          <button className="w-full py-2 border border-dashed border-indigo-300 text-indigo-600 rounded-lg text-sm hover:bg-indigo-50 transition-colors mt-2"
            onClick={agregarIntegrante}>+ Agregar integrante</button>
        )}

        <p className="text-[10px] text-slate-300 mt-3">
          Marca el círculo "Rep." para indicar el representante del grupo. El representante
          debe ser quien está llenando este formulario (su cuenta). Los demás integrantes solo
          se registran por nombre y número de lista — no necesitan tener cuenta propia en el sistema.
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button className="form-input !w-auto flex-1" onClick={handleBorrador} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button className="form-input !w-auto flex-1 bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
          onClick={handleEnviar} disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar a validación'}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className={`form-label ${error ? '!text-red-500' : ''}`}>{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-500 mt-1 block">{error}</span>}
    </div>
  );
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div className="bg-red-50 text-red-700 text-xs rounded-lg px-3 py-2 mb-3 border-l-2 border-red-300">
      {msg}
    </div>
  );
}
