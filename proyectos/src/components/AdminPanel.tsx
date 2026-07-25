// src/components/AdminPanel.tsx
import { useState } from 'react'
import { useValidadores } from '../hooks/useCatalogos'
import { Proyecto, GRADOS, MATERIAS, ESTADOS, EstadoProyecto } from '../types'

export default function AdminPanel({ proyectos }: { proyectos: Proyecto[] }) {
  const { asignaciones, docentes, loading, asignarValidador, quitarValidador } = useValidadores()

  const [tabAdmin, setTabAdmin] = useState<'validadores'|'proyectos'|'stats'>('validadores')
  const [form, setForm] = useState({ grado:'', materia_id:'', docente_id:'' })
  const [feedback, setFeedback] = useState<{ tipo:'ok'|'error'; texto:string } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  async function handleAsignar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.grado || !form.materia_id || !form.docente_id) {
      setFeedback({ tipo:'error', texto:'Completa todos los campos.' })
      return
    }
    const docente  = docentes.find(d => d.id === form.docente_id)
    const materia  = MATERIAS.find(m => m.id === form.materia_id)
    const res = await asignarValidador({
      grado: form.grado,
      materia_id: form.materia_id,
      materia_nombre: materia?.nombre ?? '',
      docente_id: form.docente_id,
      docente_nombre: docente?.nombre ?? '',
    })
    setFeedback(res.error ? { tipo:'error', texto:res.error } : { tipo:'ok', texto:'Validador asignado.' })
    if (!res.error) setForm({ grado:'', materia_id:'', docente_id:'' })
    setTimeout(() => setFeedback(null), 3000)
  }

  const proyectosFiltrados = proyectos.filter(p => {
    const matchBusqueda = !busqueda ||
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.grado.includes(busqueda) ||
      p.representante_nombre?.toLowerCase().includes(busqueda.toLowerCase())
    const matchEstado = !filtroEstado || p.estado === filtroEstado
    return matchBusqueda && matchEstado
  })

  const conteo = Object.fromEntries(
    (Object.keys(ESTADOS) as EstadoProyecto[]).map(e => [e, proyectos.filter(p => p.estado === e).length])
  )

  return (
    <div>
      <div style={s.tabs}>
        {[
          { id:'validadores', label:'🔐 Validadores' },
          { id:'proyectos',   label:'📋 Todos los proyectos' },
          { id:'stats',       label:'📊 Estadísticas' },
        ].map(t => (
          <button key={t.id} style={{ ...s.tab, ...(tabAdmin === t.id ? s.tabActive : {}) }}
            onClick={() => setTabAdmin(t.id as any)}>{t.label}</button>
        ))}
      </div>

      {tabAdmin === 'validadores' && (
        <div>
          <div style={s.card}>
            <h3 style={s.sectionTitle}>➕ Asignar docente validador</h3>
            <p style={s.muted}>Define qué docente valida proyectos de cada grado y materia.</p>

            <div style={s.row3}>
              <Field label="Grado">
                <select style={s.input} value={form.grado} onChange={e => setForm(f => ({ ...f, grado:e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Materia">
                <select style={s.input} value={form.materia_id} onChange={e => setForm(f => ({ ...f, materia_id:e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {MATERIAS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                </select>
              </Field>
              <Field label="Docente">
                <select style={s.input} value={form.docente_id} onChange={e => setForm(f => ({ ...f, docente_id:e.target.value }))}>
                  <option value="">Seleccionar...</option>
                  {docentes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                </select>
              </Field>
            </div>

            {feedback && (
              <div style={{ ...s.alert, background: feedback.tipo==='ok' ? '#eaf3de' : '#fcebeb',
                color: feedback.tipo==='ok' ? '#173404' : '#501313',
                borderColor: feedback.tipo==='ok' ? '#3b6d11' : '#a32d2d', marginBottom:10 }}>
                {feedback.tipo === 'ok' ? '✅' : '❌'} {feedback.texto}
              </div>
            )}

            <button style={s.btnPrimary} onClick={handleAsignar}>Guardar asignación</button>
          </div>

          <div style={s.card}>
            <h3 style={s.sectionTitle}>📋 Asignaciones actuales</h3>
            {loading && <p style={s.muted}>Cargando...</p>}
            {!loading && asignaciones.length === 0 && <p style={s.muted}>No hay asignaciones configuradas aún.</p>}
            {asignaciones.map(a => (
              <div key={a.id} style={s.asigRow}>
                <div>
                  <span style={s.badge}>{a.grado}</span>
                  <span style={{ ...s.badge, background:'#eeedfe', color:'#3c3489', marginLeft:6 }}>{a.materia_nombre}</span>
                  <span style={{ fontSize:13, marginLeft:10 }}>{a.docente_nombre}</span>
                </div>
                <button style={s.btnDanger} onClick={() => quitarValidador(a.id)}>Quitar</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tabAdmin === 'proyectos' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap' }}>
            <input style={{ ...s.input, maxWidth:260 }} placeholder="Buscar por título, grado o representante..."
              value={busqueda} onChange={e => setBusqueda(e.target.value)} />
            <select style={{ ...s.input, maxWidth:200 }} value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <span style={{ fontSize:12, color:'var(--color-text-secondary)', alignSelf:'center' }}>
              {proyectosFiltrados.length} de {proyectos.length} proyectos
            </span>
          </div>

          {proyectosFiltrados.length === 0 && (
            <div style={s.empty}><div style={{ fontSize:28, marginBottom:8 }}>🔍</div><p>No se encontraron proyectos.</p></div>
          )}

          {proyectosFiltrados.map(p => {
            const est = ESTADOS[p.estado]
            const COLOR_MAP: Record<string,{bg:string;color:string}> = {
              green:{bg:'#eaf3de',color:'#173404'}, blue:{bg:'#e6f1fb',color:'#0c447c'},
              amber:{bg:'#faeeda',color:'#412402'}, purple:{bg:'#eeedfe',color:'#3c3489'},
              red:{bg:'#fcebeb',color:'#501313'}, gray:{bg:'var(--color-background-secondary)',color:'var(--color-text-secondary)'},
            }
            const clr = COLOR_MAP[est.color]
            return (
              <div key={p.id} style={s.proyCard}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:500, fontSize:14 }}>{p.titulo}</div>
                    <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:3 }}>
                      {p.grado} {p.seccion} · {p.materia_nombre} · {p.integrantes_detalle?.length ?? 0} integrantes
                    </div>
                    <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:3 }}>
                      Rep: {p.representante_nombre} · {p.fecha_registro} · Intentos: {p.intentos_envio}
                    </div>
                  </div>
                  <span style={{ fontSize:11, padding:'3px 10px', borderRadius:50, fontWeight:500,
                    background:clr.bg, color:clr.color, whiteSpace:'nowrap' }}>{est.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tabAdmin === 'stats' && (
        <div>
          <div style={s.statsGrid}>
            <div style={s.statCard}><div style={{ fontSize:32, fontWeight:500 }}>{proyectos.length}</div><div style={s.statLabel}>Total</div></div>
            <div style={s.statCard}><div style={{ fontSize:32, fontWeight:500, color:'#2d7a4f' }}>{conteo.aprobado_oficial ?? 0}</div><div style={s.statLabel}>Aprobados</div></div>
            <div style={s.statCard}><div style={{ fontSize:32, fontWeight:500, color:'#534ab7' }}>{conteo.en_coordinacion ?? 0}</div><div style={s.statLabel}>En coordinación</div></div>
            <div style={s.statCard}><div style={{ fontSize:32, fontWeight:500, color:'#a32d2d' }}>{(conteo.rechazado_materia ?? 0) + (conteo.rechazado_oficial ?? 0)}</div><div style={s.statLabel}>Rechazados</div></div>
          </div>

          <div style={s.card}>
            <h3 style={s.sectionTitle}>Distribución por estado</h3>
            {Object.entries(ESTADOS).map(([estado, info]) => {
              const count = conteo[estado] ?? 0
              const pct = proyectos.length ? Math.round((count / proyectos.length) * 100) : 0
              const COLOR_MAP: Record<string,string> = { green:'#3b6d11', blue:'#378add', amber:'#ba7517', purple:'#534ab7', red:'#a32d2d', gray:'#888' }
              return (
                <div key={estado} style={{ marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:4 }}>
                    <span style={{ color:'var(--color-text-secondary)' }}>{info.label}</span>
                    <span style={{ fontWeight:500 }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ background:'var(--color-background-secondary)', borderRadius:4, height:6, overflow:'hidden' }}>
                    <div style={{ width:`${pct}%`, height:'100%', background:COLOR_MAP[info.color], borderRadius:4 }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={s.card}>
            <h3 style={s.sectionTitle}>Proyectos por grado</h3>
            {GRADOS.map(g => {
              const count = proyectos.filter(p => p.grado === g).length
              return (
                <div key={g} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0',
                  borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:13 }}>
                  <span style={{ color:'var(--color-text-secondary)' }}>{g}</span><strong>{count}</strong>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return <div><label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--color-text-secondary)', marginBottom:4 }}>{label}</label>{children}</div>
}

const s: Record<string, React.CSSProperties> = {
  tabs: { display:'flex', gap:4, background:'var(--color-background-secondary)', borderRadius:10, padding:4, marginBottom:16 },
  tab:  { flex:1, padding:'8px', border:'none', borderRadius:8, background:'transparent', fontSize:13, cursor:'pointer', color:'var(--color-text-secondary)' },
  tabActive: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-secondary)', fontWeight:500, color:'var(--color-text-primary)' },
  card: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1.25rem', marginBottom:12 },
  sectionTitle: { fontSize:14, fontWeight:500, marginBottom:10 },
  muted: { fontSize:13, color:'var(--color-text-secondary)', padding:'4px 0' },
  row3: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:12 },
  input: { width:'100%', padding:'8px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' },
  alert: { borderRadius:8, padding:'10px 14px', fontSize:13, borderLeft:'3px solid' },
  btnPrimary: { padding:'9px 18px', background:'var(--color-text-primary)', color:'var(--color-background-primary)', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' },
  btnDanger: { padding:'5px 10px', background:'#fcebeb', color:'#501313', border:'0.5px solid #a32d2d', borderRadius:6, fontSize:12, cursor:'pointer' },
  badge: { fontSize:11, padding:'3px 8px', borderRadius:50, background:'#e6f1fb', color:'#0c447c', fontWeight:500 },
  asigRow: { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'0.5px solid var(--color-border-tertiary)' },
  proyCard: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'12px', marginBottom:8 },
  empty: { textAlign:'center', padding:'2rem', color:'var(--color-text-secondary)' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 },
  statCard: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:10, padding:'12px', textAlign:'center' },
  statLabel: { fontSize:12, color:'var(--color-text-secondary)', marginTop:3 },
}
