import { useTheme, type ThemePalette } from '../../contexts/ThemeContext';
import { Palette, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const THEME_LABELS: Record<ThemePalette, string> = {
  salesiano: 'Salesiano (Institucional)',
  oceano: 'Océano',
  violeta: 'Violeta',
  noche: 'Noche',
  donezo: 'Donezo (Moderno)',
};

export default function ThemeSwitcher() {
  const { palette, setPalette, palettes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-slate-300 transition-colors shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600"
        title="Cambiar tema"
      >
        <Palette className="w-4 h-4 text-slate-600" />
        <span className="text-xs font-semibold text-slate-700 hidden sm:inline dark:text-slate-200">
          {THEME_LABELS[palette]}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-50 dark:border-slate-700 dark:bg-slate-800">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Seleccionar tema
          </div>
          {(Object.keys(palettes) as ThemePalette[]).map((p) => {
            const c = palettes[p];
            const isActive = palette === p;
            return (
              <button
                key={p}
                onClick={() => { setPalette(p); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  isActive ? 'bg-slate-50 dark:bg-slate-700/60' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{ borderColor: c.primary, backgroundColor: c.primary }}
                >
                  {isActive && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                  {THEME_LABELS[p]}
                </span>
                <span className="ml-auto text-lg">{c.icon}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
