import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import InstitutionLogo from '../shared/InstitutionLogo';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Layers, CheckCircle2, Clock } from 'lucide-react';

interface Proyecto {
  id?: string;
  titulo: string;
  descripcion: string;
  grado: string;
  seccion: string;
  materia_id: string;
  materia_nombre: string;
  representante_id: string;
  representante_nombre: string;
  integrantes: string[];
  estado: string;
  intentos_envio: number;
  observaciones: string | null;
  fecha_registro: string;
}

export default function StudentProjects() {
  const { userProfile, firebaseUser } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const uid = firebaseUser?.uid || '';
  const studentGrade = (userProfile?.gradeId || '').toLowerCase();
  const studentSection = (userProfile?.sectionId || '').toLowerCase();

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    // Los alumnos solo ven lo que el docente genere para su área o en lo que han sido asignados
    const qUser = query(
      collection(db, 'proyectos'),
      where('integrantes', 'array-contains', uid),
      orderBy('fecha_registro', 'desc')
    );

    const unsub = onSnapshot(
      qUser,
      async (snap) => {
        const userProjects = snap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));
        
        // Si no hay asignación directa por UID, consultar si el docente generó proyectos para su grado
        if (userProjects.length === 0 && studentGrade) {
          try {
            const qGrade = query(
              collection(db, 'proyectos'),
              where('grado', '==', userProfile?.gradeId || ''),
              orderBy('fecha_registro', 'desc')
            );
            const gradeSnap = await getDocs(qGrade);
            const gradeProjects = gradeSnap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));
            setProyectos(gradeProjects);
          } catch {
            setProyectos([]);
          }
        } else {
          setProyectos(userProjects);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('StudentProjects onSnapshot error:', err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [uid, studentGrade, studentSection]);

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-100 text-gray-600';
      case 'registrado': return 'bg-slate-100 text-slate-700';
      case 'en_revision_materia': return 'bg-blue-100 text-blue-700';
      case 'aprobado_oficial': return 'bg-emerald-100 text-emerald-700';
      case 'rechazado_materia': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-main)' }}>
      <header className="bg-white border-b border-slate-200/80 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InstitutionLogo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Semana de la Juventud</h1>
              <p className="text-xs text-slate-400">Proyectos y Actividades Asignadas por el Docente</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver al Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="card-crema p-6 bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-3xl border border-blue-800 shadow-md">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-slate-950">
              Área Estudiantil
            </span>
            <span className="text-xs text-blue-200">
              Semana de la Juventud 2026
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display">Proyectos Asignados para tu Área</h2>
          <p className="text-xs md:text-sm text-blue-100/90 mt-1 max-w-2xl">
            Los proyectos y actividades son definidos por el docente del área técnica. Aquí puedes consultar el progreso, rúbricas y estado de evaluación de los proyectos en los que participas.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Proyectos Asignados</h3>
            <p className="text-slate-500 text-xs">{proyectos.length} proyecto(s) registrado(s)</p>
          </div>
        </div>

        <div className="space-y-4">
          {proyectos.map(proyecto => (
            <div key={proyecto.id} className="card-crema p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-[#0D71B9] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{proyecto.titulo}</h3>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {proyecto.descripcion}
                  </p>
                  <p className="text-xs text-slate-400 pt-1">
                    {proyecto.grado} {proyecto.seccion} · {proyecto.materia_nombre || 'Área Técnica'} {proyecto.integrantes ? `· ${proyecto.integrantes.length} integrante(s)` : ''}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 ${getBadgeColor(proyecto.estado)}`}>
                  {proyecto.estado}
                </span>
              </div>
            </div>
          ))}

          {proyectos.length === 0 && (
            <div className="card-crema p-10 text-center text-slate-400 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No tienes proyectos asignados aún</p>
              <p className="text-xs text-slate-400">
                Tu docente asignará los proyectos correspondientes a tu área técnica y nivel de formación.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}