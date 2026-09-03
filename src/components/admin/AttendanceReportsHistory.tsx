import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Trash2,
  Eye
} from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { getAttendanceReports, deleteDoc, doc, db } from '../../firebase';
import { AttendanceReport } from '../../types';
import { toast } from 'sonner';

type FilterPeriod = 'all' | 'today' | 'week' | 'month';

export default function AttendanceReportsHistory() {
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getAttendanceReports();
      setReports(data);
    } catch (err) {
      console.error('Error loading reports:', err);
      toast.error('Error al cargar el historial de reportes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async (reportId: string) => {
    if (!confirm('¿Estás seguro de eliminar este reporte? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'attendance_reports', reportId));
      toast.success('Reporte eliminado correctamente');
      loadReports();
    } catch (err) {
      console.error('Error deleting report:', err);
      toast.error('Error al eliminar el reporte');
    }
  };

  const filterReportsByPeriod = (reports: AttendanceReport[]) => {
    if (filterPeriod === 'all') return reports;
    const now = new Date();
    return reports.filter(report => {
      const reportDate = report.createdAt?.toDate?.() || new Date(report.fecha);
      if (isNaN(reportDate.getTime())) return false;
      const diffDays = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));
      if (filterPeriod === 'today') return diffDays === 0;
      if (filterPeriod === 'week') return diffDays <= 7;
      if (filterPeriod === 'month') return diffDays <= 30;
      return true;
    });
  };

  const filteredReports = filterReportsByPeriod(reports).filter(report => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      report.grado.toLowerCase().includes(q) ||
      report.tutor.toLowerCase().includes(q) ||
      report.modalidad.toLowerCase().includes(q) ||
      report.fecha.toLowerCase().includes(q)
    );
  });

  const formatDate = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return '—';
    try {
      return timestamp.toDate().toLocaleDateString('es-SV', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getModalidadBadge = (modalidad: string) => {
    const isCivic = modalidad.toLowerCase().includes('cívico') || modalidad.toLowerCase().includes('civico');
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isCivic ? 'bg-secondary/10 text-secondary-dark' : 'bg-primary/10 text-primary-dark'}`}>
        {modalidad}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-primary/10">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Historial de Reportes</h1>
            <p className="module-subtitle">Consulta y gestiona los reportes de asistencia guardados</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card-crema p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por grado, tutor o fecha..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-crema pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'today', 'week', 'month'] as FilterPeriod[]).map(period => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`filter-pill ${filterPeriod === period ? 'active' : ''}`}
            >
              {period === 'all' ? 'Todos' : period === 'today' ? 'Hoy' : period === 'week' ? 'Esta semana' : 'Este mes'}
            </button>
          ))}
        </div>
        <button
          onClick={loadReports}
          className="btn-primary"
        >
          <Filter className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="empty-state">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No se encontraron reportes</p>
          <p className="text-xs text-slate-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="card-crema">
          <div className="divide-y divide-slate-100">
            {filteredReports.map((report, index) => {
              const isExpanded = expandedId === report.id;
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {report.grado}
                        </h3>
                        {getModalidadBadge(report.modalidad)}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {report.tutor}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-2">
                        <div className="text-xs font-bold text-slate-900">
                          {report.estadisticas.presentes + report.estadisticas.llegadasTarde}/{report.estadisticas.totalEstudiantes}
                        </div>
                        <div className="text-[10px] text-slate-400">asistencia</div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4 pt-2"
                    >
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900 font-mono">
                              {report.estadisticas.totalEstudiantes}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Inscritos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 font-mono">
                              {report.estadisticas.presentes}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Presentes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-secondary-dark font-mono">
                              {report.estadisticas.llegadasTarde}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Tardes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 font-mono">
                              {report.estadisticas.ausentes}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold uppercase">Ausentes</div>
                          </div>
                        </div>

                        {/* Discipline Stats */}
                        <div className="mb-4">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Disciplina
                          </h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                              <div className="text-sm font-bold text-slate-800">
                                {report.estadisticas.disciplina.cabelloLargo}
                              </div>
                              <div className="text-[10px] text-slate-500">Cabello Largo</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                              <div className="text-sm font-bold text-slate-800">
                                {report.estadisticas.disciplina.unasPintadas}
                              </div>
                              <div className="text-[10px] text-slate-500">Uñas Pintadas</div>
                            </div>
                            <div className="bg-white rounded-lg p-2 border border-slate-200 text-center">
                              <div className="text-sm font-bold text-slate-800">
                                {report.estadisticas.disciplina.uniformeIncorrecto}
                              </div>
                              <div className="text-[10px] text-slate-500">Uniforme Incorrecto</div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-3 border-t border-slate-200">
                          <button className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Ver Detalle Completo
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }}
                            className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
