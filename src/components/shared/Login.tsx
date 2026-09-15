import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Mail, Lock, AlertTriangle, UserPlus, Eye, EyeOff, KeyRound } from 'lucide-react';
import InstitutionLogo from './InstitutionLogo';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export default function Login() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    try {
      if (isSignUp) {
        if (!cleanEmail.endsWith('@salesianosanjose.edu.sv')) {
          toast.error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
          setLoading(false);
          return;
        }
        await signUp(cleanEmail, cleanPassword, displayName.trim());
        toast.success('Solicitud enviada. Espera la aprobación del administrador.');
        setIsSignUp(false);
      } else {
        await signIn(cleanEmail, cleanPassword);
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanResetEmail = resetEmail.trim().toLowerCase();
    if (!cleanResetEmail) {
      toast.error('Ingresa tu correo institucional.');
      return;
    }
    setResetLoading(true);
    try {
      await resetPassword(cleanResetEmail);
      toast.success('Se ha enviado un enlace de restablecimiento a tu correo.');
      setShowResetModal(false);
      setResetEmail('');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        toast.error('No se encontró ninguna cuenta con este correo.');
      } else if (err.code === 'auth/invalid-email') {
        toast.error('El formato del correo es inválido.');
      } else {
        toast.error('Error al enviar el enlace. Intenta de nuevo.');
      }
    } finally {
      setResetLoading(false);
    }
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
      <div className="bg-[#ffffff]/70 backdrop-blur-xl rounded-3xl border border-[#ffffff]/60 shadow-premium p-8 relative overflow-hidden">
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
            <h1 className="text-xl font-bold text-[#0f172a] tracking-tight leading-tight" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Campus Colegio<br />Salesiano San José
            </h1>
            <p className="text-xs text-[#64748b] mt-2 font-medium">Educación para el corazón</p>
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
              <label htmlFor="signup-name" className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">Nombre Completo</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94a3b8] group-focus-within:text-[#25855A] transition-colors"><UserPlus className="w-4 h-4" /></span>
                <input id="signup-name" type="text" required placeholder="Nombre del docente" value={displayName} onChange={e => setDisplayName(e.target.value)} className="input-crema pl-9 bg-[#ffffff]/60 focus:bg-white" />
              </div>
            </motion.div>
          )}
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wider">Correo Electrónico</label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94a3b8] group-focus-within:text-[#25855A] transition-colors"><Mail className="w-4 h-4" /></span>
              <input id="login-email" type="email" required placeholder="correo@salesianosanjose.edu.sv" value={email} onChange={e => setEmail(e.target.value)} className="input-crema pl-9 bg-[#ffffff]/60 focus:bg-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold text-[#475569] uppercase tracking-wider">Contraseña</label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email.trim());
                    setShowResetModal(true);
                  }}
                  className="text-[11px] font-semibold text-[#25855A] hover:text-[#124D37] transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#94a3b8] group-focus-within:text-[#25855A] transition-colors"><Lock className="w-4 h-4" /></span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-crema pl-9 pr-10 bg-[#ffffff]/60 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#94a3b8] hover:text-[#475569] transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
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

        <div className="mt-6 pt-4 border-t border-[#e2e8f0]/60 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); }} className="text-xs font-bold text-[#25855A] hover:text-[#124D37] transition-colors uppercase tracking-wider">
            {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
          </button>
        </div>
      </div>
      </motion.div>

      {/* Modal para restablecer contraseña */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-slate-200"
          >
            <div className="flex items-center gap-2 mb-3 text-slate-800">
              <KeyRound className="w-5 h-5 text-[#25855A]" />
              <h3 className="font-bold text-base">Restablecer Contraseña</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ingresa tu correo institucional y te enviaremos un enlace de Firebase para restablecer tu contraseña.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    required
                    placeholder="usuario@salesianosanjose.edu.sv"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="input-crema pl-9 w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#25855A] hover:bg-[#124D37] rounded-lg transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Enviando...' : 'Enviar Enlace'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 0.8, y: 0 }} transition={{ delay: 0.4 }}
        className="mt-8 text-sm text-[#64748b] italic text-center max-w-sm relative z-10">
        "La educación es cosa del corazón."
        <span className="block text-xs text-[#94a3b8] mt-2 not-italic" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>— San Juan Bosco</span>
      </motion.p>
    </div>
  );
}
