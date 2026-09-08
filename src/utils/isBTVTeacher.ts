import { Teacher, Grade, LMSModule } from '../types';

const BTV_GRADE_IDS = ['10t', '11t', '12t'];

/**
 * Verifica si un docente enseña en Bachillerato Técnico
 * basándose en su guideGradeId.
 */
export function isTeacherBTVByGrade(teacher: Teacher | null | undefined): boolean {
  if (!teacher?.guideGradeId) return false;
  return BTV_GRADE_IDS.includes(teacher.guideGradeId);
}

/**
 * Verifica si un docente enseña en Bachillerato Técnico
 * basándose en sus módulos LMS asignados.
 */
export function isTeacherBTVByModules(
  teacherId: string | undefined,
  modules: LMSModule[]
): boolean {
  if (!teacherId) return false;
  return modules.some(
    m => m.teacherId === teacherId && m.gradeId && BTV_GRADE_IDS.includes(m.gradeId)
  );
}

/**
 * Verifica si un gradeId pertenece a Bachillerato Técnico.
 */
export function isBTBaccalaureateGrade(gradeId: string | undefined): boolean {
  if (!gradeId) return false;
  return BTV_GRADE_IDS.includes(gradeId);
}

/**
 * Verifica si un grade tiene baccalaureateType === 'tecnico'.
 */
export function isTechnicalGrade(grade: Grade | undefined): boolean {
  return grade?.baccalaureateType === 'tecnico';
}

/**
 * Retorna los grados de Bachillerato Técnico de una lista.
 */
export function getBTVGrades(grades: Grade[]): Grade[] {
  return grades.filter(g => g.baccalaureateType === 'tecnico');
}

export { BTV_GRADE_IDS };
