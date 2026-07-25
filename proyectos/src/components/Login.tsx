// src/components/Login.tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { RolUsuario, GRADOS, MATERIAS } from '../types'

type Modo = 'login' | 'registro'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [modo,    setModo]    = useState<Modo>('login')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [nombre,   setNombre]   = useState('')
  const [rol,      setRol]      = useState<RolUsuario>('estudiante')
  const [grado,    setGrado]    = useState('')
  const [seccion,  setSeccion]  = useState('')
  const [nLista,   setNLista]   = useState('')
  const [materia,  setMateria]  = useState('')

  const SECCIONES_MAP: Record<string, string[]> = {
    '4°':['A','B'],'5°':['A','B'],'6°':['A','B'],
    '7°':['A','B','C'],'8°':['A','B','C'],'9°':['A','B','C'],
    '10°':['A','B'],'11°':['A'],
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (modo === 'login') {
      const err = await signIn(email, password)
      if (err) setError(err)
    } else {
      const err = await signUp({
        email, password, nombre, rol,
        ...(rol === 'estudiante' && {
          grado, seccion, numero_lista: Number(nLista)
        }),
        ...(rol === 'docente' && { materia_id: materia }),
      })
      if (err) setError(err)
      else     setError('✅ Cuenta creada. Ya puedes iniciar sesión.')
    }
    setLoading(false)
  }

  return (
    <div style={s.wrapper}>
      <div style={s.card}>
        <div style={s.header}>
          <div style={{ fontSize: 42 }}>🔬</div>
          <h1 style={s.titulo}>Semana de la Juventud 2026</h1>
          <p style={s.subtitulo}>Colegio Salesiano San José</p>
        </div>

        <div style={s.tabs}>
          {(['login','registro'] as Modo[]).map(m => (
            <button key={m}
              style={{ ...s.tab, ...(modo === m ? s.tabActive : {}) }}
              onClick={() => { setModo(m); setError(null) }}>
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>

          {modo === 'registro' && (
            <Field label="Nombre completo">
              <input style={s.input} type="text" required value={nombre}
                onChange={e => setNombre(e.target.value)} placeholder="Tu nombre completo" />
            </Field>
          )}

          {modo === 'registro' && (
            <Field label="Rol">
              <select style={s.input} value={rol}
                onChange={e => setRol(e.target.value as RolUsuario)}>
                <option value="estudiante">Estudiante</option>
                <option value="docente">Docente</option>
                <option value="coordinacion">Coordinación académica</option>
              </select>
            </Field>
          )}

          {modo === 'registro' && rol === 'estudiante' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 80px', gap:8, marginBottom:12 }}>
              <Field label="Grado">
                <select style={s.input} required value={grado}
                  onChange={e => { setGrado(e.target.value); setSeccion('') }}>
                  <option value="">Seleccionar...</option>
                  {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Sección">
                <select style={s.input} required value={seccion}
                  onChange={e => setSeccion(e.target.value)} disabled={!grado}>
                  <option value="">—</option>
                  {(SECCIONES_MAP[grado] ?? []).map(sc =>
                    <option key={sc} value={sc}>{sc}</option>
                  )}
                </select>
              </Field>
              <Field label="N° lista">
                <input style={s.input} type="number" min={1} max={40} required
                  value={nLista} onChange={e => setNLista(e.target.value)} placeholder="0" />
              </Field>
            </div>
          )}

          {modo === 'registro' && rol === 'docente' && (
            <Field label="Materia que imparte">
              <select style={s.input} required value={materia}
                onChange={e => setMateria(e.target.value)}>
                <option value="">Seleccionar...</option>
                {MATERIAS.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </Field>
          )}

          <Field label="Correo electrónico">
            <input style={s.input} type="email" required value={email}
              onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" />
          </Field>

          <Field label="Contraseña">
            <input style={s.input} type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : '••••••••'} />
          </Field>

          {error && (
            <div style={{
              ...s.alert,
              background:  error.startsWith('✅') ? '#eaf3de' : '#fcebeb',
              color:       error.startsWith('✅') ? '#173404' : '#501313',
              borderColor: error.startsWith('✅') ? '#3b6d11' : '#a32d2d',
            }}>{error}</div>
          )}

          <button style={{ ...s.btnPrimary, opacity: loading ? 0.7 : 1 }}
            type="submit" disabled={loading}>
            {loading ? 'Cargando...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:500,
        color:'var(--color-text-secondary)', marginBottom:4 }}>{label}</label>
      {children}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrapper:   { minHeight:'100vh', display:'flex', alignItems:'center',
    justifyContent:'center', padding:'1rem', background:'var(--color-background-secondary)' },
  card:      { background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)',
    borderRadius:16, padding:'2rem', width:'100%', maxWidth:440,
    boxShadow:'0 4px 24px rgba(0,0,0,0.08)' },
  header:    { textAlign:'center', marginBottom:'1.5rem' },
  titulo:    { fontSize:18, fontWeight:600, margin:0 },
  subtitulo: { fontSize:13, color:'var(--color-text-secondary)', marginTop:4 },
  tabs:      { display:'flex', gap:4, background:'var(--color-background-secondary)',
    borderRadius:10, padding:4, marginBottom:'1.5rem' },
  tab:       { flex:1, padding:'8px 0', border:'none', borderRadius:8,
    background:'transparent', cursor:'pointer', fontSize:13, color:'var(--color-text-secondary)' },
  tabActive: { background:'var(--color-background-primary)',
    border:'0.5px solid var(--color-border-secondary)',
    fontWeight:500, color:'var(--color-text-primary)' },
  input:     { width:'100%', padding:'8px 10px', border:'0.5px solid var(--color-border-secondary)',
    borderRadius:8, background:'var(--color-background-primary)', color:'var(--color-text-primary)',
    fontSize:14, fontFamily:'inherit', boxSizing:'border-box' },
  alert:     { borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:12, borderLeft:'3px solid' },
  btnPrimary:{ width:'100%', padding:'10px', marginTop:4, background:'var(--color-text-primary)',
    color:'var(--color-background-primary)', border:'none', borderRadius:8,
    fontSize:14, fontWeight:500, cursor:'pointer' },
}
