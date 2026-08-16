import React from 'react';

type AreaKey =
  | 'formacion' | 'notas' | 'clase' | 'horario' | 'eventos'
  | 'avisos' | 'proyectos' | 'semana-juventud' | 'semana-juventud-admin'
  | 'perfil' | 'general';

const SCENES: Record<AreaKey, React.ReactNode> = {
  proyectos: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 40c26 0 44 18 44 44 0 30-30 40-44 76-14-36-44-46-44-76 0-26 18-44 44-44Z" opacity="0.9" />
      <circle cx="120" cy="84" r="18" />
      <path d="M120 72v24M108 84h24" />
      <path d="M148 150l14 14M92 150l-14 14" opacity="0.7" />
    </g>
  ),
  formacion: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="74" y="48" width="92" height="104" rx="10" opacity="0.9" />
      <path d="M92 78h40M92 98h56M92 118h56" opacity="0.7" />
      <path d="M168 44l20-8v52l-20 8Z" opacity="0.85" />
      <path d="M178 48v28" />
    </g>
  ),
  notas: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M80 50c0-8 36-8 36 0v96c0 8-36 8-36 0Z" opacity="0.9" />
      <path d="M116 50c0-8 36-8 36 0v96c0 8-36 8-36 0Z" opacity="0.7" />
      <path d="M92 74h22M92 92h22M92 110h22" opacity="0.7" />
      <path d="M150 70l8 8 16-16" opacity="0.9" />
    </g>
  ),
  clase: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="64" y="56" width="112" height="76" rx="8" opacity="0.9" />
      <path d="M80 76h48M80 92h72M80 108h40" opacity="0.7" />
      <path d="M104 132v18M136 132v18M96 150h48" opacity="0.7" />
    </g>
  ),
  horario: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="76" y="50" width="88" height="96" rx="10" opacity="0.9" />
      <path d="M76 74h88" opacity="0.7" />
      <path d="M100 50v12M140 50v12" opacity="0.7" />
      <path d="M96 96h16M128 96h16M96 116h16M128 116h16" opacity="0.6" />
    </g>
  ),
  eventos: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M96 64c-16 0-26 12-26 28s10 30 26 30 22-14 22-30-8-28-22-28Z" opacity="0.9" />
      <path d="M150 76c-14 0-22 10-22 24s8 26 22 26 18-12 18-26-4-24-18-24Z" opacity="0.7" />
      <path d="M96 122v18M150 126v18M120 56v-10" opacity="0.6" />
      <path d="M120 40l6 10 10-4" opacity="0.8" />
    </g>
  ),
  avisos: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 52a30 30 0 0 1 30 30v22l10 14H80l10-14V82a30 30 0 0 1 30-30Z" opacity="0.9" />
      <path d="M110 140a14 14 0 0 0 20 0" opacity="0.7" />
      <path d="M156 70a6 6 0 0 1 0-12M170 84a10 10 0 0 1 0-20" opacity="0.6" />
    </g>
  ),
  'semana-juventud': (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 48l10 22 24 2-18 16 6 24-22-12-22 12 6-24-18-16 24-2Z" opacity="0.9" />
      <circle cx="120" cy="118" r="16" opacity="0.8" />
      <path d="M104 150h32" opacity="0.6" />
    </g>
  ),
  'semana-juventud-admin': (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M120 48l10 22 24 2-18 16 6 24-22-12-22 12 6-24-18-16 24-2Z" opacity="0.9" />
      <circle cx="120" cy="118" r="16" opacity="0.8" />
      <path d="M104 150h32" opacity="0.6" />
    </g>
  ),
  perfil: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="120" cy="86" r="26" opacity="0.9" />
      <path d="M76 156c0-24 20-40 44-40s44 16 44 40" opacity="0.85" />
    </g>
  ),
  general: (
    <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M84 60h72l18 18v62H66V78Z" opacity="0.9" />
      <path d="M84 60l18 18h60" opacity="0.7" />
      <path d="M96 108h48M96 124h48" opacity="0.6" />
    </g>
  ),
};

const FALLBACK: AreaKey = 'general';

interface AreaIllustrationProps {
  area?: string;
  className?: string;
}

export default function AreaIllustration({ area, className }: AreaIllustrationProps) {
  const key = (area as AreaKey) in SCENES ? (area as AreaKey) : FALLBACK;
  return (
    <svg
      viewBox="0 0 240 200"
      className={className}
      role="img"
      aria-label="Ilustración decorativa"
      preserveAspectRatio="xMidYMid meet"
    >
      {SCENES[key]}
    </svg>
  );
}
