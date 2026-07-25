// src/components/Dashboard.tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProyectos } from '../hooks/useProyectos'
import { Proyecto, ESTADOS, EstadoProyecto, MATERIAS, ROL_LABELS } from '../types'
import FormularioProyecto from './FormularioProyecto'
import Historial from './Historial'
import Cronograma from './Cronograma'
import AdminPanel from './AdminPanel'
import SugerenciaInformatica from './SugerenciaInformatica'

type Vista   = 'lista' | 'form' | 'detalle'
type MainTab = 'proyectos' | 'cronograma' | 'admin'

export default function Dashboard() {
  const { perfil, signOut } = useAuth()
  const {
    proyectos, loading, aprobarMateria, reclasificar,
    rechazarMateria, aprobarOficial, rechazarOficial
  } = useProyectos()

  const [mainTab, setMainTab] = useState<MainTab>('proyectos')
  const [vista, setVista]     = useState<Vista>('lista')
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null)
  const [modal, setModal]     = useState<{ tipo: string; proyectoId: string } | null>(null)
  const [formModal, setFormModal] = useState({ materia: '', comentario: '' })
  const [msgAccion, setMsgAccion] = useState<{ tipo: 'ok'|'error'; texto: string } | null>(null)
  const [verHistorial, setVerHistorial] = useState(false)

  const rol = perfil?.rol

  const stats = {
    total:      proyectos.length,
    aprobados:  proyectos.filter(p => p.estado === 'aprobado_oficial').length,
    pendientes: proyectos.filter(p => ['registrado','en_revision_materia','materia_validada','en_coordinacion'].includes(p.estado)).length,
    rechazados: proyectos.filter(p => p.estado.startsWith('rechazado')).length,
  }

  async function ejecutarAccionDocente(accion: 'aprobar'|'reclasificar'|'rechazar') {
    if (!modal) return
    const id = modal.proyectoId
    let res
    if (accion === 'aprobar') {
      res = await aprobarMateria(id, { materia_id: formModal.materia, comentario: formModal.comentario })
    } else if (accion === 'reclasificar') {
      res = await reclasificar(id, { materia_id: formModal.materia, comentario: formModal.comentario })
    } else {
      res = await rechazarMateria(id, formModal.comentario)
    }
    if (res.error) { setMsgAccion({ tipo:'error', texto:res.error }); return }
    setModal(null)
    setMsgAccion({ tipo:'ok', texto:'Acción registrada correctamente.' })
    setTimeout(() => setMsgAccion(null), 3000)
  }

  async function ejecutarAccionCoord(accion: 'aprobar'|'rechazar') {
    if (!modal) return
    const id = modal.proyectoId
    const res = accion === 'aprobar' ? await aprobarOficial(id) : await rechazarOficial(id, formModal.comentario)
    if (res.error) { setMsgAccion({ tipo:'error', texto:res.error }); return }
    setModal(null)
    setMsgAccion({ tipo:'ok', texto: accion === 'aprobar' ? '¡Proyecto aprobado oficialmente!' : 'Proyecto rechazado.' })
    setTimeout(() => setMsgAccion(null), 3000)
  }

  return (
    <div style={s.wrapper}>
      <div style={s.topbar}>
        <div>
          <span style={s.appName}>Semana de la Juventud 2026</span>
          <span style={s.rolBadge}>{rol ? ROL_LABELS[rol] : ''}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:13, color:'var(--color-text-secondary)' }}>{perfil?.nombre}</span>
          <button style={s.btnOutline} onClick={signOut}>Cerrar sesión</button>
        </div>
      </div>

      <div style={s.content}>
        {msgAccion && (
          <div style={{ ...s.alert,
            background: msgAccion.tipo === 'ok' ? '#eaf3de' : '#fcebeb',
            color:      msgAccion.tipo === 'ok' ? '#173404' : '#501313',
            borderColor: msgAccion.tipo === 'ok' ? '#3b6d11' : '#a32d2d',
            marginBottom:16 }}>
            {msgAccion.tipo === 'ok' ? '✅' : '❌'} {msgAccion.texto}
          </div>
        )}

        {vista === 'lista' && (
          <div style={s.mainTabs}>
            <button style={{ ...s.mainTab, ...(mainTab==='proyectos' ? s.mainTabActive : {}) }}
              onClick={() => setMainTab('proyectos')}>
              {rol === 'estudiante' ? '🔬 Mis proyectos' : rol === 'docente' ? '🔬 Por revisar' : '🔬 Proyectos'}
            </button>
            <button style={{ ...s.mainTab, ...(mainTab==='cronograma' ? s.mainTabActive : {}) }}
              onClick={() => setMainTab('cronograma')}>📅 Cronograma</button>
            {rol === 'admin' && (
              <button style={{ ...s.mainTab, ...(mainTab==='admin' ? s.mainTabActive : {}) }}
                onClick={() => setMainTab('admin')}>⚙️ Administración</button>
            )}
          </div>
        )}

        {vista === 'form' && (
          <FormularioProyecto
            proyectoInicial={proyectoActivo}
            onCancel={() => { setVista('lista'); setProyectoActivo(null) }}
            onSuccess={() => { setVista('lista'); setProyectoActivo(null) }}
          />
        )}

        {vista === 'detalle' && proyectoActivo && (
          <DetalleProyecto
            proyecto={proyectos.find(p => p.id === proyectoActivo.id) ?? proyectoActivo}
            rol={rol}
            verHistorial={verHistorial}
            onToggleHistorial={() => setVerHistorial(v => !v)}
            onVolver={() => { setVista('lista'); setProyectoActivo(null); setVerHistorial(false) }}
            onEditar={() => setVista('form')}
          />
        )}

        {vista === 'lista' && mainTab === 'cronograma' && (
          <div style={s.card}><Cronograma /></div>
        )}

        {vista === 'lista' && mainTab === 'admin' && rol === 'admin' && (
          <AdminPanel proyectos={proyectos} />
        )}

        {vista === 'lista' && mainTab === 'proyectos' && (
          <>
            <div style={s.statsGrid}>
              {[
                { num: stats.total,      label:'Total',       color:'var(--color-text-primary)' },
                { num: stats.aprobados,  label:'Aprobados',   color:'#2d7a4f' },
                { num: stats.pendientes, label:'En revisión', color:'#854f0b' },
                { num: stats.rechazados, label:'Rechazados',  color:'#a32d2d' },
              ].map(({ num, label, color }) => (
                <div key={label} style={s.statCard}>
                  <div style={{ fontSize:28, fontWeight:500, color }}>{num}</div>
                  <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{label}</div>
                </div>
              ))}
            </div>

            {rol === 'estudiante' && (
              <button style={{ ...s.btnPrimary, marginBottom:16 }}
                onClick={() => { setProyectoActivo(null); setVista('form') }}>
                + Registrar nuevo proyecto
              </button>
            )}

            {loading && <p style={{ color:'var(--color-text-secondary)', fontSize:14 }}>Cargando proyectos...</p>}

            {!loading && proyectos.length === 0 && (
              <div style={s.empty}><div style={{ fontSize:32, marginBottom:12 }}>🔬</div><p>No hay proyectos para mostrar.</p></div>
            )}

            {!loading && proyectos.map(p => (
              <ProyectoCard key={p.id} proyecto={p} rol={rol}
                onVer={() => { setProyectoActivo(p); setVista('detalle') }}
                onRevisar={() => {
                  setModal({ tipo: rol!, proyectoId: p.id })
                  setFormModal({ materia: p.materia_id, comentario: '' })
                }} />
            ))}
          </>
        )}
      </div>

      {/* Modal docente */}
      {modal?.tipo === 'docente' && (
        <Modal titulo="Revisión de materia" onClose={() => setModal(null)}>
          {(() => {
            const p = proyectos.find(x => x.id === modal.proyectoId)
            return p ? (
              <>
                <InfoRow label="Proyecto" value={p.titulo} />
                <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
                <InfoRow label="Materia solicitada" value={p.materia_nombre} />
                <InfoRow label="Descripción" value={p.descripcion} small />

                <Field label="Materia confirmada">
                  <select style={s.input} value={formModal.materia}
                    onChange={e => setFormModal(f => ({ ...f, materia: e.target.value }))}>
                    {MATERIAS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </select>
                </Field>
                <Field label="Comentarios (requerido para rechazo/reclasificación)">
                  <textarea style={{ ...s.input, minHeight:70, resize:'vertical' }}
                    value={formModal.comentario}
                    onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Escribe aquí tus observaciones..." />
                </Field>

                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
                  <button style={s.btnOutline} onClick={() => setModal(null)}>Cancelar</button>
                  <button style={s.btnWarn} onClick={() => ejecutarAccionDocente('reclasificar')}>🔄 Reclasificar</button>
                  <button style={s.btnDanger} onClick={() => ejecutarAccionDocente('rechazar')}>✕ Rechazar</button>
                  <button style={s.btnSuccess} onClick={() => ejecutarAccionDocente('aprobar')}>✓ Aprobar materia</button>
                </div>
              </>
            ) : null
          })()}
        </Modal>
      )}

      {/* Modal coordinación */}
      {modal?.tipo === 'coordinacion' && (
        <Modal titulo="Aprobación oficial" onClose={() => setModal(null)}>
          {(() => {
            const p = proyectos.find(x => x.id === modal.proyectoId)
            return p ? (
              <>
                <InfoRow label="Proyecto" value={p.titulo} />
                <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
                <InfoRow label="Materia" value={p.materia_nombre} />
                <InfoRow label="Integrantes" value={`${p.integrantes_detalle?.length ?? 0}`} />

                <CheckList proyecto={p} />

                <Field label="Motivo de rechazo (si aplica)">
                  <textarea style={{ ...s.input, minHeight:60, resize:'vertical' }}
                    value={formModal.comentario}
                    onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Solo requerido si rechazas el proyecto..." />
                </Field>

                <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:16 }}>
                  <button style={s.btnOutline} onClick={() => setModal(null)}>Cancelar</button>
                  <button style={s.btnDanger} onClick={() => ejecutarAccionCoord('rechazar')}>✕ Rechazar</button>
                  <button style={s.btnSuccess} onClick={() => ejecutarAccionCoord('aprobar')}>✓ Aprobar oficialmente</button>
                </div>
              </>
            ) : null
          })()}
        </Modal>
      )}
    </div>
  )
}

// ── SUB-COMPONENTES ────────────────────────────────────────────

function ProyectoCard({ proyecto: p, rol, onVer, onRevisar }: {
  proyecto: Proyecto; rol?: string; onVer: () => void; onRevisar: () => void
}) {
  const canRevisar =
    (rol === 'docente' && ['registrado','en_revision_materia'].includes(p.estado)) ||
    (rol === 'coordinacion' && p.estado === 'en_coordinacion')

  return (
    <div style={s.card} onClick={onVer}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:500, fontSize:14, marginBottom:4 }}>{p.titulo}</div>
          <div style={{ fontSize:12, color:'var(--color-text-secondary)' }}>
            {p.grado} {p.seccion} · {p.materia_nombre}
            {p.integrantes_detalle && ` · ${p.integrantes_detalle.length} integrantes`}
          </div>
          {p.observaciones && <div style={s.comment}>{p.observaciones}</div>}
          {p.estado === 'aprobado_oficial' && (
            <div style={{ fontSize:11.5, marginTop:6, color: p.complemento_informatica ? '#173404' : '#854f0b' }}>
              {p.complemento_informatica ? '💻 Complemento de Informática asignado' : '💡 Pendiente: complemento de Informática'}
            </div>
          )}
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
          <StatusBadge estado={p.estado} />
          {canRevisar && (
            <button style={s.btnSmall} onClick={e => { e.stopPropagation(); onRevisar() }}>Revisar →</button>
          )}
        </div>
      </div>
      <div style={{ fontSize:11, color:'var(--color-text-tertiary)', marginTop:6 }}>
        Rep: {p.representante_nombre} · Registrado: {p.fecha_registro}
      </div>
    </div>
  )
}

function DetalleProyecto({ proyecto: p, rol, verHistorial, onToggleHistorial, onVolver, onEditar }: {
  proyecto: Proyecto; rol?: string; verHistorial: boolean
  onToggleHistorial: () => void; onVolver: () => void; onEditar: () => void
}) {
  const canEdit = ['reclasificar','rechazado_materia'].includes(p.estado) && p.intentos_envio < 2
  const puedeAsignarComplemento = rol && ['docente','coordinacion','admin'].includes(rol) && p.estado === 'aprobado_oficial'

  return (
    <div>
      <button style={s.btnOutline} onClick={onVolver}>← Volver</button>
      <div style={{ height:16 }} />

      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h2 style={{ fontSize:16, fontWeight:500 }}>{p.titulo}</h2>
          <StatusBadge estado={p.estado} />
        </div>
        <InfoRow label="Grado / Sección" value={`${p.grado} ${p.seccion}`} />
        <InfoRow label="Materia base" value={p.materia_nombre} />
        <InfoRow label="Descripción" value={p.descripcion} />
        <InfoRow label="Fecha de registro" value={p.fecha_registro} />
        <InfoRow label="Intentos de envío" value={`${p.intentos_envio}/2`} />
      </div>

      <div style={s.card}>
        <h3 style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>
          Equipo ({p.integrantes_detalle?.length ?? 0} integrantes)
        </h3>
        {p.integrantes_detalle?.map(i => (
          <div key={i.uid} style={{ display:'flex', gap:10, padding:'6px 0',
            borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize:13 }}>
            <span style={s.numBadge}>{i.numero_lista}</span>
            {i.nombre}
            {i.es_rep && <span style={s.repBadge}>Representante</span>}
          </div>
        ))}
      </div>

      {p.observaciones && (
        <div style={{ ...s.alert, background:'#faeeda', color:'#412402', borderColor:'#ba7517', marginBottom:16 }}>
          <strong>Comentario del revisor:</strong> {p.observaciones}
        </div>
      )}

      {canEdit && rol === 'estudiante' && (
        <button style={{ ...s.btnPrimary, marginBottom:16 }} onClick={onEditar}>✏️ Editar y reenviar</button>
      )}

      {/* Complemento de Informática — solo si está aprobado y rol corresponde */}
      {puedeAsignarComplemento && (
        <SugerenciaInformatica proyecto={p} onAsignado={() => {}} />
      )}

      {/* Mostrar complemento ya asignado a estudiantes también */}
      {!puedeAsignarComplemento && p.complemento_informatica && rol === 'estudiante' && (
        <SugerenciaInformatica proyecto={p} onAsignado={() => {}} />
      )}

      {/* Historial */}
      <div style={s.card}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer' }}
          onClick={onToggleHistorial}>
          <h3 style={{ fontSize:14, fontWeight:500 }}>📜 Historial de actividad</h3>
          <span style={{ fontSize:12, color:'var(--color-text-secondary)' }}>{verHistorial ? '▲ Ocultar' : '▼ Mostrar'}</span>
        </div>
        {verHistorial && (
          <div style={{ marginTop:14 }}>
            <Historial proyectoId={p.id} />
          </div>
        )}
      </div>
    </div>
  )
}

function CheckList({ proyecto: p }: { proyecto: Proyecto }) {
  const items = [
    { label:'Ficha completa',             ok: !!(p.titulo && p.descripcion) },
    { label:'5–6 integrantes',            ok: (p.integrantes_detalle?.length ?? 0) >= 5 && (p.integrantes_detalle?.length ?? 0) <= 6 },
    { label:'Materia validada',           ok: !!p.materia_validada_id },
    { label:'Entregado antes del 17 jun', ok: p.fecha_registro <= '2026-06-17' },
  ]
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap', margin:'12px 0' }}>
      {items.map(i => (
        <span key={i.label} style={{ fontSize:11, padding:'3px 8px', borderRadius:50,
          background: i.ok ? '#eaf3de' : '#fcebeb', color: i.ok ? '#2d7a4f' : '#a32d2d' }}>
          {i.ok ? '✓' : '✗'} {i.label}
        </span>
      ))}
    </div>
  )
}

function StatusBadge({ estado }: { estado: EstadoProyecto }) {
  const COLOR_MAP: Record<string, { bg:string; color:string }> = {
    green:{bg:'#eaf3de',color:'#173404'}, blue:{bg:'#e6f1fb',color:'#0c447c'},
    amber:{bg:'#faeeda',color:'#412402'}, purple:{bg:'#eeedfe',color:'#3c3489'},
    red:{bg:'#fcebeb',color:'#501313'}, gray:{bg:'var(--color-background-secondary)',color:'var(--color-text-secondary)'},
  }
  const info = ESTADOS[estado]
  const clr = COLOR_MAP[info.color]
  return <span style={{ ...s.badge, background:clr.bg, color:clr.color }}>{info.label}</span>
}

function Modal({ titulo, onClose, children }: { titulo:string; onClose:()=>void; children:React.ReactNode }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontSize:16, fontWeight:500 }}>{titulo}</h3>
          <button style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:'var(--color-text-secondary)' }} onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function InfoRow({ label, value, small }: { label:string; value?:string; small?:boolean }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'7px 0',
      borderBottom:'0.5px solid var(--color-border-tertiary)', fontSize: small ? 12 : 13 }}>
      <span style={{ color:'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontWeight:500, textAlign:'right', maxWidth:'60%' }}>{value || '—'}</span>
    </div>
  )
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return (
    <div style={{ marginBottom:10 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:500, color:'var(--color-text-secondary)', marginBottom:4 }}>{label}</label>
      {children}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper: { minHeight:'100vh', background:'var(--color-background-secondary)' },
  topbar:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px',
    background:'var(--color-background-primary)', borderBottom:'0.5px solid var(--color-border-tertiary)',
    position:'sticky', top:0, zIndex:10 },
  appName: { fontSize:15, fontWeight:500, marginRight:10 },
  rolBadge:{ fontSize:11, padding:'2px 8px', borderRadius:50, background:'#e6f1fb', color:'#0c447c' },
  content: { maxWidth:720, margin:'0 auto', padding:'1.5rem 1rem' },
  mainTabs:{ display:'flex', gap:4, background:'var(--color-background-secondary)', borderRadius:10, padding:4, marginBottom:16 },
  mainTab: { flex:1, padding:'8px', border:'none', borderRadius:8, background:'transparent', fontSize:13, cursor:'pointer', color:'var(--color-text-secondary)' },
  mainTabActive: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-secondary)', fontWeight:500, color:'var(--color-text-primary)' },
  statsGrid:{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 },
  statCard:{ background:'var(--color-background-primary)', borderRadius:10, border:'0.5px solid var(--color-border-tertiary)', padding:'10px 12px', textAlign:'center' },
  card: { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:12, padding:'1rem', marginBottom:10, cursor:'pointer' },
  comment: { background:'var(--color-background-secondary)', borderRadius:6, padding:'6px 10px', fontSize:12, color:'var(--color-text-secondary)', marginTop:6, borderLeft:'2px solid var(--color-border-secondary)' },
  badge: { fontSize:11, padding:'3px 10px', borderRadius:50, fontWeight:500, whiteSpace:'nowrap' },
  numBadge: { width:22, height:22, borderRadius:'50%', background:'var(--color-background-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, flexShrink:0 },
  repBadge: { background:'#e6f1fb', color:'#0c447c', fontSize:10, padding:'2px 6px', borderRadius:50 },
  empty: { textAlign:'center', padding:'3rem 1rem', color:'var(--color-text-secondary)' },
  alert: { borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12, borderLeft:'3px solid' },
  input: { width:'100%', padding:'8px 10px', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)', fontSize:14, fontFamily:'inherit', boxSizing:'border-box' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 },
  modal: { background:'var(--color-background-primary)', borderRadius:14, padding:'1.5rem', maxWidth:500, width:'90%', maxHeight:'85vh', overflowY:'auto', border:'0.5px solid var(--color-border-tertiary)' },
  btnPrimary: { padding:'9px 18px', background:'var(--color-text-primary)', color:'var(--color-background-primary)', border:'none', borderRadius:8, fontSize:14, fontWeight:500, cursor:'pointer' },
  btnOutline: { padding:'7px 14px', background:'var(--color-background-primary)', color:'var(--color-text-primary)', border:'0.5px solid var(--color-border-secondary)', borderRadius:8, fontSize:13, cursor:'pointer' },
  btnSuccess: { padding:'7px 14px', background:'#eaf3de', color:'#173404', border:'0.5px solid #3b6d11', borderRadius:8, fontSize:13, cursor:'pointer' },
  btnDanger: { padding:'7px 14px', background:'#fcebeb', color:'#501313', border:'0.5px solid #a32d2d', borderRadius:8, fontSize:13, cursor:'pointer' },
  btnWarn: { padding:'7px 14px', background:'#faeeda', color:'#412402', border:'0.5px solid #ba7517', borderRadius:8, fontSize:13, cursor:'pointer' },
  btnSmall: { padding:'5px 10px', background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-secondary)', borderRadius:6, fontSize:12, cursor:'pointer', color:'var(--color-text-primary)' },
}
