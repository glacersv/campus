import { MonthStats, AcademicPeriod } from '../types';

export const monthsData2026: MonthStats[] = [
  { month: 'enero', name: 'Enero', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'febrero', name: 'Febrero', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'marzo', name: 'Marzo', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'abril', name: 'Abril', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'mayo', name: 'Mayo', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'junio', name: 'Junio', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'julio', name: 'Julio', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'agosto', name: 'Agosto', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'septiembre', name: 'Septiembre', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'octubre', name: 'Octubre', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'noviembre', name: 'Noviembre', semanas: 0, dias: 0, feriadosDesc: '' },
  { month: 'diciembre', name: 'Diciembre', semanas: 0, dias: 0, feriadosDesc: '' },
];

/**
 * CALENDARIO ACADÉMICO 2026 — Educación Parvularia y Educación Básica
 * Distribución: 3 Trimestres (Página 2 del documento oficial)
 */
export const academicPeriodsBasica2026: AcademicPeriod[] = [
  {
    nombre: 'Trimestre I',
    inicio: '20 enero',
    fin: '17 abril',
    tipo: 'Trimestre',
    nivel: 'basica',
    entregaBoletas: '08 mayo (K4 - 9°)',
    entregaTemarios: '18 marzo – 23 marzo',
    recuperacionOrdinaria: '20 abril – 24 abril',
    pruebaExtraordinaria: '20 abril – 24 abril',
    actividades: [
      { nombre: '*Pruebas diagnósticas', fechaInicio: '19 enero', fechaCierre: '23 enero', ingresoTBox: '------------', tipo: 'diagnostica' },
      { nombre: '01. Actividad – 35%', fechaInicio: '19 enero', fechaCierre: '26 febrero', ingresoTBox: '5 marzo', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '02. Actividad – 35%', fechaInicio: '27 febrero', fechaCierre: '26 marzo', ingresoTBox: '6 abril', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '6 abril', fechaCierre: '10 abril', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°1 - 30%', fechaInicio: '13 abril', fechaCierre: '17 abril', ingresoTBox: '24 abril', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '20 abril', fechaCierre: '24 abril', ingresoTBox: '24 abril', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '20 abril', fechaCierre: '22 abril', ingresoTBox: '29 abril', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Trimestre II',
    inicio: '20 abril',
    fin: '23 julio',
    tipo: 'Trimestre',
    nivel: 'basica',
    entregaBoletas: '10 agosto (K4 - 9°)',
    entregaTemarios: '19 de junio – 26 junio',
    recuperacionOrdinaria: '27 julio – 30 julio',
    pruebaExtraordinaria: '27 julio – 30 julio',
    actividades: [
      { nombre: '03. Actividad – 35%', fechaInicio: '20 abril', fechaCierre: '29 mayo', ingresoTBox: '5 junio', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Entrega de ficha de proyectos (de docentes a estudiantes)', fechaInicio: '1 de junio', fechaCierre: '1 de junio', ingresoTBox: '------------', tipo: 'formativa' },
      { nombre: '04. Actividad – 35%', fechaInicio: '1 junio', fechaCierre: '10 julio', ingresoTBox: '17 julio', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Recepción de ficha de proyectos', fechaInicio: '8 junio', fechaCierre: '15 junio', ingresoTBox: '------------', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '13 julio', fechaCierre: '17 julio', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°2 - 30%', fechaInicio: '20 julio', fechaCierre: '23 julio', ingresoTBox: '30 julio', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '27 julio', fechaCierre: '30 julio', ingresoTBox: '30 julio', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '27 julio', fechaCierre: '29 julio', ingresoTBox: '4 agosto', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Trimestre III',
    inicio: '27 julio',
    fin: '16 octubre',
    tipo: 'Trimestre',
    nivel: 'basica',
    entregaBoletas: '29 de octubre (K4° - 9°)',
    entregaTemarios: '14 septiembre – 28 septiembre',
    recuperacionOrdinaria: '19 octubre – 23 octubre',
    pruebaExtraordinaria: '19 octubre – 23 octubre',
    actividades: [
      { nombre: '05. Actividad – 35%', fechaInicio: '27 julio', fechaCierre: '27 agosto', ingresoTBox: '3 septiembre', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Semana de la juventud', fechaInicio: '10 agosto', fechaCierre: '14 agosto', ingresoTBox: '------------', tipo: 'formativa' },
      { nombre: '06. Actividad – 35%', fechaInicio: '31 agosto', fechaCierre: '02 octubre', ingresoTBox: '9 octubre', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '5 octubre', fechaCierre: '09 octubre', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°3 - 30%', fechaInicio: '12 octubre', fechaCierre: '16 octubre', ingresoTBox: '23 octubre', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '19 octubre', fechaCierre: '23 octubre', ingresoTBox: '23 octubre', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '19 octubre', fechaCierre: '21 octubre', ingresoTBox: '26 octubre', tipo: 'formativa' },
    ],
  },
];

/**
 * CALENDARIO ACADÉMICO 2026 — Educación Media
 * Distribución: 4 Periodos (Bimestres) (Página 1 del documento oficial)
 */
export const academicPeriodsMedia2026: AcademicPeriod[] = [
  {
    nombre: 'Primer Periodo (Bimestre I)',
    inicio: '19 enero',
    fin: '20 marzo',
    tipo: 'Bimestre',
    nivel: 'media',
    entregaBoletas: '08 abril',
    entregaTemarios: '23 febrero – 02 marzo',
    recuperacionOrdinaria: '23 marzo – 27 marzo',
    pruebaExtraordinaria: '23 marzo – 27 marzo',
    actividades: [
      { nombre: '*Pruebas diagnósticas', fechaInicio: '19 enero', fechaCierre: '23 enero', ingresoTBox: '------------', tipo: 'diagnostica' },
      { nombre: '01. Actividad – 35%', fechaInicio: '19 enero', fechaCierre: '13 febrero', ingresoTBox: '20 febrero', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '02. Actividad – 35%', fechaInicio: '16 febrero', fechaCierre: '6 marzo', ingresoTBox: '13 marzo', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '9 marzo', fechaCierre: '13 marzo', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°1 - 30%', fechaInicio: '16 marzo', fechaCierre: '20 marzo', ingresoTBox: '27 marzo', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '23 marzo', fechaCierre: '27 marzo', ingresoTBox: '27 marzo', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '23 marzo', fechaCierre: '25 marzo', ingresoTBox: '1 abril', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Segundo Periodo (Bimestre II)',
    inicio: '24 marzo',
    fin: '05 junio',
    tipo: 'Bimestre',
    nivel: 'media',
    entregaBoletas: '19 junio',
    entregaTemarios: '11 mayo – 18 mayo',
    recuperacionOrdinaria: '8 junio – 12 junio',
    pruebaExtraordinaria: '8 junio – 12 junio',
    actividades: [
      { nombre: '03. Actividad – 35%', fechaInicio: '23 marzo', fechaCierre: '24 abril', ingresoTBox: '4 mayo', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '04. Actividad – 35%', fechaInicio: '27 abril', fechaCierre: '22 mayo', ingresoTBox: '29 mayo', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '25 mayo', fechaCierre: '29 mayo', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°2 - 30%', fechaInicio: '1 junio', fechaCierre: '5 junio', ingresoTBox: '12 junio', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '8 junio', fechaCierre: '12 junio', ingresoTBox: '12 junio', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '8 junio', fechaCierre: '10 junio', ingresoTBox: '15 junio', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Tercer Periodo (Bimestre III)',
    inicio: '08 junio',
    fin: '14 agosto',
    tipo: 'Bimestre',
    nivel: 'media',
    entregaBoletas: '31 agosto',
    entregaTemarios: '13 julio – 27 julio',
    recuperacionOrdinaria: '18 agosto – 20 agosto',
    pruebaExtraordinaria: '18 agosto – 20 agosto',
    actividades: [
      { nombre: 'Entrega de ficha de proyectos (de docentes a estudiantes)', fechaInicio: '1 de junio', fechaCierre: '1 de junio', ingresoTBox: '------------', tipo: 'formativa' },
      { nombre: '05. Actividad – 35%', fechaInicio: '8 junio', fechaCierre: '30 junio', ingresoTBox: '7 julio', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Recepción de ficha de proyectos', fechaInicio: '8 junio', fechaCierre: '15 junio', ingresoTBox: '------------', tipo: 'formativa' },
      { nombre: '06. Actividad – 35%', fechaInicio: '1 julio', fechaCierre: '23 julio', ingresoTBox: '30 julio', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '27 julio', fechaCierre: '31 julio', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°3-30%(Juventud)', fechaInicio: '10 agosto', fechaCierre: '13 agosto', ingresoTBox: '20 agosto', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '18 agosto', fechaCierre: '20 agosto', ingresoTBox: '20 agosto', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '18 agosto', fechaCierre: '20 agosto', ingresoTBox: '26 agosto', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Cuarto Periodo (Bimestre IV)',
    inicio: '17 agosto',
    fin: '16 octubre',
    tipo: 'Bimestre',
    nivel: 'media',
    entregaBoletas: '29 octubre',
    entregaTemarios: '14 septiembre – 28 septiembre',
    recuperacionOrdinaria: '19 octubre – 23 octubre',
    pruebaExtraordinaria: '19 octubre – 23 octubre',
    actividades: [
      { nombre: '07. Actividad – 35%', fechaInicio: '17 agosto', fechaCierre: '11 septiembre', ingresoTBox: '18 septiembre', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '08. Actividad – 35%', fechaInicio: '14 septiembre', fechaCierre: '2 octubre', ingresoTBox: '9 octubre', porcentaje: '35%', tipo: 'formativa' },
      { nombre: 'Refuerzo académico: materias básicas y PO Formativas', fechaInicio: '5 octubre', fechaCierre: '9 octubre', ingresoTBox: '------------', tipo: 'refuerzo' },
      { nombre: 'Pruebas Objetivas: materias básicas, ordinaria N°4 - 30%', fechaInicio: '12 octubre', fechaCierre: '16 octubre', ingresoTBox: '23 octubre', porcentaje: '30%', tipo: 'objetiva' },
      { nombre: 'Prueba extraordinaria', fechaInicio: '19 octubre', fechaCierre: '23 octubre', ingresoTBox: '23 octubre', tipo: 'recuperacion' },
      { nombre: 'Entrega de actividades pendientes', fechaInicio: '19 octubre', fechaCierre: '21 octubre', ingresoTBox: '26 octubre', tipo: 'formativa' },
    ],
  },
];

/** Alias por compatibilidad */
export const academicPeriods2026: AcademicPeriod[] = academicPeriodsMedia2026;

export const recuperacionExtraordinaria2026 = {
  nombre: 'Periodo Extraordinario de Recuperación (P.E.R.) 2026',
  eventos: [
    { detalle: 'Inicio de recuperación interna (nivelación Art. 89° Reglamento CSSJ)', tbox: 'Registro interno cuadros Excel', fecha: '03 - 05 noviembre' },
    { detalle: 'Aplicación de pruebas finales (P.E.R.) Art. 90° Reglamento CSSJ / MINEDUCYT', tbox: 'Presencial (CSSJ)', fecha: '06 noviembre' },
    { detalle: 'Entrega de resultados (P.E.R.) a padres de familia y envío a Registro Académico', tbox: 'Registro Académico', fecha: '11 noviembre' },
    { detalle: 'Clausura del año escolar 2026', tbox: 'Acto institucional', fecha: '13 noviembre' },
  ],
  graduaciones: [
    { nivel: 'Graduación Educación Parvularia (6 años)', fecha: 'Martes 01 de diciembre 2026 — Mañana' },
    { nivel: 'Graduación Bachillerato / Educación Media', fecha: 'Miércoles 02 de diciembre 2026 — Tarde' },
  ],
};
