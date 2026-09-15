import { User, Student, TechnicalYear } from '../types';

/**
 * Helper to determine technical year limits for a student:
 * - Technical students (Bachillerato Técnico: 10t/1° año, 11t/2° año, 12t/3° año):
 *   Can view current year and previous years, but NOT future/next years.
 * - Non-technical or unspecified students default to standard access.
 */

export interface StudentTechnicalYearAccess {
  isTechnical: boolean;
  currentYear: number; // 1, 2, or 3
  allowedYears: TechnicalYear[]; // e.g. ['1'] for 1st year, ['1', '2'] for 2nd year, ['1', '2', '3'] for 3rd year
  maxYear: number;
}

export function getStudentTechnicalYearAccess(
  userProfile?: User | null,
  student?: Student | null
): StudentTechnicalYearAccess {
  const gradeId = (userProfile?.gradeId || student?.gradeId || '').toString().toLowerCase().trim();

  // Determine if student is technical and which year
  let isTech = false;
  let yearNum = 1;

  if (gradeId.includes('10t') || gradeId.includes('10-tecnico') || gradeId.includes('10_tecnico')) {
    isTech = true;
    yearNum = 1;
  } else if (gradeId.includes('11t') || gradeId.includes('11-tecnico') || gradeId.includes('11_tecnico')) {
    isTech = true;
    yearNum = 2;
  } else if (gradeId.includes('12t') || gradeId.includes('12-tecnico') || gradeId.includes('12_tecnico')) {
    isTech = true;
    yearNum = 3;
  } else if (gradeId === '10' || gradeId === '10g') {
    yearNum = 1;
  } else if (gradeId === '11' || gradeId === '11g') {
    yearNum = 2;
  }

  // If student record has explicit section or grade info
  const sectionId = (userProfile?.sectionId || student?.sectionId || '').toLowerCase();
  if (sectionId.includes('10t')) {
    isTech = true;
    yearNum = 1;
  } else if (sectionId.includes('11t')) {
    isTech = true;
    yearNum = 2;
  } else if (sectionId.includes('12t')) {
    isTech = true;
    yearNum = 3;
  }

  // Calculate allowed years:
  // User rule: "solo puedan ver su año actual el nivel de formacion el anterior tambien pero el siguiente no"
  // Year 1 student: can see 1° Año (previous doesn't exist in BTV). Next year (2°, 3°) NOT allowed.
  // Year 2 student: can see 2° Año and 1° Año (anterior). Next year (3°) NOT allowed.
  // Year 3 student: can see 3° Año, 2° Año, and 1° Año.
  const allowedYears: TechnicalYear[] = [];
  if (yearNum >= 1) allowedYears.push('1');
  if (yearNum >= 2) allowedYears.push('2');
  if (yearNum >= 3) allowedYears.push('3');

  return {
    isTechnical: isTech,
    currentYear: yearNum,
    allowedYears: allowedYears.length > 0 ? allowedYears : ['1', '2', '3'],
    maxYear: yearNum,
  };
}
