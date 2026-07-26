import { useState } from 'react';
import { useProyectos } from '../../hooks/useProyectos';
import { useAuth } from '../../contexts/AuthContext';
import { Proyecto, ESTADOS_PROYECTO, MATERIAS_PROYECTO, UserRole } from '../../types';
import FormularioProyecto from './FormularioProyecto';
import Historial from './Historial';
import SugerenciaInformatica from './SugerenciaInformatica';
import {
  Medal, Plus, ChevronDown, ChevronUp, Clock, CheckCircle2,
  XCircle, FlaskConical, Search, Eye
} from 'lucide-react';

type ProjectView = 'admin' | 'coordinacion' | 'docente' | 'alumno';

interface Props {
  view: ProjectView;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-amber-100 text-amber-800',
  purple: 'bg-purple-100 text-purple-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-600',
};

export default function ProjectsModule({ view, compact = false }: Props) {
  const { userProfile } = useAuth();
  const {
    proyectos, loading, aprobarMateria, reclasificar,
    rechazarMateria, aprobarOficial, rechazarOficial
  } = useProyectos();

  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);
  const [modal, setModal] = useState<{ tipo: string; proyectoId: string } | null>(null);
  const [formModal, setFormModal] = useState({ materia: '', comentario: '' });
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const rol = userProfile?.role;

  const stats = {
    total: proyectos.length,
    aprobados: proyectos.filter(p => p.estado === 'aprobado_oficial').length,
    pendientes: proyectos.filter(p => ['registrado', 'en_revision_materia', 'en_coordinacion'].includes(p.estado)).length,
    rechazados: proyectos.filter(p => p.estado.startsWith('rechazado')).length,
  };

  const proyectosFiltrados = proyectos.filter(p => {
    const matchBusqueda = !busqueda ||
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.grado.includes(busqueda);
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const visibleProyectos = expanded ? proyectosFiltrados : proyectosFiltrados.slice(0, 3);

  async function ejecutarAccion(accion: 'aprobar' | 'reclasificar' | 'rechazar' | 'aprobar_oficial' | 'rechazar_oficial') {
    if (!modal) return;
    const id = modal.proyectoId;
    let res;
    if (accion === 'aprobar') res = await aprobarMateria(id, { materia_id: formModal.materia, comentario: formModal.comentario });
    else if (accion === 'reclasificar') res = await reclasificar(id, { materia_id: formModal.materia, comentario: formModal.comentario });
    else if (accion === 'rechazar') res = await rechazarMateria(id, formModal.comentario);
    else if (accion === 'aprobar_oficial') res = await aprobarOficial(id);
    else res = await rechazarOficial(id, formModal.comentario);

    if (res.error) { setMsg({ tipo: 'error', texto: res.error }); return; }
    setModal(null);
    setMsg({ tipo: 'ok', texto: 'Acción registrada.' });
    setTimeout(() => setMsg(null), 3000);
  }

  if (showForm) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
        <FormularioProyecto
          proyectoInicial={proyectoActivo}
          onCancel={() => { setShowForm(false); setProyectoActivo(null); }}
          onSuccess={() => { setShowForm(false); setProyectoActivo(null); }}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Medal className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Semana de la Juventud</h3>
              <p className="text-[10px] text-slate-400">{stats.total} proyectos registrados</p>
            </div>
          </div>
          {view === 'alumno' && (
            <button
              className="text-xs px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-1"
              onClick={() => { setProyectoActivo(null); setShowForm(true); }}>
              <Plus className="w-3 h-3" /> Nuevo
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-px bg-slate-100">
        {[
          { num: stats.total, label: 'Total', color: 'text-slate-700' },
          { num: stats.aprobados, label: 'Aprobados', color: 'text-emerald-600' },
          { num: stats.pendientes, label: 'Pendientes', color: 'text-amber-600' },
          { num: stats.rechazados, label: 'Rechazados', color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white py-2 text-center">
            <div className={`text-base font-bold ${s.color}`}>{s.num}</div>
            <div className="text-[9px] text-slate-400 font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {msg && (
        <div className={`mx-5 mt-3 px-3 py-2 rounded-lg text-xs font-medium ${
          msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {msg.tipo === 'ok' ? '✓' : '✕'} {msg.texto}
        </div>
      )}

      {/* Filters (admin/coordinacion) */}
      {(view === 'admin' || view === 'coordinacion') && (
        <div className="px-5 pt-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:border-orange-300"
              placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          </div>
          <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 focus:outline-none"
            value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      )}

      {/* Project list */}
      <div className="px-5 py-3">
        {loading && <p className="text-xs text-slate-400 text-center py-4">Cargando...</p>}

        {!loading && proyectosFiltrados.length === 0 && (
          <div className="text-center py-6 text-slate-300">
            <FlaskConical className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No hay proyectos</p>
          </div>
        )}

        {!loading && visibleProyectos.map(p => (
          <ProyectoRow
            key={p.id}
            proyecto={p}
            rol={rol}
            view={view}
            onRevisar={() => {
              const tipoModal = view === 'coordinacion' ? 'coordinacion' : 'docente';
              setModal({ tipo: tipoModal, proyectoId: p.id });
              setFormModal({ materia: p.materia_id, comentario: '' });
            }}
            onVerDetalle={() => { setProyectoActivo(p); setShowForm(true); }}
          />
        ))}

        {proyectosFiltrados.length > 3 && (
          <button
            className="w-full text-xs text-slate-400 hover:text-slate-600 py-2 flex items-center justify-center gap-1 transition-colors"
            onClick={() => setExpanded(v => !v)}>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ver menos' : `Ver ${proyectosFiltrados.length - 3} más`}
          </button>
        )}
      </div>

      {/* Modal docente */}
      {modal?.tipo === 'docente' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <ModalDocente
            proyectos={proyectos}
            modal={modal}
            formModal={formModal}
            setFormModal={setFormModal}
            onAccion={ejecutarAccion}
            onCancel={() => setModal(null)}
          />
        </ModalOverlay>
      )}

      {/* Modal coordinación */}
      {modal?.tipo === 'coordinacion' && (
        <ModalOverlay onClose={() => setModal(null)}>
          <ModalCoordinacion
            proyectos={proyectos}
            modal={modal}
            formModal={formModal}
            setFormModal={setFormModal}
            onAccion={ejecutarAccion}
            onCancel={() => setModal(null)}
          />
        </ModalOverlay>
      )}
    </div>
  );
}

function ProyectoRow({ proyecto: p, rol, view, onRevisar, onVerDetalle }: {
  proyecto: Proyecto; rol?: string; view: string;
  onRevisar: () => void; onVerDetalle: () => void;
}) {
  const canRevisar =
    (view === 'docente' && ['registrado', 'en_revision_materia'].includes(p.estado)) ||
    (view === 'coordinacion' && p.estado === 'en_coordinacion');

  const statusKey = ESTADOS_PROYECTO[p.estado]?.color ?? 'gray';

  return (
    <div className="py-2.5 border-b border-slate-50 last:border-0 flex items-center gap-3 group">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-800 truncate">{p.titulo}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">
          {p.grado} {p.seccion} · {p.materia_nombre}
          {p.integrantes_detalle && ` · ${p.integrantes_detalle.length} integrantes`}
        </div>
      </div>
      <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[statusKey]}`}>
        {ESTADOS_PROYECTO[p.estado]?.label}
      </span>
      <div className="flex gap-1 shrink-0">
        {canRevisar && (
          <button className="text-[10px] px-2 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md hover:bg-orange-100 transition-colors"
            onClick={e => { e.stopPropagation(); onRevisar(); }}>
            Revisar
          </button>
        )}
        <button className="text-[10px] px-2 py-1 bg-slate-50 text-slate-500 border border-slate-200 rounded-md hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onVerDetalle(); }}>
          <Eye className="w-3 h-3 inline" />
        </button>
      </div>
    </div>
  );
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto shadow-xl p-5"
        onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalDocente({ proyectos, modal, formModal, setFormModal, onAccion, onCancel }: any) {
  const p = proyectos.find((x: Proyecto) => x.id === modal.proyectoId);
  if (!p) return null;

  return (
    <>
      <h3 className="text-sm font-bold text-slate-900 mb-3">Revisión de materia</h3>
      <InfoRow label="Proyecto" value={p.titulo} />
      <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
      <InfoRow label="Materia" value={p.materia_nombre} />

      <div className="mb-3 mt-3">
        <label className="text-xs font-medium text-slate-500 mb-1 block">Materia confirmada</label>
        <select className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
          value={formModal.materia} onChange={e => setFormModal(f => ({ ...f, materia: e.target.value }))}>
          {MATERIAS_PROYECTO.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label className="text-xs font-medium text-slate-500 mb-1 block">Comentarios</label>
        <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 min-h-[60px] resize-y"
          value={formModal.comentario} onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
          placeholder="Observaciones..." />
      </div>
      <div className="flex gap-2 justify-end">
        <button className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg" onClick={onCancel}>Cancelar</button>
        <button className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg"
          onClick={() => onAccion('reclasificar')}>Reclasificar</button>
        <button className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg"
          onClick={() => onAccion('rechazar')}>Rechazar</button>
        <button className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg"
          onClick={() => onAccion('aprobar')}>Aprobar</button>
      </div>
    </>
  );
}

function ModalCoordinacion({ proyectos, modal, formModal, setFormModal, onAccion, onCancel }: any) {
  const p = proyectos.find((x: Proyecto) => x.id === modal.proyectoId);
  if (!p) return null;

  return (
    <>
      <h3 className="text-sm font-bold text-slate-900 mb-3">Aprobación oficial</h3>
      <InfoRow label="Proyecto" value={p.titulo} />
      <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
      <InfoRow label="Materia" value={p.materia_nombre} />
      <InfoRow label="Integrantes" value={`${p.integrantes_detalle?.length ?? 0}`} />

      <div className="mb-4 mt-3">
        <label className="text-xs font-medium text-slate-500 mb-1 block">Motivo de rechazo (si aplica)</label>
        <textarea className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 min-h-[60px] resize-y"
          value={formModal.comentario} onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
          placeholder="Solo si rechazas..." />
      </div>
      <div className="flex gap-2 justify-end">
        <button className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg" onClick={onCancel}>Cancelar</button>
        <button className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg"
          onClick={() => onAccion('rechazar_oficial')}>Rechazar</button>
        <button className="text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg"
          onClick={() => onAccion('aprobar_oficial')}>Aprobar</button>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-1.5 text-xs border-b border-slate-50 last:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}
