import React from 'react';
import { Lock } from 'lucide-react';

interface ModulePlaceholderProps {
  title?: string;
  subtitle?: string;
}

export default function ModulePlaceholder({ title = 'Módulo en Desarrollo', subtitle = 'Este módulo está actualmente bajo mantenimiento o en fase de diseño premium. Pronto estará disponible para tu cuenta docente.' }: ModulePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 card-crema max-w-lg mx-auto text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 font-display">{title}</h3>
      <p className="text-slate-500 text-sm mt-1 max-w-sm">
        {subtitle}
      </p>
    </div>
  );
}
