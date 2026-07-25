// src/components/Cronograma.tsx

interface FechaItem {
  fecha:  string
  label:  string
  evento: string
  fase:   'inscripcion' | 'limite' | 'feria'
  importante?: boolean
}

const FECHAS: FechaItem[] = [
  { fecha:'2026-06-01', label:'1 jun',     evento:'Entrega de fichas a estudiantes',                    fase:'inscripcion' },
  { fecha:'2026-06-08', label:'8 jun',     evento:'Primera recepción de fichas (a docentes titulares)', fase:'inscripcion' },
  { fecha:'2026-06-10', label:'10 jun',    evento:'Primera devolución de observaciones por docentes',   fase:'inscripcion' },
  { fecha:'2026-06-15', label:'15 jun',    evento:'Segunda recepción de fichas corregidas',             fase:'inscripcion' },
  { fecha:'2026-06-17', label:'17 jun ⚠️', evento:'Límite: entrega de fichas a coordinación',           fase:'limite', importante:true },
  { fecha:'2026-06-23', label:'23 jun ⚠️', evento:'Límite: aprobación oficial del proyecto',            fase:'limite', importante:true },
  { fecha:'2026-08-10', label:'10 ago',    evento:'Entrega trabajo digital (Teams) · Montaje 7:30am · Inauguración 4:00pm', fase:'feria' },
  { fecha:'2026-08-11', label:'11–13 ago', evento:'Exposición de proyectos',                            fase:'feria' },
  { fecha:'2026-08-13', label:'13 ago',    evento:'Último día de exposición · Desmontaje 12:00md',      fase:'feria' },
]

const FASE_COLORS: Record<string, { bg:string; border:string; text:string; dot:string }> = {
  inscripcion: { bg:'#e6f1fb', border:'#378add', text:'#0c447c', dot:'#378add' },
  limite:      { bg:'#faeeda', border:'#ba7517', text:'#412402', dot:'#e8a020' },
  feria:       { bg:'#eaf3de', border:'#3b6d11', text:'#173404', dot:'#3b6d11' },
}

const FASE_LABELS: Record<string,string> = {
  inscripcion: 'Inscripción', limite: 'Fechas límite', feria: 'Feria',
}

export default function Cronograma() {
  const hoy = new Date().toISOString().slice(0, 10)
  const proxima = FECHAS.find(f => f.fecha >= hoy)

  return (
    <div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
        {Object.entries(FASE_COLORS).map(([fase, c]) => (
          <div key={fase} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:c.dot }} />
            <span style={{ color:'var(--color-text-secondary)' }}>{FASE_LABELS[fase]}</span>
          </div>
        ))}
      </div>

      <div style={{ position:'relative', paddingLeft:28 }}>
        <div style={{ position:'absolute', left:8, top:8, bottom:8, width:1, background:'var(--color-border-tertiary)' }} />

        {FECHAS.map((f, idx) => {
          const pasado = f.fecha < hoy
          const esHoy  = f.fecha === hoy
          const esProx = f === proxima
          const c      = FASE_COLORS[f.fase]

          return (
            <div key={idx} style={{ position:'relative', marginBottom:14 }}>
              <div style={{
                position:'absolute', left:-24, top:10, width:16, height:16, borderRadius:'50%',
                background: pasado ? 'var(--color-border-secondary)' : c.dot,
                border: esProx ? `2px solid ${c.dot}` : '2px solid transparent',
                boxShadow: esProx ? `0 0 0 3px ${c.bg}` : 'none',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                {pasado && <span style={{ fontSize:8, color:'white' }}>✓</span>}
              </div>

              <div style={{
                background: pasado ? 'var(--color-background-secondary)' : c.bg,
                border: `0.5px solid ${pasado ? 'var(--color-border-tertiary)' : c.border}`,
                borderRadius:8, padding:'8px 12px', opacity: pasado ? 0.6 : 1,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:11, fontWeight:600, color: pasado ? 'var(--color-text-tertiary)' : c.text }}>
                    {f.label}
                    {esProx && <span style={{ marginLeft:6, fontSize:10, background:c.dot, color:'white', padding:'1px 6px', borderRadius:50 }}>Próxima</span>}
                    {esHoy  && <span style={{ marginLeft:6, fontSize:10, background:'#a32d2d', color:'white', padding:'1px 6px', borderRadius:50 }}>Hoy</span>}
                  </span>
                  {f.importante && !pasado && <span style={{ fontSize:10, color:c.text, fontWeight:600 }}>LÍMITE</span>}
                </div>
                <div style={{ fontSize:13, marginTop:2, color: pasado ? 'var(--color-text-tertiary)' : c.text }}>
                  {f.evento}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop:24, borderTop:'0.5px solid var(--color-border-tertiary)', paddingTop:20 }}>
        <h4 style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>📋 Normas clave</h4>
        {[
          '5 mínimo y 6 integrantes máximo por equipo. No se acepta trabajo individual.',
          'No se aprueban proyectos repetidos por nivel o fuera del nivel académico correspondiente.',
          '8 días hábiles para corregir si el proyecto no es aprobado en la primera entrega.',
          'El reporte escrito se entrega digitalmente al docente de Lenguaje y Literatura vía Teams.',
          'Cada grupo es responsable de sus materiales para la exposición.',
          'Todos los materiales deben retirarse el mismo día del desmontaje (13 de agosto, 12:00md).',
        ].map((norma, i) => (
          <div key={i} style={{ display:'flex', gap:10, marginBottom:10, alignItems:'flex-start' }}>
            <span style={{ minWidth:20, height:20, borderRadius:'50%', background:'var(--color-background-secondary)',
              border:'0.5px solid var(--color-border-secondary)', display:'flex', alignItems:'center',
              justifyContent:'center', fontSize:11, fontWeight:500, flexShrink:0 }}>{i+1}</span>
            <span style={{ fontSize:13, color:'var(--color-text-secondary)', lineHeight:1.5 }}>{norma}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop:20, borderTop:'0.5px solid var(--color-border-tertiary)', paddingTop:20 }}>
        <h4 style={{ fontSize:14, fontWeight:500, marginBottom:12 }}>📄 Estructura del reporte escrito</h4>
        <p style={{ fontSize:12, color:'var(--color-text-secondary)', marginBottom:12 }}>
          Formato: Times New Roman 12 · Interlineado 1.5 · Texto justificado
        </p>
        {[
          { n:1, titulo:'Portada', desc:'Nombre del colegio, escudo, título, grado/sección, integrantes en orden alfabético con número de lista y fecha.' },
          { n:2, titulo:'Índice',  desc:'Tabla de contenido con todos los apartados y numeración de páginas.' },
          { n:3, titulo:'Introducción', desc:'¿Qué? ¿Cómo? ¿Por qué es importante? ¿Qué método se usará? ¿Qué limitaciones hay?' },
          { n:4, titulo:'Objetivos', desc:'1 objetivo general + 2 objetivos específicos.' },
          { n:5, titulo:'Justificación', desc:'Relevancia, utilidad, quién se beneficia, cuándo y cómo, resultados esperados.' },
          { n:6, titulo:'Marco teórico', desc:'Base científica y conceptual. Antecedentes, teorías y fundamentos. Mínimo 5 páginas.' },
        ].map(item => (
          <div key={item.n} style={{ display:'flex', gap:12, padding:'8px 0',
            borderBottom:'0.5px solid var(--color-border-tertiary)', alignItems:'flex-start' }}>
            <span style={{ minWidth:24, height:24, borderRadius:6, background:'#e6f1fb', color:'#0c447c',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, flexShrink:0 }}>{item.n}</span>
            <div>
              <div style={{ fontSize:13, fontWeight:500 }}>{item.titulo}</div>
              <div style={{ fontSize:12, color:'var(--color-text-secondary)', marginTop:2, lineHeight:1.5 }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
