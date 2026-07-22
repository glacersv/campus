import { useTheme, type ThemePalette } from '../contexts/ThemeContext';

export default function ThemeSwitcher() {
  const { palette, setPalette, palettes } = useTheme();

  return (
    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-1">
      {(Object.keys(palettes) as ThemePalette[]).map((p) => {
        const c = palettes[p];
        const isActive = palette === p;
        return (
          <button
            key={p}
            onClick={() => setPalette(p)}
            className={`w-7 h-7 rounded-md flex items-center justify-center text-[11px] transition-all ${
              isActive ? 'ring-2 ring-offset-1 scale-110' : 'opacity-50 hover:opacity-80'
            }`}
            style={{ backgroundColor: c.primary }}
            title={c.label}
          >
            <span className="text-white leading-none">{c.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
