import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Users,
  Medal,
  ClipboardCheck,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { getTeacher, getTeacherByEmail, getAllStudents } from '../../lib/firestore';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import WelcomeBanner from '../shared/WelcomeBanner';

interface DocenteStats {
  gruposAsignados: number;
  totalAlumnos: number;
  proyectosActivos: number;
  formacionesPendientes: number;
}

interface ProyectoCount {
  grado: string;
  seccion: string;
  count: number;
}

export default function DocenteDashboard() {
  const { userProfile, firebaseUser } = useAuth();
  const [stats, setStats] = useState<DocenteStats>({
    gruposAsignados: 0,
    totalAlumnos: 0,
    proyectosActivos: 0,
    formacionesPendientes: 0
  });
  const [proyectosPorGrado, setProyectosPorGrado] = useState<ProyectoCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;

    let isMounted = true;

    const loadRealData = async () => {
      try {
        // 1. Obtener docente y su grado guía asignado
        let teacher = userProfile?.teacherId ? await getTeacher(userProfile.teacherId) : null;
        if (!teacher && userProfile?.email) {
          teacher = await getTeacherByEmail(userProfile.email);
        }

        // 2. Obtener alumnos
        const allStudents = await getAllStudents();
        let assignedStudentsCount = 0;
        let assignedGroupsCount = 0;

        if (teacher?.guideGradeId) {
          const guideStudents = allStudents.filter(s => s.gradeId === teacher?.guideGradeId);
          assignedStudentsCount = guideStudents.length;
          assignedGroupsCount = 1;
        } else {
          // Si no tiene grado guía explícito, usar los alumnos de BTV o total general de su cohorte
          const btvStudents = allStudents.filter(s => s.gradeId === '11t');
          assignedStudentsCount = btvStudents.length > 0 ? btvStudents.length : allStudents.length;
          assignedGroupsCount = btvStudents.length > 0 ? 1 : 1;
        }

        // 3. Proyectos asignados al docente
        const q = query(
          collection(db, 'proyectos'),
          where('estado', 'in', ['registrado', 'en_revision_materia', 'aprobado_materia'])
        );

        const snap = await getDocs(q);
        const proyectos = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        const activos = proyectos.length;

        const grupoMap = new Map<string, { grado: string; seccion: string; count: number; alumnos: number }>();
        proyectos.forEach(p => {
          const key = `${p.grado}|${p.seccion}`;
          const existing = grupoMap.get(key);
          if (existing) {
            existing.count += 1;
            existing.alumnos += (p.integrantes?.length || 0);
          } else {
            grupoMap.set(key, {
              grado: p.grado,
              seccion: p.seccion,
              count: 1,
              alumnos: p.integrantes?.length || 0
            });
          }
        });

        const grupos = Array.from(grupoMap.values());

        if (isMounted) {
          setStats({
            gruposAsignados: assignedGroupsCount || grupos.length || 1,
            totalAlumnos: assignedStudentsCount || allStudents.length,
            proyectosActivos: activos,
            formacionesPendientes: 0,
          });

          setProyectosPorGrado(grupos.map(g => ({
            grado: g.grado,
            seccion: g.seccion,
            count: g.count
          })));

          setLoading(false);
        }
      } catch (err) {
        console.error('Error loading docente dashboard stats:', err);
        if (isMounted) setLoading(false);
      }
    };

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [firebaseUser, userProfile]);

  const statCards = [
    { 
      label: 'Grupos Asignados', 
      value: stats.gruposAsignados, 
      icon: Users, 
      accent: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30' 
    },
    { 
      label: 'Total Alumnos', 
      value: stats.totalAlumnos, 
      icon: BookOpen, 
      accent: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/15 dark:text-sky-400 dark:border-sky-500/30' 
    },
    { 
      label: 'Proyectos Activos', 
      value: stats.proyectosActivos, 
      icon: Medal, 
      accent: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30' 
    },
    { 
      label: 'Formaciones', 
      value: stats.formacionesPendientes, 
      icon: ClipboardCheck, 
      accent: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30' 
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Banner contextual para docente */}
      <WelcomeBanner
        name={userProfile?.displayName || 'Bienvenido'}
        role="docente"
        area="general"
        subtitle="Gestione sus grupos, proyectos y actividades académicas desde su panel central."
        badge="Año Escolar 2026"
        showProfile={true}
      />

      {/* Stat Cards - Estilo AdminDashboard pero simplificado */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-display text-2xl font-black leading-tight text-slate-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-primary transition-colors">
                <span>Ver detalle</span>
                <ArrowUpRight className="w-3 h-3" />
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Proyectos por Grado - Mini insight */}
      {proyectosPorGrado.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center dark:bg-indigo-500/15">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Proyectos por Grupo
              </h3>
              <p className="text-xs text-slate-400">
                Distribución de proyectos activos
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {proyectosPorGrado.slice(0, 5).map((g, i) => (
              <div
                key={`${g.grado}-${g.seccion}`}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors dark:bg-slate-700/50 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                    {g.grado.replace(/[^0-9]/g, '')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {g.grado} "{g.seccion}"
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Sección {g.seccion}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">
                    {g.count} proyecto{g.count !== 1 ? 's' : ''}
                  </span>
                  <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden dark:bg-slate-600">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${Math.min(100, (g.count / Math.max(...proyectosPorGrado.map(x => x.count))) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Grid de Módulos - Reutilizando componente compartido sin duplicar banner ni stats */}
      <ModuleGridDashboard
        title="Módulos del Sistema"
        subtitle=""
        basePath="/docente"
        showMondayNotice={true}
        exclude={['formacion']}
        bannerArea="general"
        showProfile={false}
        showBanner={false}
        showStats={false}
      >
        {/* Contenido adicional personalizado si se necesita */}
      </ModuleGridDashboard>
    </div>
  );
}
