// Helper para generar cronograma correlativo de módulos técnicos
// Toma la fecha de inicio del año (del calendario institucional cargado por admin)
// y calcula fechas secuenciales para cada módulo,
// respetando días de asueto/suspensión del calendario.

import { LMSModule, MonthStats, SuspensionEvent } from '../types';
import { calculateStageJornalizacion, calculateProjectDeliveryDate, StageJornalizacionItem } from './jornalizacionHelper';

export interface ModuloCronograma {
  moduleId: string;
  codigo: string;
  nombre: string;
  year: string;
  fechaInicio: string;
  fechaFin: string;
  horasTotales: number;
  semanasTotales: number;
  diasHabilesNecesarios: number;
  projectDeliveryDate: string;
  jornalizacion: StageJornalizacionItem[];
  estado: 'programado' | 'en_ejecucion' | 'pausado' | 'completado';
}

export interface CronogramaInput {
  startDate: string;      // Fecha de inicio del año (del calendario institucional)
  endDate: string;        // Fecha de fin del año escolar (del calendario)
  year: string;           // Año académico (ej: "2026", del calendario)
  modules: LMSModule[];
  suspensiones: MonthStats[];
}

export interface CronogramaResult {
  modulos: ModuloCronograma[];
  totalDias: number;
  totalHoras: number;
  fechaInicio: string;
  fechaFin: string;
  warnings: string[];     // Advertencias (ej: módulos no caben en el año)
}

/**
 * Extrae todas las fechas de suspensión/asueto de los meses del calendario
 * Retorna un Set de strings "YYYY-MM-DD" para búsqueda rápida
 * @param year - Año académico (viene del calendario cargado, ej: "2026")
 */
function collectSuspensionDates(suspensiones: MonthStats[], year: string): Set<string> {
  const dates = new Set<string>();
  const monthMap: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12',
  };

  for (const mes of suspensiones) {
    if (!mes.eventos) continue;
    for (const ev of mes.eventos) {
      const monthNum = monthMap[ev.mes?.toLowerCase()] || monthMap[mes.month];
      if (!monthNum) continue;
      const day = ev.dia?.toString().padStart(2, '0');
      if (!day) continue;
      dates.add(`${year}-${monthNum}-${day}`);
    }
  }

  return dates;
}

/**
 * Añade días hábiles saltando fines de semana Y suspensiones/asuetos
 */
function addBusinessDaysWithSuspensions(
  startDateStr: string,
  daysToAdd: number,
  suspensionDates: Set<string>
): string {
  if (!startDateStr) return '';
  const date = new Date(startDateStr + 'T12:00:00');
  let added = 0;

  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Fin de semana

    const dateStr = date.toISOString().split('T')[0];
    if (suspensionDates.has(dateStr)) continue; // Asueto/suspensión

    added++;
  }

  return date.toISOString().split('T')[0];
}

/**
 * Calcula los días hábiles necesarios para un módulo según sus horas
 * Fórmula MINED: 18 horas/semana, 5 días hábiles/semana
 */
function calculateBusinessDaysNeeded(hours: number): number {
  if (hours <= 0) return 5;
  // semanas necesarias = ceil(horas / 18)
  // días hábiles = semanas * 5
  const weeks = Math.ceil(hours / 18);
  return weeks * 5;
}

/**
 * Genera el cronograma completo correlativo para módulos técnicos
 * Los módulos se ordenan por código y se asignan fechas secuenciales
 */
export function generarCronogramaTecnico(input: CronogramaInput): CronogramaResult {
  const { startDate, endDate, year, modules, suspensiones } = input;
  const suspensionDates = collectSuspensionDates(suspensiones, year);
  const warnings: string[] = [];

  // Ordenar módulos por código (BTVDG1.1, BTVDG1.2, ..., BTVDG2.1, ...)
  const sorted = [...modules].sort((a, b) => {
    if (a.code < b.code) return -1;
    if (a.code > b.code) return 1;
    return 0;
  });

  const modulos: ModuloCronograma[] = [];
  let currentDate = startDate;
  let totalDias = 0;
  let totalHoras = 0;

  for (const mod of sorted) {
    const daysNeeded = calculateBusinessDaysNeeded(mod.hours);
    const fechaInicio = currentDate;
    const fechaFin = addBusinessDaysWithSuspensions(fechaInicio, daysNeeded - 1, suspensionDates);

    // Validar que no se pase del fin del año escolar
    if (endDate && fechaFin > endDate) {
      warnings.push(
        `⚠️ El módulo ${mod.code} (${mod.name}) termina el ${fechaFin}, pasándose del fin de año escolar (${endDate}). Considere ajustar horas o fechas.`
      );
    }

    // Calcular las 6 etapas MINED para este módulo
    const jornalizacion = calculateStageJornalizacion(
      mod.name,
      mod.hours,
      fechaInicio,
      fechaFin
    );

    const projectDeliveryDate = calculateProjectDeliveryDate(fechaFin);

    modulos.push({
      moduleId: mod.id,
      codigo: mod.code,
      nombre: mod.name,
      year: mod.technicalYear,
      fechaInicio,
      fechaFin,
      horasTotales: mod.hours,
      semanasTotales: mod.weeks,
      diasHabilesNecesarios: daysNeeded,
      projectDeliveryDate,
      jornalizacion,
      estado: 'programado',
    });

    totalDias += daysNeeded;
    totalHoras += mod.hours;

    // El siguiente módulo empieza el día hábil después del fin de este
    currentDate = addBusinessDaysWithSuspensions(fechaFin, 1, suspensionDates);
  }

  return {
    modulos,
    totalDias,
    totalHoras,
    fechaInicio: startDate,
    fechaFin: modulos.length > 0 ? modulos[modulos.length - 1].fechaFin : startDate,
    warnings,
  };
}

/**
 * Recalcula las fechas de un solo módulo dado un rango específico
 * Útil cuando el docente quiere ajustar un módulo individual
 */
export function recalcularModuloIndividual(
  mod: LMSModule,
  fechaInicio: string,
  diasHabiles: number,
  suspensionDates: Set<string>
): ModuloCronograma {
  const fechaFin = addBusinessDaysWithSuspensions(fechaInicio, diasHabiles - 1, suspensionDates);
  const jornalizacion = calculateStageJornalizacion(mod.name, mod.hours, fechaInicio, fechaFin);
  const projectDeliveryDate = calculateProjectDeliveryDate(fechaFin);

  return {
    moduleId: mod.id,
    codigo: mod.code,
    nombre: mod.name,
    year: mod.technicalYear,
    fechaInicio,
    fechaFin,
    horasTotales: mod.hours,
    semanasTotales: mod.weeks,
    diasHabilesNecesarios: diasHabiles,
    projectDeliveryDate,
    jornalizacion,
    estado: 'programado',
  };
}

/**
 * Convierte un ModuloCronograma a formato jornalizacion[] para guardar en Firestore
 */
export function cronogramaToJornalizacion(cronograma: ModuloCronograma): StageJornalizacionItem[] {
  return cronograma.jornalizacion;
}

/**
 * Agrupa módulos por año técnico
 */
export function agruparPorAno(modulos: LMSModule[]): Record<string, LMSModule[]> {
  const groups: Record<string, LMSModule[]> = {};
  for (const mod of modulos) {
    const year = mod.technicalYear || '1';
    if (!groups[year]) groups[year] = [];
    groups[year].push(mod);
  }
  return groups;
}

/**
 * Calcula el total de semanas de un cronograma
 */
export function calcularTotalSemanas(cronograma: CronogramaResult): number {
  return cronograma.modulos.reduce((sum, m) => sum + m.semanasTotales, 0);
}

/**
 * Busca un módulo en el cronograma por código
 */
export function findModuloByCodigo(cronograma: CronogramaResult, codigo: string): ModuloCronograma | undefined {
  return cronograma.modulos.find(m => m.codigo === codigo);
}

/**
 * Calcula el porcentaje de avance de un cronograma
 */
export function calcularAvance(cronograma: CronogramaResult): number {
  if (cronograma.modulos.length === 0) return 0;
  const completados = cronograma.modulos.filter(m => m.estado === 'completado').length;
  return Math.round((completados / cronograma.modulos.length) * 100);
}
