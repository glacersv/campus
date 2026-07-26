import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Proyecto, EstadoProyecto, Integrante,
  FECHA_LIMITE_REGISTRO, FECHA_LIMITE_APROBACION, MATERIAS_PROYECTO
} from '../types';

interface CrearProyectoData {
  titulo: string;
  descripcion: string;
  grado: string;
  seccion: string;
  materia_id: string;
  integrantes: Integrante[];
}

interface AccionDocenteData {
  materia_id: string;
  comentario?: string;
}

export function useProyectos() {
  const { userProfile } = useAuth();
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userProfile) return;
    setLoading(true);

    const col = collection(db, 'proyectos');
    let q;

    if (userProfile.role === 'alumno') {
      q = query(col,
        where('integrantes', 'array-contains', userProfile.uid),
        orderBy('fecha_registro', 'desc')
      );
    } else if (userProfile.role === 'docente') {
      q = query(col,
        where('estado', 'in', ['registrado', 'en_revision_materia']),
        orderBy('fecha_registro', 'desc')
      );
    } else {
      q = query(col, orderBy('fecha_registro', 'desc'));
    }

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));
      setProyectos(data);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return unsub;
  }, [userProfile]);

  async function crearProyecto(data: CrearProyectoData): Promise<{ id?: string; error?: string }> {
    const hoy = new Date().toISOString().slice(0, 10);
    if (hoy > FECHA_LIMITE_REGISTRO) return { error: 'La fecha límite de registro (17 de junio) ya pasó.' };
    if (!userProfile) return { error: 'No hay sesión activa.' };
    if (data.integrantes.length < 5 || data.integrantes.length > 6) {
      return { error: 'El equipo debe tener entre 5 y 6 integrantes.' };
    }

    const q = query(collection(db, 'proyectos'),
      where('titulo', '==', data.titulo),
      where('grado', '==', data.grado),
      where('seccion', '==', data.seccion)
    );
    const dup = await getDocs(q);
    if (!dup.empty) return { error: 'Ya existe un proyecto con ese título en este grado y sección.' };

    const materia = MATERIAS_PROYECTO.find(m => m.id === data.materia_id);
    const rep = data.integrantes.find(i => i.es_rep);

    try {
      const ref = await addDoc(collection(db, 'proyectos'), {
        titulo: data.titulo,
        descripcion: data.descripcion,
        grado: data.grado,
        seccion: data.seccion,
        materia_id: data.materia_id,
        materia_nombre: materia?.nombre ?? '',
        representante_id: userProfile.uid,
        representante_nombre: userProfile.displayName,
        integrantes: data.integrantes.map(i => i.uid),
        integrantes_detalle: data.integrantes,
        estado: 'borrador' as EstadoProyecto,
        intentos_envio: 0,
        observaciones: null,
        fecha_registro: hoy,
        fecha_envio: null,
        fecha_aprobacion: null,
      });
      await _registrarHistorial(ref.id, 'registro', undefined, { estado: 'borrador' });
      return { id: ref.id };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function guardarBorrador(
    proyectoId: string,
    campos: Partial<Proyecto>
  ): Promise<{ ok?: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), { ...campos, estado: 'borrador' });
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function enviarAValidacion(proyectoId: string): Promise<{ ok?: boolean; error?: string }> {
    const hoy = new Date().toISOString().slice(0, 10);
    if (hoy > FECHA_LIMITE_REGISTRO) return { error: 'La fecha límite de registro (17 de junio) ya pasó.' };

    const proyecto = proyectos.find(p => p.id === proyectoId);
    if (!proyecto) return { error: 'Proyecto no encontrado.' };
    if (proyecto.intentos_envio >= 2) return { error: 'Se agotaron los 2 intentos de envío permitidos.' };

    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'registrado',
        intentos_envio: proyecto.intentos_envio + 1,
        fecha_envio: hoy,
        observaciones: null,
      });
      await _registrarHistorial(proyectoId, 'envio_validacion', undefined, { estado: 'registrado' });
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function aprobarMateria(
    proyectoId: string,
    data: AccionDocenteData
  ): Promise<{ ok?: boolean; error?: string }> {
    const materia = MATERIAS_PROYECTO.find(m => m.id === data.materia_id);
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'en_coordinacion',
        materia_validada_id: data.materia_id,
        materia_nombre: materia?.nombre ?? '',
        observaciones: data.comentario ?? null,
      });
      await _registrarHistorial(proyectoId, 'aprobacion_materia',
        undefined, { materia_id: data.materia_id }, data.comentario);
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function reclasificar(
    proyectoId: string,
    data: AccionDocenteData
  ): Promise<{ ok?: boolean; error?: string }> {
    if (!data.comentario) return { error: 'Debes escribir un comentario para reclasificar.' };
    const materia = MATERIAS_PROYECTO.find(m => m.id === data.materia_id);
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'reclasificar',
        materia_id: data.materia_id,
        materia_nombre: materia?.nombre ?? '',
        observaciones: data.comentario,
      });
      await _registrarHistorial(proyectoId, 'reclasificacion',
        undefined, { materia_id: data.materia_id }, data.comentario);
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function rechazarMateria(
    proyectoId: string,
    comentario: string
  ): Promise<{ ok?: boolean; error?: string }> {
    if (!comentario) return { error: 'Debes escribir un motivo de rechazo.' };
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'rechazado_materia',
        observaciones: comentario,
      });
      await _registrarHistorial(proyectoId, 'rechazo_materia',
        undefined, { estado: 'rechazado_materia' }, comentario);
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function aprobarOficial(proyectoId: string): Promise<{ ok?: boolean; error?: string }> {
    const hoy = new Date().toISOString().slice(0, 10);
    if (hoy > FECHA_LIMITE_APROBACION) return { error: 'La fecha límite de aprobación (23 de junio) ya pasó.' };
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'aprobado_oficial',
        fecha_aprobacion: hoy,
        observaciones: null,
      });
      await _registrarHistorial(proyectoId, 'aprobacion_coordinacion',
        undefined, { estado: 'aprobado_oficial' });
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function rechazarOficial(
    proyectoId: string,
    motivo: string
  ): Promise<{ ok?: boolean; error?: string }> {
    if (!motivo) return { error: 'Debes indicar el motivo del rechazo.' };
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'rechazado_oficial',
        observaciones: motivo,
      });
      await _registrarHistorial(proyectoId, 'rechazo_coordinacion',
        undefined, { estado: 'rechazado_oficial' }, motivo);
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function _registrarHistorial(
    proyectoId: string,
    accion: string,
    valorAnterior?: Record<string, unknown>,
    valorNuevo?: Record<string, unknown>,
    comentario?: string
  ) {
    if (!userProfile) return;
    try {
      await addDoc(collection(db, 'historial'), {
        proyecto_id: proyectoId,
        actor_id: userProfile.uid,
        actor_nombre: userProfile.displayName,
        rol_actor: userProfile.role,
        accion,
        valor_anterior: valorAnterior ?? null,
        valor_nuevo: valorNuevo ?? null,
        comentario: comentario ?? null,
        fecha: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Error guardando historial:', e);
    }
  }

  return {
    proyectos, loading, error,
    crearProyecto, guardarBorrador, enviarAValidacion,
    aprobarMateria, reclasificar, rechazarMateria,
    aprobarOficial, rechazarOficial,
  };
}
