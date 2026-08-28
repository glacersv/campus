import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { MonthStats, AcademicPeriod } from '../types';
import { academicPeriods2026, monthsData2026 } from '../data/calendarData';

// Set up pdfjs-dist safely with multiple fallback workers
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    if (pdfjsLib.GlobalWorkerOptions) {
      const version = pdfjsLib.version || '4.0.379';
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
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
 * Extracts Academic Periods (Bimestres / Trimestres) with dates from text or table
 */
export function extractAcademicPeriodsFromText(text: string): AcademicPeriod[] | null {
  if (!text) return null;

  const periods: AcademicPeriod[] = [];
  const periodRegex = /(?:Bimestre|Periodo|Trimestre)\s*([1-4]|I|II|III|IV)\b[:\s\-–\.]+(?:del?\s+)?([0-9]{1,2}\s+(?:de\s+)?[A-Za-z]+)\s+(?:al?|hasta|-|–)\s+([0-9]{1,2}\s+(?:de\s+)?[A-Za-z]+)(?:.*?TBox[:\s]+([^\n\r,\.]+))?/gi;

  let match;
  while ((match = periodRegex.exec(text)) !== null) {
    const rawNum = match[1];
    const inicio = match[2]?.trim();
    const fin = match[3]?.trim();
    const tbox = match[4]?.trim();

    const numMap: { [key: string]: string } = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', i: 'I', ii: 'II', iii: 'III', iv: 'IV' };
    const roman = numMap[rawNum.toLowerCase()] || rawNum;

    periods.push({
      nombre: `Bimestre ${roman}`,
      inicio: inicio || 'Por definir',
      fin: fin || 'Por definir',
      tipo: 'Bimestre',
      ingresoTBoxFinal: tbox || 'Conforme a calendario',
      actividades: [],
    });
  }

  if (periods.length >= 2) {
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

  const finalMonths = detectedMonths || monthsData2026;
  const finalPeriods = detectedPeriods || academicPeriods2026;

  const detectedFields: string[] = [];
  if (detectedMonths) detectedFields.push(`${detectedMonths.length} Meses de Calendario Anual`);
  if (detectedPeriods) detectedFields.push(`${detectedPeriods.length} Períodos / Bimestres Identificados`);

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
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n--- PÁGINA ${i} ---\n` + pageText;
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
  const headerData = parsed.headerData || undefined;

  const finalMonths = months || monthsData2026;
  const finalPeriods = periods || academicPeriods2026;

  const detectedFields: string[] = [];
  if (months && Array.isArray(months)) detectedFields.push(`${months.length} Meses y Calendario`);
  if (periods && Array.isArray(periods)) detectedFields.push(`${periods.length} Bimestres y Periodos`);

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
    summary,
  };
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
    detectedFields.push(`${detectedPeriods.length} Períodos / Bimestres Identificados`);
  }

  const finalMonths = detectedMonths || monthsData2026;
  const finalPeriods = detectedPeriods || academicPeriods2026;

  return {
    fileName,
    fileType,
    fileSize,
    rawText,
    months: finalMonths,
    periods: finalPeriods,
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

  // Hoja 1: Periodos y Evaluaciones (Bimestres con TBox y fechas oficiales)
  const periodRows: any[] = [];
  periodRows.push([
    'Bimestre / Periodo',
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
