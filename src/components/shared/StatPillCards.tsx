import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface StatPillData {
  id: string;
  label: string;
  value: string;
  percentage: number;
  trend?: number;
  trendLabel?: string;
  hint?: string;
  bars?: number[];
}

interface StatPillCardsProps {
  items: StatPillData[];
}

export default function StatPillCards({ items }: StatPillCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((item) => {
        const isPositive = (item.trend ?? 0) >= 0;
        const TrendIcon = isPositive ? ArrowUpRight : ArrowDownRight;
        return (
          <div
            key={item.id}
            className="card-crema p-5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">{item.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isPositive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {item.trendLabel ?? (isPositive ? `+${item.trend}` : `${item.trend}`)}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-3">
              <span className="text-3xl font-black text-slate-900 font-display">{item.value}</span>
              {item.trend !== undefined && (
                <span
                  className={`text-xs font-semibold flex items-center ${
                    isPositive ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  <TrendIcon className="w-3.5 h-3.5" />
                  {Math.abs(item.trend)}%
                </span>
              )}
            </div>

            {item.bars && item.bars.length > 0 ? (
              <div className="w-full bg-slate-100 rounded-full h-2.5 flex overflow-hidden">
                {item.bars.map((width, idx) => (
                  <div
                    key={idx}
                    className="h-full rounded-full"
                    style={{
                      width: `${width}%`,
                      background: idx === item.bars.length - 1
                        ? 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))'
                        : idx % 2 === 0 ? '#10b981' : '#f59e0b',
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                  }}
                />
              </div>
            )}

            {item.hint && <p className="text-xs text-slate-400 mt-2">{item.hint}</p>}
          </div>
        );
      })}
    </div>
  );
}
