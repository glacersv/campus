// Persistencia del Calendario Institucional en Firestore
// Collection: institutional_calendar
// Document ID: {year} (ej: "2026")

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { MonthStats, AcademicPeriod, SuspensionEvent } from '../types';

const CALENDAR_COLLECTION = 'institutional_calendar';

export interface InstitutionalCalendarData {
  year: string;
  institution: string;
  months: MonthStats[];
  periodsBasica: AcademicPeriod[];
  periodsMedia: AcademicPeriod[];
  perData?: {
    nombre: string;
    eventos: any[];
    graduaciones: any[];
  };
  updatedAt?: any;
  createdAt?: any;
}

/**
 * Guarda o actualiza el calendario institucional completo en Firestore
 */
export async function saveInstitutionalCalendar(data: InstitutionalCalendarData): Promise<void> {
  const ref = doc(db, CALENDAR_COLLECTION, data.year);
  const existing = await getDoc(ref);

  if (existing.exists()) {
    await updateDoc(ref, {
      months: data.months,
      periodsBasica: data.periodsBasica,
      periodsMedia: data.periodsMedia,
      perData: data.perData || null,
      institution: data.institution,
      updatedAt: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      year: data.year,
      institution: data.institution,
      months: data.months,
      periodsBasica: data.periodsBasica,
      periodsMedia: data.periodsMedia,
      perData: data.perData || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

/**
 * Obtiene el calendario institucional desde Firestore
 * Retorna null si no existe
 */
export async function getInstitutionalCalendar(year: string): Promise<InstitutionalCalendarData | null> {
  const ref = doc(db, CALENDAR_COLLECTION, year);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    year: data.year,
    institution: data.institution,
    months: data.months || [],
    periodsBasica: data.periodsBasica || [],
    periodsMedia: data.periodsMedia || [],
    perData: data.perData || null,
  };
}

/**
 * Obtiene solo las suspensiones/asuetos del calendario
 * Útil para el cronograma del docente
 */
export async function getCalendarSuspensions(year: string): Promise<MonthStats[]> {
  const calendar = await getInstitutionalCalendar(year);
  return calendar?.months || [];
}

/**
 * Obtiene los períodos académicos de Educación Media (Bimestres)
 * Útil para calcular ventanas de tiempo por módulo
 */
export async function getMediaPeriods(year: string): Promise<AcademicPeriod[]> {
  const calendar = await getInstitutionalCalendar(year);
  return calendar?.periodsMedia || [];
}

/**
 * Verifica si existe un calendario para el año dado
 */
export async function calendarExists(year: string): Promise<boolean> {
  const ref = doc(db, CALENDAR_COLLECTION, year);
  const snap = await getDoc(ref);
  return snap.exists();
}
