// Panel Docente LMS — Mis Módulos
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { lmsService } from '../../../services/lmsService';
import { LMSModule, LMSCourse } from '../../../types';
import { BTV_GRAPHIC_DESIGN_COURSES } from '../../../services/btvCurriculumData';
import { BookOpen, Plus, Calendar, Users, FileText, Edit, Trash2, GraduationCap, Filter } from 'lucide-react';

export default function TeacherLMSDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');

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

  const filteredModules = modules.filter(mod => selectedYear === 'all' || mod.technicalYear === selectedYear);

  return (
    <div className="space-y-6">
      {/* Banner Decorativo */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-blue-600 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-extrabold tracking-tight">Mis Módulos Técnicos</h1>
              <p className="text-blue-100 mt-1 max-w-xl text-sm leading-relaxed">
                Gestiona el contenido de tus módulos, edita los descriptores, revisa la jornalización y coordina las entregas de proyectos.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/docente/lms/crear')}
            className="inline-flex shrink-0 items-center gap-2 bg-white text-primary px-5 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Crear Módulo
          </button>
        </div>
      </div>

      {/* Navegación por Año */}
      <div className="flex items-center gap-2 pb-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-2 bg-white/60 p-1 rounded-xl border border-slate-200/60 shadow-sm backdrop-blur-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1 shrink-0" />
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedYear === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedYear('1')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedYear === '1' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            1° Año
          </button>
          <button
            onClick={() => setSelectedYear('2')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedYear === '2' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            2° Año
          </button>
          <button
            onClick={() => setSelectedYear('3')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedYear === '3' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            3° Año
          </button>
        </div>
        <div className="ml-auto text-xs font-medium text-slate-500">
          Mostrando {filteredModules.length} módulo{filteredModules.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredModules.length === 0 ? (
        <div className="card-crema p-10 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 font-medium">No se encontraron módulos</p>
          <p className="text-xs text-slate-500 mt-1">
            {selectedYear !== 'all' 
              ? `No tienes módulos asignados para el ${selectedYear}° Año` 
              : 'Contacta al administrador para que te asigne módulos'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((mod) => (
            <motion.div
              key={mod.id}
              whileHover={{ y: -2 }}
              className="card-crema p-5 border border-slate-200 hover:shadow-md transition-all cursor-pointer group flex flex-col h-full"
              onClick={() => navigate(`/docente/lms/${mod.id}/contenido`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                    {mod.technicalYear}° Año
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                    mod.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {mod.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              <h3 className="font-display font-bold text-base text-slate-900 mb-1 group-hover:text-primary transition-colors flex-1">
                {mod.name}
              </h3>
              <p className="text-xs text-slate-500 mb-4">{mod.code} • {mod.gradeName}</p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 mb-4">
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  {mod.hours}h / {mod.weeks} sem
                </span>
                <span className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm truncate">
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">{lmsService.getTeacherName(mod.teacherId)}</span>
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 mt-auto">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/docente/modulos`);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-primary hover:bg-primary/5 py-2.5 rounded-lg transition-colors border border-transparent hover:border-primary/20"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/docente/modulos`);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 py-2.5 rounded-lg transition-colors border border-slate-200"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Fechas
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
