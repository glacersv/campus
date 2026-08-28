import { MonthStats, SuspensionEvent, SuspensionCategory } from '../types';

export interface SuspensionCategoryMeta {
  id: SuspensionCategory;
  label: string;
  shortLabel: string;
  iconName: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBg: string;
  accentColor: string;
}

export const SUSPENSION_CATEGORIES: Record<SuspensionCategory, SuspensionCategoryMeta> = {
  pausa: {
    id: 'pausa',
    label: 'Pausa Pedagógica',
    shortLabel: 'Pausa Pedagógica',
    iconName: 'Coffee',
    badgeBg: 'bg-indigo-100',
    badgeText: 'text-indigo-800',
    badgeBorder: 'border-indigo-200',
    cardBg: 'bg-indigo-50/50',
    accentColor: '#6366f1',
  },
  feriado: {
    id: 'feriado',
    label: 'Feriado / Asueto',
    shortLabel: 'Feriado / Asueto',
    iconName: 'Sun',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-200',
    cardBg: 'bg-amber-50/50',
    accentColor: '#f59e0b',
  },
  institucional: {
    id: 'institucional',
    label: 'Actividad Institucional / Salesiana',
    shortLabel: 'Institucional',
    iconName: 'Building2',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    badgeBorder: 'border-emerald-200',
    cardBg: 'bg-emerald-50/50',
    accentColor: '#10b981',
  },
  suspension: {
    id: 'suspension',
    label: 'Suspensión Extraordinaria',
    shortLabel: 'Suspensión',
    iconName: 'AlertCircle',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
    cardBg: 'bg-rose-50/50',
    accentColor: '#f43f5e',
  },
  evaluacion: {
    id: 'evaluacion',
    label: 'Evaluación / Cierre Bimestre',
    shortLabel: 'Evaluación',
    iconName: 'FileCheck',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    badgeBorder: 'border-blue-200',
    cardBg: 'bg-blue-50/50',
    accentColor: '#3b82f6',
  },
};

export const MONTH_NAMES_ORDER: { key: string; name: string; index: number }[] = [
  { key: 'enero', name: 'Enero', index: 0 },
  { key: 'febrero', name: 'Febrero', index: 1 },
  { key: 'marzo', name: 'Marzo', index: 2 },
  { key: 'abril', name: 'Abril', index: 3 },
  { key: 'mayo', name: 'Mayo', index: 4 },
  { key: 'junio', name: 'Junio', index: 5 },
  { key: 'julio', name: 'Julio', index: 6 },
  { key: 'agosto', name: 'Agosto', index: 7 },
  { key: 'septiembre', name: 'Septiembre', index: 8 },
  { key: 'octubre', name: 'Octubre', index: 9 },
  { key: 'noviembre', name: 'Noviembre', index: 10 },
  { key: 'diciembre', name: 'Diciembre', index: 11 },
];

export function getCurrentMonthKey(): string {
  const currentMonthIdx = new Date().getMonth();
  const found = MONTH_NAMES_ORDER.find((m) => m.index === currentMonthIdx);
  return found ? found.key : 'enero';
}

export function inferCategoryFromText(text: string): SuspensionCategory {
  const lower = text.toLowerCase();
  if (lower.includes('pausa') || lower.includes('pedagógica') || lower.includes('pedagogica')) {
    return 'pausa';
  }
  if (
    lower.includes('feriado') ||
    lower.includes('asueto') ||
    lower.includes('compensatorio') ||
    lower.includes('comp.') ||
    lower.includes('trabajo') ||
    lower.includes('padre') ||
    lower.includes('maestro') ||
    lower.includes('independencia') ||
    lower.includes('semana santa') ||
    lower.includes('fiestas agostinas') ||
    lower.includes('fiesta señora santa ana')
  ) {
    return 'feriado';
  }
  if (
    lower.includes('evaluación') ||
    lower.includes('evaluacion') ||
    lower.includes('cierre') ||
    lower.includes('calificaciones') ||
    lower.includes('p.e.r') ||
    lower.includes('recuperación') ||
    lower.includes('recuperacion') ||
    lower.includes('boletas')
  ) {
    return 'evaluacion';
  }
  if (
    lower.includes('suspensión') ||
    lower.includes('suspension') ||
    lower.includes('alerta') ||
    lower.includes('emergencia')
  ) {
    return 'suspension';
  }
  return 'institucional';
}

export function parseFeriadosDesc(monthKey: string, desc: string): SuspensionEvent[] {
  if (!desc || desc.trim().toLowerCase().includes('sin suspension') || !monthKey) {
    return [];
  }

  const chunks = desc
    .split(/[,;\n]/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const results: SuspensionEvent[] = [];

  chunks.forEach((chunk, idx) => {
    let dia = '';
    let actividad = chunk;

    const parenMatch = chunk.match(/^([0-9\-\/\s\w]+)\s*\((.+)\)\.?$/);
    if (parenMatch) {
      dia = parenMatch[1].trim();
      actividad = parenMatch[2].trim();
    } else {
      const colonMatch = chunk.match(/^(.+?):\s*(.+)$/);
      if (colonMatch) {
        actividad = colonMatch[1].trim();
        dia = colonMatch[2].trim();
      } else {
        const leadingDateMatch = chunk.match(/^([0-9\-\/\s]+[a-zA-Z]*)\s+(.+)$/);
        if (leadingDateMatch) {
          dia = leadingDateMatch[1].trim();
          actividad = leadingDateMatch[2].trim();
        }
      }
    }

    if (!dia) {
      dia = monthKey.slice(0, 3);
    }

    results.push({
      id: `ev-${monthKey}-${idx}-${Date.now()}`,
      dia,
      mes: monthKey,
      actividad,
      tipo: inferCategoryFromText(`${dia} ${actividad}`),
    });
  });

  return results;
}

export function formatMonthFeriadosDesc(eventos?: SuspensionEvent[]): string {
  if (!eventos || eventos.length === 0) {
    return 'Sin suspensiones.';
  }
  return eventos
    .map((e) => {
      const diaClean = e.dia.trim();
      const actClean = e.actividad.trim();
      return `${diaClean} (${actClean})`;
    })
    .join(', ');
}

export const defaultInitialSuspensionEvents: Record<string, SuspensionEvent[]> = {
  enero: [
    { id: 'ev-ene-1', dia: '19 ene', mes: 'enero', actividad: 'Inicio oficial del Año Escolar 2026', tipo: 'institucional' },
    { id: 'ev-ene-2', dia: '30-31 ene', mes: 'enero', actividad: 'Fiesta Solemne de San Juan Bosco', tipo: 'institucional' },
  ],
  febrero: [
    { id: 'ev-feb-1', dia: '02 feb', mes: 'febrero', actividad: 'Compensatorio Fiesta Don Bosco', tipo: 'feriado' },
    { id: 'ev-feb-2', dia: '23 feb', mes: 'febrero', actividad: 'Pausa Pedagógica #1 - Jornada de Formación Docente', tipo: 'pausa' },
    { id: 'ev-feb-3', dia: '27 feb', mes: 'febrero', actividad: 'Jornada Pastoral de la Amorevolezza', tipo: 'institucional' },
  ],
  marzo: [
    { id: 'ev-mar-1', dia: '09 mar', mes: 'marzo', actividad: 'Compensatorio Fiestón Salesiano', tipo: 'feriado' },
    { id: 'ev-mar-2', dia: '19 mar', mes: 'marzo', actividad: 'Fiesta de San José / Sport Fest Salesiano', tipo: 'institucional' },
    { id: 'ev-mar-3', dia: '27 mar', mes: 'marzo', actividad: 'Retiro Espiritual de Cuaresma', tipo: 'institucional' },
    { id: 'ev-mar-4', dia: '30-31 mar', mes: 'marzo', actividad: 'Semana Santa (Lunes y Martes Santo)', tipo: 'feriado' },
  ],
  abril: [
    { id: 'ev-abr-1', dia: '01-05 abr', mes: 'abril', actividad: 'Semana Santa (Miércoles Santo a Domingo de Pascua)', tipo: 'feriado' },
    { id: 'ev-abr-2', dia: '27 abr', mes: 'abril', actividad: 'Pausa Pedagógica #2 - Evaluación y Seguimiento Curricular', tipo: 'pausa' },
  ],
  mayo: [
    { id: 'ev-may-1', dia: '01 may', mes: 'mayo', actividad: 'Asueto Nacional · Día Internacional del Trabajo', tipo: 'feriado' },
    { id: 'ev-may-2', dia: '06 may', mes: 'mayo', actividad: 'Fiesta de Santo Domingo Savio', tipo: 'institucional' },
    { id: 'ev-may-3', dia: '25 may', mes: 'mayo', actividad: 'Compensatorio Solemnidad María Auxiliadora', tipo: 'feriado' },
  ],
  junio: [
    { id: 'ev-jun-1', dia: '17 jun', mes: 'junio', actividad: 'Asueto Nacional · Día del Padre', tipo: 'feriado' },
    { id: 'ev-jun-2', dia: '22 jun', mes: 'junio', actividad: 'Asueto Nacional · Día del Maestro', tipo: 'feriado' },
    { id: 'ev-jun-3', dia: '23-25 jun', mes: 'junio', actividad: 'Jornadas de Análisis y Orientación Vocacional', tipo: 'institucional' },
  ],
  julio: [
    { id: 'ev-jul-1', dia: '06-10 jul', mes: 'julio', actividad: 'Semana de Salud Mental, Bienestar y Convivencia', tipo: 'institucional' },
    { id: 'ev-jul-2', dia: '24-26 jul', mes: 'julio', actividad: 'Fiesta de Señora Santa Ana (Patronales)', tipo: 'feriado' },
    { id: 'ev-jul-3', dia: '31 jul', mes: 'julio', actividad: 'Cierre evaluativo Bimestre II y registro de notas', tipo: 'evaluacion' },
  ],
  agosto: [
    { id: 'ev-ago-1', dia: '04-08 ago', mes: 'agosto', actividad: 'Vacaciones de Fiestas Agostinas / Divino Salvador del Mundo', tipo: 'feriado' },
    { id: 'ev-ago-2', dia: '17 ago', mes: 'agosto', actividad: 'Compensatorio Natalicio de San Juan Bosco', tipo: 'feriado' },
    { id: 'ev-ago-3', dia: '28 ago', mes: 'agosto', actividad: 'Pausa Pedagógica #3 - Balance de Rendimiento Académico', tipo: 'pausa' },
  ],
  septiembre: [
    { id: 'ev-sep-1', dia: '15 sep', mes: 'septiembre', actividad: 'Asueto Nacional · Día de la Independencia Patria', tipo: 'feriado' },
  ],
  octubre: [
    { id: 'ev-oct-1', dia: '16 oct', mes: 'octubre', actividad: 'Culminación Oficial de Clases Lectivas 2026', tipo: 'institucional' },
    { id: 'ev-oct-2', dia: '29 oct', mes: 'octubre', actividad: 'Entrega final de calificaciones y cierre institucional', tipo: 'evaluacion' },
  ],
  noviembre: [
    { id: 'ev-nov-1', dia: '03-06 nov', mes: 'noviembre', actividad: 'Periodo Extraordinario de Recuperación (P.E.R.)', tipo: 'evaluacion' },
    { id: 'ev-nov-2', dia: '13 nov', mes: 'noviembre', actividad: 'Acto de Clausura y Graduación del Año Escolar 2026', tipo: 'institucional' },
  ],
};

export function ensureMonthEvents(months: MonthStats[]): MonthStats[] {
  return months.map((m) => {
    if (m.eventos && m.eventos.length > 0) {
      return m;
    }
    const defaultList = defaultInitialSuspensionEvents[m.month];
    if (defaultList && defaultList.length > 0) {
      return {
        ...m,
        eventos: [...defaultList],
        feriadosDesc: formatMonthFeriadosDesc(defaultList),
      };
    }
    const parsed = parseFeriadosDesc(m.month, m.feriadosDesc);
    return {
      ...m,
      eventos: parsed,
      feriadosDesc: formatMonthFeriadosDesc(parsed),
    };
  });
}
