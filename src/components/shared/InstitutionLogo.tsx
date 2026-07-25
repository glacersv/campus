import React, { useState } from 'react';
import logoImage from '../../assets/logo-salesiano.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export default function InstitutionLogo({ className = "w-16 h-16", showText = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={logoImage}
        alt="Escudo Oficial Colegio Salesiano San José"
        className={`${className} object-contain shrink-0`}
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-sm font-bold font-display tracking-tight text-slate-100 leading-tight">
            Colegio Salesiano
          </span>
          <span className="text-base font-extrabold font-display tracking-tight text-salesiano-yellow leading-none">
            San José
          </span>
        </div>
      )}
    </div>
  );
}
