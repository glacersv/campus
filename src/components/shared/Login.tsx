import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertTriangle, UserPlus } from 'lucide-react';
import InstitutionLogo from './InstitutionLogo';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        if (!email.endsWith('@salesianosanjose.edu.sv')) {
          toast.error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        toast.success('Solicitud enviada. Espera la aprobación del administrador.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error('Auth error full:', err);
      console.error('Auth error code:', err.code);
      console.error('Auth error message:', err.message);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        toast.error('Correo o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') toast.error('Este correo ya está registrado.');
      else if (err.code === 'auth/weak-password') toast.error('La contraseña debe tener al menos 6 caracteres.');
      else if (err.code === 'auth/invalid-email') toast.error('El correo electrónico no es válido.');
      else if (err.message?.includes('pendiente de aprobación')) {
        toast.error(err.message);
      } else if (err.message?.includes('rechazada')) {
        toast.error(err.message);
      } else {
        toast.error(err.message || 'Error al procesar la solicitud. Intente nuevamente.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Institutional gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-salesiano-green/5 via-transparent to-salesiano-yellow/5 pointer-events-none" />
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[80%] h-[60%] bg-salesiano-green/8 blur-[80px] rounded-full pointer-events-none" />

      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-salesiano-green via-salesiano-yellow to-salesiano-red" />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.1 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Premium glass card */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/60 shadow-premium p-8 relative overflow-hidden">
          {/* Top accent glow */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
          
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', bounce: 0.1 }}
              className="mb-4"
            >
              <InstitutionLogo className="w-20 h-20" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: 'spring', bounce: 0.1 }}
            >
              <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                Campus Colegio<br />Salesiano San José
              </h1>
              <p className="text-xs text-slate-500 mt-2 font-medium">Educación para el corazón</p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              >
                <label htmlFor="signup-name" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-salesiano-green transition-colors"><UserPlus className="w-4 h-4" /></span>
                  <input id="signup-name" type="text" required placeholder="Nombre del docente" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input pl-9 bg-white/60 focus:bg-white" />
                </div>
              </motion.div>
            )}
            <div>
              <label htmlFor="login-email" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-salesiano-green transition-colors"><Mail className="w-4 h-4" /></span>
                <input id="login-email" type="email" required placeholder="correo@salesianosanjose.edu.sv" value={email} onChange={e => setEmail(e.target.value)} className="input pl-9 bg-white/60 focus:bg-white" />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 group-focus-within:text-salesiano-green transition-colors"><Lock className="w-4 h-4" /></span>
                <input id="login-password" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="input pl-9 bg-white/60 focus:bg-white" />
              </div>
            </div>
            <motion.button 
              type="submit" 
              disabled={loading} 
              className="btn-primary w-full justify-center py-3 rounded-full disabled:opacity-50"
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <LogIn className="w-4 h-4" />
              {loading ? 'Procesando...' : isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión'}
            </motion.button>
          </form>

          {/* Microsoft Button (placeholder) */}
          <div className="mt-4">
            <button disabled className="w-full py-2.5 px-4 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-400 bg-white/40 cursor-not-allowed flex items-center justify-center gap-2 opacity-60 backdrop-blur-sm">
              <svg className="w-4 h-4" viewBox="0 0 21 21">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Iniciar con Microsoft (Próximamente)
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200/60 text-center">
            <button onClick={() => { setIsSignUp(!isSignUp); }} className="text-xs font-bold text-salesiano-green hover:text-salesiano-green-dark transition-colors uppercase tracking-wider">
              {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 0.8, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-8 text-sm text-slate-600 italic text-center max-w-sm relative z-10">
        "La educación es cosa del corazón."
        <span className="block text-xs text-slate-400 mt-2 not-italic" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>— San Juan Bosco</span>
      </motion.p>
    </div>
  );
}
