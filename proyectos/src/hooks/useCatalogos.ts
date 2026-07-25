// src/hooks/useCatalogos.ts
import { useState, useEffect } from 'react'
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, updateDoc, deleteDoc, doc, getDocs
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './useAuth'
import { Validador, HistorialItem, Perfil } from '../types'

// ── Validadores (asignación docente por grado+materia) ────────
export function useValidadores() {
  const [asignaciones, setAsignaciones] = useState<Validador[]>([])
  const [docentes,     setDocentes]     = useState<Perfil[]>([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    // Escuchar validadores en tiempo real
    const unsubV = onSnapshot(collection(db, 'validadores'), snap => {
      setAsignaciones(snap.docs.map(d => ({ id: d.id, ...d.data() } as Validador)))
    })

    // Obtener docentes una vez
    fetchDocentes()

    return unsubV
  }, [])

  async function fetchDocentes() {
    setLoading(true)
    const q = query(collection(db, 'perfiles'), where('rol', '==', 'docente'), orderBy('nombre'))
    const snap = await getDocs(q)
    setDocentes(snap.docs.map(d => ({ id: d.id, ...d.data() } as Perfil)))
    setLoading(false)
  }

  async function asignarValidador(data: {
    grado:          string
    materia_id:     string
    materia_nombre: string
    docente_id:     string
    docente_nombre: string
  }): Promise<{ ok?: boolean; error?: string }> {
    try {
      // Verificar si ya existe y actualizar, o crear nuevo
      const q = query(collection(db, 'validadores'),
        where('grado',      '==', data.grado),
        where('materia_id', '==', data.materia_id)
      )
      const snap = await getDocs(q)
      if (!snap.empty) {
        await updateDoc(snap.docs[0].ref, {
          docente_id:     data.docente_id,
          docente_nombre: data.docente_nombre,
        })
      } else {
        await addDoc(collection(db, 'validadores'), data)
      }
      return { ok: true }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  async function quitarValidador(id: string): Promise<{ ok?: boolean; error?: string }> {
    try {
      await deleteDoc(doc(db, 'validadores', id))
      return { ok: true }
    } catch (e: any) {
      return { error: e.message }
    }
  }

  return { asignaciones, docentes, loading, asignarValidador, quitarValidador }
}

// ── Historial de un proyecto ──────────────────────────────────
export function useHistorial(proyectoId: string | null) {
  const [historial, setHistorial] = useState<HistorialItem[]>([])
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    if (!proyectoId) return
    setLoading(true)

    const q = query(
      collection(db, 'historial'),
      where('proyecto_id', '==', proyectoId),
      orderBy('fecha', 'desc')
    )

    const unsub = onSnapshot(q, snap => {
      setHistorial(snap.docs.map(d => ({ id: d.id, ...d.data() } as HistorialItem)))
      setLoading(false)
    })

    return unsub
  }, [proyectoId])

  return { historial, loading }
}

// ── Todos los perfiles (para admin) ──────────────────────────
export function usePerfiles() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'perfiles'), orderBy('nombre'))
    const unsub = onSnapshot(q, snap => {
      setPerfiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as Perfil)))
      setLoading(false)
    })
    return unsub
  }, [])

  return { perfiles, loading }
}
