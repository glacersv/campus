import { useState, useMemo, useEffect, type ElementType } from 'react';
import { useProyectos } from '../../hooks/useProyectos';
import { Proyecto, ESTADOS_PROYECTO, EstadoProyecto } from '../../types';
import FormularioProyecto from '../proyectos/FormularioProyecto';
import ActividadEvaluada from '../proyectos/ActividadEvaluada';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Pencil, Trash2, Copy, X, AlertTriangle, SlidersHorizontal, ClipboardCheck, CheckCircle2, ArrowLeft, ListChecks, Medal, Atom, Dna, Monitor, Code2, Calculator, FlaskConical } from 'lucide-react';

const BADGE: Record<string, string> = {
  borrador: 'badge-slate',
  registrado: 'badge-blue',
  en_revision_materia: 'badge-yellow',
  aprobado_materia: 'badge-green',
  aprobado_oficial: 'badge-green',
  rechazado_materia: 'badge-red',
};

interface MateriaIconDef {
  match: string[];
  icon: ElementType;
  box: string;
}

const MATERIA_ICONS: MateriaIconDef[] = [
  { match: ['quimica', 'química', 'chemistry', 'ciencia'], icon: FlaskConical, box: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { match: ['biologia', 'biología', 'biology'], icon: Dna, box: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300' },
  { match: ['fisica', 'física', 'physics'], icon: Atom, box: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300' },
  { match: ['informatica', 'informática', 'computacion', 'computación', 'tics', 'tech'], icon: Monitor, box: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300' },
  { match: ['arduino', 'robotica', 'robótica', 'codigo', 'código', 'programacion', 'programación'], icon: Code2, box: 'bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300' },
  { match: ['matematica', 'matemática', 'math'], icon: Calculator, box: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300' },
];

function getMateriaIcon(nombre?: string): MateriaIconDef {
  const n = (nombre || '').toLowerCase();
  const found = MATERIA_ICONS.find(m => m.match.some(k => n.includes(k)));
  return found ?? { match: [], icon: FlaskConical, box: 'bg-slate-50 text-slate-500 dark:bg-slate-700 dark:text-slate-300' };
}

const MATERIA_LABELS: Record<string, string> = {
  quimica: 'Química',
  biologia: 'Biología',
  fisica: 'Física',
  informatica: 'Informática',
  arduino: 'Arduino',
  matematica: 'Matemática',
};

function materiaCoincide(nombre?: string, key?: string): boolean {
  if (!key) return true;
  const def = MATERIA_ICONS.find(m => m.match[0] === key);
  if (!def) return true;
  const n = (nombre || '').toLowerCase();
  return def.match.some(k => n.includes(k));
}

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ElementType;
  tint: string;
}

function KpiCard({ label, value, icon: Icon, tint }: KpiCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</div>
        <div className="font-display text-2xl font-black leading-tight text-slate-900 dark:text-white">{value}</div>
      </div>
    </div>
  );
}

function extractGradeNumber(g: string) {
  const n = parseInt(g, 10);
  return isNaN(n) ? 999 : n;
}

export default function DocenteProyectosCRUD() {
  const { proyectos, loading, eliminarProyecto } = useProyectos();

  const [search, setSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoProyecto | ''>('');
  const [filtroGrado, setFiltroGrado] = useState('');
  const [filtroSeccion, setFiltroSeccion] = useState('');
  const [filtroMateria, setFiltroMateria] = useState('');

  const [vista, setVista] = useState<'lista' | 'form' | 'actividades'>('lista');
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);
  const [proyectoParaActividades, setProyectoParaActividades] = useState<Proyecto | null>(null);

  const [modalEliminar, setModalEliminar] = useState<Proyecto | null>(null);
  const [motivoEliminar, setMotivoEliminar] = useState('');
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  // Orden numérico para grados (igual criterio que el admin)
  const grados = useMemo(
    () => [...new Set(proyectos.map(p => p.grado))].sort((a, b) => extractGradeNumber(a) - extractGradeNumber(b)),
    [proyectos]
  );
  const secciones = useMemo(
    () => [...new Set(proyectos.map(p => p.seccion))].sort(),
    [proyectos]
  );
  const estados = useMemo(
    () => [...new Set(proyectos.map(p => p.estado))] as EstadoProyecto[],
    [proyectos]
  );

  // Detección de duplicados (mismo título + grado + sección)
  const clavesDuplicadas = useMemo(() => {
    const map = new Map<string, number>();
    proyectos.forEach(p => {
      const key = `${p.titulo.trim().toLowerCase()}|${p.grado}|${p.seccion}`.toLowerCase();
      map.set(key, (map.get(key) || 0) + 1);
    });
    return new Set([...map.entries()].filter(([, n]) => n > 1).map(([k]) => k));
  }, [proyectos]);
  const duplicadosCount = useMemo(() => {
    const set = new Set<string>();
    proyectos.forEach(p => {
      const key = `${p.titulo.trim().toLowerCase()}|${p.grado}|${p.seccion}`.toLowerCase();
      if (clavesDuplicadas.has(key)) set.add(p.id);
    });
    return set.size;
  }, [proyectos, clavesDuplicadas]);
  function esDuplicado(p: Proyecto) {
    return clavesDuplicadas.has(
      `${p.titulo.trim().toLowerCase()}|${p.grado}|${p.seccion}`.toLowerCase()
    );
  }

  const kpis = useMemo(() => {
    const count = (e: EstadoProyecto) => proyectos.filter(p => p.estado === e).length;
    return {
      total: proyectos.length,
      registrado: count('registrado'),
      aprobado: count('aprobado_oficial') + count('materia_validada'),
      rechazado: count('rechazado_materia'),
      duplicados: duplicadosCount,
    };
  }, [proyectos, duplicadosCount]);

  const listaFiltrada = useMemo(() => {
    const term = search.trim().toLowerCase();
    return proyectos.filter(p => {
      if (term && !p.titulo.toLowerCase().includes(term) &&
        !`${p.grado} ${p.seccion}`.toLowerCase().includes(term)) return false;
      if (filtroEstado && p.estado !== filtroEstado) return false;
      if (filtroGrado && p.grado !== filtroGrado) return false;
      if (filtroSeccion && p.seccion !== filtroSeccion) return false;
      if (filtroMateria && !materiaCoincide(p.materia_nombre, filtroMateria)) return false;
      return true;
    });
  }, [proyectos, search, filtroEstado, filtroGrado, filtroSeccion, filtroMateria]);

  // Reset de página al cambiar filtros/búsqueda
  useEffect(() => { setPage(1); }, [search, filtroEstado, filtroGrado, filtroSeccion, filtroMateria]);

  const totalPages = Math.max(1, Math.ceil(listaFiltrada.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = listaFiltrada.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);
  const firstItem = (safePage - 1) * PER_PAGE + 1;
  const lastItem = Math.min(listaFiltrada.length, safePage * PER_PAGE);

  const hayFiltros = !!(filtroEstado || filtroGrado || filtroSeccion || search || filtroMateria);
  function limpiarFiltros() {
    setFiltroEstado(''); setFiltroGrado(''); setFiltroSeccion(''); setSearch(''); setFiltroMateria('');
  }

  async function confirmarEliminar() {
    if (!modalEliminar) return;
    const res = await eliminarProyecto(
      modalEliminar.id,
      motivoEliminar || 'Eliminado desde gestión de proyectos (docente)'
    );
    if (res.error) {
      setMsg({ tipo: 'error', texto: res.error });
    } else {
      setMsg({ tipo: 'ok', texto: 'Proyecto eliminado correctamente.' });
    }
    setModalEliminar(null);
    setMotivoEliminar('');
    setTimeout(() => setMsg(null), 3000);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      {vista === 'actividades' ? (
        <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          <button
            onClick={() => { setVista('lista'); setProyectoParaActividades(null); }}
            className="btn-secondary rounded-xl px-3.5 py-1.5 text-xs font-bold dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a proyectos
          </button>
          <ActividadEvaluada proyectoInicial={proyectoParaActividades ?? undefined} />
        </div>
      ) : (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="module-header mb-4">
          <div className="module-title-group">
            <div className="module-icon bg-indigo-100 dark:bg-indigo-500/15">
              <Medal className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <div>
              <h1 className="module-title">Gestión de Proyectos</h1>
              <p className="module-subtitle">
                {proyectos.length} proyecto(s) · {duplicadosCount} duplicado(s) detectado(s)
              </p>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium mb-4 fade-in ${
            msg.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {msg.tipo === 'ok' ? '✓' : '✕'} {msg.texto}
          </div>
        )}

        {/* KPI cards (estilo OmniDash / diseno) */}
        <div className="grid grid-cols-2 gap-3 mb-4 fade-in-up lg:grid-cols-4">
          <KpiCard
            label="Total"
            value={kpis.total}
            icon={Medal}
            tint="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
          />
          <KpiCard
            label="Registrados"
            value={kpis.registrado}
            icon={ClipboardCheck}
            tint="bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400"
          />
          <KpiCard
            label="Aprobados"
            value={kpis.aprobado}
            icon={CheckCircle2}
            tint="bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400"
          />
          <KpiCard
            label="Duplicados"
            value={kpis.duplicados}
            icon={AlertTriangle}
            tint="bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400"
          />
        </div>

        {/* Buscador + Nuevo */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 fade-in-up">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="form-input pl-11 py-3 text-base w-full"
              placeholder="Buscar por nombre del proyecto o grado/sección..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn-primary sm:w-auto flex items-center justify-center gap-2 shrink-0"
            onClick={() => { setProyectoActivo(null); setVista('form'); }}
          >
            <Plus className="w-4 h-4" /> Nuevo proyecto
          </button>
        </div>

        {/* Filtro por materia (iconos) */}
        <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm fade-in-up dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Materia</span>
            {filtroMateria && (
              <button
                onClick={() => setFiltroMateria('')}
                className="ml-auto text-xs font-semibold text-primary hover:underline"
              >
                Limpiar filtro
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFiltroMateria('')}
              className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroMateria === '' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
              Todas
            </button>
            {MATERIA_ICONS.map(m => {
              const Icon = m.icon;
              const active = filtroMateria === m.match[0];
              return (
                <button
                  key={m.match[0]}
                  onClick={() => setFiltroMateria(active ? '' : m.match[0])}
                  title={MATERIA_LABELS[m.match[0]]}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${active ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                  <Icon className="h-4 w-4" />
                  {MATERIA_LABELS[m.match[0]]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Barra de filtros estilo admin: chips segmentados con conteo */}
        <div className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm fade-in-up dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Filtros</span>
            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                className="ml-auto text-xs font-semibold text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start gap-4">
            {/* Estado */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Estado</div>
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex-wrap dark:bg-slate-800 dark:border-slate-700">
                <button
                  onClick={() => setFiltroEstado('')}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroEstado === '' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                  Todos
                </button>
                {estados.map(e => (
                  <button
                    key={e}
                    onClick={() => setFiltroEstado(filtroEstado === e ? '' : e)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroEstado === e ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                    {e === 'aprobado_oficial' ? 'Aprobado' : (ESTADOS_PROYECTO[e]?.label || e)}
                  </button>
                ))}
              </div>
            </div>

            {/* Grado */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Grado</div>
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex-wrap dark:bg-slate-800 dark:border-slate-700">
                <button
                  onClick={() => setFiltroGrado('')}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroGrado === '' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                  Todos
                </button>
                {grados.map(g => (
                  <button
                    key={g}
                    onClick={() => setFiltroGrado(filtroGrado === g ? '' : g)}
                    className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroGrado === g ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Sección */}
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Sección</div>
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 flex-wrap dark:bg-slate-800 dark:border-slate-700">
                <button
                  onClick={() => setFiltroSeccion('')}
                  className={`rounded-full border px-4 py-1.5 text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroSeccion === '' ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                  Todos
                </button>
                {secciones.map(s => (
                  <button
                    key={s}
                    onClick={() => setFiltroSeccion(filtroSeccion === s ? '' : s)}
                    className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold transition-all cursor-pointer dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 ${filtroSeccion === s ? 'bg-primary text-white border-primary' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Lista de proyectos (filas estilo OmniDash / diseno) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white fade-in dark:border-slate-700 dark:bg-slate-800">
          {loading && (
            <div className="px-5 py-10 text-center text-sm text-slate-400">Cargando...</div>
          )}
          {!loading && listaFiltrada.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400">
              <Copy className="mx-auto mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">No hay proyectos que coincidan.</p>
            </div>
          )}
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:border-slate-700/60">
            <div className="h-9 w-9 shrink-0" />
            <span className="min-w-0 flex-1">Proyecto</span>
            <span className="hidden w-28 shrink-0 sm:block">Estado</span>
            <span className="hidden w-20 shrink-0 text-right md:block">Integrantes</span>
            <span className="w-[92px] shrink-0 text-right">Acciones</span>
          </div>
          <div>
            {paginated.map(p => {
              const dup = esDuplicado(p);
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-700/60 dark:hover:bg-slate-700/40"
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getMateriaIcon(p.materia_nombre).box}`}>
                    {(() => {
                      const Mi = getMateriaIcon(p.materia_nombre).icon;
                      return <Mi className="h-4 w-4" />;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{p.titulo}</span>
                      {dup && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> Duplicado
                        </span>
                      )}
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      {p.materia_nombre} · {p.grado} {p.seccion}
                    </div>
                  </div>

                  <span className={`status-badge hidden sm:inline-flex ${BADGE[p.estado] ?? 'badge-slate'}`}>
                    {ESTADOS_PROYECTO[p.estado]?.label || p.estado}
                  </span>

                  <span className="hidden w-20 shrink-0 text-right text-xs font-medium text-slate-500 dark:text-slate-400 md:block">
                    {p.integrantes_detalle?.length ?? 0} int.
                  </span>

                  <div className="flex shrink-0 gap-1">
                    <button
                      className="rounded-lg p-1.5 transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-500/15"
                      title="Actividades / Rúbrica"
                      onClick={() => { setProyectoParaActividades(p); setVista('actividades'); }}
                    >
                      <ListChecks className="h-4 w-4 text-indigo-500" />
                    </button>
                    <button
                      className="rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-600/50"
                      title="Editar"
                      onClick={() => { setProyectoActivo(p); setVista('form'); }}
                    >
                      <Pencil className="h-4 w-4 text-slate-500" />
                    </button>
                    <button
                      className="rounded-lg p-1.5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/15"
                      title="Eliminar"
                      onClick={() => setModalEliminar(p)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
           </div>
         </div>

        {/* Paginación (estilo tabla de alumnos del admin) */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 py-3.5 shadow-sm max-w-5xl mx-auto dark:border-slate-700 dark:bg-slate-800">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Mostrando {firstItem}-{lastItem} de {listaFiltrada.length} proyectos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="btn-secondary rounded-xl px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              >
                Anterior
              </button>
              <span className="px-3 text-xs font-bold text-slate-600 dark:text-slate-300">Página {safePage} de {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="btn-secondary rounded-xl px-3.5 py-1.5 text-xs font-bold disabled:opacity-40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              >
                Siguiente
              </button>
            </div>
           </div>
        )}
      </div>
      )}

      {/* Modal: Nuevo / Editar proyecto (estilo admin) */}
      <AnimatePresence>
        {vista === 'form' && (
          <div className="modal-backdrop" onClick={() => { setVista('lista'); setProyectoActivo(null); }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="modal-container max-w-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                    <Copy className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="modal-title">{proyectoActivo ? 'Editar proyecto' : 'Nuevo proyecto'}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => { setVista('lista'); setProyectoActivo(null); }}
                  className="modal-close-btn"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body">
                <FormularioProyecto
                  proyectoInicial={proyectoActivo}
                  onCancel={() => { setVista('lista'); setProyectoActivo(null); }}
                  onSuccess={() => { setVista('lista'); setProyectoActivo(null); }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Eliminar proyecto (estilo admin) */}
      <AnimatePresence>
        {modalEliminar && (
          <div className="modal-backdrop" onClick={() => setModalEliminar(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="modal-container max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="modal-title">Eliminar proyecto</h3>
                </div>
                <button type="button" onClick={() => setModalEliminar(null)} className="modal-close-btn">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="modal-body space-y-3">
                <p className="text-sm text-slate-600">
                  ¿Seguro que deseas eliminar <strong>{modalEliminar.titulo}</strong> ({modalEliminar.grado} {modalEliminar.seccion})?
                  Esta acción no se puede deshacer.
                </p>
                <div>
                  <label className="form-label">Motivo (opcional)</label>
                  <textarea
                    className="form-input min-h-[60px] resize-y"
                    value={motivoEliminar}
                    onChange={e => setMotivoEliminar(e.target.value)}
                    placeholder="Ej: proyecto duplicado"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setModalEliminar(null)} className="btn-secondary">Cancelar</button>
                <button type="button" className="btn-danger" onClick={confirmarEliminar}>
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
