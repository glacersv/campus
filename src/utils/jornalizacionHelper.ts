// Helper para cálculo inteligente de fechas de jornalización y etapas de acción completa
// Regla Salesiana / MINED: Entrega de proyecto 4 días hábiles (u 8 horas lectivas) antes del cierre del módulo.

import { ActionStageKey } from '../types';

export interface StageJornalizacionItem {
  stage: string;
  stageKey?: ActionStageKey;
  name: string;
  startDate: string;
  endDate: string;
  hours: number;
  description?: string;
  isDeliveryMilestone?: boolean;
}

export interface ModuleDateCalculation {
  startDate: string;
  endDate: string;
  projectDeliveryDate: string;
  stages: StageJornalizacionItem[];
}

/**
 * Añade días hábiles (lunes a viernes) a una fecha dada en formato YYYY-MM-DD
 */
export function addBusinessDays(startDateStr: string, daysToAdd: number): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr + 'T12:00:00');
  let added = 0;
  
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // No sábado ni domingo
      added++;
    }
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Resta días hábiles (lunes a viernes) a una fecha dada en formato YYYY-MM-DD
 */
export function subtractBusinessDays(endDateStr: string, daysToSubtract: number): string {
  if (!endDateStr) return '';
  const date = new Date(endDateStr + 'T12:00:00');
  let subtracted = 0;
  
  while (subtracted < daysToSubtract) {
    date.setDate(date.getDate() - 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      subtracted++;
    }
  }
  
  return date.toISOString().split('T')[0];
}

/**
 * Calcula la fecha de entrega del proyecto anual (4 días hábiles antes del final del módulo)
 */
export function calculateProjectDeliveryDate(moduleEndDate: string): string {
  if (!moduleEndDate) return '';
  return subtractBusinessDays(moduleEndDate, 4);
}

/**
 * Calcula la distribución cronológica y horaria de las 6 etapas de la acción completa
 * para un módulo según su fecha de inicio, fecha de fin y total de horas.
 */
export function calculateStageJornalizacion(
  moduleName: string,
  totalHours: number,
  startDateStr: string,
  endDateStr: string
): StageJornalizacionItem[] {
  const safeHours = totalHours > 0 ? totalHours : 72;
  const safeStart = startDateStr || '2026-01-19';
  const safeEnd = endDateStr || addBusinessDays(safeStart, Math.ceil((safeHours / 18) * 5));

  // Definición de las 6 etapas y porcentajes normativos MINED
  const stageDefs: { key: ActionStageKey; num: number; name: string; pct: number; desc: string }[] = [
    { key: 'informar', num: 1, name: '1. Etapa de Informarse', pct: 0.10, desc: 'Investigación documental, saberes previos y recopilación de antecedentes teóricos/técnicos.' },
    { key: 'planificar', num: 2, name: '2. Etapa de Planificar', pct: 0.10, desc: 'Plan de trabajo, cronograma de ruta crítica y asignación de roles de equipo.' },
    { key: 'decidir', num: 3, name: '3. Etapa de Decidir', pct: 0.10, desc: 'Formulario de decisiones, evaluación de alternativas y consenso de propuesta.' },
    { key: 'ejecutar', num: 4, name: '4. Etapa de Ejecutar', pct: 0.25, desc: 'Bocetería, experimentación, producción de piezas y artes finales.' },
    { key: 'controlar', num: 5, name: '5. Etapa de Controlar', pct: 0.25, desc: 'Control de calidad, verificación de especificaciones y entrega de proyecto (4 días antes).' },
    { key: 'valorar', num: 6, name: '6. Etapa de Valorar', pct: 0.20, desc: 'Evaluación por rúbrica MINED (escala 1-5), autoevaluación, coevaluación y defensa oral.' },
  ];

  const totalDays = Math.max(5, Math.round((safeHours / 18) * 5)); // Estimación de días hábiles
  let currentStart = safeStart;

  return stageDefs.map((st, idx) => {
    const stageHours = Math.max(1, Math.round(safeHours * st.pct));
    const stageDays = Math.max(1, Math.round(totalDays * st.pct));
    const stageEnd = idx === stageDefs.length - 1 ? safeEnd : addBusinessDays(currentStart, Math.max(1, stageDays - 1));
    
    const isDeliveryMilestone = st.key === 'controlar' || st.key === 'valorar';

    const item: StageJornalizacionItem = {
      stage: `Etapa ${st.num}`,
      stageKey: st.key,
      name: `${st.name} (${Math.round(st.pct * 100)}% de horas)`,
      startDate: currentStart,
      endDate: stageEnd,
      hours: stageHours,
      description: st.desc,
      isDeliveryMilestone: isDeliveryMilestone,
    };

    // Preparar inicio de la siguiente etapa
    currentStart = addBusinessDays(stageEnd, 1);

    return item;
  });
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) a formato legible en español (ej: "19 de enero, 2026")
 */
export function formatDateSpanish(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${parseInt(day, 10)} de ${monthNames[monthIndex] || month}, ${year}`;
  } catch {
    return dateStr;
  }
}
