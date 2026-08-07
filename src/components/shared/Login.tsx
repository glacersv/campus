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
        // Restrict registration to institutional email domain
        if (!email.endsWith('@salesianosanjose.edu.sv')) {
          toast.error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName);
        toast.success('Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        setIsSignUp(false);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err.code);
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
      {/* Abstract Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-salesiano-green/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-salesiano-yellow/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-salesiano-green via-salesiano-yellow to-salesiano-red" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 relative z-10">
          <div className="flex flex-col items-center text-center mb-8">
            <InstitutionLogo className="w-20 h-20 mb-4" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight uppercase leading-tight">
              Campus Colegio<br />Salesiano San José
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Nombre Completo</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><UserPlus className="w-4 h-4" /></span>
                  <input type="text" required placeholder="Nombre del docente" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input pl-9" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail className="w-4 h-4" /></span>
                <input type="email" required placeholder="correo@salesianosanjose.edu.sv" value={email} onChange={e => setEmail(e.target.value)} className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Lock className="w-4 h-4" /></span>
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="input pl-9" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 rounded-full disabled:opacity-50">
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

        <div className="mt-6 pt-4 border-t border-slate-200/50 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); }} className="text-xs font-bold text-salesiano-green hover:text-salesiano-green-dark transition-colors uppercase tracking-wider">
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 0.8, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-8 text-sm text-slate-600 italic text-center max-w-sm relative z-10">
        "La educación es cosa del corazón."
        <span className="block text-xs font-black text-slate-400 mt-2 not-italic font-display uppercase tracking-widest">— San Juan Bosco</span>
      </motion.p>
    </div>
  );
}
