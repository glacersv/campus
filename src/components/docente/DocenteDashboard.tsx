import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LMSModule, ModuloCronograma, StageJornalizacionItem } from '../../types';
import { formatDateSpanish } from '../../utils/jornalizacionHelper';
import { toast } from 'sonner';
import { 
  Calendar, Clock, CheckCircle2, Play, Pause, 
  ChevronRight, AlertTriangle, BookOpen, Target,
  TrendingUp, Award
} from 'lucide-react';

interface TodayTask {
  moduleId: string;
  moduleCode: string;
  moduleName: string;
  moduleColor: string;
  stage: StageJornalizacionItem | null;
  stageIndex: number;
  status: 'hoy' | 'proximo' | 'atrasado';
}

export default function DocenteDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayTasks, setTodayTasks] = useState<TodayTask[]>([]);

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lms_modules'));
      const snap = await getDocs(q);
      const allMods = snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule));
      setModules(allMods);
      calculateTodayTasks(allMods);
    } catch (e) {
      console.error(e);
      toast.error('Error al cargar módulos');
    } finally {
      setLoading(false);
    }
  };

  const calculateTodayTasks = (allMods: LMSModule[]) => {
    const today = new Date().toISOString().split('T')[0];
    const tasks: TodayTask[] = [];

    for (const mod of allMods) {
      if (!mod.jornalizacion || mod.jornalizacion.length === 0) continue;

      const stages = mod.jornalizacion as StageJornalizacionItem[];
      
      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        if (today >= stage.startDate && today <= stage.endDate) {
          tasks.push({
            moduleId: mod.id,
            moduleCode: mod.code,
            moduleName: mod.name,
            moduleColor: mod.color || '#0D71B9',
            stage,
            stageIndex: i,
            status: 'hoy',
          });
        } else if (today < stage.startDate) {
          // Próxima etapa
          const daysUntil = Math.ceil(
            (new Date(stage.startDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysUntil <= 7) {
            tasks.push({
              moduleId: mod.id,
              moduleCode: mod.code,
              moduleName: mod.name,
              moduleColor: mod.color || '#0D71B9',
              stage,
              stageIndex: i,
              status: 'proximo',
            });
          }
        }
      }
    }

    // Ordenar: hoy primero, luego próximos
    tasks.sort((a, b) => {
      if (a.status === 'hoy' && b.status !== 'hoy') return -1;
      if (a.status !== 'hoy' && b.status === 'hoy') return 1;
      return 0;
    });

    setTodayTasks(tasks);
  };

  // Calcular estadísticas
  const stats = {
    totalModules: modules.filter(m => m.jornalizacion && m.jornalizacion.length > 0).length,
    activeModules: modules.filter(m => m.status === 'active').length,
    totalHours: modules.reduce((sum, m) => sum + (m.hours || 0), 0),
    completedStages: modules.reduce((sum, m) => {
      if (!m.jornalizacion) return sum;
      const stages = m.jornalizacion as StageJornalizacionItem[];
      const today = new Date().toISOString().split('T')[0];
      return sum + stages.filter(s => s.endDate < today).length;
    }, 0),
    totalStages: modules.reduce((sum, m) => sum + (m.jornalizacion?.length || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mi Panel Docente</h1>
        <p className="text-slate-500 text-sm mt-1">
          Resumen de actividad docente y progreso de módulos
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-crema p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <BookOpen size={18} />
            <span className="text-xs font-medium">Módulos</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalModules}</div>
          <div className="text-xs text-slate-500">{stats.activeModules} activos</div>
        </div>
        <div className="card-crema p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Clock size={18} />
            <span className="text-xs font-medium">Horas</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalHours}h</div>
          <div className="text-xs text-slate-500">planificadas</div>
        </div>
        <div className="card-crema p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Target size={18} />
            <span className="text-xs font-medium">Etapas</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.completedStages}/{stats.totalStages}</div>
          <div className="text-xs text-slate-500">completadas</div>
        </div>
        <div className="card-crema p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <TrendingUp size={18} />
            <span className="text-xs font-medium">Avance</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stats.totalStages > 0 ? Math.round((stats.completedStages / stats.totalStages) * 100) : 0}%
          </div>
          <div className="text-xs text-slate-500">general</div>
        </div>
      </div>

      {/* Tareas de Hoy */}
      {todayTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="text-primary" size={20} />
            Actividad de Hoy
          </h2>
          <div className="space-y-3">
            {todayTasks.map(task => (
              <div
                key={`${task.moduleId}-${task.stageIndex}`}
                className={`card-crema p-4 rounded-xl border-l-4 ${
                  task.status === 'hoy' 
                    ? 'border-l-emerald-500 bg-emerald-50/50' 
                    : 'border-l-amber-500 bg-amber-50/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold text-white px-2 py-1 rounded-md"
                      style={{ backgroundColor: task.moduleColor }}
                    >
                      {task.moduleCode}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900">{task.moduleName}</h3>
                      <p className="text-sm text-slate-600">{task.stage?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.status === 'hoy' ? (
                      <span className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
                        <CheckCircle2 size={16} />
                        En curso
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-700 text-sm font-medium">
                        <Clock size={16} />
                        Próximamente
                      </span>
                    )}
                    <button
                      onClick={() => navigate(`/docente/jornalizacion/${task.moduleId}`)}
                      className="p-2 rounded-lg hover:bg-white/80 transition-colors"
                    >
                      <ChevronRight size={16} className="text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accesos Rápidos */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Accesos Rápidos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/docente/jornalizacion')}
            className="card-crema p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
          >
            <Calendar className="text-primary mb-2" size={24} />
            <h3 className="font-bold text-slate-900">Cronograma</h3>
            <p className="text-sm text-slate-500 mt-1">Ver y generar cronograma de módulos</p>
          </button>
          <button
            onClick={() => navigate('/docente/proyectos')}
            className="card-crema p-4 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50 transition-all text-left"
          >
            <Award className="text-emerald-600 mb-2" size={24} />
            <h3 className="font-bold text-slate-900">Proyectos</h3>
            <p className="text-sm text-slate-500 mt-1">Gestionar proyectos estudiantiles</p>
          </button>
          <button
            onClick={() => navigate('/docente/modules')}
            className="card-crema p-4 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all text-left"
          >
            <BookOpen className="text-amber-600 mb-2" size={24} />
            <h3 className="font-bold text-slate-900">Módulos</h3>
            <p className="text-sm text-slate-500 mt-1">Administrar contenido LMS</p>
          </button>
        </div>
      </div>
    </div>
  );
}
