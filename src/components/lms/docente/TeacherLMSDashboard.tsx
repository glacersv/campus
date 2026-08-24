// Panel Docente LMS — Mis Módulos
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { lmsService } from '../../../services/lmsService';
import { LMSModule, LMSCourse } from '../../../types';
import { BTV_GRAPHIC_DESIGN_COURSES } from '../../../services/btvCurriculumData';
import { BookOpen, Plus, Calendar, Users, FileText, Edit, Trash2, GraduationCap } from 'lucide-react';

export default function TeacherLMSDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    if (!userProfile?.uid) return;
    try {
      // Cargar módulos desde Firestore (lms_modules)
      const dbModules = await lmsService.getAllModules();
      
      // Si no hay módulos en Firestore, usar los cursos BTV existentes como base
      if (dbModules.length === 0) {
        const seedModules: LMSModule[] = BTV_GRAPHIC_DESIGN_COURSES.map(course => ({
          id: `lms-mod-${course.id}`,
          name: course.name,
          code: course.code,
          subjectId: course.subjectId,
          teacherId: course.teacherId,
          teacherName: course.teacherName,
          gradeId: course.gradeId,
          gradeName: course.gradeName,
          technicalYear: course.technicalYear as '1' | '2' | '3',
          hours: course.hours,
          weeks: course.weeks,
          status: course.status as 'active' | 'inactive',
          descriptor: course.descriptor || {
            objective: '',
            units: [],
            methodology: '',
            evaluationCriteria: [],
            bibliography: { books: [], websites: [] },
            saberesPrevios: [],
            developmentAxes: {
              desarrolloTecnico: '',
              desarrolloEmprendedor: '',
              desarrolloHumanoSocial: '',
              desarrolloAcademicoAplicado: '',
            },
          },
          createdAt: course.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }));
        setModules(seedModules);
      } else {
        setModules(dbModules);
      }
    } catch (e) {
      console.error('Error loading modules:', e);
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-display font-extrabold text-slate-900">Mis Módulos Técnicos</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona el contenido de tus módulos (cursos ya existentes + nuevos)</p>
        </div>
        <button
          onClick={() => navigate('/docente/lms/crear')}
          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Crear Módulo
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="card-crema p-10 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">No tienes módulos asignados</p>
          <p className="text-xs text-slate-500 mt-1">Contacta al administrador para que te asigne módulos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((mod) => (
            <motion.div
              key={mod.id}
              whileHover={{ y: -2 }}
              className="card-crema p-5 border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
              onClick={() => navigate(`/docente/lms/${mod.id}/contenido`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  mod.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {mod.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <h3 className="font-display font-bold text-base text-slate-900 mb-1 group-hover:text-primary transition-colors">
                {mod.name}
              </h3>
              <p className="text-xs text-slate-500 mb-3">{mod.code} • {mod.gradeName}</p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {mod.hours}h / {mod.weeks} semanas
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {mod.teacherName}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/docente/lms/${mod.id}/contenido`);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 py-2 rounded-lg transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar Contenido
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/docente/lms/${mod.id}/calendario`);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 py-2 rounded-lg transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Calendario
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
