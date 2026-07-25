// src/components/FormularioProyecto.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProyectos } from '../hooks/useProyectos'
import {
  Proyecto, Integrante, GRADOS, SECCIONES_POR_GRADO,
  MATERIAS, FECHA_LIMITE_REGISTRO
} from '../types'

interface Props {
  proyectoInicial: Proyecto | null
  onCancel:  () => void
  onSuccess: () => void
}

interface IntegranteForm {
  nombre:       string
  numero_lista: string
  es_rep:       boolean
  uid:          string
}

export default function FormularioProyecto({ proyectoInicial, onCancel, onSuccess }: Props) {
  const { perfil }   = useAuth()
  const { crearProyecto, guardarBorrador, enviarAValidacion } = useProyectos()
  const esEdicion = !!proyectoInicial

  const [titulo,      setTitulo]      = useState(proyectoInicial?.titulo ?? '')
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion ?? '')
  const [grado,       setGrado]       = useState(proyectoInicial?.grado ?? '')
  const [seccion,     setSeccion]     = useState(proyectoInicial?.seccion ?? '')
  const [materiaId,   setMateriaId]   = useState(proyectoInicial?.materia_id ?? '')

  const [integrantes, setIntegrantes] = useState<IntegranteForm[]>(
    proyectoInicial?.integrantes_detalle?.map(i => ({
      nombre: i.nombre, numero_lista: String(i.numero_lista), es_rep: i.es_rep, uid: i.uid
    })) ??
    Array.from({ length: 5 }, (_, idx) => ({
      nombre: '', numero_lista: '', es_rep: idx === 0, uid: ''
    }))
  )

  const [errores,  setErrores]  = useState<Record<string,string>>({})
  const [loading,  setLoading]  = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'ok'|'error'; texto: string } | null>(null)

  const secciones = SECCIONES_POR_GRADO[grado] ?? []

  useEffect(() => {
    if (grado && !secciones.includes(seccion)) setSeccion('')
  }, [grado])

  function updateIntegrante(idx: number, field: keyof IntegranteForm, value: string | boolean) {
    setIntegrantes(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  function setRepresentante(idx: number) {
    setIntegrantes(prev => prev.map((it, i) => ({ ...it, es_rep: i === idx })))
  }

  function agregarIntegrante() {
    if (integrantes.length >= 6) return
    setIntegrantes(prev => [...prev, { nombre:'', numero_lista:'', es_rep:false, uid: `pendiente-${Date.now()}` }])
  }

  function quitarIntegrante(idx: number) {
    if (integrantes.length <= 5) return
    setIntegrantes(prev => prev.filter((_, i) => i !== idx))
  }

  function validar(): boolean {
    const errs: Record<string,string> = {}
    const hoy = new Date().toISOString().slice(0, 10)

    if (hoy > FECHA_LIMITE_REGISTRO) errs.global = 'La fecha límite de registro (17 de junio) ya pasó.'
    if (!grado)      errs.grado = 'Selecciona el grado.'
    if (!seccion)    errs.seccion = 'Selecciona la sección.'
    if (!materiaId)  errs.materia = 'Selecciona la materia base.'
    if (titulo.length < 5 || titulo.length > 100) errs.titulo = 'El título debe tener entre 5 y 100 caracteres.'
    if (!descripcion.trim() || descripcion.length > 300) errs.descripcion = 'Descripción requerida (máx 300 caracteres).'

    const llenadosOk = integrantes.every(i => i.nombre.trim() && i.numero_lista)
    if (!llenadosOk) errs.integrantes = 'Completa nombre y número de lista de todos los integrantes.'

    const listas = integrantes.map(i => i.numero_lista)
    if (new Set(listas).size !== listas.length) errs.integrantes = 'Los números de lista deben ser únicos.'

    if (!integrantes.some(i => i.es_rep)) errs.representante = 'Debes marcar un representante del equipo.'

    setErrores(errs)
    return Object.keys(errs).length === 0
  }

  function buildIntegrantesDetalle(): Integrante[] {
    return integrantes.map((i, idx) => ({
      // El representante siempre usa su UID real (el usuario logueado).
      // Los demás integrantes usan un UID temporal hasta que el admin
      // los vincule a una cuenta real (ver sección de Administración).
      uid:          i.es_rep && perfil ? perfil.id : (i.uid || `temp-${idx}-${Date.now()}`),
      nombre:       i.nombre.trim(),
      numero_lista: Number(i.numero_lista),
      es_rep:       i.es_rep,
    }))
  }

  async function handleBorrador() {
    if (!grado || !materiaId || !titulo) {
      setFeedback({ tipo:'error', texto:'Completa al menos: grado, materia y título.' })
      return
    }
    setLoading(true)
    if (esEdicion && proyectoInicial) {
      const res = await guardarBorrador(proyectoInicial.id, {
        titulo, descripcion, grado, seccion, materia_id: materiaId,
        integrantes_detalle: buildIntegrantesDetalle(),
        integrantes: buildIntegrantesDetalle().map(i => i.uid),
      })
      setFeedback(res.error ? { tipo:'error', texto:res.error } : { tipo:'ok', texto:'Borrador guardado.' })
    } else {
      const detalle = buildIntegrantesDetalle()
      const res = await crearProyecto({ titulo, descripcion, grado, seccion, materia_id: materiaId, integrantes: detalle })
      setFeedback(res.error ? { tipo:'error', texto:res.error } : { tipo:'ok', texto:'Borrador guardado.' })
    }
    setLoading(false)
  }

  async function handleEnviar() {
    if (!validar()) return
    setLoading(true)

    if (esEdicion && proyectoInicial) {
      await guardarBorrador(proyectoInicial.id, {
        titulo, descripcion, grado, seccion, materia_id: materiaId,
        integrantes_detalle: buildIntegrantesDetalle(),
        integrantes: buildIntegrantesDetalle().map(i => i.uid),
      })
      const res = await enviarAValidacion(proyectoInicial.id)
      if (res.error) { setFeedback({ tipo:'error', texto:res.error }); setLoading(false); return }
    } else {
      const detalle = buildIntegrantesDetalle()
      const res = await crearProyecto({ titulo, descripcion, grado, seccion, materia_id: materiaId, integrantes: detalle })
      if (res.error || !res.id) { setFeedback({ tipo:'error', texto: res.error ?? 'Error al crear proyecto.' }); setLoading(false); return }
      await enviarAValidacion(res.id)
    }
    setLoading(false)
    onSuccess()
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h2 style={{ fontSize:16, fontWeight:500 }}>
          {esEdicion ? 'Editar proyecto' : 'Registrar nuevo proyecto'}
        </h2>
        <button style={s.btnOutline} onClick={onCancel}>← Cancelar</button>
      </div>

      <div style={s.alertInfo}>
        📋 El equipo debe tener entre 5 y 6 integrantes. Fecha límite de registro: <strong>17 de junio de 2026</strong>.
      </div>

      {feedback && (
        <div style={{
          ...s.alert,
          background:  feedback.tipo === 'ok' ? '#eaf3de' : '#fcebeb',
          color:        feedback.tipo === 'ok' ? '#173404' : '#501313',
          borderColor:  feedback.tipo === 'ok' ? '#3b6d11' : '#a32d2d',
          marginBottom: 12
        }}>{feedback.tipo === 'ok' ? '✅' : '❌'} {feedback.texto}</div>
      )}

      {errores.global && (
        <div style={{ ...s.alert, background:'#fcebeb', color:'#501313', borderColor:'#a32d2d', marginBottom:12 }}>
          {errores.global}
        </div>
      )}

      <div style={s.card}>
        <h3 style={s.sectionTitle}>📌 Datos del proyecto</h3>

        <div style={s.row2}>
          <Field label="Grado *" error={errores.grado}>
            <select style={s.input} value={grado} onChange={e => setGrado(e.target.value)}>
              <option value="">Seleccionar...</option>
              {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Sección *" error={errores.seccion}>
            <select style={s.input} value={seccion} onChange={e => setSeccion(e.target.value)} disabled={!grado}>
              <option value="">{grado ? 'Seleccionar...' : 'Primero elige grado'}</option>
              {secciones.map(sc => <option key={sc} value={sc}>{sc}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Materia base *" error={errores.materia}>
          <select style={s.input} value={materiaId} onChange={e => setMateriaId(e.target.value)}>
            <option value="">Seleccionar materia...</option>
            {MATERIAS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </Field>

        <Field label={`Título del proyecto * (${titulo.length}/100)`} error={errores.titulo}>
          <input style={s.input} type="text" value={titulo} maxLength={100}
            onChange={e => setTitulo(e.target.value)} placeholder="Mínimo 5 caracteres, máximo 100" />
        </Field>

        <Field label={`Descripción breve * (${descripcion.length}/300)`} error={errores.descripcion}>
          <textarea style={{ ...s.input, minHeight:80, resize:'vertical' }} value={descripcion} maxLength={300}
            onChange={e => setDescripcion(e.target.value)} placeholder="Explica brevemente el proyecto..." />
        </Field>
      </div>

      <div style={s.card}>
        <h3 style={s.sectionTitle}>
          👥 Integrantes del equipo
          <span style={{ fontSize:12, fontWeight:400, color:'var(--color-text-secondary)', marginLeft:8 }}>
            ({integrantes.length}/6) — mínimo 5, máximo 6
          </span>
        </h3>

        {errores.integrantes    && <ErrMsg msg={errores.integrantes} />}
        {errores.representante  && <ErrMsg msg={errores.representante} />}

        <div style={{ display:'grid', gridTemplateColumns:'1fr 80px 60px 32px', gap:8,
          marginBottom:6, fontSize:11, color:'var(--color-text-secondary)', fontWeight:500 }}>
          <span>Nombre completo</span><span>N° lista</span><span style={{ textAlign:'center' }}>Rep.</span><span></span>
        </div>

        {integrantes.map((int, idx) => (
          <div key={idx} style={{ display:'grid', gridTemplateColumns:'1fr 80px 60px 32px', gap:8, marginBottom:8, alignItems:'center' }}>
            <input style={s.input} type="text" placeholder={`Integrante ${idx+1}`}
              value={int.nombre} onChange={e => updateIntegrante(idx,'nombre',e.target.value)} />
            <input style={{ ...s.input, textAlign:'center' }} type="number" min={1} max={40} placeholder="00"
              value={int.numero_lista} onChange={e => updateIntegrante(idx,'numero_lista',e.target.value)} />
            <div style={{ display:'flex', justifyContent:'center' }}>
              <input type="radio" name="representante" checked={int.es_rep}
                onChange={() => setRepresentante(idx)} style={{ width:16, height:16, cursor:'pointer' }} />
            </div>
            <button style={s.btnRemove} onClick={() => quitarIntegrante(idx)}
              disabled={integrantes.length <= 5} title="Quitar">×</button>
          </div>
        ))}

        {integrantes.length < 6 && (
          <button style={s.btnAdd} onClick={agregarIntegrante}>+ Agregar integrante</button>
        )}

        <p style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:8 }}>
          Marca el círculo "Rep." para indicar el representante del grupo. El representante
          debe ser quien está llenando este formulario (su cuenta). Los demás integrantes solo
          se registran por nombre y número de lista — no necesitan tener cuenta propia en el sistema.
        </p>
      </div>

      <div style={{ display:'flex', gap:10, marginTop:8 }}>
        <button style={s.btnSecondary} onClick={handleBorrador} disabled={loading}>
          💾 {loading ? 'Guardando...' : 'Guardar borrador'}
        </button>
        <button style={s.btnPrimary} onClick={handleEnviar} disabled={loading}>
          📤 {loading ? 'Enviando...' : 'Enviar a validación'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:500,
        color: error ? '#a32d2d' : 'var(--color-text-secondary)', marginBottom:4 }}>{label}</label>
      {children}
      {error && <span style={{ fontSize:11, color:'#a32d2d', display:'block', marginTop:3 }}>{error}</span>}
    </div>
  )
}

function ErrMsg({ msg }: { msg: string }) {
  return <div style={{ fontSize:12, color:'#501313', background:'#fcebeb', borderRadius:6,
    padding:'6px 10px', marginBottom:10, borderLeft:'2px solid #a32d2d' }}>{msg}</div>
}

const s: Record<string, React.CSSProperties> = {
  card:        { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1.25rem', marginBottom:12 },
  sectionTitle:{ fontSize:14, fontWeight:500, marginBottom:14 },
  row2:        { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  input:       { width:'100%', padding:'8px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' },
  alertInfo:   { background:'#e6f1fb', color:'#0c447c', borderLeft:'3px solid #378add', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 },
  alert:       { borderRadius:8, padding:'10px 14px', fontSize:13, borderLeft:'3px solid' },
  btnPrimary:  { padding:'9px 20px', background:'var(--color-text-primary)', color:'var(--color-background-primary)', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' },
  btnSecondary:{ padding:'9px 20px', background:'var(--color-background-primary)', color:'var(--color-text-primary)', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, fontSize:14, cursor:'pointer' },
  btnOutline:  { padding:'7px 14px', background:'var(--color-background-primary)', color:'var(--color-text-primary)', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, fontSize:13, cursor:'pointer' },
  btnAdd:      { display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#378add', background:'none', border:'0.5px dashed #378add', borderRadius:8, padding:'8px 14px', cursor:'pointer', width:'100%', marginTop:4 },
  btnRemove:   { background:'none', border:'none', color:'var(--color-text-tertiary)', fontSize:20, cursor:'pointer', padding:'4px', lineHeight:1, borderRadius:4 },
}
