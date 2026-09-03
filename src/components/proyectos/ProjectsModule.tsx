import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useProyectos } from '../../hooks/useProyectos';
import { useAuth } from '../../contexts/AuthContext';
import { Proyecto, ESTADOS_PROYECTO, UserRole, Subject } from '../../types';
import { getAllSubjects } from '../../lib/firestore';
import FormularioProyecto from './FormularioProyecto';
import Historial from './Historial';
import SugerenciaInformatica from './SugerenciaInformatica';
import ActividadEvaluada from './ActividadEvaluada';
import {
  Medal, Plus, ChevronDown, ChevronUp, Clock, CheckCircle2,
  XCircle, FlaskConical, Search, Eye, Award, ClipboardCheck,
  TrendingUp, Users, AlertTriangle, ChevronLeft, ChevronRight,
  Calendar, Trash2, Atom, Dna, Monitor, Code2, Calculator
} from 'lucide-react';
import { TIPOS_ACTIVIDAD } from '../../types';

type ProjectView = 'admin' | 'coordinacion' | 'docente' | 'alumno';

interface Props {
  view: ProjectView;
  compact?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-slate-100 text-slate-700',
  purple: 'bg-purple-100 text-purple-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-600',
};

interface MateriaIconDef {
  match: string[];
  icon: React.ComponentType<{ className?: string }>;
  box: string;
}

const MATERIA_ICONS: MateriaIconDef[] = [
  { match: ['quimica', 'química', 'chemistry', 'ciencia'], icon: FlaskConical, box: 'bg-emerald-100 text-emerald-600' },
  { match: ['biologia', 'biología', 'biology'], icon: Dna, box: 'bg-green-100 text-green-600' },
  { match: ['fisica', 'física', 'physics'], icon: Atom, box: 'bg-blue-100 text-blue-600' },
  { match: ['informatica', 'informática', 'computacion', 'computación', 'tics', 'tech'], icon: Monitor, box: 'bg-indigo-100 text-indigo-600' },
  { match: ['arduino', 'robotica', 'robótica', 'codigo', 'código', 'programacion', 'programación'], icon: Code2, box: 'bg-orange-100 text-orange-600' },
  { match: ['matematica', 'matemática', 'math'], icon: Calculator, box: 'bg-purple-100 text-purple-600' },
];

function getMateriaIcon(nombre?: string): MateriaIconDef {
  const n = (nombre || '').toLowerCase();
  const found = MATERIA_ICONS.find(m => m.match.some(k => n.includes(k)));
  return found ?? { match: [], icon: FlaskConical, box: 'bg-slate-100 text-slate-500' };
}

export default function ProjectsModule({ view, compact = false }: Props) {
  const { userProfile } = useAuth();
  const {
    proyectos, loading, aprobarMateria, reclasificar,
    rechazarMateria, aprobarOficial, rechazarOficial, eliminarProyecto
  } = useProyectos();

  const [materias, setMaterias] = useState<Subject[]>([]);

  useEffect(() => {
    getAllSubjects().then(setMaterias).catch(console.error);
  }, []);

  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);
  const [modal, setModal] = useState<{ tipo: string; proyectoId: string } | null>(null);
  const [formModal, setFormModal] = useState({ materia: '', comentario: '' });
  const [deleteModal, setDeleteModal] = useState<{ proyecto: Proyecto; motivo: string } | null>(null);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [activeTab, setActiveTab] = useState<'proyectos' | 'actividades'>('proyectos');

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

  async function handleEliminar() {
    if (!deleteModal || !deleteModal.motivo.trim()) return;
    const res = await eliminarProyecto(deleteModal.proyecto.id, deleteModal.motivo.trim());
    if (res.error) {
      setMsg({ tipo: 'error', texto: res.error });
    } else {
      setDeleteModal(null);
      setMsg({ tipo: 'ok', texto: 'Proyecto eliminado correctamente.' });
    }
    setTimeout(() => setMsg(null), 3000);
  }

  if (showForm) {
    return (
      <div className="card-crema p-6">
        <FormularioProyecto
          proyectoInicial={proyectoActivo}
          onCancel={() => { setShowForm(false); setProyectoActivo(null); }}
          onSuccess={() => { setShowForm(false); setProyectoActivo(null); }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banner - Estilo Admin Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="relative rounded-3xl bg-gradient-to-r from-[#124D37] via-[#25855A] to-[#38A169] text-white p-7 md:p-9 shadow-xl shadow-emerald-900/10 overflow-hidden"
      >
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-32 h-32 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />
        <Medal className="absolute right-6 top-1/2 -translate-y-1/2 w-28 h-28 text-white/10 pointer-events-none" strokeWidth={1.5} />

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-emerald-200">
            <Medal className="w-3.5 h-3.5" />
            Semana de la Juventud 2026
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold font-display leading-tight">
            {view === 'alumno' ? 'Mi Proyecto' : 'Gestión de Proyectos'}
          </h2>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            {view === 'alumno' 
              ? 'Revisa el estado de tu proyecto y las evaluaciones de tus docentes.'
              : 'Administra los proyectos estudiantiles, aprueba materiales y califica actividades.'}
          </p>
          
          {(view === 'alumno' || view === 'docente') && activeTab === 'proyectos' && (
            <div className="pt-2">
              <button
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-emerald-700 font-bold text-sm hover:bg-emerald-50 transition-all active:scale-95 shadow-md shadow-emerald-900/10 font-display"
                onClick={() => { setProyectoActivo(null); setShowForm(true); }}>
                <Plus className="w-4 h-4" />
                Nuevo Proyecto
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Tabs para docentes y alumnos */}
      {(view === 'docente' || view === 'alumno') && (
        <div className="flex gap-2">
          <button
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'proyectos'
                ? 'bg-orange-100 text-orange-700 border border-orange-200 shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
            onClick={() => setActiveTab('proyectos')}>
            <FlaskConical className="w-4 h-4 inline mr-2" />
            Proyectos
          </button>
          <button
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'actividades'
                ? 'bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm'
                : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
            }`}
            onClick={() => setActiveTab('actividades')}>
            <Award className="w-4 h-4 inline mr-2" />
            {view === 'alumno' ? 'Mis Evaluaciones' : 'Actividades Evaluadas'}
          </button>
        </div>
      )}

      {/* Stats Cards - Estilo Admin Dashboard */}
      {activeTab === 'proyectos' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {[
            { label: 'Total', value: stats.total, icon: Medal, accent: 'bg-slate-50 text-slate-600 border-slate-200' },
            { label: 'Aprobados', value: stats.aprobados, icon: CheckCircle2, accent: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
            { label: 'Pendientes', value: stats.pendientes, icon: Clock, accent: 'bg-amber-50 text-amber-600 border-amber-200' },
            { label: 'Rechazados', value: stats.rechazados, icon: AlertTriangle, accent: 'bg-red-50 text-red-600 border-red-200' },
          ].map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="stat-card"
            >
              <div className={`stat-card-icon ${card.accent}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <span className="stat-card-label">{card.label}</span>
                <div className="stat-card-value">{card.value}</div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {msg && (
        <div className={`px-5 py-3 rounded-xl text-sm font-medium ${
          msg.tipo === 'ok' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {msg.tipo === 'ok' ? '✓' : '✕'} {msg.texto}
        </div>
      )}

      {/* Vista de Actividades Evaluadas */}
      {activeTab === 'actividades' && view === 'docente' && (
        <div className="card-crema rounded-3xl p-6">
          <ActividadEvaluada />
        </div>
      )}
      {activeTab === 'actividades' && view === 'alumno' && (
        <EvaluacionesAlumno />
      )}

      {/* Vista de Proyectos */}
      {activeTab === 'proyectos' && (
        <div className="card-crema rounded-3xl">
          {/* Filters (admin/coordinacion) */}
          {(view === 'admin' || view === 'coordinacion') && (
            <div className="p-5 border-b border-slate-100 flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input                  className="input-crema text-sm pl-10"
                  placeholder="Buscar proyectos..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
              </div>
              <select                 className="input-crema text-sm"
                value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                {Object.entries(ESTADOS_PROYECTO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          )}

          {/* Project list */}
          <div className="p-5">
            {loading && (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && proyectosFiltrados.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-base font-medium">No hay proyectos</p>
                <p className="text-sm text-slate-300 mt-1">Crea uno para comenzar</p>
              </div>
            )}

            {!loading && visibleProyectos.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ProyectoRow
                  proyecto={p}
                  rol={rol}
                  view={view}
                  materias={materias}
                  onRevisar={() => {
                    const tipoModal = view === 'coordinacion' ? 'coordinacion' : 'docente';
                    setModal({ tipo: tipoModal, proyectoId: p.id });
                    setFormModal({ materia: p.materia_id, comentario: '' });
                  }}
                  onVerDetalle={() => { setProyectoActivo(p); setShowForm(true); }}
                  onDelete={view === 'docente' ? () => setDeleteModal({ proyecto: p, motivo: '' }) : undefined}
                />
              </motion.div>
            ))}

            {proyectosFiltrados.length > 3 && (
              <button
                className="w-full text-sm text-slate-500 hover:text-slate-700 py-3 flex items-center justify-center gap-2 transition-colors border-t border-slate-100 mt-4"
                onClick={() => setExpanded(v => !v)}>
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {expanded ? 'Ver menos' : `Ver ${proyectosFiltrados.length - 3} más`}
              </button>
            )}
          </div>
        </div>
      )}

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

      {/* Modal eliminar proyecto */}
      {deleteModal && (
        <ModalOverlay onClose={() => setDeleteModal(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Eliminar Proyecto</h3>
                <p className="text-sm text-slate-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-700">{deleteModal.proyecto.titulo}</p>
              <p className="text-xs text-slate-500 mt-1">
                {deleteModal.proyecto.grado} {deleteModal.proyecto.seccion} · {deleteModal.proyecto.materia_nombre}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                Motivo de eliminación *
              </label>
              <textarea
                 className="input-crema min-h-[80px] resize-none text-sm"
                placeholder="Describe el motivo por el cual se elimina este proyecto..."
                value={deleteModal.motivo}
                onChange={e => setDeleteModal({ ...deleteModal, motivo: e.target.value })}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                className="btn-secondary text-xs"
                onClick={() => setDeleteModal(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger text-xs"
                disabled={!deleteModal.motivo.trim()}
                onClick={handleEliminar}
              >
                Eliminar Proyecto
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

function ProyectoRow({ proyecto: p, rol, view, materias, onRevisar, onVerDetalle, onDelete }: {
  proyecto: Proyecto; rol?: string; view: string; materias: Subject[];
  onRevisar: () => void; onVerDetalle: () => void; onDelete?: () => void;
}) {
  const canRevisar =
    (view === 'docente' && ['borrador', 'registrado', 'en_revision_materia'].includes(p.estado)) ||
    (view === 'coordinacion' && p.estado === 'en_coordinacion');
  const canDelete = view === 'docente' && onDelete;

  const statusKey = ESTADOS_PROYECTO[p.estado]?.color ?? 'gray';
  const materiaIcon = getMateriaIcon(p.materia_nombre);
  const MateriaIcon = materiaIcon.icon;

  return (
    <div className="py-4 border-b border-slate-100 last:border-0 flex items-center gap-4 group hover:bg-slate-50 -mx-5 px-5 transition-colors">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${materiaIcon.box}`}>
        <MateriaIcon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-base font-semibold text-slate-900 truncate">{p.titulo}</div>
        <div className="text-sm text-slate-500 mt-1">
          {p.grado} {p.seccion}
          {p.integrantes_detalle && ` · ${p.integrantes_detalle.length} integrantes`}
          {p.representante_nombre && ` · Líder: ${p.representante_nombre}`}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            {p.materia_nombre}
          </span>
          {p.materias_secundarias?.map(mId => {
            const mat = materias.find(m => m.id === mId);
            return mat ? (
              <span key={mId} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                {mat.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <span className={`text-xs px-3 py-1 rounded-full font-semibold shrink-0 ${STATUS_COLORS[statusKey]}`}>
        {ESTADOS_PROYECTO[p.estado]?.label}
      </span>
      <div className="flex gap-2 shrink-0">
        {canRevisar && (
          <button className="text-sm px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors font-medium"
            onClick={e => { e.stopPropagation(); onRevisar(); }}>
            Revisar
          </button>
        )}
        {canDelete && (
          <button className="text-sm px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100"
            onClick={e => { e.stopPropagation(); onDelete!(); }}>
            <Trash2 className="w-4 h-4 inline" />
          </button>
        )}
        <button className="text-sm px-3 py-2 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
          onClick={e => { e.stopPropagation(); onVerDetalle(); }}>
          <Eye className="w-4 h-4 inline" />
        </button>
      </div>
    </div>
  );
}

function ModalOverlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-lg"
        onClick={e => e.stopPropagation()}>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ModalDocente({ proyectos, modal, formModal, setFormModal, onAccion, onCancel }: any) {
  const [materias, setMaterias] = useState<Subject[]>([]);
  useEffect(() => { getAllSubjects().then(setMaterias).catch(console.error); }, []);
  const p = proyectos.find((x: Proyecto) => x.id === modal.proyectoId);
  if (!p) return null;

  return (
    <>
      <h3 className="text-lg font-bold text-slate-900 mb-4">Revisión de materia</h3>
      <InfoRow label="Proyecto" value={p.titulo} />
      <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
      <div className="py-3 border-b border-slate-100">
        <span className="text-sm text-slate-500">Materias</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            {p.materia_nombre}
          </span>
          {p.materias_secundarias?.map(mId => {
            const mat = materias.find(m => m.id === mId);
            return mat ? (
              <span key={mId} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                {mat.name}
              </span>
            ) : null;
          })}
        </div>
      </div>

      <div className="mb-4 mt-4">
        <label className="text-sm font-medium text-slate-600 mb-2 block">Materia confirmada</label>
        <select className="input-crema text-sm"
          value={formModal.materia} onChange={e => setFormModal(f => ({ ...f, materia: e.target.value }))}>
          {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="mb-5">
        <label className="text-sm font-medium text-slate-600 mb-2 block">Comentarios</label>
        <textarea className="input-crema text-sm min-h-[80px] resize-y"
          value={formModal.comentario} onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
          placeholder="Observaciones..." />
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary text-xs" onClick={onCancel}>Cancelar</button>
        <button className="px-5 py-2.5 text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
          onClick={() => onAccion('reclasificar')}>Reclasificar</button>
        <button className="btn-danger text-xs"
          onClick={() => onAccion('rechazar')}>Rechazar</button>
        <button className="px-5 py-2.5 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
          onClick={() => onAccion('aprobar')}>Aprobar</button>
      </div>
    </>
  );
}

function ModalCoordinacion({ proyectos, modal, formModal, setFormModal, onAccion, onCancel }: any) {
  const [materias, setMaterias] = useState<Subject[]>([]);
  useEffect(() => { getAllSubjects().then(setMaterias).catch(console.error); }, []);
  const p = proyectos.find((x: Proyecto) => x.id === modal.proyectoId);
  if (!p) return null;

  return (
    <>
      <h3 className="text-lg font-bold text-slate-900 mb-4">Aprobación oficial</h3>
      <InfoRow label="Proyecto" value={p.titulo} />
      <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
      <div className="py-3 border-b border-slate-100">
        <span className="text-sm text-slate-500">Materias</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
            {p.materia_nombre}
          </span>
          {p.materias_secundarias?.map(mId => {
            const mat = materias.find(m => m.id === mId);
            return mat ? (
              <span key={mId} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                {mat.name}
              </span>
            ) : null;
          })}
        </div>
      </div>
      <InfoRow label="Integrantes" value={`${p.integrantes_detalle?.length ?? 0}`} />

      <div className="mb-5 mt-4">
        <label className="text-sm font-medium text-slate-600 mb-2 block">Motivo de rechazo (si aplica)</label>
        <textarea className="input-crema text-sm min-h-[80px] resize-y"
          value={formModal.comentario} onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
          placeholder="Solo si rechazas..." />
      </div>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary text-xs" onClick={onCancel}>Cancelar</button>
        <button className="btn-danger text-xs"
          onClick={() => onAccion('rechazar_oficial')}>Rechazar</button>
        <button className="px-5 py-2.5 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors"
          onClick={() => onAccion('aprobar_oficial')}>Aprobar</button>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between py-3 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="font-medium text-sm text-slate-900 text-right max-w-[60%] truncate">{value || '—'}</span>
    </div>
  );
}

function EvaluacionesAlumno() {
  const { proyectos, loading } = useProyectos();
  const [materias, setMaterias] = useState<Subject[]>([]);

  useEffect(() => {
    getAllSubjects().then(setMaterias).catch(console.error);
  }, []);

  // Todas las actividades evaluadas aplanadas, sin envolver en card padre
  const actividades = proyectos
    .filter(p => p.actividades_evaluadas?.length)
    .flatMap(p => 
      (p.actividades_evaluadas || []).map(a => ({ actividad: a, proyecto: p }))
    );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (actividades.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="text-base font-medium">No tienes evaluaciones asignadas</p>
        <p className="text-sm text-slate-300 mt-1">Aparecerán cuando tu docente las publique</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cards separadas — una por actividad, sin contenedor padre */}
      {actividades.map(({ actividad, proyecto }) => (
        <ActividadCardAlumno
          key={`${proyecto.id}-${actividad.id}`}
          actividad={actividad}
          proyecto={proyecto}
          materias={materias}
        />
      ))}
    </div>
  );
}

function ActividadCardAlumno({ actividad, proyecto, materias }: {
  actividad: any;
  proyecto: Proyecto;
  materias: Subject[];
}) {
  const [showRubrica, setShowRubrica] = useState(false);
  
  const estadoColors: Record<string, string> = {
    borrador: 'bg-slate-100 text-slate-600',
    publicada: 'bg-blue-100 text-blue-700',
    entregada: 'bg-amber-100 text-amber-700',
    calificada: 'bg-emerald-100 text-emerald-700',
  };

  const escalaCalificacion: Record<number, { label: string; color: string }> = {
    1: { label: 'Deficiente', color: 'text-red-600 bg-red-50' },
    2: { label: 'En desarrollo', color: 'text-orange-600 bg-orange-50' },
    3: { label: 'Cumple parcialmente', color: 'text-amber-600 bg-amber-50' },
    4: { label: 'Cumple', color: 'text-emerald-600 bg-emerald-50' },
    5: { label: 'Superó expectativas', color: 'text-green-600 bg-green-50' },
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-slate-200/80 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="text-base font-bold text-slate-800">{actividad.titulo}</div>
          <div className="text-sm text-slate-400 mt-1">
            {actividad.materia_nombre} · {TIPOS_ACTIVIDAD[actividad.tipo_actividad]?.label || actividad.tipo_actividad}
          </div>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${estadoColors[actividad.estado] ?? 'bg-slate-100 text-slate-600'}`}>
          {actividad.estado.charAt(0).toUpperCase() + actividad.estado.slice(1)}
        </span>
        {actividad.calificacion_nota != null && (
          <span className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-100 text-emerald-700">
            Nota: {actividad.calificacion_nota}/10
          </span>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{actividad.descripcion}</p>

      {/* Instrucciones detalladas */}
      {actividad.instrucciones && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-xs font-bold text-blue-700 mb-1">Instrucciones</div>
          <p className="text-sm text-blue-600 whitespace-pre-line">{actividad.instrucciones}</p>
        </div>
      )}

      {/* Herramientas requeridas */}
      {actividad.herramientas_requeridas?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {actividad.herramientas_requeridas.map((h: string) => (
            <span key={h} className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
              {h}
            </span>
          ))}
        </div>
      )}

      {/* Fecha de evaluación */}
      {actividad.fecha_calificacion && (
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <Calendar className="w-3.5 h-3.5" />
          <span>Evaluado el {new Date(actividad.fecha_calificacion).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      )}

      {/* Botón para ver rúbrica */}
      {actividad.rubrica?.length > 0 && (
        <button
          onClick={() => setShowRubrica(!showRubrica)}
          className={`text-sm font-semibold flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg transition-colors ${
            actividad.calificacion_nota != null
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
              : 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50'
          }`}
        >
          <Award className="w-4 h-4" />
          {actividad.calificacion_nota != null
            ? `Ver calificación (${actividad.calificacion_nota}/10)`
            : `Ver rúbrica (${actividad.rubrica.length} criterios)`}
        </button>
      )}

      {/* Rúbrica expandible - Carrusel */}
      {showRubrica && actividad.rubrica && (
        <RubricaCarrusel rubrica={actividad.rubrica} calificacion={actividad} escalaCalificacion={escalaCalificacion} />
      )}
    </div>
  );
}

function RubricaCarrusel({ rubrica, calificacion, escalaCalificacion }: {
  rubrica: any[];
  calificacion: any;
  escalaCalificacion: Record<number, { label: string; color: string }>;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const criterio = rubrica[currentIndex];
  const total = rubrica.length;

  const next = () => setCurrentIndex(i => (i + 1) % total);
  const prev = () => setCurrentIndex(i => (i - 1 + total) % total);

  return (
    <div className="mt-4 border-t border-slate-200 pt-4">
      {/* Header con contador */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-bold text-slate-700">
          Criterio {currentIndex + 1} de {total}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={next}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Indicadores */}
      <div className="flex justify-center gap-2 mb-4">
        {rubrica.map((_: any, i: number) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-2 rounded-full transition-all ${
              i === currentIndex 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-slate-200 hover:bg-slate-300'
            }`}
          />
        ))}
      </div>

      {/* Card del criterio */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm"
        >
          {/* Header del criterio */}
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-base font-bold text-slate-900">{criterio.descripcion}</h4>
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
              {criterio.peso} pts
            </span>
          </div>
          
          {/* Niveles verticales */}
          <div className="space-y-3">
            {[
              { nivel: 1, desc: criterio.descripcion_nivel1, color: 'red', label: 'Deficiente' },
              { nivel: 2, desc: criterio.descripcion_nivel2, color: 'orange', label: 'En desarrollo' },
              { nivel: 3, desc: criterio.descripcion_nivel3, color: 'amber', label: 'Cumple parcialmente' },
              { nivel: 4, desc: criterio.descripcion_nivel4, color: 'emerald', label: 'Cumple' },
              { nivel: 5, desc: criterio.descripcion_nivel5, color: 'green', label: 'Superó expectativas' },
            ].map(n => {
              const ptsPorNivel = Math.round((criterio.peso / 5) * n.nivel * 10) / 10;
              return (
              <div key={n.nivel} className={`flex items-start gap-3 p-3 rounded-xl ${
                n.color === 'red' ? 'bg-red-50 border border-red-100' :
                n.color === 'orange' ? 'bg-orange-50 border border-orange-100' :
                n.color === 'amber' ? 'bg-amber-50 border border-amber-100' :
                n.color === 'emerald' ? 'bg-emerald-50 border border-emerald-100' :
                'bg-green-50 border border-green-100'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                  n.color === 'red' ? 'bg-red-500 text-white' :
                  n.color === 'orange' ? 'bg-orange-500 text-white' :
                  n.color === 'amber' ? 'bg-amber-500 text-white' :
                  n.color === 'emerald' ? 'bg-emerald-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {n.nivel}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className={`text-sm font-semibold ${
                      n.color === 'red' ? 'text-red-700' :
                      n.color === 'orange' ? 'text-orange-700' :
                      n.color === 'amber' ? 'text-amber-700' :
                      n.color === 'emerald' ? 'text-emerald-700' :
                      'text-green-700'
                    }`}>
                      {n.label}
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                      n.color === 'red' ? 'bg-red-100 text-red-600' :
                      n.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                      n.color === 'amber' ? 'bg-amber-100 text-amber-600' :
                      n.color === 'emerald' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {ptsPorNivel} pts
                    </span>
                  </div>
                  {n.desc && (
                    <div className="text-sm text-slate-600 mt-1 leading-relaxed">
                      {n.desc}
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Calificación si existe */}
      {calificacion.calificacion_nota != null && currentIndex === total - 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
        >
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-bold text-emerald-700">Calificación Final</span>
            <span className="text-xl font-bold text-emerald-600">
              {calificacion.calificacion_nota}/10
            </span>
          </div>
          {calificacion.calificaciones_criterios && (
            <div className="space-y-2">
              {calificacion.calificaciones_criterios.map((cal: any) => {
                const crit = rubrica.find((c: any) => c.id === cal.criterio_id);
                if (!crit) return null;
                const escalaInfo = escalaCalificacion[cal.puntuacion];
                return (
                  <div key={cal.criterio_id} className="flex justify-between items-center p-2 bg-white rounded-lg">
                    <span className="text-sm text-slate-700">{crit.descripcion}</span>
                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${escalaInfo?.color || 'bg-slate-100 text-slate-600'}`}>
                      {cal.puntuacion}/5 - {escalaInfo?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {calificacion.observaciones_calificacion && (
            <div className="mt-3 text-sm text-slate-600 italic">
              "{calificacion.observaciones_calificacion}"
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
