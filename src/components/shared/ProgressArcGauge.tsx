import React from 'react';
import { motion } from 'motion/react';

interface ProgressArcGaugeProps {
  value: number;
  title?: string;
  subtitle?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  centerLabel?: string;
  centerSublabel?: string;
}

export default function ProgressArcGauge({
  value,
  title,
  subtitle,
  size = 200,
  strokeWidth = 24,
  color = 'var(--color-primary)',
  trackColor,
  centerLabel,
  centerSublabel,
}: ProgressArcGaugeProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = Math.PI * radius;
  const filledLength = (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg width={size} height={size / 2 + 30} className="overflow-visible">
        {/* Background track arc */}
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          className="progress-arc-track"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Active filled arc */}
        <motion.path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${filledLength} ${circumference}`}
          initial={{ strokeDasharray: `0 ${circumference}` }}
          animate={{ strokeDasharray: `${filledLength} ${circumference}` }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
        />
      </svg>

      {/* Center label overlay */}
      <div className="absolute top-[35%] text-center flex flex-col items-center pointer-events-none">
        <span className="text-3xl font-black text-slate-900 font-display tracking-tight">
          {centerLabel ?? `${clamped}%`}
        </span>
        {centerSublabel && (
          <span className="text-xs font-medium text-slate-500 mt-0.5">{centerSublabel}</span>
        )}
      </div>

      {(title || subtitle) && (
        <div className="text-center mt-3">
          {title && <h4 className="text-sm font-bold text-slate-800 font-display">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
