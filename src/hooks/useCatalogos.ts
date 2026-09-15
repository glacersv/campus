import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Validador, HistorialItem, User } from '../types';

export function useValidadores() {
  const [asignaciones, setAsignaciones] = useState<Validador[]>([]);
  const [docentes, setDocentes] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubV = onSnapshot(
      collection(db, 'validadores'),
      (snap) => {
        setAsignaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Validador));
      },
      (err) => {
        console.warn('validadores onSnapshot warning:', err.message);
      }
    );

    fetchDocentes();
    return unsubV;
  }, []);

  async function fetchDocentes() {
    setLoading(true);
    const q = query(collection(db, 'users'), where('role', '==', 'docente'), orderBy('displayName'));
    const snap = await getDocs(q);
    setDocentes(snap.docs.map(d => ({ uid: d.id, ...d.data() } as User)));
    setLoading(false);
  }

  async function asignarValidador(data: {
    grado: string;
    materia_id: string;
    materia_nombre: string;
    docente_id: string;
    docente_nombre: string;
  }): Promise<{ ok?: boolean; error?: string }> {
    try {
      const q = query(collection(db, 'validadores'),
        where('grado', '==', data.grado),
        where('materia_id', '==', data.materia_id)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          docente_id: data.docente_id,
          docente_nombre: data.docente_nombre,
        });
      } else {
        await addDoc(collection(db, 'validadores'), data);
      }
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function quitarValidador(id: string): Promise<{ ok?: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'validadores', id));
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  return { asignaciones, docentes, loading, asignarValidador, quitarValidador };
}

export function useHistorial(proyectoId: string | null) {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!proyectoId) return;
    setLoading(true);

    const q = query(
      collection(db, 'historial'),
      where('proyecto_id', '==', proyectoId),
      orderBy('fecha', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setHistorial(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HistorialItem));
        setLoading(false);
      },
      (err) => {
        console.warn('historial onSnapshot warning:', err.message);
        setLoading(false);
      }
    );

    return unsub;
  }, [proyectoId]);

  return { historial, loading };
}

export function usePerfiles() {
  const [perfiles, setPerfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('displayName'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPerfiles(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as User));
        setLoading(false);
      },
      (err) => {
        console.warn('perfiles onSnapshot warning:', err.message);
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  return { perfiles, loading };
}
