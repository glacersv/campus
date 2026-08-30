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

export const academicPeriods2026: AcademicPeriod[] = [
  {
    nombre: 'Primer Periodo (Trimestre I)',
    inicio: '19 enero',
    fin: '20 marzo',
    tipo: 'Trimestre',
    entregaBoletas: '08 de abril',
    entregaTemarios: '23 feb – 02 mar',
    recuperacionOrdinaria: '23 mar – 27 mar',
    pruebaExtraordinaria: '23 mar – 27 mar',
    actividades: [
      { nombre: '01. Actividad Formativa - 35%', fechas: '19 ene – 13 feb', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '02. Pruebas Objetivas: materias básicas - 30%', fechaInicio: '16 mar', fechaCierre: '20 mar', porcentaje: '30%', tipo: 'objetiva', ingresoTBox: '20 febrero' },
      { nombre: '03. Actividad Sumativa - 35%', fechas: '26 feb – 13 mar', porcentaje: '35%', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Segundo Periodo (Trimestre II)',
    inicio: '08 junio',
    fin: '31 julio',
    tipo: 'Trimestre',
    entregaBoletas: '19 de junio',
    entregaTemarios: '11-18 may',
    recuperacionOrdinaria: '08-12 jun',
    pruebaExtraordinaria: '08-12 jun',
    actividades: [
      { nombre: '04. Actividad Formativa - 35%', fechas: '08 jun – 03 jul', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '05. Pruebas Objetivas: materias básicas - 30%', fechaInicio: '01 jun', fechaCierre: '05 jun', porcentaje: '30%', tipo: 'objetiva', ingresoTBox: '05 jul' },
      { nombre: '06. Actividad Sumativa - 35%', fechas: '16 jun – 10 jul', porcentaje: '35%', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Tercer Periodo (Trimestre III)',
    inicio: '17 agosto',
    fin: '10 septiembre',
    tipo: 'Trimestre',
    entregaBoletas: '31 de agosto',
    entregaTemarios: '13-27 jul',
    recuperacionOrdinaria: '18-20 ago',
    pruebaExtraordinaria: '18 ago',
    actividades: [
      { nombre: '07. Actividad Formativa - 35%', fechas: '17 ago – 04 sep', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '08. Pruebas Objetivas: materias básicas - 30%', fechaInicio: '10 ago', fechaCierre: '13 ago', porcentaje: '30%', tipo: 'objetiva', ingresoTBox: '20 ago' },
      { nombre: '09. Actividad Sumativa - 35%', fechas: '14 ago – 04 sep', porcentaje: '35%', tipo: 'formativa' },
    ],
  },
  {
    nombre: 'Cuarto Periodo (Trimestre IV)',
    inicio: '17 agosto',
    fin: '16 octubre',
    tipo: 'Trimestre',
    entregaBoletas: '29 de octubre',
    entregaTemarios: '14-28 sep',
    recuperacionOrdinaria: '19-21 oct',
    pruebaExtraordinaria: '19 oct',
    actividades: [
      { nombre: '10. Actividad Formativa - 35%', fechas: '07 sep – 02 oct', porcentaje: '35%', tipo: 'formativa' },
      { nombre: '11. Pruebas Objetivas: materias básicas - 30%', fechaInicio: '12 oct', fechaCierre: '16 oct', porcentaje: '30%', tipo: 'objetiva', ingresoTBox: '21 oct' },
      { nombre: '12. Actividad Sumativa - 35%', fechas: '05 oct – 16 oct', porcentaje: '35%', tipo: 'formativa' },
    ],
  },
];

export const recuperacionExtraordinaria2026 = {
  nombre: 'Periodo Extraordinario de Recuperación (P.E.R.) 2026',
  eventos: [
    { detalle: 'Inicio de recuperación interna (nivelación Art. 89° de la Ley General de Educación)', tbox: 'Presencial', fecha: '03-05 nov' },
    { detalle: 'Aplicación de pruebas finales P.E.R. (40% Guía de Estudio + 60% Prueba Final Temario)', tbox: 'Presencial', fecha: '06 nov' },
    { detalle: 'Entrega de resultados del P.E.R. a padres de familia', tbox: 'Presencial', fecha: '11 nov' },
    { detalle: 'Prueba extraordinaria oficial MINEDUCYT (Art. 90°) para casos no resueltos', tbox: 'TBox (En línea)', fecha: '13-17 nov' },
  ],
  graduaciones: [
    { nivel: 'Graduación Educación Parvularia (6 años)', fecha: '01 de diciembre 2026 — 8:00 a.m. (Mañana)' },
    { nivel: 'Graduación Bachillerato / Educación Media', fecha: '02 de diciembre 2026 — 3:00 p.m. (Tarde)' },
  ],
};
