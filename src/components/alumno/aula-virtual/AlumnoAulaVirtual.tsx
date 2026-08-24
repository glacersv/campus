import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { lmsService } from '../../../services/lmsService';
import { LMSModule } from '../../../types';
import { BookOpen, Calendar, Users, ChevronRight, GraduationCap, Clock, Award, Sparkles } from 'lucide-react';

export default function AlumnoAulaVirtual() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const dbModules = await lmsService.getAllModules();
      const studentGradeId = userProfile?.gradeId;
      const filtered = studentGradeId
        ? dbModules.filter(m => m.gradeId === studentGradeId || !m.gradeId)
        : dbModules;
      setModules(filtered.filter(m => m.status === 'active'));
    } catch (e) {
      console.error('Error loading modules:', e);
    } finally {
      setLoading(false);
    }
  };

  const yearLabels: Record<string, string> = { '1': '1.° Año', '2': '2.° Año', '3': '3.er Año' };

  const filteredModules = selectedYear === 'all'
    ? modules
    : modules.filter(m => m.technicalYear === selectedYear);

  const modulesByYear = {
    '1': modules.filter(m => m.technicalYear === '1'),
    '2': modules.filter(m => m.technicalYear === '2'),
    '3': modules.filter(m => m.technicalYear === '3'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900">Mi Aula Virtual</h1>
          <p className="text-sm text-slate-500 mt-1">Módulos técnicos asignados a tu grado</p>
        </div>
      </div>

      {/* Selector de Año Técnico */}
      <div className="card-crema p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200">
        <div className="flex items-center gap-2.5">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-slate-700">Filtrar por Año Técnico</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedYear === 'all' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            Todos ({modules.length})
          </button>
          {(['1', '2', '3'] as const).map(yr => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedYear === yr ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              {yearLabels[yr]} ({modulesByYear[yr].length})
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Módulos */}
      {filteredModules.length === 0 ? (
        <div className="card-crema p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">No hay módulos disponibles</p>
          <p className="text-xs text-slate-500 mt-1">Los módulos aparecerán cuando el administrador los publique</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod, idx) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: idx * 0.04 }}
              whileHover={{ y: -2 }}
              className="card-crema p-5 border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/alumno/aula-virtual/cursos/${mod.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  {mod.affineArea && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {mod.affineArea}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    mod.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {mod.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <h3 className="font-display font-bold text-sm text-slate-900 mb-1 group-hover:text-primary transition-colors line-clamp-2">
                {mod.name}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mb-2">{mod.code}</p>

              {mod.description && (
                <p className="text-[11px] text-slate-500 line-clamp-2 mb-3 leading-relaxed">{mod.description}</p>
              )}

              <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {mod.hours}h / {mod.weeks} sem
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {mod.teacherName || 'Sin asignar'}
                </span>
              </div>

              {mod.descriptor?.currentProject && (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 mb-3">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Proyecto {mod.descriptor.currentProject.academicYear}
                  </span>
                  <p className="text-[11px] font-semibold text-slate-800 truncate mt-0.5">
                    {mod.descriptor.currentProject.title}
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-primary font-bold group-hover:underline">
                  Ver contenido
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
