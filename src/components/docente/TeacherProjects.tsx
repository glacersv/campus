import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import InstitutionLogo from '../shared/InstitutionLogo';
import { useNavigate } from 'react-router-dom';

interface Integrante {
  uid: string;
  nombre: string;
  es_rep: boolean;
}

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

export default function TeacherProjects() {
  const { userProfile, firebaseUser } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'proyectos'),
      where('estado', 'in', ['registrado', 'en_revision_materia', 'reclasificar', 'rechazado_materia']),
      orderBy('fecha_registro', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setProyectos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto)));
      setLoading(false);
    });
    return unsub;
  }, []);

  async function cambiarEstado(proyectoId: string, nuevoEstado: string, comentario?: string) {
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: nuevoEstado,
        observaciones: comentario || null,
      });
    } catch (e) {
      console.error('Error actualizando estado:', e);
    }
  }

  const estadosDisponibles = [
    { value: 'en_revision_materia', label: 'En revisión de materia' },
    { value: 'aprobado_oficial', label: 'Aprobado oficial' },
    { value: 'rechazado_materia', label: 'Rechazado por materia' },
    { value: 'reclasificar', label: 'Reclasificar' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gray-100 text-gray-600';
      case 'registrado': return 'bg-slate-100 text-slate-700';
      case 'en_revision_materia': return 'bg-blue-100 text-blue-700';
      case 'aprobado_oficial': return 'bg-emerald-100 text-emerald-700';
      case 'rechazado_materia':
      case 'rechazado_oficial': return 'bg-red-100 text-red-700';
      case 'reclasificar': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InstitutionLogo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Semana de la Juventud</h1>
              <p className="text-xs text-slate-400">Gestión de Proyectos</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver al Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Proyectos en Revisión</h2>
          <p className="text-slate-500 mt-1">{proyectos.length} proyecto(s) encontrado(s)</p>
        </div>

        <div className="space-y-4">
          {proyectos.map(proyecto => (
            <div key={proyecto.id} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{proyecto.titulo}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {proyecto.grado} {proyecto.seccion} · {proyecto.materia_nombre} · {proyecto.integrantes.length} integrantes
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Representante: {proyecto.representante_nombre}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(proyecto.estado)}`}>
                  {proyecto.estado}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <select
                  onChange={(e) => cambiarEstado(proyecto.id!, e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  defaultValue=""
                >
                  <option value="" disabled>Cambiar estado...</option>
                  {estadosDisponibles.map(e => (
                    <option key={e.value} value={e.value}>{e.label}</option>
                  ))}
                </select>
                {proyecto.observaciones && (
                  <span className="text-xs text-slate-500">
                    Nota: {proyecto.observaciones}
                  </span>
                )}
              </div>
            </div>
          ))}
          {proyectos.length === 0 && (
            <p className="text-center text-slate-400 py-8">No hay proyectos en revisión</p>
          )}
        </div>
      </main>
    </div>
  );
}