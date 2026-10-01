import React from 'react';
import { motion } from 'motion/react';
import { Clock, ShieldAlert, LogOut, RefreshCw, Mail } from 'lucide-react';
import InstitutionLogo from './InstitutionLogo';
import { useAuth } from '../../contexts/AuthContext';

interface PendingApprovalScreenProps {
  status: 'pending' | 'rejected';
  rejectionReason?: string;
  email: string;
  displayName: string;
}

export default function PendingApprovalScreen({
  status,
  rejectionReason,
  email,
  displayName,
}: PendingApprovalScreenProps) {
  const { signOut } = useAuth();

  const isRejected = status === 'rejected';

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[#F0F4F8] dark:bg-[#0b1120]">
      {/* Institutional gradient glow background */}
      <div className="absolute inset-0 bg-gradient-to-br from-salesiano-green/5 via-transparent to-salesiano-yellow/5 pointer-events-none" />
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[80%] h-[60%] bg-salesiano-green/10 blur-[90px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-salesiano-green via-salesiano-yellow to-salesiano-red" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-800 shadow-xl p-8 text-center relative overflow-hidden">
          {/* Accent Header Ribbon */}
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center p-2 shadow-inner border border-slate-100 dark:border-slate-700">
              <InstitutionLogo className="w-14 h-14" />
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-3">
            {isRejected ? (
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center border border-red-200 dark:border-red-900">
                <ShieldAlert className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center border border-amber-200 dark:border-amber-900">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
            )}
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white font-display mb-1">
            {isRejected ? 'Acceso No Autorizado' : 'Cuenta en Espera de Autorización'}
          </h2>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-6">
            Colegio Salesiano San José · Sistema de Gestión Campus
          </p>

          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2 mb-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Titular:</span>
              <strong className="text-slate-800 dark:text-slate-200 truncate">{displayName}</strong>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-700 dark:text-slate-300 font-mono truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-slate-400 font-medium">Estado actual:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isRejected
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                }`}
              >
                {isRejected ? 'Rechazado' : 'Pendiente de Validación'}
              </span>
            </div>
          </div>

          {isRejected ? (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/60 text-left mb-6 text-xs text-red-800 dark:text-red-300">
              <p className="font-semibold mb-1">Motivo:</p>
              <p>{rejectionReason || 'Su solicitud de acceso no fue aprobada por la administración del colegio.'}</p>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Tu cuenta de Office 365 ha sido registrada en el sistema. Por políticas de seguridad institucional, un
              administrador debe verificar tu identidad y asignarte el rol de <strong>Docente</strong>,{' '}
              <strong>Alumno</strong> o <strong>Coordinación</strong> para habilitar tus módulos.
            </p>
          )}

          <div className="flex flex-col gap-2.5">
            {!isRejected && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Verificar Estado de Aprobación</span>
              </button>
            )}

            <button
              type="button"
              onClick={signOut}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ¿Dudas con tu asignación? Consulta en Secretaría o Soporte Técnico Salesiano.
        </p>
      </motion.div>
    </div>
  );
}
