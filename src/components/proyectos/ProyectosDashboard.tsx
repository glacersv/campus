import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProyectos } from '../../hooks/useProyectos';
import { Proyecto, ESTADOS_PROYECTO, EstadoProyecto, ROLE_LABELS, UserRole, Subject, TIPOS_ACTIVIDAD } from '../../types';
import { getAllSubjects } from '../../lib/firestore';
import FormularioProyecto from './FormularioProyecto';
import Historial from './Historial';
import Cronograma from './Cronograma';
import AdminPanel from './AdminPanel';
import SugerenciaInformatica from './SugerenciaInformatica';
import ActividadEvaluada from './ActividadEvaluada';
import EvaluacionInformatica from './EvaluacionInformatica';
import { FlaskConical, Calendar, Settings, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, AlertTriangle, ClipboardCheck, Award } from 'lucide-react';

type Vista = 'lista' | 'form' | 'detalle';
type MainTab = 'proyectos' | 'cronograma' | 'admin' | 'evaluacion' | 'actividades';

const STATUS_COLORS: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-800',
  blue: 'bg-blue-100 text-blue-800',
  amber: 'bg-slate-100 text-slate-700',
  purple: 'bg-purple-100 text-purple-800',
  red: 'bg-red-100 text-red-800',
  gray: 'bg-slate-100 text-slate-600',
};

export default function ProyectosDashboard() {
  const { userProfile, signOut } = useAuth();
  const {
    proyectos, loading, aprobarMateria, reclasificar,
    rechazarMateria, aprobarOficial, rechazarOficial
  } = useProyectos();

  const [mainTab, setMainTab] = useState<MainTab>('proyectos');
  const [vista, setVista] = useState<Vista>('lista');
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);
  const [modal, setModal] = useState<{ tipo: string; proyectoId: string } | null>(null);
  const [formModal, setFormModal] = useState({ materia: '', comentario: '' });
  const [msgAccion, setMsgAccion] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [verHistorial, setVerHistorial] = useState(false);
  const [materias, setMaterias] = useState<Subject[]>([]);

  useEffect(() => {
    getAllSubjects().then(setMaterias).catch(console.error);
  }, []);

  const rol = userProfile?.role;

  const stats = {
    total: proyectos.length,
    aprobados: proyectos.filter(p => p.estado === 'aprobado_oficial').length,
    pendientes: proyectos.filter(p => ['registrado', 'en_revision_materia', 'materia_validada', 'en_coordinacion'].includes(p.estado)).length,
    rechazados: proyectos.filter(p => p.estado.startsWith('rechazado')).length,
  };

  async function ejecutarAccionDocente(accion: 'aprobar' | 'reclasificar' | 'rechazar') {
    if (!modal) return;
    const id = modal.proyectoId;
    let res;
    if (accion === 'aprobar') {
      res = await aprobarMateria(id, { materia_id: formModal.materia, comentario: formModal.comentario });
    } else if (accion === 'reclasificar') {
      res = await reclasificar(id, { materia_id: formModal.materia, comentario: formModal.comentario });
    } else {
      res = await rechazarMateria(id, formModal.comentario);
    }
    if (res.error) { setMsgAccion({ tipo: 'error', texto: res.error }); return; }
    setModal(null);
    setMsgAccion({ tipo: 'ok', texto: 'Acción registrada correctamente.' });
    setTimeout(() => setMsgAccion(null), 3000);
  }

  async function ejecutarAccionCoord(accion: 'aprobar' | 'rechazar') {
    if (!modal) return;
    const id = modal.proyectoId;
    const res = accion === 'aprobar' ? await aprobarOficial(id) : await rechazarOficial(id, formModal.comentario);
    if (res.error) { setMsgAccion({ tipo: 'error', texto: res.error }); return; }
    setModal(null);
    setMsgAccion({ tipo: 'ok', texto: accion === 'aprobar' ? '¡Proyecto aprobado oficialmente!' : 'Proyecto rechazado.' });
    setTimeout(() => setMsgAccion(null), 3000);
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-indigo-100">
            <FlaskConical className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="module-title">Semana de la Juventud 2026</h1>
            <p className="module-subtitle">{rol ? ROLE_LABELS[rol as UserRole] : ''} — {userProfile?.displayName}</p>
          </div>
        </div>
        <button onClick={signOut} className="btn-secondary">Cerrar sesión</button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {msgAccion && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium mb-4 ${
            msgAccion.tipo === 'ok'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {msgAccion.tipo === 'ok' ? '✓' : '✕'} {msgAccion.texto}
          </div>
        )}

        {vista === 'lista' && (
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mainTab === 'proyectos' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMainTab('proyectos')}>
              <FlaskConical className="w-4 h-4 inline mr-1.5" />
              {rol === 'alumno' ? 'Mis proyectos' : 'Proyectos'}
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                mainTab === 'cronograma' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
              onClick={() => setMainTab('cronograma')}>
              <Calendar className="w-4 h-4 inline mr-1.5" />Cronograma
            </button>
            {rol === 'admin' && (
              <button
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  mainTab === 'admin' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                }`}
                onClick={() => setMainTab('admin')}>
                <Settings className="w-4 h-4 inline mr-1.5" />Admin
              </button>
            )}
            {rol === 'docente' && (
              <>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    mainTab === 'actividades' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setMainTab('actividades')}>
                  <Award className="w-4 h-4 inline mr-1.5" />Actividades
                </button>
                <button
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    mainTab === 'evaluacion' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                  }`}
                  onClick={() => setMainTab('evaluacion')}>
                  <ClipboardCheck className="w-4 h-4 inline mr-1.5" />Evaluar
                </button>
              </>
            )}
          </div>
        )}

        {vista === 'form' && (
          <FormularioProyecto
            proyectoInicial={proyectoActivo}
            onCancel={() => { setVista('lista'); setProyectoActivo(null); }}
            onSuccess={() => { setVista('lista'); setProyectoActivo(null); }}
          />
        )}

        {vista === 'detalle' && proyectoActivo && (
          <DetalleProyecto
            proyecto={proyectos.find(p => p.id === proyectoActivo.id) ?? proyectoActivo}
            rol={rol}
            materias={materias}
            verHistorial={verHistorial}
            onToggleHistorial={() => setVerHistorial(v => !v)}
            onVolver={() => { setVista('lista'); setProyectoActivo(null); setVerHistorial(false); }}
            onEditar={() => setVista('form')}
          />
        )}

        {vista === 'lista' && mainTab === 'cronograma' && (
          <div className="card-crema p-6">
            <Cronograma />
          </div>
        )}

        {vista === 'lista' && mainTab === 'admin' && rol === 'admin' && (
          <AdminPanel proyectos={proyectos} />
        )}

        {vista === 'lista' && mainTab === 'evaluacion' && rol === 'docente' && (
          <EvaluacionInformatica />
        )}

        {vista === 'lista' && mainTab === 'actividades' && rol === 'docente' && (
          <ActividadEvaluada />
        )}

        {vista === 'lista' && mainTab === 'proyectos' && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { num: stats.total, label: 'Total', icon: FlaskConical, color: 'text-slate-700' },
                { num: stats.aprobados, label: 'Aprobados', icon: CheckCircle2, color: 'text-emerald-600' },
                { num: stats.pendientes, label: 'En revisión', icon: Clock, color: 'text-slate-600' },
                { num: stats.rechazados, label: 'Rechazados', icon: XCircle, color: 'text-red-600' },
              ].map(({ num, label, icon: Icon, color }) => (
                <div key={label} className="card-crema p-3 text-center">
                  <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
                  <div className={`text-xl font-bold ${color}`}>{num}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{label}</div>
                </div>
              ))}
            </div>

            {rol === 'alumno' && (
              <button
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors mb-4 flex items-center justify-center gap-2"
                onClick={() => { setProyectoActivo(null); setVista('form'); }}>
                <Plus className="w-4 h-4" /> Registrar nuevo proyecto
              </button>
            )}

            {loading && <p className="text-sm text-slate-400 text-center py-8">Cargando proyectos...</p>}

            {!loading && proyectos.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <FlaskConical className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No hay proyectos para mostrar.</p>
              </div>
            )}

            {!loading && proyectos.map(p => (
              <ProyectoCard key={p.id} proyecto={p} rol={rol} materias={materias}
                onVer={() => { setProyectoActivo(p); setVista('detalle'); }}
                onRevisar={() => {
                  setModal({ tipo: rol!, proyectoId: p.id });
                  setFormModal({ materia: p.materia_id, comentario: '' });
                }} />
            ))}
          </>
        )}
      </div>

      {/* Modal docente */}
      {modal?.tipo === 'docente' && (
        <Modal titulo="Revisión de materia" onClose={() => setModal(null)}>
          {(() => {
            const p = proyectos.find(x => x.id === modal.proyectoId);
            return p ? (
              <>
                <InfoRow label="Proyecto" value={p.titulo} />
                <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
                <div className="py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-400">Materias</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                      {p.materia_nombre}
                    </span>
                    {p.materias_secundarias?.map(mId => {
                      const mat = materias.find(m => m.id === mId);
                      return mat ? (
                        <span key={mId} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                          {mat?.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <InfoRow label="Descripción" value={p.descripcion} small />

                <div className="mb-3">
                  <label className="form-label">Materia confirmada</label>
                  <select className="form-input" value={formModal.materia}
                    onChange={e => setFormModal(f => ({ ...f, materia: e.target.value }))}>
                    {materias.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label">Comentarios (requerido para rechazo/reclasificación)</label>
                  <textarea className="form-input min-h-[70px] resize-y"
                    value={formModal.comentario}
                    onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Escribe aquí tus observaciones..." />
                </div>

                <div className="flex gap-2 justify-end">
                  <button className="form-input !w-auto" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="form-input !w-auto bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
                    onClick={() => ejecutarAccionDocente('reclasificar')}>Reclasificar</button>
                  <button className="form-input !w-auto bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                    onClick={() => ejecutarAccionDocente('rechazar')}>Rechazar</button>
                  <button className="form-input !w-auto bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    onClick={() => ejecutarAccionDocente('aprobar')}>Aprobar materia</button>
                </div>
              </>
            ) : null;
          })()}
        </Modal>
      )}

      {/* Modal coordinación */}
      {modal?.tipo === 'coordinacion' && (
        <Modal titulo="Aprobación oficial" onClose={() => setModal(null)}>
          {(() => {
            const p = proyectos.find(x => x.id === modal.proyectoId);
            return p ? (
              <>
                <InfoRow label="Proyecto" value={p.titulo} />
                <InfoRow label="Grado/Sección" value={`${p.grado} ${p.seccion}`} />
                <div className="py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-400">Materias</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
                      {p.materia_nombre}
                    </span>
                    {p.materias_secundarias?.map(mId => {
                      const mat = materias.find(m => m.id === mId);
                      return mat ? (
                        <span key={mId} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                          {mat?.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <InfoRow label="Integrantes" value={`${p.integrantes_detalle?.length ?? 0}`} />

                <CheckList proyecto={p} />

                <div className="mb-4">
                  <label className="form-label">Motivo de rechazo (si aplica)</label>
                  <textarea className="form-input min-h-[60px] resize-y"
                    value={formModal.comentario}
                    onChange={e => setFormModal(f => ({ ...f, comentario: e.target.value }))}
                    placeholder="Solo requerido si rechazas el proyecto..." />
                </div>

                <div className="flex gap-2 justify-end">
                  <button className="form-input !w-auto" onClick={() => setModal(null)}>Cancelar</button>
                  <button className="form-input !w-auto bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                    onClick={() => ejecutarAccionCoord('rechazar')}>Rechazar</button>
                  <button className="form-input !w-auto bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    onClick={() => ejecutarAccionCoord('aprobar')}>Aprobar oficialmente</button>
                </div>
              </>
            ) : null;
          })()}
        </Modal>
      )}
    </div>
  );
}

function ProyectoCard({ proyecto: p, rol, materias, onVer, onRevisar }: {
  proyecto: Proyecto; rol?: string; materias: Subject[]; onVer: () => void; onRevisar: () => void;
}) {
  const canRevisar =
    (rol === 'docente' && ['registrado', 'en_revision_materia'].includes(p.estado)) ||
    (rol === 'coordinacion' && p.estado === 'en_coordinacion');

  const statusKey = ESTADOS_PROYECTO[p.estado]?.color ?? 'gray';

  return (
    <div className="card-crema p-4 mb-3 cursor-pointer" onClick={onVer}>
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-slate-900 truncate">{p.titulo}</div>
          <div className="text-xs text-slate-400 mt-1">
            {p.grado} {p.seccion}
            {p.integrantes_detalle && ` · ${p.integrantes_detalle.length} integrantes`}
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            <span className="inline-flex items-center px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-bold">
              {p.materia_nombre}
            </span>
            {p.materias_secundarias?.map(mId => {
              const mat = materias.find(m => m.id === mId);
              return mat ? (
                <span key={mId} className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-[9px] font-medium">
                  {mat?.name}
                </span>
              ) : null;
            })}
          </div>
          {p.observaciones && (
            <div className="bg-slate-50 rounded-lg px-3 py-2 text-xs text-slate-500 mt-2 border-l-2 border-slate-200">
              {p.observaciones}
            </div>
          )}
          {p.estado === 'aprobado_oficial' && (
            <div className={`text-[11px] mt-2 ${p.complemento_informatica ? 'text-emerald-700' : 'text-slate-700'}`}>
              {p.complemento_informatica ? '✓ Complemento de Informática asignado' : ' Pendiente: complemento de Informática'}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[statusKey]}`}>
            {ESTADOS_PROYECTO[p.estado]?.label}
          </span>
          {canRevisar && (
            <button className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 transition-colors"
              onClick={e => { e.stopPropagation(); onRevisar(); }}>
              Revisar →
            </button>
          )}
        </div>
      </div>
      <div className="text-[10px] text-slate-300 mt-2">
        Rep: {p.representante_nombre} · Registrado: {p.fecha_registro}
      </div>
    </div>
  );
}

function DetalleProyecto({ proyecto: p, rol, materias, verHistorial, onToggleHistorial, onVolver, onEditar }: {
  proyecto: Proyecto; rol?: string; materias: Subject[]; verHistorial: boolean;
  onToggleHistorial: () => void; onVolver: () => void; onEditar: () => void;
}) {
  const canEdit = ['reclasificar', 'rechazado_materia'].includes(p.estado) && p.intentos_envio < 2;
  const puedeAsignarComplemento = rol && ['docente', 'coordinacion', 'admin'].includes(rol) && p.estado === 'aprobado_oficial';

  return (
    <div>
      <button className="btn-secondary !w-auto mb-4" onClick={onVolver}>
        <ChevronLeft className="w-4 h-4 inline mr-1" />Volver
      </button>

      <div className="card-crema p-5 mb-3">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-slate-900">{p.titulo}</h2>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[ESTADOS_PROYECTO[p.estado]?.color ?? 'gray']}`}>
            {ESTADOS_PROYECTO[p.estado]?.label}
          </span>
        </div>
        <InfoRow label="Grado / Sección" value={`${p.grado} ${p.seccion}`} />
        <div className="py-2 border-b border-slate-100">
          <span className="text-sm text-slate-400">Materias</span>
          <div className="flex flex-wrap gap-1 mt-1">
            <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-bold">
              {p.materia_nombre}
            </span>
            {p.materias_secundarias?.map(mId => {
              const mat = materias.find(m => m.id === mId);
              return mat ? (
                <span key={mId} className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-medium">
                  {mat?.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
        <InfoRow label="Descripción" value={p.descripcion} />
        <InfoRow label="Fecha de registro" value={p.fecha_registro} />
        <InfoRow label="Intentos de envío" value={`${p.intentos_envio}/2`} />
      </div>

      <div className="card-crema p-5 mb-3">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Equipo ({p.integrantes_detalle?.length ?? 0} integrantes)
        </h3>
        {p.integrantes_detalle?.map(i => (
          <div key={i.uid} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-sm">
            <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
              {i.numero_lista}
            </span>
            <span className="text-slate-700">{i.nombre}</span>
            {i.es_rep && (
              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">Representante</span>
            )}
          </div>
        ))}
      </div>

      {p.observaciones && (
        <div className="bg-slate-50 text-slate-800 border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3">
          <strong>Comentario del revisor:</strong> {p.observaciones}
        </div>
      )}

      {canEdit && rol === 'alumno' && (
        <button className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors mb-3"
          onClick={onEditar}>Editar y reenviar</button>
      )}

      {puedeAsignarComplemento && (
        <SugerenciaInformatica proyecto={p} onAsignado={() => {}} />
      )}

      {!puedeAsignarComplemento && p.complemento_informatica && rol === 'alumno' && (
        <SugerenciaInformatica proyecto={p} onAsignado={() => {}} />
      )}

      {/* Evaluación del proyecto */}
      {p.evaluacion_informatica && (
        <div className="card-crema p-5 mb-3">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            📋 Actividad Evaluada
          </h3>
          <InfoRow label="Título" value={p.evaluacion_informatica.titulo} />
          <InfoRow label="Tipo" value={TIPOS_ACTIVIDAD[p.evaluacion_informatica.tipo_actividad]?.label || p.evaluacion_informatica.tipo_actividad} />
          <InfoRow label="Estado" value={p.evaluacion_informatica.estado} />
          {p.evaluacion_informatica.calificacion_nota != null && (
            <InfoRow label="Calificación" value={`${p.evaluacion_informatica.calificacion_nota}/10`} />
          )}
          <div className="mt-3">
            <p className="text-xs text-slate-500 mb-2">{p.evaluacion_informatica.descripcion}</p>
            {p.evaluacion_informatica.herramientas_requeridas?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {p.evaluacion_informatica.herramientas_requeridas.map(h => (
                  <span key={h} className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{h}</span>
                ))}
              </div>
            )}
          </div>
          {p.evaluacion_informatica.rubrica?.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rúbrica de Evaluación</p>
              <div className="text-[9px] text-slate-500 mb-2">
                Escala 1-5 · {p.evaluacion_informatica.rubrica.length} criterios · Total: {p.evaluacion_informatica.rubrica.reduce((sum, c) => sum + c.peso, 0)} pts
              </div>
              {p.evaluacion_informatica.rubrica.map(c => (
                <div key={c.id} className="bg-slate-50 rounded-lg p-2 mb-1.5 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-slate-700">{c.descripcion}</span>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {c.peso} pts
                    </span>
                  </div>
                  {(c.descripcion_nivel1 || c.descripcion_nivel5) && (
                    <div className="mt-1.5 flex gap-1 flex-wrap">
                      {c.descripcion_nivel1 && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                          1: {c.descripcion_nivel1.substring(0, 40)}...
                        </span>
                      )}
                      {c.descripcion_nivel5 && (
                        <span className="text-[8px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                          5: {c.descripcion_nivel5.substring(0, 40)}...
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card-crema p-5">
        <div className="flex justify-between items-center cursor-pointer" onClick={onToggleHistorial}>
          <h3 className="text-sm font-bold text-slate-900">Historial de actividad</h3>
          <span className="text-xs text-slate-400">{verHistorial ? 'Ocultar' : 'Mostrar'}</span>
        </div>
        {verHistorial && (
          <div className="mt-4">
            <Historial proyectoId={p.id} />
          </div>
        )}
      </div>
    </div>
  );
}

function CheckList({ proyecto: p }: { proyecto: Proyecto }) {
  const items = [
    { label: 'Ficha completa', ok: !!(p.titulo && p.descripcion) },
    { label: '5–6 integrantes', ok: (p.integrantes_detalle?.length ?? 0) >= 5 && (p.integrantes_detalle?.length ?? 0) <= 6 },
    { label: 'Materia validada', ok: !!p.materia_validada_id },
    { label: 'Entregado antes del 17 jun', ok: p.fecha_registro <= '2026-06-17' },
  ];
  return (
    <div className="flex gap-2 flex-wrap my-3">
      {items.map(i => (
        <span key={i.label} className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${
          i.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
        }`}>
          {i.ok ? '✓' : '✗'} {i.label}
        </span>
      ))}
    </div>
  );
}

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container max-w-lg"
        onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{titulo}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <span className="text-lg">×</span>
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, small }: { label: string; value?: string; small?: boolean }) {
  return (
    <div className={`flex justify-between py-2 border-b border-slate-100 ${small ? 'text-xs' : 'text-sm'}`}>
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-slate-700 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );
}
