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
 * Fórmula MINED: 5 días hábiles/semana
 * 1° y 2° Año: 14 horas/semana REALES (no 18 teóricas)
 * 3° Año: 25 horas/semana REALES (no 30 teóricas)
 * Todos: 40 semanas = 200 días hábiles
 */
function calculateBusinessDaysNeeded(hours: number, technicalYear: string): number {
  if (hours <= 0) return 5;
  // Horas REALES por semana (no teóricas)
  const hoursPerWeek = technicalYear === '3' ? 25 : 14;
  const weeks = Math.ceil(hours / hoursPerWeek);
  return weeks * 5;
}

/**
 * Genera el cronograma completo para módulos técnicos
 * Patrón híbrido: secuencial por defecto, paralelo cuando no alcanza el tiempo
 * Cada año técnico tiene su PROPIO año escolar completo (40 semanas)
 */
export function generarCronogramaTecnico(input: CronogramaInput): CronogramaResult {
  const { startDate, endDate, year, modules, suspensiones } = input;
  const suspensionDates = collectSuspensionDates(suspensiones, year);
  const warnings: string[] = [];

  // Agrupar módulos por año técnico
  const modulesByYear = modules.reduce((acc, mod) => {
    const y = mod.technicalYear;
    if (!acc[y]) acc[y] = [];
    acc[y].push(mod);
    return acc;
  }, {} as Record<string, LMSModule[]>);

  const allModulos: ModuloCronograma[] = [];
  let totalDias = 0;
  let totalHoras = 0;

  // Para cada año técnico, distribuir módulos
  for (const [yearNum, yearModules] of Object.entries(modulesByYear)) {
    // Horas REALES por semana (no teóricas)
    const hoursPerWeek = yearNum === '3' ? 25 : 14;

    // Ordenar módulos por código
    const sorted = [...yearModules].sort((a, b) => {
      if (a.code < b.code) return -1;
      if (a.code > b.code) return 1;
      return 0;
    });

    // Calcular semanas necesarias por módulo
    const modulesWithInfo = sorted.map(mod => ({
      mod,
      weeksNeeded: Math.ceil(mod.hours / hoursPerWeek),
      daysNeeded: Math.ceil(mod.hours / hoursPerWeek) * 5,
    }));

    // Algoritmo híbrido: secuencial con posibilidad de paralelo
    // Primero intentar secuencial
    let sequentialAssignments: { mod: LMSModule; startDay: number; daysNeeded: number }[] = [];
    let currentDay = 0; // Día hábil actual (0-199)
    
    for (const { mod, daysNeeded } of modulesWithInfo) {
      sequentialAssignments.push({
        mod,
        startDay: currentDay,
        daysNeeded,
      });
      currentDay += daysNeeded;
    }

    // Verificar si algún módulo se pasa del año escolar (200 días)
    const maxDay = Math.max(...sequentialAssignments.map(a => a.startDay + a.daysNeeded));
    
    if (maxDay > 200) {
      // Necesitamos paralelismo: ajustar módulos que se pasan
      // Encontrar módulos que exceden y buscar espacio anterior
      const overflow = maxDay - 200;
      
      // Mover módulos tardíos hacia atrás (paralelo con otros)
      for (let i = sequentialAssignments.length - 1; i >= 0 && sequentialAssignments.some(a => a.startDay + a.daysNeeded > 200); i--) {
        const assignment = sequentialAssignments[i];
        if (assignment.startDay + assignment.daysNeeded > 200) {
          // Calcular cuántos días necesita moverse
          const excess = (assignment.startDay + assignment.daysNeeded) - 200;
          assignment.startDay = Math.max(0, assignment.startDay - excess);
        }
      }
    }

    // Convertir días a fechas
    for (const assignment of sequentialAssignments) {
      const { mod, startDay, daysNeeded } = assignment;
      
      // Calcular fecha de inicio basada en el día hábil
      const fechaInicio = addBusinessDaysWithSuspensions(startDate, startDay, suspensionDates);
      
      // Calcular fecha de fin
      const fechaFin = addBusinessDaysWithSuspensions(fechaInicio, daysNeeded - 1, suspensionDates);

      // Validar que no se pase del fin del año escolar
      if (endDate && fechaFin > endDate) {
        warnings.push(
          `⚠️ El módulo ${mod.code} (${mod.name}) termina el ${fechaFin}, pasándose del fin de año escolar (${endDate}).`
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

      allModulos.push({
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
    }
  }

  return {
    modulos: allModulos,
    totalDias,
    totalHoras,
    fechaInicio: startDate,
    fechaFin: allModulos.length > 0 ? allModulos[allModulos.length - 1].fechaFin : startDate,
    warnings,
  };
}

/**
 * Calcula los días hábiles entre dos fechas excluyendo suspensiones
 */
function calculateBusinessDaysBetween(startDate: string, endDate: string, suspensionDates: Set<string>): number {
  if (!startDate || !endDate) return 0;
  
  let count = 0;
  let current = startDate;
  
  while (current <= endDate) {
    const date = new Date(current + 'T12:00:00');
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !suspensionDates.has(current)) {
      count++;
    }
    
    // Avanzar al siguiente día
    date.setDate(date.getDate() + 1);
    current = date.toISOString().split('T')[0];
  }
  
  return count;
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

/**
 * Valida que el cronograma no exceda los 200 días hábiles (40 semanas)
 * Retorna advertencias si se excede
 */
export function validarCronogramaContraCalendario(
  cronograma: CronogramaResult,
  maxDias: number = 200,
  maxSemanas: number = 40
): string[] {
  const warnings: string[] = [];
  
  // Calcular días hábiles totales del cronograma
  const totalDiasCalendario = cronograma.totalDias;
  
  if (totalDiasCalendario > maxDias) {
    warnings.push(
      `⚠️ El cronograma usa ${totalDiasCalendario} días hábiles, excediendo el máximo de ${maxDias} días (${maxSemanas} semanas).`
    );
  }
  
  // Verificar que la fecha fin no exceda el fin del año escolar
  if (cronograma.fechaFin > '2026-10-16') {
    warnings.push(
      `⚠️ El cronograma termina el ${cronograma.fechaFin}, pasándose del fin de año escolar (16 octubre 2026).`
    );
  }
  
  // Verificar que cada año no exceda 200 días
  const modulosPorAnio = cronograma.modulos.reduce((acc, mod) => {
    const year = mod.year;
    if (!acc[year]) acc[year] = { dias: 0, horas: 0 };
    acc[year].dias += mod.diasHabilesNecesarios;
    acc[year].horas += mod.horasTotales;
    return acc;
  }, {} as Record<string, { dias: number; horas: number }>);
  
  for (const [year, data] of Object.entries(modulosPorAnio)) {
    if (data.dias > maxDias) {
      warnings.push(
        `⚠️ ${year}° Año: ${data.dias} días hábiles (excede ${maxDias} días).`
      );
    }
  }
  
  return warnings;
}
