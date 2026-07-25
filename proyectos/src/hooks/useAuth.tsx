// src/hooks/useAuth.tsx
import {
  createContext, useContext, useEffect, useState, ReactNode
} from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../lib/firebase'
import { Perfil, RolUsuario } from '../types'

interface SignUpData {
  email:        string
  password:     string
  nombre:       string
  rol:          RolUsuario
  grado?:       string
  seccion?:     string
  numero_lista?: number
  materia_id?:  string
}

interface AuthContextType {
  user:    User | null
  perfil:  Perfil | null
  loading: boolean
  signIn:  (email: string, password: string) => Promise<string | null>
  signUp:  (data: SignUpData) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [perfil,  setPerfil]  = useState<Perfil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        await fetchPerfil(u.uid)
      } else {
        setPerfil(null)
        setLoading(false)
      }
    })
    return unsub
  }, [])

  async function fetchPerfil(uid: string) {
    try {
      const snap = await getDoc(doc(db, 'perfiles', uid))
      if (snap.exists()) setPerfil({ id: snap.id, ...snap.data() } as Perfil)
    } catch (e) {
      console.error('Error fetching perfil:', e)
    }
    setLoading(false)
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    try {
      await signInWithEmailAndPassword(auth, email, password)
      return null
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/user-not-found':  'No existe una cuenta con ese correo.',
        'auth/wrong-password':  'Contraseña incorrecta.',
        'auth/invalid-email':   'Correo electrónico inválido.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
      }
      return msgs[e.code] ?? e.message
    }
  }

  async function signUp(data: SignUpData): Promise<string | null> {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password)
      // Crear perfil en Firestore
      const perfil: Omit<Perfil, 'id'> = {
        nombre:       data.nombre,
        email:        data.email,
        rol:          data.rol,
        created_at:   new Date().toISOString(),
        ...(data.grado        && { grado:        data.grado }),
        ...(data.seccion      && { seccion:       data.seccion }),
        ...(data.numero_lista && { numero_lista:  data.numero_lista }),
        ...(data.materia_id   && { materia_id:    data.materia_id }),
      }
      await setDoc(doc(db, 'perfiles', cred.user.uid), perfil)
      return null
    } catch (e: any) {
      const msgs: Record<string, string> = {
        'auth/email-already-in-use': 'Ya existe una cuenta con ese correo.',
        'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres.',
        'auth/invalid-email':        'Correo electrónico inválido.',
      }
      return msgs[e.code] ?? e.message
    }
  }

  async function signOut() {
    await fbSignOut(auth)
    setPerfil(null)
  }

  return (
    <AuthContext.Provider value={{ user, perfil, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
