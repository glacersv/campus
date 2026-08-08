import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
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

export default function StudentProjects() {
  const { userProfile, firebaseUser } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nuevoProyecto, setNuevoProyecto] = useState({
    titulo: '',
    descripcion: '',
    grado: '',
    seccion: '',
    materia_id: '',
    integrantes: [{ uid: '', nombre: '', es_rep: true }],
  });
  const navigate = useNavigate();

  const uid = firebaseUser?.uid || '';
  const nombre = userProfile?.displayName || '';

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const q = query(
      collection(db, 'proyectos'),
      where('integrantes', 'array-contains', uid),
      orderBy('fecha_registro', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setProyectos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto)));
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  async function crearProyecto(e: React.FormEvent) {
    e.preventDefault();
    if (nuevoProyecto.integrantes.length < 5) return;
    try {
      const hoy = new Date().toISOString().slice(0, 10);
      const materia = { id: nuevoProyecto.materia_id, nombre: '' };
      await addDoc(collection(db, 'proyectos'), {
        titulo: nuevoProyecto.titulo,
        descripcion: nuevoProyecto.descripcion,
        grado: nuevoProyecto.grado,
        seccion: nuevoProyecto.seccion,
        materia_id: nuevoProyecto.materia_id,
        materia_nombre: materia.nombre,
        representante_id: uid,
        representante_nombre: nombre,
        integrantes: nuevoProyecto.integrantes.map(i => i.uid),
        estado: 'borrador',
        intentos_envio: 0,
        observaciones: null,
        fecha_registro: hoy,
      });
      setNuevoProyecto({ titulo: '', descripcion: '', grado: '', seccion: '', materia_id: '', integrantes: [{ uid: '', nombre: '', es_rep: true }] });
      setShowForm(false);
    } catch (err) {
      console.error('Error creando proyecto:', err);
    }
  }

  async function enviarProyecto(id: string) {
    try {
      await updateDoc(doc(db, 'proyectos', id), { estado: 'registrado' });
    } catch (err) {
      console.error('Error enviando:', err);
    }
  }

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
    <div className="min-h-screen bg-[#F9FAFB]">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <InstitutionLogo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Semana de la Juventud</h1>
              <p className="text-xs text-slate-400">Mis Proyectos</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver al Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Mis Proyectos</h2>
            <p className="text-slate-500 mt-1">{proyectos.length} proyecto(s)</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            {showForm ? 'Cancelar' : '+ Nuevo Proyecto'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={crearProyecto} className="mb-8 p-6 bg-white rounded-xl border border-gray-200 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
              <input type="text" value={nuevoProyecto.titulo} onChange={e => setNuevoProyecto({...nuevoProyecto, titulo: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea value={nuevoProyecto.descripcion} onChange={e => setNuevoProyecto({...nuevoProyecto, descripcion: e.target.value})} required rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grado</label>
                <input type="text" value={nuevoProyecto.grado} onChange={e => setNuevoProyecto({...nuevoProyecto, grado: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Sección</label>
                <input type="text" value={nuevoProyecto.seccion} onChange={e => setNuevoProyecto({...nuevoProyecto, seccion: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Materia</label>
                <input type="text" value={nuevoProyecto.materia_id} onChange={e => setNuevoProyecto({...nuevoProyecto, materia_id: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>
            <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">Crear Proyecto</button>
          </form>
        )}

        <div className="space-y-4">
          {proyectos.map(proyecto => (
            <div key={proyecto.id} className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-slate-900">{proyecto.titulo}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {proyecto.grado} {proyecto.seccion} · {proyecto.materia_nombre} · {proyecto.integrantes.length} integrantes
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBadgeColor(proyecto.estado)}`}>
                  {proyecto.estado}
                </span>
              </div>
              {proyecto.estado === 'borrador' && (
                <button
                  onClick={() => enviarProyecto(proyecto.id!)}
                  className="mt-3 px-4 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600"
                >
                  Enviar para Validación
                </button>
              )}
            </div>
          ))}
          {proyectos.length === 0 && (
            <p className="text-center text-slate-400 py-8">No tienes proyectos aún. Crea uno para empezar.</p>
          )}
        </div>
      </main>
    </div>
  );
}