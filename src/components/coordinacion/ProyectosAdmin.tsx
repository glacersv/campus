import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useProyectos } from '../../hooks/useProyectos';
import { useAuth } from '../../contexts/AuthContext';
import { Proyecto, ESTADOS_PROYECTO, MATERIAS_PROYECTO, UserRole } from '../../types';
import FormularioProyecto from '../proyectos/FormularioProyecto';
import Historial from '../proyectos/Historial';
import {
  Medal, Plus, ChevronDown, ChevronUp, Clock, CheckCircle2,
  XCircle, FlaskConical, Search, Eye, Users, BarChart3,
  ArrowRight, Check, X, AlertTriangle
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  borrador: { label: 'Borrador', color: 'text-slate-600', bg: 'bg-slate-100' },
  registrado: { label: 'Registrado', color: 'text-blue-600', bg: 'bg-blue-100' },
  en_revision_materia: { label: 'En Revisión', color: 'text-amber-600', bg: 'bg-amber-100' },
  en_coordinacion: { label: 'En Coordinación', color: 'text-purple-600', bg: 'bg-purple-100' },
  aprobado_oficial: { label: 'Aprobado', color: 'text-emerald-600', bg: 'bg-emerald-100' },
  rechazado_materia: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-100' },
  rechazado_oficial: { label: 'Rechazado', color: 'text-red-600', bg: 'bg-red-100' },
};

export default function ProyectosAdmin() {
  const { userProfile } = useAuth();
  const {
    proyectos, loading, aprobarMateria, reclasificar,
    rechazarMateria, aprobarOficial, rechazarOficial
  } = useProyectos();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [proyectoActivo, setProyectoActivo] = useState<Proyecto | null>(null);
  const [modal, setModal] = useState<{ tipo: string; proyecto: Proyecto } | null>(null);
  const [comentario, setComentario] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const stats = {
    total: proyectos.length,
    aprobados: proyectos.filter(p => p.estado === 'aprobado_oficial').length,
    pendientes: proyectos.filter(p => ['registrado', 'en_revision_materia', 'en_coordinacion'].includes(p.estado)).length,
    rechazados: proyectos.filter(p => p.estado.startsWith('rechazado')).length,
  };

  const proyectosFiltrados = proyectos.filter(p => {
    const matchBusqueda = !busqueda ||
      p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.representante_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.grado.includes(busqueda);
    const matchEstado = !filtroEstado || p.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const handleApprove = async (proyecto: Proyecto, tipo: 'materia' | 'oficial') => {
    try {
      if (tipo === 'materia') {
        await aprobarMateria(proyecto.id, { materia_id: proyecto.materia_id, comentario });
      } else {
        await aprobarOficial(proyecto.id);
      }
      setModal(null);
      setComentario('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (proyecto: Proyecto, tipo: 'materia' | 'oficial') => {
    try {
      if (tipo === 'materia') {
        await rechazarMateria(proyecto.id, comentario);
      } else {
        await rechazarOficial(proyecto.id, comentario);
      }
      setModal(null);
      setComentario('');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-indigo-100 border border-indigo-200/80">
            <Medal className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="module-title">Semana de la Juventud</h1>
            <p className="module-subtitle">Administra todos los proyectos estudiantiles</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-card-icon bg-indigo-50 text-indigo-600">
            <Medal className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Total</span>
            <div className="stat-card-value">{stats.total}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-amber-50 text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Pendientes</span>
            <div className="stat-card-value">{stats.pendientes}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Aprobados</span>
            <div className="stat-card-value">{stats.aprobados}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon bg-red-50 text-red-600">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="stat-card-label">Rechazados</span>
            <div className="stat-card-value">{stats.rechazados}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por título, alumno o grado..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={e => setFiltroEstado(e.target.value)}
          className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {proyectosFiltrados.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <Medal className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold">No hay proyectos registrados</p>
          </div>
        ) : (
          proyectosFiltrados.map((proyecto, i) => {
            const statusConfig = STATUS_CONFIG[proyecto.estado] || STATUS_CONFIG.borrador;
            const isExpanded = expanded === proyecto.id;
            
            return (
              <motion.div
                key={proyecto.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden"
              >
                {/* Project Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : proyecto.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.color}`}>
                          {statusConfig.label}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {proyecto.grado} {proyecto.seccion}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate">{proyecto.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {proyecto.representante_nombre} • {proyecto.materia_nombre}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {proyecto.estado === 'en_coordinacion' && (
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setModal({ tipo: 'aprobar_oficial', proyecto }); }}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                            title="Aprobar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setModal({ tipo: 'rechazar_oficial', proyecto }); }}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                            title="Rechazar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-slate-100"
                    >
                      <div className="p-4 space-y-4">
                        {/* Description */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Descripción</span>
                          <p className="text-xs text-slate-600 mt-1">{proyecto.descripcion}</p>
                        </div>

                        {/* Team Members */}
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Integrantes ({proyecto.integrantes_detalle?.length || 0})</span>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {proyecto.integrantes_detalle?.map((int, idx) => (
                              <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-[10px] font-bold text-primary">{int.numero_lista}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-semibold text-slate-700 truncate">{int.nombre}</p>
                                  {int.es_rep && <span className="text-[9px] text-primary font-bold">Representante</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions for en_coordinacion */}
                        {proyecto.estado === 'en_coordinacion' && (
                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setModal({ tipo: 'aprobar_oficial', proyecto })}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                            >
                              <Check className="w-4 h-4" /> Aprobar Proyecto
                            </button>
                            <button
                              onClick={() => setModal({ tipo: 'rechazar_oficial', proyecto })}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                              <X className="w-4 h-4" /> Rechazar
                            </button>
                          </div>
                        )}

                        {/* History */}
                        <div className="pt-2 border-t border-slate-100">
                          <Historial proyectoId={proyecto.id} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Approval/Rejection Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  modal.tipo.includes('aprobar') ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {modal.tipo.includes('aprobar') ? (
                    <Check className={`w-5 h-5 ${modal.tipo.includes('aprobar') ? 'text-emerald-600' : 'text-red-600'}`} />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {modal.tipo.includes('aprobar') ? 'Aprobar Proyecto' : 'Rechazar Proyecto'}
                  </h3>
                  <p className="text-xs text-slate-500">{modal.proyecto.titulo}</p>
                </div>
              </div>

              {modal.tipo.includes('rechazar') && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-700 mb-2">Motivo del rechazo</label>
                  <textarea
                    value={comentario}
                    onChange={e => setComentario(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                    rows={3}
                    placeholder="Describe el motivo del rechazo..."
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleApprove(modal.proyecto, modal.tipo.includes('oficial') ? 'oficial' : 'materia')}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${
                    modal.tipo.includes('aprobar') ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {modal.tipo.includes('aprobar') ? 'Aprobar' : 'Rechazar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
