import React, { useState } from 'react';
import { MonthStats } from '../../types';
import { SuspensionesManager } from './SuspensionesManager';
import { Info, Check, Sparkles } from 'lucide-react';

interface Table1Props {
  months: MonthStats[];
  anoLectivo: string;
  isEditMode?: boolean;
  onUpdateMonths?: (newMonths: MonthStats[]) => void;
}

export const Table1SemanasLaborales: React.FC<Table1Props> = ({
  months,
  anoLectivo,
  isEditMode = false,
  onUpdateMonths,
}) => {
  const totalSemanas = months.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);
  const totalDias = months.reduce((acc, m) => acc + (Number(m.dias) || 0), 0);

  const handleCellChange = (index: number, field: 'semanas' | 'dias', val: string | number) => {
    if (!onUpdateMonths) return;
    const updated = [...months];
    updated[index][field] = Number(val) || 0;
    onUpdateMonths(updated);
  };

  const applyPreset200Dias = () => {
    if (!onUpdateMonths) return;
    const standard200: Record<string, { semanas: number; dias: number }> = {
      enero: { semanas: 2, dias: 10 }, febrero: { semanas: 4, dias: 20 }, marzo: { semanas: 4, dias: 20 },
      abril: { semanas: 4, dias: 20 }, mayo: { semanas: 4, dias: 20 }, junio: { semanas: 4, dias: 20 },
      julio: { semanas: 5, dias: 25 }, agosto: { semanas: 4, dias: 20 }, septiembre: { semanas: 4, dias: 20 },
      octubre: { semanas: 3, dias: 15 }, noviembre: { semanas: 2, dias: 10 }, diciembre: { semanas: 0, dias: 0 },
    };
    onUpdateMonths(months.map((m) => { const t = standard200[m.month.toLowerCase()]; return t ? { ...m, semanas: t.semanas, dias: t.dias } : m; }));
  };

  const applyPreset182Dias = () => {
    if (!onUpdateMonths) return;
    const salesiano182: Record<string, { semanas: number; dias: number }> = {
      enero: { semanas: 2, dias: 10 }, febrero: { semanas: 4, dias: 18 }, marzo: { semanas: 4, dias: 19 },
      abril: { semanas: 4, dias: 18 }, mayo: { semanas: 4, dias: 19 }, junio: { semanas: 4, dias: 20 },
      julio: { semanas: 5, dias: 21 }, agosto: { semanas: 4, dias: 17 }, septiembre: { semanas: 4, dias: 21 },
      octubre: { semanas: 3, dias: 12 }, noviembre: { semanas: 2, dias: 5 }, diciembre: { semanas: 1, dias: 3 },
    };
    onUpdateMonths(months.map((m) => { const t = salesiano182[m.month.toLowerCase()]; return t ? { ...m, semanas: t.semanas, dias: t.dias } : m; }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5"><Info className="w-4 h-4" /></div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Normativa MINEDUCYT vs. Días Efectivos en Aula</h3>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed max-w-2xl">La normativa del <strong>MINEDUCYT</strong> estipula <strong>200 días lectivos</strong> (40 sem × 5 días). Al descontar 18 días de asuetos, pausas y descansos, el conteo neto resulta en <strong>182 días hábiles</strong>.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={applyPreset200Dias} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${totalDias === 200 ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/20' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}><Sparkles className="w-3.5 h-3.5" /><span>200 Días</span></button>
              <button onClick={applyPreset182Dias} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${totalDias === 182 || totalDias === 183 ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-500/20' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}><Check className="w-3.5 h-3.5" /><span>182 Días Netos</span></button>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">1</span>
            <h2 className="text-base font-bold text-slate-800 tracking-tight">SEMANAS LABORALES Y DÍAS LECTIVOS - {anoLectivo}</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-xs"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Total Semanas: <strong className="text-slate-800">{totalSemanas}</strong></span>
            <span className={`inline-flex items-center gap-1 font-medium px-2.5 py-1 rounded-md border shadow-xs ${totalDias === 200 ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 text-slate-800'}`}><span className="w-2 h-2 rounded-full bg-blue-500"></span>Total Días: <strong className="font-extrabold">{totalDias}</strong></span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="py-2.5 px-3 text-left font-bold text-slate-900 border-r border-slate-200 w-28 bg-slate-200/60">Meses</th>
                {months.map((m) => <th key={m.month} className="py-2.5 px-2.5 border-r border-slate-200 capitalize font-semibold">{m.name}</th>)}
                <th className="py-2.5 px-3 font-bold text-blue-900 bg-blue-50/70">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-200 hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 text-left font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/70">Semanas</td>
                {months.map((m, idx) => (
                  <td key={m.month} className="py-2 px-1.5 border-r border-slate-200 text-slate-700 font-medium">
                    {isEditMode ? <input type="number" min={0} max={6} value={m.semanas} onChange={(e) => handleCellChange(idx, 'semanas', e.target.value)} className="w-12 text-center py-1 rounded border border-blue-300 bg-blue-50/50 font-bold text-blue-900 focus:ring-1 focus:ring-blue-500 outline-hidden" /> : m.semanas}
                  </td>
                ))}
                <td className="py-2.5 px-3 font-bold text-blue-700 bg-blue-50/40">{totalSemanas}</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2.5 px-3 text-left font-semibold text-slate-800 border-r border-slate-200 bg-slate-50/70">Días</td>
                {months.map((m, idx) => (
                  <td key={m.month} className="py-2 px-1.5 border-r border-slate-200 text-slate-700 font-medium">
                    {isEditMode ? <input type="number" min={0} max={31} value={m.dias} onChange={(e) => handleCellChange(idx, 'dias', e.target.value)} className="w-12 text-center py-1 rounded border border-blue-300 bg-blue-50/50 font-bold text-blue-900 focus:ring-1 focus:ring-blue-500 outline-hidden" /> : m.dias}
                  </td>
                ))}
                <td className="py-2.5 px-3 font-bold text-blue-700 bg-blue-50/40">{totalDias}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SuspensionesManager embebido */}
        <SuspensionesManager months={months} isEditMode={isEditMode} onUpdateMonths={onUpdateMonths} />
      </div>
    </div>
  );
};
