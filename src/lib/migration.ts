import { Student, Grade, Section, BaccalaureateTypeDoc } from '../types';

export const GRADE_ORDER = ['k4', 'k5', 'k6', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10g', '11g', '11t'];

export function sortGrades(grades: Grade[]): Grade[] {
  return [...grades].sort((a, b) => {
    const ia = GRADE_ORDER.indexOf(a.id);
    const ib = GRADE_ORDER.indexOf(b.id);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });
}

export function getNextGradeId(gradeId: string, grades: Grade[], baccalaureateTypes: BaccalaureateTypeDoc[]): string | null {
  if (gradeId === 'k4') return 'k5';
  if (gradeId === 'k5') return 'k6';
  if (gradeId === 'k6') return '1';

  const numeric = gradeId.replace(/[^0-9]/g, '');
  const suffix = gradeId.replace(/[0-9]/g, '');
  const num = parseInt(numeric, 10);
  if (!Number.isFinite(num)) return null;

  if (num === 9 && !suffix) return '10g';

  if (suffix === 'g' || suffix === 't') {
    const grade = grades.find(g => g.id === gradeId);
    const bt = grade?.baccalaureateType ? baccalaureateTypes.find(b => b.id === grade.baccalaureateType) : null;
    const maxGrade = bt?.maxGrade ?? (suffix === 'g' ? 11 : 12);
    if (num >= maxGrade) return null;
    return `${num + 1}${suffix}`;
  }

  if (num >= 11) return null;
  return String(num + 1);
}

export function getPrevGradeId(gradeId: string, grades: Grade[], baccalaureateTypes: BaccalaureateTypeDoc[]): string | null {
  return grades.find(g => getNextGradeId(g.id, grades, baccalaureateTypes) === gradeId)?.id ?? null;
}

export function sectionLetter(sectionId: string): string {
  const parts = (sectionId || 'A').split('-');
  const letter = parts[parts.length - 1] || 'A';
  return letter.toUpperCase();
}

export function uniqueNames(sections: Section[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  sections.forEach(s => {
    const key = (s.name || '').trim().toUpperCase();
    if (key && !seen.has(key)) { seen.add(key); names.push(s.name.trim().toUpperCase()); }
  });
  return names;
}

export function resizeNames(names: string[], count: number): string[] {
  const next = names.slice(0, count);
  for (let i = next.length; i < count; i++) {
    next.push(String.fromCharCode(65 + i));
  }
  return next;
}

export interface DistributionResult {
  counts: Record<string, number>;
  assigned: Record<string, string>;
}

export function distributeStudents(students: Student[], sectionNames: string[]): DistributionResult {
  const counts: Record<string, number> = {};
  const assigned: Record<string, string> = {};
  sectionNames.forEach(n => counts[n] = 0);

  if (sectionNames.length === 0) return { counts, assigned };

  const leftover: Student[] = [];
  students.forEach(s => {
    const letter = sectionLetter(s.sectionId);
    if (sectionNames.includes(letter)) {
      counts[letter] += 1;
      assigned[s.id] = letter;
    } else {
      leftover.push(s);
    }
  });

  leftover.forEach(s => {
    const target = [...sectionNames].sort((a, b) => counts[a] - counts[b])[0];
    counts[target] += 1;
    assigned[s.id] = target;
  });

  return { counts, assigned };
}

export interface MigrationPlanRow {
  gradeId: string;
  gradeName: string;
  cycle: string;
  sourceGradeId: string | null;
  sourceGradeName: string;
  incomingCount: number;
  outgoingCount: number;
  nextGradeId: string | null;
  nextGradeName: string;
  currentSectionNames: string[];
  newSectionNames: string[];
  distribution: { sectionName: string; count: number }[];
}

export function isActiveStudent(s: Student): boolean {
  return s.status !== 'INACTIVO' && s.status !== 'GRADUADO';
}

export function buildMigrationRows(
  students: Student[],
  grades: Grade[],
  sections: Section[],
  baccalaureateTypes: BaccalaureateTypeDoc[],
  currentYear: number | null
): MigrationPlanRow[] {
  return sortGrades(grades).map(grade => {
    const currentStudents = students.filter(s => isActiveStudent(s) && s.gradeId === grade.id);
    const nextId = getNextGradeId(grade.id, grades, baccalaureateTypes);
    const prevId = getPrevGradeId(grade.id, grades, baccalaureateTypes);
    const sourceStudents = prevId ? students.filter(s => isActiveStudent(s) && s.gradeId === prevId) : [];

    const yearSections = sections.filter(s => s.gradeId === grade.id && s.schoolYear === currentYear);
    const secList = yearSections.length > 0 ? yearSections : sections.filter(s => s.gradeId === grade.id && !s.schoolYear);
    const currentNames = uniqueNames(secList);

    const newNames = currentNames.length > 0 ? [...currentNames] : ['A'];
    const dist = distributeStudents(sourceStudents, newNames);

    return {
      gradeId: grade.id,
      gradeName: grade.name,
      cycle: grade.cycle,
      sourceGradeId: prevId,
      sourceGradeName: prevId ? (grades.find(g => g.id === prevId)?.name || prevId) : 'Nuevo ingreso',
      incomingCount: sourceStudents.length,
      outgoingCount: currentStudents.length,
      nextGradeId: nextId,
      nextGradeName: nextId ? (grades.find(g => g.id === nextId)?.name || nextId) : 'Graduación',
      currentSectionNames: currentNames,
      newSectionNames: newNames,
      distribution: newNames.map(n => ({ sectionName: n, count: dist.counts[n] || 0 })),
    };
  });
}
