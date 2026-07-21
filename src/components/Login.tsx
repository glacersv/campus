import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertTriangle, UserPlus } from 'lucide-react';
import InstitutionLogo from './InstitutionLogo';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found') setError('No existe una cuenta con este correo.');
      else if (err.code === 'auth/wrong-password') setError('Contraseña incorrecta.');
      else if (err.code === 'auth/email-already-in-use') setError('Este correo ya está registrado.');
      else if (err.code === 'auth/weak-password') setError('La contraseña debe tener al menos 6 caracteres.');
      else if (err.code === 'auth/invalid-email') setError('El correo electrónico no es válido.');
      else setError('Error al iniciar sesión. Intente nuevamente.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col justify-center items-center p-4">
      <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
      <div className="absolute bottom-0 left-0 w-full h-1 bg-secondary" />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-gray-200 rounded-xl shadow-sm p-8 relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <InstitutionLogo className="w-20 h-20 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 tracking-tight uppercase leading-tight">
            Campus Colegio<br />Salesiano San José
          </h1>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
            className="mb-5 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-2 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombre Completo</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><UserPlus className="w-4 h-4" /></span>
                <input type="text" required placeholder="Nombre del docente" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input pl-9" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Correo Electrónico</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Mail className="w-4 h-4" /></span>
              <input type="email" required placeholder="correo@salesianosanjose.edu.sv" value={email} onChange={e => setEmail(e.target.value)} className="input pl-9" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Contraseña</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><Lock className="w-4 h-4" /></span>
              <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="input pl-9" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
            <LogIn className="w-4 h-4" />
            {loading ? 'Procesando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Microsoft Button (placeholder) */}
        <div className="mt-4">
          <button disabled className="w-full py-2.5 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-400 bg-gray-50 cursor-not-allowed flex items-center justify-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 21 21">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
            Iniciar con Microsoft (Próximamente)
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setError(null); }} className="text-xs font-medium text-primary hover:text-primary-dark transition-colors">
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} transition={{ delay: 0.3 }}
        className="mt-6 text-sm text-gray-500 italic text-center max-w-sm">
        "La educación es cosa del corazón."
        <span className="block text-xs font-semibold text-gray-400 mt-1 not-italic">— San Juan Bosco</span>
      </motion.p>
    </div>
  );
}
