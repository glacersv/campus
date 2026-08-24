import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Award,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  GraduationCap,
  CheckCircle2,
  FileCheck,
  Target,
  Palette,
  Calendar,
} from 'lucide-react';
import { lmsService } from '../../services/lmsService';
import { LMSModule as LMSModuleType } from '../../types';
import WelcomeBanner from '../shared/WelcomeBanner';
import CourseCard from './shared/CourseCard';

interface StudentLMSDashboardProps {
  onNavigateCourse?: (courseId: string) => void;
  onViewAllCourses?: () => void;
  onViewProgress?: () => void;
}

export const StudentLMSDashboard: React.FC<StudentLMSDashboardProps> = ({
  onNavigateCourse = (_courseId: string) => {},
  onViewAllCourses = () => {},
  onViewProgress = () => {},
}) => {
  const [modules, setModules] = useState<LMSModuleType[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const dbModules = await lmsService.getAllModules();
      setModules(dbModules.filter(m => m.status === 'active'));
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

  const totalHours = modules.reduce((sum, m) => sum + (m.hours || 0), 0);
  const avgLevel = modules.length > 0
    ? Math.round(modules.reduce((sum, m) => sum + (m.minedLevel || 4), 0) / modules.length)
    : 4;
  const avgGrade = modules.length > 0
    ? modules.reduce((sum, m) => sum + (m.averageGrade || 8), 0) / modules.length
    : 8;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. Welcome Banner */}
      <WelcomeBanner
        title={`Bachillerato Técnico en Diseño Gráfico`}
        subtitle={`Plan de Estudio Oficial MINED • ${totalHours} Horas Técnicas • Formación orientada a la acción y proyectos reales.`}
        name="Estudiante Salesiano"
        role="alumno"
        area="general"
        badge="MINED Ricaldone"
        ctaLabel="Explorar Módulos"
        onCta={onViewAllCourses}
      />

      {/* 2. Selector de Año Técnico */}
      <div className="card-crema p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D71B9]/10 text-[#0D71B9] flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm md:text-base text-slate-900">
              Nivel de Formación Técnica
            </h3>
            <p className="text-xs text-slate-500">
              Selecciona el año lectivo para visualizar los módulos asignados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setSelectedYear('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedYear === 'all'
                ? 'bg-white text-[#0D71B9] shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({modules.length})
          </button>
          {(['1', '2', '3'] as const).map(yr => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedYear === yr
                  ? 'bg-white text-[#0D71B9] shadow-sm border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {yearLabels[yr]} ({modulesByYear[yr].length})
            </button>
          ))}
        </div>
      </div>

      {/* 3. Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          onClick={onViewAllCourses}
          className="card-crema card-interactive p-6 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#0D71B9]/10 text-[#0D71B9] border border-[#0D71B9]/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Módulos Técnicos
              </span>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 mt-0.5">
                {modules.length}{' '}
                <span className="text-xs font-semibold text-slate-500">({totalHours}h totales)</span>
              </h3>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#0D71B9] group-hover:translate-x-1 transition-all" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={onViewProgress}
          className="card-crema card-interactive p-6 flex items-center justify-between group border-l-4 border-l-emerald-500 cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Nivel MINED (Escala 1 al 5)
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900">
                  Nivel {avgLevel}
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {avgLevel >= 4 ? 'Aprobado' : 'En refuerzo'}
                </span>
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={onViewProgress}
          className="card-crema card-interactive p-6 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-2xl bg-[#25855A]/10 text-[#25855A] border border-[#25855A]/20 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Calificación Promedio
              </span>
              <h3 className="font-display font-extrabold text-2xl md:text-3xl text-slate-900 mt-0.5">
                {avgGrade.toFixed(1)}{' '}
                <span className="text-xs font-semibold text-emerald-600">/ 10.0 pts</span>
              </h3>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-[#25855A] group-hover:translate-x-1 transition-all" />
        </motion.div>
      </div>

      {/* 4. 6 Etapas Infographic */}
      <div className="card-crema p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl border border-slate-700 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">
                  Metodología Pedagógica Oficial
                </span>
                <h3 className="font-display font-extrabold text-xl md:text-2xl text-white">
                  Las 6 Etapas de la Acción Completa por Proyecto
                </h3>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/20">
              Método Aprender Haciendo • 100% Criterial
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {[
              { num: '1', name: 'Informar', pct: '10%', desc: 'Saberes previos y marco teórico' },
              { num: '2', name: 'Planificar', pct: '10%', desc: 'Ruta crítica y marco lógico' },
              { num: '3', name: 'Decidir', pct: '10%', desc: 'Matriz Delphi y consenso' },
              { num: '4', name: 'Ejecutar', pct: '25%', desc: 'Bocetería, software y dummies' },
              { num: '5', name: 'Controlar', pct: '25%', desc: 'FODA, listas de cotejo y calidad' },
              { num: '6', name: 'Valorar', pct: '20%', desc: 'Rúbrica MINED (1-5) y feria' },
            ].map((st) => (
              <div
                key={st.num}
                className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="w-6 h-6 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">
                    {st.num}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-blue-300">{st.pct}</span>
                </div>
                <h4 className="font-bold text-sm text-white">{st.name}</h4>
                <p className="text-[10px] text-slate-300 mt-1 leading-snug">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Module Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900 flex items-center gap-2">
              <span>Módulos Disponibles</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#0D71B9]/10 text-[#0D71B9] border border-[#0D71B9]/20">
                {filteredModules.length} módulos
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Descriptores oficiales, proyectos anuales y rúbricas MINED
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAllCourses}
            className="btn-secondary !py-1.5 !px-3.5 text-xs gap-1.5 self-start sm:self-auto"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredModules.length === 0 ? (
          <div className="card-crema p-10 text-center border border-slate-200">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">No hay módulos disponibles</p>
            <p className="text-xs text-slate-500 mt-1">Los módulos aparecerán cuando el administrador los publique</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredModules.map((mod, idx) => (
              <CourseCard
                key={mod.id}
                course={{
                  id: mod.id,
                  name: mod.name,
                  code: mod.code,
                  description: mod.description || '',
                  technicalYear: mod.technicalYear,
                  hours: mod.hours,
                  weeks: mod.weeks,
                  affineArea: mod.affineArea || '',
                  color: mod.color || '#0D71B9',
                  icon: mod.icon || 'BookOpen',
                  teacherName: mod.teacherName,
                  classroom: mod.classroom || '',
                  progress: mod.progress || 0,
                  minedLevel: mod.minedLevel,
                  averageGrade: mod.averageGrade,
                  status: mod.status as any,
                  gradeId: mod.gradeId,
                  gradeName: mod.gradeName,
                  sectionId: mod.sectionId || '',
                  sectionName: mod.sectionName || '',
                  subjectId: mod.subjectId,
                  schedule: mod.schedule || '',
                  unitsCount: 6,
                  activitiesCount: 0,
                  descriptor: mod.descriptor as any,
                }}
                index={idx}
                onClick={() => onNavigateCourse(mod.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentLMSDashboard;
