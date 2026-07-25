// src/App.tsx
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

function AppRouter() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, color: 'var(--color-text-secondary)'
      }}>
        <div style={{ fontSize: 32 }}>🔬</div>
        <p style={{ fontSize: 14 }}>Cargando sistema...</p>
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}
