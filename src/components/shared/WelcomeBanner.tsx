import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import AreaIllustration from './AreaIllustration';

type BannerTheme = { light: string; dark: string };

const BANNER_THEMES: Record<string, BannerTheme> = {
  formacion: { light: 'from-[#124D37] via-[#25855A] to-[#1D6F4B]', dark: 'dark:from-[#0b1120] dark:via-[#0a3d2b] dark:to-[#0b1120]' },
  notas: { light: 'from-[#0C4A6E] via-[#0EA5E9] to-[#0369A1]', dark: 'dark:from-[#0b1120] dark:via-[#0c3a52] dark:to-[#0b1120]' },
  clase: { light: 'from-[#92400E] via-[#F59E0B] to-[#B45309]', dark: 'dark:from-[#0b1120] dark:via-[#4a2607] dark:to-[#0b1120]' },
  horario: { light: 'from-[#4C1D95] via-[#8B5CF6] to-[#6D28D9]', dark: 'dark:from-[#0b1120] dark:via-[#2e1065] dark:to-[#0b1120]' },
  eventos: { light: 'from-[#134E4A] via-[#14B8A6] to-[#0F766E]', dark: 'dark:from-[#0b1120] dark:via-[#0d3b38] dark:to-[#0b1120]' },
  avisos: { light: 'from-[#1E3A8A] via-[#3B82F6] to-[#1D4ED8]', dark: 'dark:from-[#0b1120] dark:via-[#172554] dark:to-[#0b1120]' },
  proyectos: { light: 'from-[#7C2D12] via-[#F97316] to-[#C2410C]', dark: 'dark:from-[#0b1120] dark:via-[#4a1d09] dark:to-[#0b1120]' },
  'semana-juventud': { light: 'from-[#1E1B4B] via-[#6366F1] to-[#4338CA]', dark: 'dark:from-[#0b1120] dark:via-[#1e1b4b] dark:to-[#0b1120]' },
  'semana-juventud-admin': { light: 'from-[#1E1B4B] via-[#6366F1] to-[#4338CA]', dark: 'dark:from-[#0b1120] dark:via-[#1e1b4b] dark:to-[#0b1120]' },
  perfil: { light: 'from-[#124D37] via-[#25855A] to-[#1D6F4B]', dark: 'dark:from-[#0b1120] dark:via-[#0a3d2b] dark:to-[#0b1120]' },
  general: { light: 'from-[#124D37] via-[#25855A] to-[#1D6F4B]', dark: 'dark:from-[#0b1120] dark:via-[#0a3d2b] dark:to-[#0b1120]' },
};

const FALLBACK_THEME = BANNER_THEMES.general;

interface WelcomeBannerProps {
  name: string;
  role?: string;
  area?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  ctaLabel?: string;
  onCta?: () => void;
  showProfile?: boolean;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  docente: 'Docente',
  alumno: 'Alumno',
  coordinacion: 'Coordinación',
  coordinacion_academica: 'Coordinación Académica',
  coordinacion_convivencia: 'Coordinación Convivencia',
  coordinacion_primaria: 'Coordinación Primaria',
  coordinacion_parvularia: 'Coordinación Parvularia',
  registro_academico: 'Registro Académico',
  enfermeria: 'Enfermería',
  psicopedagogico: 'Psicopedagogía',
};

function roleLabel(role?: string): string {
  if (!role) return '';
  return ROLE_LABELS[role] ?? (role.charAt(0).toUpperCase() + role.slice(1));
}

export default function WelcomeBanner({
  name,
  role,
  area = 'general',
  title,
  subtitle,
  badge,
  ctaLabel,
  onCta,
  showProfile = false,
}: WelcomeBannerProps) {
  const heading = title ?? `Hola, ${name || 'Bienvenido'}.`;
  const roleText = roleLabel(role);
  const theme = BANNER_THEMES[area] ?? FALLBACK_THEME;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${theme.light} ${theme.dark} p-6 text-white shadow-xl shadow-black/10 md:p-8`}
    >
      {/* Glow circles */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-32 top-0 h-32 w-32 rounded-full bg-amber-400/20 blur-xl" />
      <div className="pointer-events-none absolute -left-12 top-1/3 h-44 w-44 rounded-full bg-emerald-300/10 blur-2xl" />

      <div className="relative z-10 grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="max-w-2xl space-y-3">
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md">
              <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
              {badge}
            </div>
          )}

          <h2 className="font-display text-2xl font-extrabold leading-tight md:text-3xl">
            {heading}
          </h2>

          {subtitle && (
            <p className="text-sm leading-relaxed text-emerald-100/90">{subtitle}</p>
          )}

          {showProfile && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-md w-fit">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 font-display text-sm font-bold ring-2 ring-white/30">
                {getInitials(name)}
              </div>
              <div className="leading-tight">
                <div className="text-sm font-bold">{name}</div>
                {roleText && <div className="text-[11px] text-emerald-100/80">{roleText}</div>}
              </div>
            </div>
          )}

          {ctaLabel && onCta && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onCta}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 font-display text-xs font-bold text-slate-900 shadow-md shadow-black/20 transition-all hover:bg-white/90 active:scale-95"
              >
                {ctaLabel}
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Contextual illustration */}
        <div className="hidden h-44 w-44 shrink-0 opacity-90 sm:block md:h-52 md:w-52">
          <AreaIllustration area={area} className="h-full w-full text-white" />
        </div>
      </div>
    </motion.div>
  );
}
