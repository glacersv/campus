// src/components/SugerenciaInformatica.tsx
import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'
import { Proyecto, SugerenciaOpcion, ComplementoInformatica } from '../types'

interface Props {
  proyecto: Proyecto
  onAsignado: () => void
}

const TIPO_INFO: Record<string, { label: string; icon: string; color: string }> = {
  presentacion: { label: 'Presentación', icon: '📊', color: '#0c447c' },
  dashboard:    { label: 'Dashboard',    icon: '📈', color: '#173404' },
  app:          { label: 'Aplicación',   icon: '📱', color: '#3c3489' },
}

export default function SugerenciaInformatica({ proyecto, onAsignado }: Props) {
  const [opciones, setOpciones]   = useState<SugerenciaOpcion[]>(proyecto.sugerencias_informatica ?? [])
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState<string | null>(null)
  const [seleccionada, setSeleccionada] = useState<number | null>(null)
  const [modoManual, setModoManual] = useState(false)

  const [manual, setManual] = useState({ tipo: 'presentacion', titulo: '', descripcion: '', alcance: '' })
  const [guardando, setGuardando] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const yaAsignado = !!proyecto.complemento_informatica

  async function generarSugerencias() {
    setLoading(true)
    setError(null)
    try {
      const fn = httpsCallable(functions, 'sugerirComplementoInformatica')
      const res = await fn({ proyectoId: proyecto.id })
      const data = res.data as { opciones: SugerenciaOpcion[] }
      setOpciones(data.opciones)
    } catch (e: any) {
      setError(e.message ?? 'Error al generar sugerencias. Intenta de nuevo.')
    }
    setLoading(false)
  }

  async function asignar(opcion: SugerenciaOpcion | null) {
    setGuardando(true)
    setFeedback(null)
    try {
      const complemento: ComplementoInformatica = opcion
        ? { ...opcion, es_personalizado: false }
        : { ...manual, es_personalizado: true }

      const fn = httpsCallable(functions, 'asignarComplementoInformatica')
      await fn({ proyectoId: proyecto.id, complemento })

      setFeedback('✅ Complemento asignado correctamente.')
      setTimeout(() => onAsignado(), 1200)
    } catch (e: any) {
      setFeedback('❌ ' + (e.message ?? 'Error al asignar.'))
    }
    setGuardando(false)
  }

  // ── Si ya está asignado, mostrar resumen ──────────────────
  if (yaAsignado) {
    const c = proyecto.complemento_informatica!
    const info = TIPO_INFO[c.tipo] ?? { label: c.tipo, icon: '📌', color: '#888' }
    return (
      <div style={s.card}>
        <h3 style={s.sectionTitle}>💻 Complemento de Informática asignado</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 24 }}>{info.icon}</span>
          <div>
            <div style={{ fontWeight: 500, fontSize: 14, color: info.color }}>{c.titulo}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>{info.label}</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>{c.descripcion}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 6 }}>
              <strong>Alcance:</strong> {c.alcance}
            </div>
            {c.herramientas_sugeridas && c.herramientas_sugeridas.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {c.herramientas_sugeridas.map((h, i) => (
                  <span key={i} style={s.toolBadge}>{h}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
              {c.es_personalizado ? 'Asignado manualmente' : 'Elegido de sugerencias IA'} por {c.asignado_por_nombre} · {c.fecha_asignacion?.slice(0, 10)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={s.card}>
      <h3 style={s.sectionTitle}>💻 Complemento de Informática</h3>
      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
        Genera sugerencias con IA basadas en el tema del proyecto, o asigna una opción personalizada.
      </p>

      {opciones.length === 0 && !modoManual && (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btnPrimary} onClick={generarSugerencias} disabled={loading}>
            {loading ? '🧠 Generando sugerencias...' : '✨ Generar sugerencias con IA'}
          </button>
          <button style={s.btnOutline} onClick={() => setModoManual(true)}>
            ✏️ Escribir manualmente
          </button>
        </div>
      )}

      {error && <div style={{ ...s.alert, background: '#fcebeb', color: '#501313', borderColor: '#a32d2d', marginTop: 10 }}>{error}</div>}

      {/* Opciones generadas por IA */}
      {opciones.length > 0 && !modoManual && (
        <div>
          {opciones.map((op, idx) => {
            const info = TIPO_INFO[op.tipo] ?? { label: op.tipo, icon: '📌', color: '#888' }
            const isSel = seleccionada === idx
            return (
              <div key={idx}
                style={{ ...s.opcionCard, ...(isSel ? s.opcionCardSel : {}) }}
                onClick={() => setSeleccionada(idx)}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22 }}>{info.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: 13, color: info.color }}>{op.titulo}</span>
                      <span style={{ ...s.toolBadge, background: info.color + '15', color: info.color }}>{info.label}</span>
                    </div>
                    <div style={{ fontSize: 12.5, marginTop: 4, color: 'var(--color-text-secondary)' }}>{op.descripcion}</div>
                    <div style={{ fontSize: 11.5, marginTop: 6 }}>
                      <strong>Alcance:</strong> {op.alcance}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                      {op.herramientas_sugeridas.map((h, i) => (
                        <span key={i} style={s.toolBadge}>{h}</span>
                      ))}
                    </div>
                  </div>
                  <input type="radio" checked={isSel} onChange={() => setSeleccionada(idx)} style={{ marginTop: 4 }} />
                </div>
              </div>
            )
          })}

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={s.btnOutline} onClick={generarSugerencias} disabled={loading}>
              🔄 Regenerar sugerencias
            </button>
            <button style={s.btnOutline} onClick={() => setModoManual(true)}>
              ✏️ Escribir otra cosa
            </button>
            <button style={s.btnPrimary} disabled={seleccionada === null || guardando}
              onClick={() => seleccionada !== null && asignar(opciones[seleccionada])}>
              {guardando ? 'Guardando...' : '✓ Asignar esta opción'}
            </button>
          </div>
        </div>
      )}

      {/* Modo manual */}
      {modoManual && (
        <div>
          <Field label="Tipo">
            <select style={s.input} value={manual.tipo} onChange={e => setManual(m => ({ ...m, tipo: e.target.value }))}>
              <option value="presentacion">Presentación</option>
              <option value="dashboard">Dashboard</option>
              <option value="app">Aplicación</option>
            </select>
          </Field>
          <Field label="Título del complemento">
            <input style={s.input} value={manual.titulo} onChange={e => setManual(m => ({ ...m, titulo: e.target.value }))}
              placeholder="Ej: App en App Inventor para calcular ahorro energético" />
          </Field>
          <Field label="Descripción">
            <textarea style={{ ...s.input, minHeight: 70, resize: 'vertical' }} value={manual.descripcion}
              onChange={e => setManual(m => ({ ...m, descripcion: e.target.value }))}
              placeholder="¿Qué deben construir los estudiantes?" />
          </Field>
          <Field label="Alcance / criterios de evaluación">
            <textarea style={{ ...s.input, minHeight: 60, resize: 'vertical' }} value={manual.alcance}
              onChange={e => setManual(m => ({ ...m, alcance: e.target.value }))}
              placeholder="Qué tan completo debe ser, cuánto tiempo de clase, qué partes evaluar..." />
          </Field>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={s.btnOutline} onClick={() => setModoManual(false)}>← Volver</button>
            <button style={s.btnPrimary} disabled={!manual.titulo || !manual.descripcion || guardando}
              onClick={() => asignar(null)}>
              {guardando ? 'Guardando...' : '✓ Asignar este complemento'}
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div style={{ ...s.alert, marginTop: 12,
          background: feedback.startsWith('✅') ? '#eaf3de' : '#fcebeb',
          color:      feedback.startsWith('✅') ? '#173404' : '#501313',
          borderColor: feedback.startsWith('✅') ? '#3b6d11' : '#a32d2d' }}>
          {feedback}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 500,
        color: 'var(--color-text-secondary)', marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  card:         { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1.25rem', marginBottom: 12 },
  sectionTitle: { fontSize: 14, fontWeight: 500, marginBottom: 6 },
  input:        { width: '100%', padding: '8px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' },
  alert:        { borderRadius: 8, padding: '10px 14px', fontSize: 13, borderLeft: '3px solid' },
  btnPrimary:   { padding: '9px 18px', background: 'var(--color-text-primary)', color: 'var(--color-background-primary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
  btnOutline:   { padding: '9px 16px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  opcionCard:   { border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: '12px', marginBottom: 8, cursor: 'pointer', transition: 'border-color 0.15s' },
  opcionCardSel:{ borderColor: 'var(--color-text-primary)', borderWidth: 1.5, background: 'var(--color-background-secondary)' },
  toolBadge:    { fontSize: 10.5, padding: '2px 8px', borderRadius: 50, background: 'var(--color-background-secondary)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' },
}
