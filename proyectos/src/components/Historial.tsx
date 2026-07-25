// src/components/Historial.tsx
import { useHistorial } from '../hooks/useCatalogos'
import { AccionHistorial, RolUsuario, ROL_LABELS } from '../types'

const ACCION_INFO: Record<AccionHistorial, { label:string; icon:string; color:string }> = {
  registro:                { label:'Proyecto registrado',          icon:'📝', color:'#0c447c' },
  envio_validacion:        { label:'Enviado a validación',         icon:'📤', color:'#0c447c' },
  aprobacion_materia:      { label:'Materia aprobada por docente', icon:'✅', color:'#173404' },
  reclasificacion:         { label:'Reclasificado por docente',    icon:'🔄', color:'#412402' },
  rechazo_materia:         { label:'Rechazado por docente',        icon:'❌', color:'#501313' },
  aprobacion_coordinacion: { label:'Aprobado oficialmente',        icon:'🏆', color:'#173404' },
  rechazo_coordinacion:    { label:'Rechazado por coordinación',   icon:'🚫', color:'#501313' },
}

export default function Historial({ proyectoId }: { proyectoId: string }) {
  const { historial, loading } = useHistorial(proyectoId)

  if (loading) return <p style={s.muted}>Cargando historial...</p>
  if (historial.length === 0) return <p style={s.muted}>Sin actividad registrada aún.</p>

  return (
    <div style={s.timeline}>
      {historial.map((h, idx) => {
        const info = ACCION_INFO[h.accion] ?? { label:h.accion, icon:'•', color:'var(--color-text-secondary)' }
        return (
          <div key={h.id} style={s.item}>
            {idx < historial.length - 1 && <div style={s.line} />}
            <div style={{ ...s.dot, background: info.color }}>
              <span style={{ fontSize:12 }}>{info.icon}</span>
            </div>
            <div style={s.content}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <span style={{ fontWeight:500, fontSize:13, color: info.color }}>{info.label}</span>
                <span style={s.fecha}>{formatFecha(h.fecha)}</span>
              </div>
              <div style={s.actor}>
                {ROL_LABELS[h.rol_actor as RolUsuario] ?? h.rol_actor}: <strong>{h.actor_nombre}</strong>
              </div>
              {h.comentario && <div style={s.comentario}>"{h.comentario}"</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function formatFecha(iso: string): string {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-SV', {
    day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
  })
}

const s: Record<string, React.CSSProperties> = {
  timeline:  { position:'relative', paddingLeft:36 },
  item:      { position:'relative', paddingBottom:20 },
  line:      { position:'absolute', left:-24, top:28, bottom:0, width:1, background:'var(--color-border-tertiary)' },
  dot:       { position:'absolute', left:-32, top:2, width:28, height:28, borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center', opacity:0.9 },
  content:   { background:'var(--color-background-secondary)', border:'0.5px solid var(--color-border-tertiary)', borderRadius:8, padding:'10px 12px' },
  fecha:     { fontSize:11, color:'var(--color-text-tertiary)', whiteSpace:'nowrap', marginLeft:8 },
  actor:     { fontSize:12, color:'var(--color-text-secondary)', marginTop:4 },
  comentario:{ fontSize:12, color:'var(--color-text-secondary)', marginTop:6, fontStyle:'italic',
    borderLeft:'2px solid var(--color-border-secondary)', paddingLeft:8 },
  muted:     { fontSize:13, color:'var(--color-text-secondary)', padding:'8px 0' },
}
