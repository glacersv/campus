import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { MonthStats, AcademicPeriod, AcademicPeriodActivity, PERData, SuspensionEvent } from '../types';
import { academicPeriods2026, monthsData2026, recuperacionExtraordinaria2026 } from '../data/calendarData';
import { inferCategoryFromText } from './suspensionesHelper';

// Set up pdfjs-dist with local worker
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }
  }
  return pdfjsLib;
}

export interface ParsedDocumentResult {
  fileName: string;
  fileType: 'pdf' | 'excel' | 'word' | 'json' | 'text' | 'manual' | 'unknown';
  fileSize: number;
  rawText?: string;
  headerData?: Partial<Record<string, unknown>>;
  months?: MonthStats[];
  periods?: AcademicPeriod[];
  perData?: PERData;
  summary: {
    monthsCount: number;
    periodsCount: number;
    detectedFields: string[];
    rawLinesCount: number;
  };
}

export const SPANISH_MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const MONTH_DISPLAY_NAMES: { [key: string]: string } = {
  enero: 'Enero',
  febrero: 'Febrero',
  marzo: 'Marzo',
  abril: 'Abril',
  mayo: 'Mayo',
  junio: 'Junio',
  julio: 'Julio',
  agosto: 'Agosto',
  septiembre: 'Septiembre',
  setiembre: 'Septiembre',
  octubre: 'Octubre',
  noviembre: 'Noviembre',
  diciembre: 'Diciembre',
};

function cleanText(str: any): string {
  if (str == null) return '';
  return String(str).trim();
}

/**
 * Creates a clean 12-month array with all weeks and days set to 0 and empty descriptions
 */
export function createEmpty12Months(): MonthStats[] {
  return SPANISH_MONTH_NAMES.map((m) => ({
    month: m,
    name: MONTH_DISPLAY_NAMES[m] || m,
    semanas: 0,
    dias: 0,
    feriadosDesc: '',
    eventos: [],
  }));
}

/**
 * Creates a clean 12-month array populated from a standard baseline or default 2026 data
 */
export function createDefault12Months(): MonthStats[] {
  return JSON.parse(JSON.stringify(monthsData2026));
}

/**
 * Spanish month name to month number (0-indexed)
 */
const MONTH_NAME_TO_NUM: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, setiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

/**
 * Parse a date string like "19 enero" or "08 de junio" into a Date object (year 2026)
 */
function parseDate(str: string, year = 2026): Date | null {
  if (!str) return null;
  const cleaned = str.toLowerCase().replace(/de\s+/g, '').trim();
  const match = cleaned.match(/(\d{1,2})\s*([a-záéíóúñ]+)/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthNum = MONTH_NAME_TO_NUM[match[2]];
  if (monthNum === undefined || isNaN(day)) return null;
  return new Date(year, monthNum, day);
}

/**
 * Calculate weeks and days per month from academic periods (bimestres).
 * Counts only business days (Mon-Fri) within each period's date range.
 */
export function calculateMonthsFromPeriods(periods: AcademicPeriod[]): MonthStats[] {
  const months = createEmpty12Months();
  if (!periods || periods.length === 0) return months;

  // Build list of date ranges from periods
  const ranges: { start: Date; end: Date }[] = [];
  for (const p of periods) {
    const start = parseDate(p.inicio);
    const end = parseDate(p.fin);
    if (start && end) ranges.push({ start, end });
  }
  if (ranges.length === 0) return months;

  // For each month, count business days within any period range
  for (let m = 0; m < 12; m++) {
    const year = 2026;
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    let businessDays = 0;
    const firstDay = new Date(year, m, 1);
    const lastDay = new Date(year, m, daysInMonth);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, m, d);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends

      // Check if this day falls within any period
      for (const range of ranges) {
        if (date >= range.start && date <= range.end) {
          businessDays++;
          break;
        }
      }
    }

    months[m].dias = businessDays;
    months[m].semanas = businessDays > 0 ? Math.ceil(businessDays / 5) : 0;
  }

  return months;
}

/**
 * Scans a 2D grid/table (from Excel) for a Horizontal Month Distribution:
 * Row 1: [Meses, Enero, Febrero, ...]
 * Row 2: [Semanas, 2, 4, ...]
 * Row 3: [Días, 10, 18, ...]
 */
export function extractHorizontalMonthsFromGrid(rows: any[][]): MonthStats[] | null {
  if (!rows || rows.length < 2) return null;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 4) continue;

    const monthPositions: { col: number; monthKey: string; name: string }[] = [];
    row.forEach((cell, cIdx) => {
      const txt = cleanText(cell).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const matchedMonth = SPANISH_MONTH_NAMES.find((m) => txt === m || (txt.length >= 3 && m.startsWith(txt)));
      if (matchedMonth) {
        monthPositions.push({
          col: cIdx,
          monthKey: matchedMonth,
          name: MONTH_DISPLAY_NAMES[matchedMonth] || matchedMonth,
        });
      }
    });

    if (monthPositions.length >= 4) {
      let semanasRowIdx = -1;
      let diasRowIdx = -1;
      let feriadosRowIdx = -1;

      for (let nextR = r + 1; nextR < Math.min(rows.length, r + 6); nextR++) {
        const checkRow = rows[nextR];
        if (!checkRow || checkRow.length === 0) continue;
        const firstFew = checkRow.slice(0, 3).map((c) => cleanText(c).toLowerCase()).join(' ');

        if (firstFew.includes('semana') || firstFew.includes('sem')) {
          semanasRowIdx = nextR;
        } else if (firstFew.includes('dia') || firstFew.includes('días') || firstFew.includes('habiles') || firstFew.includes('lectivos')) {
          diasRowIdx = nextR;
        } else if (firstFew.includes('feriado') || firstFew.includes('suspensi') || firstFew.includes('observaci') || firstFew.includes('pausa')) {
          feriadosRowIdx = nextR;
        }
      }

      if (semanasRowIdx === -1 && diasRowIdx === -1 && rows[r + 1]) {
        const sampleNumbers = monthPositions.map(({ col }) => Number(rows[r + 1][col])).filter((n) => !isNaN(n));
        if (sampleNumbers.length >= 3) {
          const allSmall = sampleNumbers.every((n) => n >= 0 && n <= 6);
          if (allSmall) {
            semanasRowIdx = r + 1;
            if (rows[r + 2]) {
              diasRowIdx = r + 2;
            }
          } else {
            diasRowIdx = r + 1;
          }
        }
      }

      if (semanasRowIdx !== -1 || diasRowIdx !== -1) {
        const resultMonths = createEmpty12Months();

        monthPositions.forEach(({ col, monthKey }) => {
          const mIdx = resultMonths.findIndex((rm) => rm.month === monthKey);
          if (mIdx !== -1) {
            if (semanasRowIdx !== -1 && rows[semanasRowIdx] && rows[semanasRowIdx][col] != null) {
              const semVal = Number(rows[semanasRowIdx][col]);
              if (!isNaN(semVal) && semVal >= 0 && semVal <= 6) {
                resultMonths[mIdx].semanas = semVal;
              }
            }
            if (diasRowIdx !== -1 && rows[diasRowIdx] && rows[diasRowIdx][col] != null) {
              const diasVal = Number(rows[diasRowIdx][col]);
              if (!isNaN(diasVal) && diasVal >= 0 && diasVal <= 31) {
                resultMonths[mIdx].dias = diasVal;
              }
            }
            if (feriadosRowIdx !== -1 && rows[feriadosRowIdx] && rows[feriadosRowIdx][col] != null) {
              const desc = cleanText(rows[feriadosRowIdx][col]);
              if (desc) {
                resultMonths[mIdx].feriadosDesc = desc;
              }
            }
          }
        });

        resultMonths.forEach((rm, idx) => {
          if (!rm.feriadosDesc && monthsData2026[idx]?.feriadosDesc) {
            rm.feriadosDesc = monthsData2026[idx].feriadosDesc;
          }
          rm.eventos = monthsData2026[idx]?.eventos || [];
        });

        return resultMonths;
      }
    }
  }

  return null;
}

/**
 * Scans a 2D grid/table for Vertical Month Distribution (Rows = Months):
 * Enero | 2 | 10 | Asuetos...
 * Febrero | 4 | 18 | ...
 */
export function extractVerticalMonthsFromGrid(rows: any[][]): MonthStats[] | null {
  if (!rows || rows.length < 3) return null;

  const foundMonths: { month: string; semanas: number; dias: number; desc: string }[] = [];

  rows.forEach((row) => {
    if (!row || row.length < 2) return;
    const firstCell = cleanText(row[0]).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const matched = SPANISH_MONTH_NAMES.find((m) => firstCell === m || firstCell.startsWith(m));

    if (matched) {
      let sem = 0;
      let dias = 0;
      let desc = '';

      for (let c = 1; c < row.length; c++) {
        const val = row[c];
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= 6 && sem === 0) {
          sem = num;
        } else if (!isNaN(num) && num >= 0 && num <= 31 && dias === 0) {
          dias = num;
        } else if (typeof val === 'string' && val.trim().length > 3 && !desc) {
          desc = val.trim();
        }
      }

      foundMonths.push({
        month: matched,
        semanas: sem,
        dias: dias,
        desc,
      });
    }
  });

  if (foundMonths.length >= 3) {
    const result = createEmpty12Months();
    foundMonths.forEach((fm) => {
      const idx = result.findIndex((rm) => rm.month === fm.month);
      if (idx !== -1) {
        result[idx].semanas = fm.semanas;
        result[idx].dias = fm.dias;
        if (fm.desc) result[idx].feriadosDesc = fm.desc;
      }
    });

    result.forEach((rm, idx) => {
      if (!rm.feriadosDesc && monthsData2026[idx]?.feriadosDesc) {
        rm.feriadosDesc = monthsData2026[idx].feriadosDesc;
      }
      rm.eventos = monthsData2026[idx]?.eventos || [];
    });

    return result;
  }

  return null;
}

/**
 * Extracts activities from text (table rows after bimestre header)
 */
function extractActivitiesFromText(text: string, periodStartIdx: number, periodEndIdx: number): AcademicPeriodActivity[] {
  const activities: AcademicPeriodActivity[] = [];
  const lines = text.substring(periodStartIdx, periodEndIdx).split('\n');
  const dp = '(\\d{1,2}\\s+(?:de\\s+)?[a-záéíóúñ]+)';

  // 1. "01. Actividad – 35% 19 enero 13 febrero 20 febrero"
  const activityRegex = new RegExp(`^(\\d{1,2})\\.\\s*(.+?)\\s*[–\\-]\\s*(\\d{1,2}%)\\s+${dp}\\s+${dp}\\s+${dp}`, 'i');
  // 2. "Pruebas Objetivas: materias básicas, ordinaria N°1 - 30% 16 marzo 20 marzo 27 marzo"
  const pruebasRegex = new RegExp(`^(Pruebas?\\s+Objetivas?.*?)\\s*[–\\-]\\s*(\\d{1,2}%[^\\s]*)\\s+${dp}\\s+${dp}\\s+${dp}`, 'i');
  // 3. "*Pruebas diagnósticas 19 enero 23 enero"
  const diagnosticasRegex = new RegExp(`^[*]?\\s*Pruebas?\\s+diagn[oó]sticas?\\s+${dp}\\s+${dp}`, 'i');
  // 4. "Refuerzo académico: materias básicas y PO Formativas 9 marzo 13 marzo"
  const refuerzoRegex = new RegExp(`^Refuerzo\\s+acad[eé]mico.*?\\s+${dp}\\s+${dp}`, 'i');
  // 5. "Prueba extraordinaria 23 marzo 27 marzo"
  const extraordinariaRegex = new RegExp(`^Prueba\\s+extraordinaria\\s+${dp}\\s+${dp}`, 'i');
  // 6. "Entrega de actividades pendientes 23 marzo 25 marzo 1 abril"
  const entregaPendientesRegex = new RegExp(`^Entrega\\s+de\\s+actividades?\\s+pendientes?\\s+${dp}\\s+${dp}\\s+${dp}`, 'i');
  // 7. "1ª Entrega de boletas de calificaciones 8 abril"
  const boletasRegex = new RegExp(`^(\\d+[ª°]?\\s+)?Entrega\\s+de\\s+boletas?.*?\\s+${dp}`, 'i');
  // 8. "Recuperación ordinaria"
  const recuperacionRegex = /^Recuperaci[oó]n\s+ordinaria/i;
  // 9. "Entrega de temarios y pruebas objetivas a coordinación"
  const temariosRegex = /^Entrega\s+de\s+temarios/i;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('(materias')) continue;

    const m1 = trimmed.match(activityRegex);
    if (m1) {
      const [, num, nombre, porcentaje, fechaIni, fechaFin, tbox] = m1;
      activities.push({
        nombre: `${num}. ${nombre.trim()}`,
        fechas: `${fechaIni.trim()} – ${fechaFin.trim()}`,
        porcentaje: porcentaje.trim(),
        tipo: porcentaje.includes('30%') ? 'objetiva' : 'formativa',
        ingresoTBox: tbox.trim(),
        fechaInicio: fechaIni.trim(),
        fechaCierre: fechaFin.trim(),
      });
      continue;
    }

    const m2 = trimmed.match(pruebasRegex);
    if (m2) {
      const [, nombre, porcentaje, fechaIni, fechaFin, tbox] = m2;
      activities.push({
        nombre: nombre.trim(),
        fechas: `${fechaIni.trim()} – ${fechaFin.trim()}`,
        porcentaje: porcentaje.trim(),
        tipo: 'objetiva',
        ingresoTBox: tbox.trim(),
        fechaInicio: fechaIni.trim(),
        fechaCierre: fechaFin.trim(),
      });
      continue;
    }

    const m3 = trimmed.match(diagnosticasRegex);
    if (m3) {
      const [, fechaIni, fechaFin] = m3;
      activities.push({
        nombre: 'Pruebas diagnósticas',
        fechas: `${fechaIni.trim()} – ${fechaFin.trim()}`,
        tipo: 'diagnostica',
        fechaInicio: fechaIni.trim(),
        fechaCierre: fechaFin.trim(),
      });
      continue;
    }

    const m4 = trimmed.match(refuerzoRegex);
    if (m4) {
      const [, fechaIni, fechaFin] = m4;
      activities.push({
        nombre: 'Refuerzo académico',
        fechas: `${fechaIni.trim()} – ${fechaFin.trim()}`,
        tipo: 'refuerzo',
        fechaInicio: fechaIni.trim(),
        fechaCierre: fechaFin.trim(),
      });
      continue;
    }

    const m5 = trimmed.match(extraordinariaRegex);
    if (m5) {
      const [, fechaIni, fechaFin] = m5;
      activities.push({
        nombre: 'Prueba extraordinaria',
        fechas: `${fechaIni.trim()} – ${fechaFin.trim()}`,
        tipo: 'recuperacion',
        fechaInicio: fechaIni.trim(),
        fechaCierre: fechaFin.trim(),
      });
      continue;
    }

    const m6 = trimmed.match(entregaPendientesRegex);
    if (m6) {
      const [, fechaIni, fechaFin, fechaExtra] = m6;
      activities.push({
        nombre: 'Entrega de actividades pendientes',
        fechas: fechaExtra ? `${fechaIni.trim()} – ${fechaExtra.trim()}` : `${fechaIni.trim()} – ${fechaFin.trim()}`,
        tipo: 'recuperacion',
        fechaInicio: fechaIni.trim(),
        fechaCierre: fechaExtra?.trim() || fechaFin.trim(),
      });
      continue;
    }

    const m7 = trimmed.match(boletasRegex);
    if (m7) {
      const [, prefijo, fecha] = m7;
      activities.push({
        nombre: `${prefijo ? prefijo.trim() + ' ' : ''}Entrega de boletas de calificaciones`.trim(),
        fechas: fecha.trim(),
        tipo: 'boletas',
        fechaInicio: fecha.trim(),
      });
      continue;
    }

    if (recuperacionRegex.test(trimmed)) {
      activities.push({ nombre: 'Recuperación ordinaria', tipo: 'recuperacion' });
      continue;
    }

    if (temariosRegex.test(trimmed)) {
      activities.push({ nombre: 'Entrega de temarios y pruebas objetivas a coordinación', tipo: 'temario' });
      continue;
    }
  }

  return activities;
}

/**
 * Extracts Academic Periods (Trimestres) with dates AND activities from text or table
 */
export function extractAcademicPeriodsFromText(text: string): AcademicPeriod[] | null {
  if (!text) return null;

  const periods: AcademicPeriod[] = [];

  // Pattern 1: "PRIMER PERIODO (19 enero – 20 marzo)" — Word-exported PDFs
  const periodNameMap: Record<string, string> = {
    'primer': 'I', 'segundo': 'II', 'tercer': 'III', 'cuarto': 'IV',
    '1': 'I', '2': 'II', '3': 'III', '4': 'IV',
  };
  const pdfPeriodRegex = /(?:PRIMER|SEGUNDO|TERCER(?:O)?|CUARTO)\s+PERIODO\s*\((\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]+)\s*[–\-]\s*(\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]+)\)/gi;
  let match;
  const periodMatches: { index: number; raw: string; inicio: string; fin: string; roman: string }[] = [];

  while ((match = pdfPeriodRegex.exec(text)) !== null) {
    const nombreRaw = match[0].split('(')[0].trim().toLowerCase();
    let roman = 'I';
    for (const [key, val] of Object.entries(periodNameMap)) {
      if (nombreRaw.startsWith(key)) { roman = val; break; }
    }
    periodMatches.push({
      index: match.index,
      raw: match[0],
      inicio: match[1]?.trim() || 'Por definir',
      fin: match[2]?.trim() || 'Por definir',
      roman,
    });
  }

  // Also detect Trimestres: "Trimestre I (20 enero-17 de abril)"
  const trimestreRegex = /Trimestre\s+(I{1,3}|IV|V?I{0,3})\s*\((\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]+)\s*[-–]\s*(\d{1,2}\s+(?:de\s+)?[a-záéíóúñ]+)\)/gi;
  const trimestreMatches: { index: number; raw: string; inicio: string; fin: string; roman: string }[] = [];

  while ((match = trimestreRegex.exec(text)) !== null) {
    const romanMap: Record<string, string> = { 'I': 'I', 'II': 'II', 'III': 'III' };
    const roman = romanMap[match[1]?.toUpperCase()] || match[1];
    trimestreMatches.push({
      index: match.index,
      raw: match[0],
      inicio: match[2]?.trim() || 'Por definir',
      fin: match[3]?.trim() || 'Por definir',
      roman,
    });
  }

  // Extract Trimestres if found
  if (periodMatches.length >= 2) {
    for (let i = 0; i < periodMatches.length; i++) {
      const pm = periodMatches[i];
      const nextIdx = i + 1 < periodMatches.length ? periodMatches[i + 1].index : 
                      trimestreMatches.length > 0 ? trimestreMatches[0].index : text.length;
      const activities = extractActivitiesFromText(text, pm.index + pm.raw.length, nextIdx);
      periods.push({
        nombre: `Trimestre ${pm.roman}`,
        inicio: pm.inicio,
        fin: pm.fin,
        tipo: 'Trimestre',
        ingresoTBoxFinal: 'Conforme a calendario',
        actividades: activities,
      });
    }
  }

  // Extract Trimestres if found (Educación Parvularia y Básica)
  if (trimestreMatches.length >= 2) {
    for (let i = 0; i < trimestreMatches.length; i++) {
      const tm = trimestreMatches[i];
      const nextIdx = i + 1 < trimestreMatches.length ? trimestreMatches[i + 1].index : text.length;
      const activities = extractActivitiesFromText(text, tm.index + tm.raw.length, nextIdx);
      periods.push({
        nombre: `Trimestre ${tm.roman} (Parvularia/Básica)`,
        inicio: tm.inicio,
        fin: tm.fin,
        tipo: 'Trimestre',
        ingresoTBoxFinal: 'Conforme a calendario',
        actividades: activities,
      });
    }
  }

  if (periods.length >= 2) return periods;

  // Pattern 2: "Bimestre I: 19 enero – 20 marzo" or "Periodo 1 (19 enero al 20 marzo)"
  const periodRegex = /(?:Bimestre|Periodo|Trimestre)\s*([1-4]|I|II|III|IV)\b[:\s\-–\.]+(?:del?\s+)?([0-9]{1,2}\s+(?:de\s+)?[A-Za-záéíóúñ]+)\s+(?:al?|hasta|-|–)\s+([0-9]{1,2}\s+(?:de\s+)?[A-Za-záéíóúñ]+)(?:.*?TBox[:\s]+([^\n\r,\.]+))?/gi;

  const periodMatches2: { index: number; rawNum: string; inicio: string; fin: string; tbox: string; roman: string }[] = [];

  while ((match = periodRegex.exec(text)) !== null) {
    const rawNum = match[1];
    const inicio = match[2]?.trim();
    const fin = match[3]?.trim();
    const tbox = match[4]?.trim();

    const numMap: { [key: string]: string } = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', i: 'I', ii: 'II', iii: 'III', iv: 'IV' };
    const roman = numMap[rawNum.toLowerCase()] || rawNum;

    periodMatches2.push({
      index: match.index,
      rawNum,
      inicio: inicio || 'Por definir',
      fin: fin || 'Por definir',
      tbox: tbox || 'Conforme a calendario',
      roman,
    });
  }

  if (periodMatches2.length >= 2) {
    for (let i = 0; i < periodMatches2.length; i++) {
      const pm = periodMatches2[i];
      const nextIdx = i + 1 < periodMatches2.length ? periodMatches2[i + 1].index : text.length;
      const activities = extractActivitiesFromText(text, pm.index + 100, nextIdx);

      periods.push({
        nombre: `Trimestre ${pm.roman}`,
        inicio: pm.inicio,
        fin: pm.fin,
        tipo: 'Trimestre',
        ingresoTBoxFinal: pm.tbox,
        actividades: activities,
      });
    }
    return periods;
  }

  return null;
}

/**
 * Parses free text for month tables (e.g. "Enero: 2 semanas, 10 días", or tabular text lines)
 */
export function extractMonthsFromFreeText(text: string): MonthStats[] | null {
  if (!text) return null;

  const foundMonths: { month: string; semanas: number; dias: number; desc: string }[] = [];

  SPANISH_MONTH_NAMES.forEach((mName) => {
    const reg = new RegExp(
      `(?:^|\\n|[\\|;,])\\s*${mName}\\b[^\\d\\n]*?(\\d{1,2})\\s*(?:sem|semanas|w)?[^\\d\\n]*?(\\d{1,2})\\s*(?:d[ií]as|d|days)?(?:[:\\-–\\|\\s]+([^\\n\\r]+))?`,
      'i'
    );
    const m = text.match(reg);
    if (m) {
      const sem = parseInt(m[1], 10);
      const dias = parseInt(m[2], 10);
      const desc = m[3]?.trim() || '';

      if (!isNaN(sem) && sem <= 6 && !isNaN(dias) && dias <= 31) {
        foundMonths.push({
          month: mName,
          semanas: sem,
          dias: dias,
          desc: desc.length > 5 ? desc : '',
        });
      }
    }
  });

  if (foundMonths.length >= 3) {
    const result = createEmpty12Months();
    foundMonths.forEach((fm) => {
      const idx = result.findIndex((rm) => rm.month === fm.month);
      if (idx !== -1) {
        result[idx].semanas = fm.semanas;
        result[idx].dias = fm.dias;
        if (fm.desc) result[idx].feriadosDesc = fm.desc;
      }
    });

    result.forEach((rm, idx) => {
      if (!rm.feriadosDesc && monthsData2026[idx]?.feriadosDesc) {
        rm.feriadosDesc = monthsData2026[idx].feriadosDesc;
      }
      rm.eventos = monthsData2026[idx]?.eventos || [];
    });

    return result;
  }

  return null;
}

/**
 * Parses an Excel (.xlsx, .xls, .csv) file using SheetJS (XLSX).
 * Uses multi-strategy column, cell, and horizontal/vertical grid recognizers.
 */
export async function parseExcelFile(file: File): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  let allText = '';
  let detectedMonths: MonthStats[] | null = null;
  let detectedPeriods: AcademicPeriod[] | null = null;

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];

    allText += `\n--- HOJA: ${sheetName} ---\n`;

    if (!jsonData || jsonData.length === 0) return;

    if (!detectedMonths) {
      detectedMonths = extractHorizontalMonthsFromGrid(jsonData) || extractVerticalMonthsFromGrid(jsonData);
      if (detectedMonths) {
        allText += `Detectados ${detectedMonths.length} meses de calendario.\n`;
      }
    }

    if (!detectedPeriods) {
      const sheetText = jsonData.map((r) => r.join(' ')).join('\n');
      detectedPeriods = extractAcademicPeriodsFromText(sheetText);
      if (detectedPeriods) {
        allText += `Detectados ${detectedPeriods.length} períodos académicos.\n`;
      }
    }
  });

  // If no months detected directly, calculate from periods
  let finalMonths = detectedMonths || null;
  if (!finalMonths && detectedPeriods && detectedPeriods.length > 0) {
    finalMonths = calculateMonthsFromPeriods(detectedPeriods);
  }
  if (!finalMonths) {
    finalMonths = monthsData2026;
  }
  const finalPeriods = detectedPeriods || academicPeriods2026;

  const detectedFields: string[] = [];
  if (detectedMonths) detectedFields.push(`${detectedMonths.length} Meses de Calendario Anual`);
  if (detectedPeriods) detectedFields.push(`${detectedPeriods.length} Períodos / Trimestres Identificados`);
  if (!detectedMonths && finalMonths && detectedPeriods) detectedFields.push('Semanas y días calculados desde períodos');

  const summary = {
    monthsCount: finalMonths.length,
    periodsCount: finalPeriods.length,
    detectedFields,
    rawLinesCount: allText.split('\n').length,
  };

  return {
    fileName: file.name,
    fileType: 'excel',
    fileSize: file.size,
    rawText: allText,
    months: finalMonths,
    periods: finalPeriods,
    summary,
  };
}

/**
 * Parses a Word (.docx / .doc) document using mammoth and analyzes curricular contents.
 */
export async function parseWordFile(file: File): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  let text = '';
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value || '';
  } catch (e) {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    text = decoder.decode(arrayBuffer);
  }

  return analyzeExtractedText(file.name, file.size, text, 'word');
}

/**
 * Parses a plain text or markdown file (.txt, .md, .csv).
 */
export async function parseTextFile(file: File): Promise<ParsedDocumentResult> {
  const text = await file.text();
  return analyzeExtractedText(file.name, file.size, text, 'text');
}

/**
 * Parses a PDF file using pdfjs-dist in the browser.
 * Simple extraction - let the text analyzer handle month assignment.
 */
export async function parsePdfFile(file: File): Promise<ParsedDocumentResult> {
  let fullText = '';
  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();

    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Group text items by Y position (same line) and sort by X (left to right)
      const linesByY: Record<number, { str: string; x: number }[]> = {};
      for (const item of textContent.items as any[]) {
        const y = Math.round(item.transform[5]);
        const x = item.transform[4];
        if (!linesByY[y]) linesByY[y] = [];
        linesByY[y].push({ str: item.str, x });
      }

      // Sort lines top-to-bottom (descending Y), items left-to-right
      const sortedYs = Object.keys(linesByY).map(Number).sort((a, b) => b - a);
      const pageLines = sortedYs.map(y => {
        const items = linesByY[y].sort((a, b) => a.x - b.x);
        return items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim();
      }).filter(line => line.length > 0);

      fullText += `\n--- PÁGINA ${i} ---\n` + pageLines.join('\n');
    }
  } catch (err: any) {
    console.warn('PDF parsing fallback:', err);
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(arrayBuffer);
    const matches = raw.match(/\(([^()]+)\)T[jJ]/g) || [];
    fullText = matches.map((m: string) => m.replace(/^\(|\)[tT][jJ]$/g, '')).join(' ');
  }

  return analyzeExtractedText(file.name, file.size, fullText, 'pdf');
}

/**
 * Parses JSON backup files or pasted text.
 */
export function parseJsonContent(text: string, fileName = 'documento.json', fileSize = 0): ParsedDocumentResult {
  let parsed: any = {};
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return {
      fileName,
      fileType: 'json',
      fileSize,
      rawText: text.substring(0, 3000),
      summary: {
        monthsCount: 0,
        periodsCount: 0,
        detectedFields: ['Error: JSON inválido'],
        rawLinesCount: text.split('\n').length,
      },
    };
  }

  const months = Array.isArray(parsed.months) ? parsed.months : undefined;
  const periods = Array.isArray(parsed.periods) ? parsed.periods : undefined;
  const perData = parsed.perData ? parsed.perData : undefined;
  const headerData = parsed.headerData || undefined;

  const finalMonths = months || monthsData2026;
  const finalPeriods = periods || academicPeriods2026;
  const finalPER = perData || null;

  const detectedFields: string[] = [];
  if (months && Array.isArray(months)) detectedFields.push(`${months.length} Meses y Calendario`);
  if (periods && Array.isArray(periods)) detectedFields.push(`${periods.length} Trimestres y Periodos`);
  if (perData) detectedFields.push('P.E.R. y Graduaciones');

  const summary = {
    monthsCount: finalMonths.length,
    periodsCount: finalPeriods.length,
    detectedFields,
    rawLinesCount: text.split('\n').length,
  };

  return {
    fileName,
    fileType: 'json',
    fileSize,
    rawText: text.substring(0, 3000),
    headerData,
    months: finalMonths,
    periods: finalPeriods,
    perData: finalPER,
    summary,
  };
}

/**
 * Extracts PER (Periodo Extraordinario de Recuperación) data from text
 */
function extractPERDataFromText(text: string): PERData | null {
  if (!text) return null;

  const lowerText = text.toLowerCase();
  
  // Check if text contains PER-related content (flexible)
  const hasPERContent = lowerText.includes('periodo extraordinario') || 
                        lowerText.includes('recuperación extraordinaria') ||
                        lowerText.includes('recuperacion extraordinaria') ||
                        lowerText.includes('p.e.r.') ||
                        lowerText.includes('prueba extraordinaria') ||
                        lowerText.includes('graduación');
  if (!hasPERContent) {
    return null;
  }

  const eventos: { detalle: string; tbox: string; fecha: string }[] = [];
  const graduaciones: { nivel: string; fecha: string }[] = [];

  // Extract PER events - multiple patterns
  // Pattern 1: "INICIO DEL PERIODO EXTRAORDINARIO DE RECUPERACIÓN 03 noviembre"
  const perEventRegex1 = /(inicio del periodo extraordinario|aplicación de pruebas extraordinarias|entrega de resultados|recuperación extraordinaria)[^.]*?(\d{1,2}\s*(?:de\s+)?(?:nov(?:iembre)?))/gi;
  let match;
  while ((match = perEventRegex1.exec(text)) !== null) {
    const detalle = match[1]?.trim() || '';
    const fecha = match[2]?.trim() || '';
    if (detalle && fecha) {
      eventos.push({ detalle: detalle.charAt(0).toUpperCase() + detalle.slice(1), tbox: 'Presencial', fecha });
    }
  }

  // Pattern 2: "03-05 nov" style dates with event descriptions
  const perEventRegex2 = /(\d{1,2}[-\d]*\s*(?:de\s+)?(?:nov(?:iembre)?))\s*[-–]\s*([^.\n]+)/gi;
  while ((match = perEventRegex2.exec(text)) !== null) {
    const fecha = match[1]?.trim() || '';
    const detalle = match[2]?.trim() || '';
    if (fecha && detalle && !eventos.some(e => e.fecha === fecha)) {
      eventos.push({ detalle: detalle.charAt(0).toUpperCase() + detalle.slice(1), tbox: 'Presencial', fecha });
    }
  }

  // Extract graduations - flexible patterns
  // "graduación de nivel medio - 20 de noviembre de 2026"
  const gradRegex1 = /(graduación\s+[^.\n]*?(?:medio|básico|preescolar|transición)[^.\n]*?)\s*[-–]\s*(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/gi;
  while ((match = gradRegex1.exec(text)) !== null) {
    const nivel = match[1]?.trim() || '';
    const fecha = match[2]?.trim() || '';
    if (nivel && fecha) {
      graduaciones.push({ nivel, fecha });
    }
  }

  // Pattern 2: just "Graduación" followed by date
  const gradRegex2 = /(graduación[^.\n]*?)(?:\s+)(\d{1,2}\s+de\s+[a-záéíóúñ]+\s+de\s+\d{4})/gi;
  while ((match = gradRegex2.exec(text)) !== null) {
    const nivel = match[1]?.trim() || '';
    const fecha = match[2]?.trim() || '';
    if (nivel && fecha && !graduaciones.some(g => g.fecha === fecha)) {
      graduaciones.push({ nivel, fecha });
    }
  }

  // If we found PER content, return the data
  if (eventos.length > 0 || graduaciones.length > 0) {
    return {
      nombre: 'Periodo Extraordinario de Recuperación (P.E.R.) 2026',
      eventos: eventos.length > 0 ? eventos : recuperacionExtraordinaria2026.eventos,
      graduaciones: graduaciones.length > 0 ? graduaciones : recuperacionExtraordinaria2026.graduaciones,
    };
  }

  // Fallback: return default PER data if PER content was detected but regex didn't match
  if (hasPERContent) {
    return recuperacionExtraordinaria2026;
  }

  return null;
}

/**
 * Extracts important dates from the "FECHAS IMPORTANTES A TOMAR EN CUENTA" section.
 * Handles 2-column PDF layout where month names and dates may be interleaved.
 * Returns events mapped to each month.
 */
function extractImportantDatesFromText(text: string): Record<string, SuspensionEvent[]> {
  const result: Record<string, SuspensionEvent[]> = {};
  if (!text) return result;

  const headerIdx = text.toLowerCase().indexOf('fechas importantes');
  if (headerIdx === -1) {
    console.log('[extractImportantDatesFromText] "fechas importantes" NOT FOUND in text');
    return result;
  }

  const section = text.substring(headerIdx);
  console.log('[extractImportantDatesFromText] Section length:', section.length);
  console.log('[extractImportantDatesFromText] Section preview:', section.substring(0, 1000));

  // The PDF has 2 columns. Month names appear in pairs on the same line:
  // "Enero Julio", "Febrero Agosto", "Abril Octubre", "Mayo Noviembre", "Junio Diciembre"
  // Events from both columns are interleaved on the same lines.

  // Find ALL month name positions
  const monthRegex = new RegExp(`\\b(${SPANISH_MONTH_NAMES.join('|')})\\b`, 'gi');
  const monthPositions: { month: string; pos: number }[] = [];
  let mm;
  while ((mm = monthRegex.exec(section)) !== null) {
    monthPositions.push({ month: mm[1].toLowerCase(), pos: mm.index });
  }
  console.log('[extractImportantDatesFromText] Month positions found:', monthPositions);
  if (monthPositions.length === 0) return result;

  // Find all date-event pairs
  const allEvents: { pos: number; dia: string; nombre: string }[] = [];

  // Range patterns: "04 al 08", "12-16", "30/31", "14/16"
  // Stop capture at next date pattern or line break
  const nextDatePattern = '(?:\\s*\\d{1,2}\\s*(?:al|[-–]|\\/)\\s*\\d{1,2}|\\s*\\d{1,2}\\s+[A-Za-záéíóúñ]|$)';
  const rangePatterns = [
    new RegExp(`(\\d{1,2})\\s+al\\s+(\\d{1,2})\\s+([A-Za-záéíóúñ][^\\n]{2,60}?)(?=${nextDatePattern})`, 'gi'),
    new RegExp(`(\\d{1,2})\\s*[-–]\\s*(\\d{1,2})\\s+([A-Za-záéíóúñ][^\\n]{2,60}?)(?=${nextDatePattern})`, 'gi'),
    new RegExp(`(\\d{1,2})\\s*\\/\\s*(\\d{1,2})\\s+([A-Za-záéíóúñ][^\\n]{2,60}?)(?=${nextDatePattern})`, 'gi'),
  ];

  for (const regex of rangePatterns) {
    let em;
    while ((em = regex.exec(section)) !== null) {
      const nombre = em[3].trim().replace(/\s+/g, ' ');
      if (SPANISH_MONTH_NAMES.includes(nombre.toLowerCase())) continue;
      if (nombre.length < 3) continue;
      allEvents.push({ pos: em.index, dia: `${em[1]} al ${em[2]}`, nombre });
    }
  }

  // Single date: "5 inicio de labores" — anywhere in text, not just start of line
  // Match: digit + space + letters (event name), stopping at next date pattern
  const singleDateRegex = new RegExp(`(\\d{1,2})\\s+([A-Za-záéíóúñ][a-záéíóúñ\\s]{2,50}?)(?=${nextDatePattern})`, 'gi');
  let sm;
  while ((sm = singleDateRegex.exec(section)) !== null) {
    const nombre = sm[2].trim().replace(/\s+/g, ' ');
    if (SPANISH_MONTH_NAMES.includes(nombre.toLowerCase())) continue;
    if (nombre.length < 3) continue;
    // Skip if already captured as part of a range
    const alreadyCaptured = allEvents.some(e => Math.abs(e.pos - sm.index) < 5);
    if (!alreadyCaptured) {
      allEvents.push({ pos: sm.index, dia: sm[1], nombre });
    }
  }
  console.log('[extractImportantDatesFromText] All events found:', allEvents.map(e => ({ dia: e.dia, nombre: e.nombre, pos: e.pos })));

  // 2-column PDF layout association:
  // The PDF has two vertical columns (fixed pairs):
  //   Col 1 (left):  Enero, Febrero, Marzo, Abril, Mayo, Junio
  //   Col 2 (right): Julio, Agosto, Septiembre, Octubre, Noviembre, Diciembre
  // Visual layout (rows top to bottom):
  // Row 1: Enero (left) | Julio (right)
  // Row 2: Febrero (left) | Agosto (right)
  // Row 3: Marzo (left) | Septiembre (right)
  // Row 4: Abril (left) | Octubre (right)
  // Row 5: Mayo (left) | Noviembre (right)
  // Row 6: Junio (left) | Diciembre (right)
  const FIXED_MONTH_PAIRS: { left: string; right: string }[] = [
    { left: 'enero', right: 'julio' },
    { left: 'febrero', right: 'agosto' },
    { left: 'marzo', right: 'septiembre' },
    { left: 'abril', right: 'octubre' },
    { left: 'mayo', right: 'noviembre' },
    { left: 'junio', right: 'diciembre' },
  ];

  // Find positions of all 12 months in text
  const monthPosMap = new Map<string, number>();
  for (const mp of monthPositions) {
    // Keep first occurrence of each month
    if (!monthPosMap.has(mp.month)) {
      monthPosMap.set(mp.month, mp.pos);
    }
  }
  console.log('[extractImportantDatesFromText] Month positions map:', Object.fromEntries(monthPosMap));
  console.log('[extractImportantDatesFromText] All monthPositions raw:', monthPositions.map(m => ({month: m.month, pos: m.pos})));

  // Build month pairs in FIXED VISUAL ORDER (not sorted by text position)
  const monthPairs: { left: string; right: string; leftPos: number; rightPos: number; mid: number; pos: number; visualRow: number }[] = [];
  
  for (let i = 0; i < FIXED_MONTH_PAIRS.length; i++) {
    const fixedPair = FIXED_MONTH_PAIRS[i];
    const leftPos = monthPosMap.get(fixedPair.left);
    const rightPos = monthPosMap.get(fixedPair.right);
    
    if (leftPos !== undefined && rightPos !== undefined) {
      // Both found - use visual row index for ordering, not text position
      monthPairs.push({
        left: fixedPair.left,
        right: fixedPair.right,
        leftPos,
        rightPos,
        mid: (leftPos + rightPos) / 2,
        pos: leftPos, // anchor
        visualRow: i, // 0=top row (Enero/Julio), 5=bottom row (Junio/Diciembre)
      });
    } else if (leftPos !== undefined) {
      monthPairs.push({
        left: fixedPair.left,
        right: '',
        leftPos,
        rightPos: leftPos,
        mid: leftPos,
        pos: leftPos,
        visualRow: i,
      });
    } else if (rightPos !== undefined) {
      monthPairs.push({
        left: '',
        right: fixedPair.right,
        leftPos: rightPos,
        rightPos,
        mid: rightPos,
        pos: rightPos,
        visualRow: i,
      });
    }
  }

  // Sort by VISUAL ROW ORDER (top to bottom), not by text position
  monthPairs.sort((a, b) => a.visualRow - b.visualRow);
  console.log('[extractImportantDatesFromText] Month pairs (visual row order):', monthPairs.map(p => ({ left: p.left, right: p.right, leftPos: p.leftPos, rightPos: p.rightPos, visualRow: p.visualRow })));

  // Associate events: assign by VISUAL ROW SECTIONS, then sort by date within each month
  // Visual rows: 0=Enero/Julio, 1=Febrero/Agosto, 2=Marzo/Septiembre, 3=Abril/Octubre, 4=Mayo/Noviembre, 5=Junio/Diciembre
  const pairMidpoints = monthPairs.map(p => p.mid);

  for (const ev of allEvents) {
    let bestMonth = '';
    let bestDist = Infinity;

    // Find which visual row section this event falls into
    for (let i = 0; i < monthPairs.length; i++) {
      const pair = monthPairs[i];
      const sectionStart = i === 0 ? -Infinity : (pairMidpoints[i - 1] + pair.mid) / 2;
      const sectionEnd = (pair.mid + (pairMidpoints[i + 1] ?? Infinity)) / 2;
      
      if (ev.pos >= sectionStart && ev.pos < sectionEnd) {
        // Event is in this visual row - assign to left or right month by proximity
        if (pair.right && pair.left) {
          const distToLeft = Math.abs(ev.pos - pair.leftPos);
          const distToRight = Math.abs(ev.pos - pair.rightPos);
          bestMonth = distToLeft <= distToRight ? pair.left : pair.right;
        } else if (pair.left) {
          bestMonth = pair.left;
        } else if (pair.right) {
          bestMonth = pair.right;
        }
        break;
      }
    }

    // Fallback: nearest month overall
    if (!bestMonth) {
      for (const [month, pos] of monthPosMap) {
        const dist = Math.abs(ev.pos - pos);
        if (dist < bestDist) {
          bestDist = dist;
          bestMonth = month;
        }
      }
    }

    if (!bestMonth) continue;

    const tipo = inferCategoryFromText(ev.nombre);
    const id = `${bestMonth}-${ev.dia}-${ev.nombre.replace(/\s+/g, '-').substring(0, 30)}`;
    const evento: SuspensionEvent = { id, dia: ev.dia, mes: bestMonth, actividad: ev.nombre, tipo };

    if (!result[bestMonth]) result[bestMonth] = [];
    if (!result[bestMonth].some(e => e.actividad === ev.nombre && e.dia === ev.dia)) {
      result[bestMonth].push(evento);
    }
  }

  // Sort events within each month by date (ascending)
  const monthOrder = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  function parseDiaForSort(diaStr: string): number {
    // Extract first number from dia string like "5", "04 al 08", "12-16", "30/31"
    const match = diaStr.match(/(\d{1,2})/);
    return match ? parseInt(match[1], 10) : 99;
  }

  for (const month of monthOrder) {
    const events = result[month];
    if (events && events.length > 0) {
      events.sort((a, b) => parseDiaForSort(a.dia) - parseDiaForSort(b.dia));
    }
  }

  console.log('[extractImportantDatesFromText] Final result (sorted by month & date):', Object.fromEntries(Object.entries(result).map(([k, v]) => [k, v.map(e => `${e.dia} ${e.actividad}`)])));
  return result;
}

/**
 * High-tolerance NLP / Regex analyzer for arbitrary text, Word, PDF, or pasted clipboard content.
 * Focused on calendar extraction (months, periods) for the admin institutional calendar.
 */
export function analyzeExtractedText(
  fileName: string,
  fileSize: number,
  rawText: string,
  fileType: 'pdf' | 'excel' | 'word' | 'json' | 'text'
): ParsedDocumentResult {
  const detectedFields: string[] = [];

  const detectedMonths = extractMonthsFromFreeText(rawText);
  if (detectedMonths) {
    detectedFields.push('12 Meses de Calendario Anual Detectados');
  }

  const detectedPeriods = extractAcademicPeriodsFromText(rawText);
  if (detectedPeriods) {
    detectedFields.push(`${detectedPeriods.length} Períodos / Trimestres Identificados`);
  }

  const detectedPER = extractPERDataFromText(rawText);
  if (detectedPER) {
    detectedFields.push('P.E.R. y Graduaciones Detectados');
  }

  // If no months detected directly, calculate from periods
  let finalMonths = detectedMonths || null;
  if (!finalMonths && detectedPeriods && detectedPeriods.length > 0) {
    finalMonths = calculateMonthsFromPeriods(detectedPeriods);
    detectedFields.push('Semanas y días calculados desde períodos');
  }
  if (!finalMonths) {
    finalMonths = monthsData2026;
  }

  // Extract important dates from "FECHAS IMPORTANTES" section and apply to months
  const importantDates = extractImportantDatesFromText(rawText);
  const importantDateMonths = Object.keys(importantDates);
  if (importantDateMonths.length > 0) {
    detectedFields.push(`${importantDateMonths.reduce((sum, m) => sum + importantDates[m].length, 0)} Fechas Importantes detectadas`);
    for (const month of finalMonths) {
      const events = importantDates[month.month];
      if (events && events.length > 0) {
        month.eventos = [...(month.eventos || []), ...events];
      }
    }
  }

  const finalPeriods = detectedPeriods || academicPeriods2026;
  const finalPER = detectedPER || null;

  return {
    fileName,
    fileType,
    fileSize,
    rawText,
    months: finalMonths,
    periods: finalPeriods,
    perData: finalPER,
    summary: {
      monthsCount: finalMonths.length,
      periodsCount: finalPeriods.length,
      detectedFields,
      rawLinesCount: rawText.split('\n').length,
    },
  };
}

/**
 * Generates an Excel template with the official institutional calendar structure.
 * 2 sheets: Periodos_Evaluaciones_2026, Calendario_Dias_Habiles
 */
export function generateExcelTemplateWorkbook(
  months: MonthStats[],
  periods: AcademicPeriod[] = academicPeriods2026
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Periodos y Evaluaciones (Trimestres con TBox y fechas oficiales)
  const periodRows: any[] = [];
  periodRows.push([
    'Trimestre / Periodo',
    'Fecha Inicio',
    'Fecha Fin',
    'Semanas',
    'Subida Notas TBox',
    'Entrega de Boletas',
    'Eventos y Actividades Clave',
  ]);

  periods.forEach((p) => {
    periodRows.push([
      p.nombre,
      p.inicio,
      p.fin,
      p.ingresoTBoxFinal || 'Conforme a calendario',
      p.entregaBoletas || 'Por definir',
      p.actividades.map((a) => `${a.nombre} (${a.fechas || a.fechaInicio || ''})`).join('; '),
    ]);
  });

  const wsPeriods = XLSX.utils.aoa_to_sheet(periodRows);
  XLSX.utils.book_append_sheet(wb, wsPeriods, 'Periodos_Evaluaciones_2026');

  // Hoja 2: Calendario y Días Hábiles (Mes por mes)
  const calendarRows: any[] = [];
  calendarRows.push(['Mes', 'Semanas Hábiles', 'Días Hábiles', 'Feriados y Descansos Institucionales']);

  months.forEach((m) => {
    calendarRows.push([m.name, m.semanas, m.dias, m.feriadosDesc || 'Días hábiles regulares']);
  });

  const wsCalendar = XLSX.utils.aoa_to_sheet(calendarRows);
  XLSX.utils.book_append_sheet(wb, wsCalendar, 'Calendario_Dias_Habiles');

  return wb;
}
