import { Calendar, CheckCircle2, AlertTriangle, Star } from 'lucide-react';

interface FechaItem {
  fecha: string;
  label: string;
  evento: string;
  fase: 'inscripcion' | 'limite' | 'feria';
  importante?: boolean;
}

const FECHAS: FechaItem[] = [
  { fecha: '2026-06-01', label: '1 jun',     evento: 'Entrega de fichas a estudiantes',                    fase: 'inscripcion' },
  { fecha: '2026-06-08', label: '8 jun',     evento: 'Primera recepción de fichas (a docentes titulares)', fase: 'inscripcion' },
  { fecha: '2026-06-10', label: '10 jun',    evento: 'Primera devolución de observaciones por docentes',   fase: 'inscripcion' },
  { fecha: '2026-06-15', label: '15 jun',    evento: 'Segunda recepción de fichas corregidas',             fase: 'inscripcion' },
  { fecha: '2026-06-17', label: '17 jun',    evento: 'Límite: entrega de fichas a coordinación',           fase: 'limite', importante: true },
  { fecha: '2026-06-23', label: '23 jun',    evento: 'Límite: aprobación oficial del proyecto',            fase: 'limite', importante: true },
  { fecha: '2026-08-10', label: '10 ago',    evento: 'Entrega trabajo digital (Teams) · Montaje 7:30am · Inauguración 4:00pm', fase: 'feria' },
  { fecha: '2026-08-11', label: '11–13 ago', evento: 'Exposición de proyectos',                            fase: 'feria' },
  { fecha: '2026-08-13', label: '13 ago',    evento: 'Último día de exposición · Desmontaje 12:00md',      fase: 'feria' },
];

const FASE_STYLES: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  inscripcion: { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    dot: 'bg-blue-500' },
  limite:      { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-800',   dot: 'bg-slate-500' },
  feria:       { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
};

const FASE_LABELS: Record<string, string> = {
  inscripcion: 'Inscripción', limite: 'Fechas límite', feria: 'Feria',
};

export default function Cronograma() {
  const hoy = new Date().toISOString().slice(0, 10);
  const proxima = FECHAS.find(f => f.fecha >= hoy);

  return (
    <div>
      <div className="flex gap-4 flex-wrap mb-5">
        {Object.entries(FASE_STYLES).map(([fase, s]) => (
          <div key={fase} className="flex items-center gap-2 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
            <span className="text-slate-500">{FASE_LABELS[fase]}</span>
          </div>
        ))}
      </div>

      <div className="relative pl-7">
        <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200" />

        {FECHAS.map((f, idx) => {
          const pasado = f.fecha < hoy;
          const esHoy = f.fecha === hoy;
          const esProx = f === proxima;
          const s = FASE_STYLES[f.fase];

          return (
            <div key={idx} className="relative mb-3">
              <div className={`absolute -left-[22px] top-2.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                pasado ? 'bg-slate-200 border-slate-200' : `${s.dot} border-white`
              } ${esProx ? `ring-4 ${s.bg}` : ''}`}>
                {pasado && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
              </div>

              <div className={`${pasado ? 'bg-slate-50 border-slate-200' : `${s.bg} ${s.border}`} border rounded-lg px-3 py-2 ${pasado ? 'opacity-50' : ''}`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[11px] font-semibold ${pasado ? 'text-slate-400' : s.text}`}>
                    {f.label}
                    {esProx && <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full text-white ${s.dot}`}>Próxima</span>}
                    {esHoy && <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">Hoy</span>}
                  </span>
                  {f.importante && !pasado && <span className={`text-[10px] font-semibold ${s.text}`}>LÍMITE</span>}
                </div>
                <div className={`text-sm mt-0.5 ${pasado ? 'text-slate-400' : s.text}`}>
                  {f.evento}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-5 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-500" /> Normas clave
        </h4>
        {[
          '5 mínimo y 6 integrantes máximo por equipo. No se acepta trabajo individual.',
          'No se aprueban proyectos repetidos por nivel o fuera del nivel académico correspondiente.',
          '8 días hábiles para corregir si el proyecto no es aprobado en la primera entrega.',
          'El reporte escrito se entrega digitalmente al docente de Lenguaje y Literatura vía Teams.',
          'Cada grupo es responsable de sus materiales para la exposición.',
          'Todos los materiales deben retirarse el mismo día del desmontaje (13 de agosto, 12:00md).',
        ].map((norma, i) => (
          <div key={i} className="flex gap-3 mb-2.5 items-start">
            <span className="min-w-[20px] h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-medium text-slate-500 shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-slate-500 leading-relaxed">{norma}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-5 border-t border-slate-200">
        <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Star className="w-4 h-4 text-indigo-500" /> Estructura del reporte escrito
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          Formato: Times New Roman 12 · Interlineado 1.5 · Texto justificado
        </p>
        {[
          { n: 1, titulo: 'Portada', desc: 'Nombre del colegio, escudo, título, grado/sección, integrantes en orden alfabético con número de lista y fecha.' },
          { n: 2, titulo: 'Índice',  desc: 'Tabla de contenido con todos los apartados y numeración de páginas.' },
          { n: 3, titulo: 'Introducción', desc: '¿Qué? ¿Cómo? ¿Por qué es importante? ¿Qué método se usará? ¿Qué limitaciones hay?' },
          { n: 4, titulo: 'Objetivos', desc: '1 objetivo general + 2 objetivos específicos.' },
          { n: 5, titulo: 'Justificación', desc: 'Relevancia, utilidad, quién se beneficia, cuándo y cómo, resultados esperados.' },
          { n: 6, titulo: 'Marco teórico', desc: 'Base científica y conceptual. Antecedentes, teorías y fundamentos. Mínimo 5 páginas.' },
        ].map(item => (
          <div key={item.n} className="flex gap-3 py-2 border-b border-slate-100 items-start last:border-0">
            <span className="min-w-[24px] h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
              {item.n}
            </span>
            <div>
              <div className="text-sm font-medium text-slate-900">{item.titulo}</div>
              <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
