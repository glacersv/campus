import { Grade, Section } from '../types';

/**
 * Retorna un peso numérico para un grado, permitiendo ordenarlos cronológicamente
 * desde Parvularia/Kínder hasta Bachillerato (12° grado) de forma exacta.
 */
export function getGradeSortWeight(gradeId: string): number {
  if (!gradeId) return 1000;
  const lower = gradeId.toLowerCase().trim();

  // Parvularia / Kínder (K4, K5, K6 / Preparatoria)
  if (lower === 'k4') return 10;
  if (lower === 'k5') return 11;
  if (lower === 'k6' || lower === 'prep' || lower === 'preparatoria') return 12;

  // Extraer números para Grados Básica y Bachillerato
  const numStr = lower.replace(/[^0-9]/g, '');
  const num = parseInt(numStr, 10);

  if (Number.isFinite(num)) {
    // Básica: 1° - 9° Grado
    if (num >= 1 && num <= 9) return 20 + num;
    // Bachillerato: 10° - 12° Grado
    if (num >= 10 && num <= 12) return 40 + (num - 10);
  }

  // Fallback para nombres o IDs no numéricos
  return 100;
}

/**
 * Ordena un arreglo de Grados cronológicamente
 */
export function sortGradesChronological<T extends { id: string }>(grades: T[]): T[] {
  return [...grades].sort((a, b) => getGradeSortWeight(a.id) - getGradeSortWeight(b.id));
}

/**
 * Ordena un arreglo de Secciones cronológicamente por su Grado asignado
 */
export function sortSectionsChronological<T extends { gradeId: string; name: string }>(
  sections: T[]
): T[] {
  return [...sections].sort((a, b) => {
    const weightA = getGradeSortWeight(a.gradeId);
    const weightB = getGradeSortWeight(b.gradeId);
    if (weightA !== weightB) return weightA - weightB;
    // Si están en el mismo grado, ordenar alfabéticamente por nombre de sección (A, B, C...)
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}
