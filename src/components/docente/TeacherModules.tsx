import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { LMSModule } from '../../types';
import LMSModuleEditor from './LMSModuleEditor';

export default function TeacherModules() {
  const { userProfile } = useAuth();
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModule, setEditingModule] = useState<LMSModule | null>(null);

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadModules();
  }, [userProfile]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'lms_modules'), where('teacherId', '==', userProfile?.teacherId || userProfile?.uid));
      const snap = await getDocs(q);
      
      // Fallback for testing
      if (snap.empty) {
         const allQ = query(collection(db, 'lms_modules'));
         const allSnap = await getDocs(allQ);
         setModules(allSnap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule)));
      } else {
         setModules(snap.docs.map(d => ({ id: d.id, ...d.data() } as LMSModule)));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (editingModule) {
    return (
      <LMSModuleEditor 
        module={editingModule} 
        onBack={() => setEditingModule(null)} 
        onSaved={() => { setEditingModule(null); loadModules(); }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mis Módulos (LMS)</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona el contenido de tus módulos técnicos asignados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => (
          <div key={mod.id} className="card-crema p-6 flex flex-col justify-between border-l-4 bg-white shadow-sm rounded-2xl" style={{ borderColor: mod.color || '#0D71B9' }}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-white px-2.5 py-1 rounded-md shadow-sm" style={{ backgroundColor: mod.color || '#0D71B9' }}>
                  {mod.code || 'MOD'}
                </span>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-md">{mod.gradeName}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 leading-tight">{mod.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{mod.description || 'Sin descripción'}</p>
            </div>
            
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 text-sm">{mod.hours || 0}h</span>
                  <span className="text-[10px] uppercase">Duración</span>
                </div>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-700 text-sm">{mod.weeks || 0} sem</span>
                  <span className="text-[10px] uppercase">Semanas</span>
                </div>
              </div>
              
              <button 
                onClick={() => setEditingModule(mod)}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm mt-2 flex justify-center items-center gap-2"
              >
                <span>Editar Contenido</span>
              </button>
            </div>
          </div>
        ))}
        {modules.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Sin módulos asignados</h3>
            <p className="text-slate-500">No tienes módulos técnicos asignados en este momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
