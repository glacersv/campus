import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertTriangle, UserPlus } from 'lucide-react';
import InstitutionLogo from './InstitutionLogo';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onLoginSuccess?: () => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
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
      onLoginSuccess?.();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No existe una cuenta con este correo electrónico.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Contraseña incorrecta. Verifique e intente nuevamente.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado. Inicie sesión.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El correo electrónico no es válido.');
      } else {
        setError('Error al iniciar sesión. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-4 bg-salesiano-green" />
      <div className="absolute bottom-0 left-0 w-full h-2 bg-salesiano-yellow" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border-2 border-slate-200 rounded-2xl shadow-premium-lg p-8 relative z-10"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <InstitutionLogo className="w-24 h-24 mb-4" />
          <h1 className="text-xl font-black font-display text-slate-800 tracking-tight uppercase leading-tight">
            CAMPUS COLEGIO<br />SALESIANO SAN JOSÉ
          </h1>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-5 p-3 bg-red-50 border-l-4 border-red-600 text-red-800 rounded flex items-start gap-2 text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Nombre Completo
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserPlus className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Nombre del docente"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-salesiano-green focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Correo Institucional
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                required
                placeholder="ejemplo@salesianosanjose.edu.sv"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-salesiano-green focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-salesiano-green focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-salesiano-green hover:bg-salesiano-green-dark text-white font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Procesando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs font-semibold text-salesiano-green hover:text-salesiano-green-dark transition-colors"
          >
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ delay: 0.3 }}
        className="mt-6 text-sm text-slate-600 font-medium italic text-center max-w-sm"
      >
        &ldquo;La educación es cosa del corazón.&rdquo;
        <span className="block text-xs font-bold text-slate-500 mt-1 not-italic">— San Juan Bosco</span>
      </motion.p>
    </div>
  );
}