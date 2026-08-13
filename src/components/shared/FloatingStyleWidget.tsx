import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Settings2, Palette, Type, Check, RotateCcw, X } from 'lucide-react';
import { useTheme, type ThemePalette, type FontScale, type FontFamilyId } from '../../contexts/ThemeContext';

const THEME_LABELS: Record<ThemePalette, string> = {
  salesiano: 'Salesiano (Institucional)',
  oceano: 'Océano',
  violeta: 'Violeta',
  noche: 'Noche',
  donezo: 'Donezo (Moderno)',
};

const SCALE_LABELS: Record<FontScale, string> = {
  90: 'Compacto',
  100: 'Normal',
  110: 'Grande',
  125: 'Muy Grande',
};

export default function FloatingStyleWidget() {
  const {
    palette, setPalette, palettes,
    fontScale, setFontScale, fontScales,
    fontFamily, setFontFamily, fontFamilies,
  } = useTheme();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'tema' | 'texto'>('tema');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetAll = () => {
    setPalette('salesiano');
    setFontScale(100);
    setFontFamily('campus');
  };

  const isDefault = palette === 'salesiano' && fontScale === 100 && fontFamily === 'campus';

  return (
    <div ref={ref} className="fixed right-5 bottom-5 z-[60] flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="w-72 bg-white/90 backdrop-blur-xl border border-slate-200/70 rounded-3xl shadow-xl shadow-slate-900/10 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-slate-900 font-display">Personalizar</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 p-2">
              <button
                onClick={() => setTab('tema')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  tab === 'tema' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                Colores
              </button>
              <button
                onClick={() => setTab('texto')}
                className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                  tab === 'texto' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                Texto
              </button>
            </div>

            <div className="p-4 max-h-[48vh] overflow-y-auto">
              {tab === 'tema' && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tema de color</p>
                  {(Object.keys(palettes) as ThemePalette[]).map((p) => {
                    const c = palettes[p];
                    const isActive = palette === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setPalette(p)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all ${
                          isActive
                            ? 'border-primary/40 bg-primary/5 shadow-sm'
                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                          style={{ borderColor: c.primary, backgroundColor: c.primary }}
                        >
                          {isActive && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span className={`text-xs font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                          {THEME_LABELS[p]}
                        </span>
                        <span className="ml-auto text-sm">{c.icon}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {tab === 'texto' && (
                <div className="space-y-5">
                  {/* Font size scale */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tamaño del texto</p>
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
                      {fontScales.map((s) => (
                        <button
                          key={s}
                          onClick={() => setFontScale(s)}
                          className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                            fontScale === s
                              ? 'bg-white shadow text-slate-900'
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {SCALE_LABELS[s]}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                      Se aplica al instante en toda la interfaz
                    </p>
                  </div>

                  {/* Font family */}
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Familia tipográfica</p>
                    <div className="space-y-1.5">
                      {(Object.keys(fontFamilies) as FontFamilyId[]).map((f) => {
                        const isActive = fontFamily === f;
                        return (
                          <button
                            key={f}
                            onClick={() => setFontFamily(f)}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl border text-left transition-all ${
                              isActive
                                ? 'border-primary/40 bg-primary/5 shadow-sm'
                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className={`text-sm font-semibold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                              {fontFamilies[f].label}
                            </span>
                            {isActive && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-100">
              <button
                onClick={resetAll}
                disabled={isDefault}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restablecer valores predeterminados
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen(!open)}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
          open ? 'bg-slate-800 text-white' : 'bg-primary text-white hover:bg-primary-dark'
        }`}
        title="Personalizar apariencia"
        aria-label="Personalizar apariencia"
      >
        <Settings2 className={`w-5 h-5 transition-transform ${open ? 'rotate-90' : ''}`} />
      </motion.button>
    </div>
  );
}
