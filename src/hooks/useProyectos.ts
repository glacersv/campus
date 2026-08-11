import { useState, useEffect, useCallback } from 'react';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, doc,
  serverTimestamp, getDocs, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  Proyecto, EstadoProyecto, Integrante,
  FECHA_LIMITE_REGISTRO, FECHA_LIMITE_APROBACION
} from '../types';
import { getAllSubjects, getTeacher } from '../lib/firestore';

interface CrearProyectoData {
  titulo: string;
  descripcion: string;
  grado: string;
  seccion: string;
  materia_id: string;
  materias_secundarias?: string[];
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
      // Alumnos ven solo proyectos donde son integrantes
      // Fetch all y filtrar en cliente para soportar Auth UID y studentId (compatibilidad)
      q = query(col);
    } else if (userProfile.role === 'docente') {
      // Docentes ven todos los proyectos
      q = query(col,
        where('estado', 'in', ['borrador', 'registrado', 'en_revision_materia', 'aprobado_oficial', 'rechazado_materia'])
      );
    } else {
      q = query(col, orderBy('fecha_registro', 'desc'));
    }

    const unsub = onSnapshot(q, (snap) => {
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Proyecto));

      if (userProfile.role === 'alumno') {
        // Filtrar proyectos donde el alumno es integrante o representante
        data = data.filter(p => {
          const uid = userProfile.uid;
          const sid = userProfile.studentId || '';
          // 1. Auth UID en integrantes
          if (p.integrantes?.includes(uid)) return true;
          // 2. studentId en integrantes (compatibilidad con proyectos viejos)
          if (sid && p.integrantes?.includes(sid)) return true;
          // 3. Auth UID en integrantes_detalle
          if (p.integrantes_detalle?.some(i => i.uid === uid)) return true;
          // 4. studentId en integrantes_detalle
          if (sid && p.integrantes_detalle?.some(i => i.uid === sid)) return true;
          // 5. Es el representante/creador del proyecto
          if (p.representante_id === uid) return true;
          return false;
        });
      }

      // Ordenar por fecha_registro descendente en cliente
      data.sort((a, b) => (b.fecha_registro || '').localeCompare(a.fecha_registro || ''));
      setProyectos(data);
      setLoading(false);
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return unsub;
  }, [userProfile]);

  async function crearProyecto(data: CrearProyectoData): Promise<{ id?: string; error?: string }> {
    if (!userProfile) return { error: 'No hay sesión activa.' };
    if (data.integrantes.length < 1) {
      return { error: 'Debe haber al menos un integrante (líder).' };
    }

    const hoy = new Date().toISOString().slice(0, 10);

    const q = query(collection(db, 'proyectos'),
      where('titulo', '==', data.titulo),
      where('grado', '==', data.grado),
      where('seccion', '==', data.seccion)
    );
    const dup = await getDocs(q);
    if (!dup.empty) return { error: 'Ya existe un proyecto con ese título en este grado y sección.' };

    const materias = await getAllSubjects();
    const materia = materias.find(m => m.id === data.materia_id);
    const rep = data.integrantes.find(i => i.es_rep) || data.integrantes[0];

    try {
      const ref = await addDoc(collection(db, 'proyectos'), {
        titulo: data.titulo,
        descripcion: data.descripcion,
        grado: data.grado,
        seccion: data.seccion,
        materia_id: data.materia_id,
        materia_nombre: materia?.name ?? '',
        materias_secundarias: data.materias_secundarias ?? [],
        representante_id: rep?.uid || userProfile.uid,
        representante_nombre: rep?.nombre || userProfile.displayName,
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
      const proyectoActual = proyectos.find(p => p.id === proyectoId);
      const cambios: string[] = [];

      if (proyectoActual) {
        if (campos.titulo && campos.titulo !== proyectoActual.titulo) {
          cambios.push(`Título cambiado de "${proyectoActual.titulo}" a "${campos.titulo}"`);
        }
        if (campos.descripcion && campos.descripcion !== proyectoActual.descripcion) {
          cambios.push('Descripción modificada');
        }
        if (campos.grado && campos.grado !== proyectoActual.grado) {
          cambios.push(`Grado cambiado de "${proyectoActual.grado}" a "${campos.grado}"`);
        }
        if (campos.seccion && campos.seccion !== proyectoActual.seccion) {
          cambios.push(`Sección cambiada de "${proyectoActual.seccion}" a "${campos.seccion}"`);
        }
        if (campos.materia_nombre && campos.materia_nombre !== proyectoActual.materia_nombre) {
          cambios.push(`Materia cambiada de "${proyectoActual.materia_nombre}" a "${campos.materia_nombre}"`);
        }

        if (campos.integrantes_detalle) {
          const viejos = proyectoActual.integrantes_detalle?.map(i => i.nombre) ?? [];
          const nuevos = campos.integrantes_detalle.map(i => i.nombre);
          const agregados = nuevos.filter(n => !viejos.includes(n));
          const eliminados = viejos.filter(v => !nuevos.includes(v));
          agregados.forEach(n => cambios.push(`Se agregó integrante: ${n}`));
          eliminados.forEach(v => cambios.push(`Se eliminó integrante: ${v}`));
        }
      }

      await updateDoc(doc(db, 'proyectos', proyectoId), campos);

      if (cambios.length > 0 && proyectoActual) {
        await _registrarHistorial(
          proyectoId,
          'edicion_proyecto',
          { titulo: proyectoActual.titulo, integrantes: proyectoActual.integrantes_detalle?.map(i => i.nombre) },
          { titulo: campos.titulo ?? proyectoActual.titulo, integrantes: campos.integrantes_detalle?.map(i => i.nombre) ?? proyectoActual.integrantes_detalle?.map(i => i.nombre) },
          cambios.join(' | ')
        );
      }

      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function enviarAValidacion(proyectoId: string): Promise<{ ok?: boolean; error?: string }> {
    const hoy = new Date().toISOString().slice(0, 10);

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
    const materias = await getAllSubjects();
    const materia = materias.find(m => m.id === data.materia_id);
    const proyecto = proyectos.find(p => p.id === proyectoId);
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'aprobado_oficial',
        materia_validada_id: data.materia_id,
        materia_nombre: materia?.name ?? proyecto?.materia_nombre ?? '',
        observaciones: data.comentario ?? null,
        fecha_aprobacion: new Date().toISOString().slice(0, 10),
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
    const materias = await getAllSubjects();
    const materia = materias.find(m => m.id === data.materia_id);
    const proyecto = proyectos.find(p => p.id === proyectoId);
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        estado: 'reclasificar',
        materia_id: data.materia_id,
        materia_nombre: materia?.name ?? proyecto?.materia_nombre ?? '',
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

  async function agregarMateriaSecundaria(
    proyectoId: string,
    materiaId: string
  ): Promise<{ ok?: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        materias_secundarias: arrayUnion(materiaId),
      });
      return { ok: true };
    } catch (e: any) {
      return { error: e.message };
    }
  }

  async function removerMateriaSecundaria(
    proyectoId: string,
    materiaId: string
  ): Promise<{ ok?: boolean; error?: string }> {
    try {
      await updateDoc(doc(db, 'proyectos', proyectoId), {
        materias_secundarias: arrayRemove(materiaId),
      });
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
    agregarMateriaSecundaria, removerMateriaSecundaria,
  };
}
