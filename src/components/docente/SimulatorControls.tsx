import { Clock } from 'lucide-react';

interface SimulatorControlsProps {
  simulatedTime: string;
  onTimeChange: (time: string) => void;
}

export default function SimulatorControls({ simulatedTime, onTimeChange }: SimulatorControlsProps) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/10 p-2 rounded-lg border border-slate-900/10 text-xs font-semibold">
      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-900/20">
        <Clock className="w-4 h-4 text-slate-700" />
        <span>Simulador de Hora:</span>
      </div>
      <div className="flex gap-1">
        <button
          onClick={() => onTimeChange('06:40 AM')}
          className={`px-3 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
            simulatedTime === '06:40 AM'
              ? 'bg-slate-900 text-white'
              : 'hover:bg-slate-900/10 text-slate-700'
          }`}
        >
          06:40 AM (A tiempo)
        </button>
        <button
          onClick={() => onTimeChange('06:46 AM')}
          className={`px-3 py-1 rounded text-[11px] font-bold font-mono transition-colors ${
            simulatedTime === '06:46 AM'
              ? 'bg-salesiano-red text-white'
              : 'hover:bg-slate-900/10 text-slate-700'
          }`}
        >
          06:46 AM (Tarde)
        </button>
      </div>
    </div>
  );
}