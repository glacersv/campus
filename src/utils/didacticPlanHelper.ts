import { ModuleDescriptor, InstitutionalHeader, DidacticPlan, DidacticEvaluationActivity, EtapaAccionCompletaInfo, LMSModule } from '../types';
import { saveAs } from 'file-saver';
import { formatDateSpanish, StageJornalizacionItem } from './jornalizacionHelper';

export function getMonthNumber(monthName: string): string {
  const clean = monthName.toLowerCase().trim();
  const map: Record<string, string> = {
    enero: '01',
    febrero: '02',
    marzo: '03',
    abril: '04',
    mayo: '05',
    junio: '06',
    julio: '07',
    agosto: '08',
    septiembre: '09',
    setiembre: '09',
    octubre: '10',
    noviembre: '11',
    diciembre: '12',
  };
  return map[clean] || '01';
}

export function formatModuleDateRange(module: ModuleDescriptor, anoLectivo: string): string {
  const mStart = getMonthNumber(module.mesInicio || 'enero');
  const dStart = String(module.diaInicio || 1).padStart(2, '0');
  const mEnd = getMonthNumber(module.mesFin || module.mesInicio || 'enero');
  const dEnd = String(module.diaFin || 20).padStart(2, '0');
  const year = anoLectivo || '2026';

  return `${dStart}/${mStart}/${year} - ${dEnd}/${mEnd}/${year}`;
}

export function getModuleStagesAccionCompleta(
  module?: ModuleDescriptor,
  internalWeightPreset: 'standard' | 'execution_heavy' = 'standard'
): EtapaAccionCompletaInfo[] {
  const duracion = module?.duracionHoras || 72;
  const modNombre = module?.nombre || 'Diseño Gráfico';
  const modCode = module?.codigo || 'BTVDG';

  const h1 = Math.max(1, Math.round(duracion * 0.10));
  const h2 = Math.max(1, Math.round(duracion * 0.10));
  const h3 = Math.max(1, Math.round(duracion * 0.10));
  const h4 = Math.max(2, Math.round(duracion * 0.40));
  const h5 = Math.max(1, Math.round(duracion * 0.15));
  const h6 = Math.max(1, duracion - (h1 + h2 + h3 + h4 + h5));

  const isExecutionHeavy = internalWeightPreset === 'execution_heavy';

  const w1_internal = isExecutionHeavy ? 35 : 40;
  const w2_internal = isExecutionHeavy ? 65 : 60;
  const w1_global = Math.round((w1_internal * 25) / 100);
  const w2_global = 25 - w1_global;

  const w3_internal = isExecutionHeavy ? 30 : 30;
  const w4_internal = isExecutionHeavy ? 70 : 70;
  const w3_global = Math.round((w3_internal * 50) / 100);
  const w4_global = 50 - w3_global;

  const w5_internal = isExecutionHeavy ? 35 : 40;
  const w6_internal = isExecutionHeavy ? 65 : 60;
  const w5_global = Math.round((w5_internal * 25) / 100);
  const w6_global = 25 - w5_global;

  const isOrientacion = modCode.includes('.0') || modNombre.toLowerCase().includes('orientación');
  const isEnglish = modNombre.toLowerCase().includes('inglés') || modNombre.toLowerCase().includes('english');
  const isEditorial = modNombre.toLowerCase().includes('editorial') || modNombre.toLowerCase().includes('publicación');
  const is3D = modNombre.toLowerCase().includes('3d') || modNombre.toLowerCase().includes('animación');
  const isPackaging = modNombre.toLowerCase().includes('empaque') || modNombre.toLowerCase().includes('envase');
  const isWeb = modNombre.toLowerCase().includes('web') || modNombre.toLowerCase().includes('multimedia') || modNombre.toLowerCase().includes('interactiva');
  const isPhoto = modNombre.toLowerCase().includes('foto') || modNombre.toLowerCase().includes('imagen');
  const isVector = modNombre.toLowerCase().includes('vector') || modNombre.toLowerCase().includes('ilustra') || modNombre.toLowerCase().includes('dibujo');
  const isBrand = modNombre.toLowerCase().includes('identidad') || modNombre.toLowerCase().includes('marca') || modNombre.toLowerCase().includes('corporativa');
  const isEmprendedurismo = modNombre.toLowerCase().includes('emprend') || modNombre.toLowerCase().includes('negocio');

  let desc1 = `Investigación contextual y diagnóstico de necesidades para ${modNombre}. Análisis del brief, requerimientos técnicos y referentes del sector.`;
  let evid1 = `Brief técnico de requerimientos, cuadro comparativo de referentes y ficha de diagnóstico de ${modNombre}.`;

  let desc2 = `Planificación estratégica y cronograma de producción de ${modNombre}. Estimación de recursos, software/insumos y pliego de bocetos preliminares.`;
  let evid2 = `Cronograma de trabajo (Gantt), mapa de requerimientos y lámina de bocetos/estructuras iniciales.`;

  let desc3 = `Toma de decisiones técnicas y conceptuales para ${modNombre}. Selección fundamentada de propuesta visual, paleta cromática, tipografías y especificaciones de salida.`;
  let evid3 = `Moodboard de estilo, matriz de decisión técnica y propuesta aprobada debidamente justificada.`;

  let desc4 = `Ejecución y desarrollo práctico de ${modNombre}. Digitalización, composición, maquetación, modelado y producción del producto gráfico final.`;
  let evid4 = `Archivos editables nativos y artes/productos finales optimizados con estándares técnicos de la industria.`;

  let desc5 = `Control de calidad técnica y revisión de especificaciones para ${modNombre}. Verificación de parámetros, resolución, perfiles de salida y cumplimiento de lista de cotejo.`;
  let evid5 = `Lista de cotejo técnica diligenciada, informe de control de calidad y pruebas de comprobación técnica.`;

  let desc6 = `Sustentación oral del proyecto de ${modNombre}, coevaluación constructiva entre pares, autoevaluación reflexiva y consolidación del portafolio técnico.`;
  let evid6 = `Rúbrica de sustentación oral, instrumentos de coevaluación, autoevaluación y portafolio de evidencias.`;

  if (isOrientacion) {
    desc1 = `Diagnóstico inicial e investigación sobre el enfoque por competencias orientadas a la acción y perfiles profesionales del área técnica.`;
    evid1 = `Ficha de diagnóstico y mapa conceptual del enfoque por competencias de la especialidad.`;
    desc2 = `Planificación del proyecto de formación técnica y elaboración del plan de vida vocacional.`;
    evid2 = `Cronograma de metas académicas y matriz del plan de desarrollo profesional.`;
    desc3 = `Decisión y selección de área técnica de especialización y metodología de trabajo en equipo.`;
    evid3 = `Propuesta justificada de área de desarrollo técnico y asignación de roles colaborativos.`;
    desc4 = `Desarrollo de muestras gráficas representativas de cada área técnica de la especialidad.`;
    evid4 = `Muestrario de piezas preliminares de las áreas de diseño y comunicación visual.`;
    desc5 = `Revisión y verificación del portafolio inicial de inducción técnica mediante lista de cotejo.`;
    evid5 = `Lista de cotejo de inducción y verificación de productos formativos.`;
    desc6 = `Exposición grupal de expectativas vocacionales, coevaluación y consolidación de compromisos.`;
    evid6 = `Rúbrica de presentación, formato de coevaluación y portafolio vocacional.`;
  } else if (isEnglish) {
    desc1 = `Exploración y recopilación de manuales técnicos, glosarios y documentación especializada en idioma inglés para diseño.`;
    evid1 = `Glosario técnico bilingüe y fichas de lectura comprensiva de manuales de software.`;
    desc2 = `Planificación de síntesis técnicas y traducción aplicada de requerimientos de clientes internacionales.`;
    evid2 = `Esquema de traducción y cronograma de análisis de briefs en inglés.`;
    desc3 = `Selección de vocabulario técnico adecuado y redacción del pitch conceptual en idioma inglés.`;
    evid3 = `Documento de especificaciones técnicas redactado en inglés para proyectos de diseño.`;
    desc4 = `Elaboración de manuales de usuario, piezas publicitarias bilingües y presentaciones en inglés.`;
    evid4 = `Pieza gráfica final con copy técnico en inglés y presentación digital del proyecto.`;
    desc5 = `Verificación de ortografía técnica, gramática y coherencia del mensaje en inglés con lista de cotejo.`;
    evid5 = `Lista de cotejo lingüística y técnica para diseño en idioma inglés.`;
    desc6 = `Pitch oral en inglés ante el facilitador y compañeros, coevaluación y consolidación de glosario.`;
    evid6 = `Rúbrica de sustentación oral (Oral Pitch Evaluation) y portafolio bilingüe.`;
  } else if (isPackaging) {
    desc1 = `Investigación de mercado, producto a contener, normativas de etiquetado y materiales de empaque.`;
    evid1 = `Brief de producto, estudio de normativas de empaque y análisis de envases competidores.`;
    desc2 = `Desarrollo de planos mecánicos (troqueles), selección de sustratos y bocetos estructurales.`;
    evid2 = `Plano de troquel acotado con líneas de corte/doblez y bocetos 3D a mano alzada.`;
    desc3 = `Selección del tipo de cierre, gramaje de cartón/sustrato, paleta de tintas y acabados especiales.`;
    evid3 = `Ficha técnica de sustrato y troquel con especificaciones de barniz, plastificado y tintas.`;
    desc4 = `Vectorización del arte sobre el plano de troquel, maquetación de caras y armado del prototipo/dummy físico y 3D.`;
    evid4 = `Arte final vectorizado sobre troquel y dummy o mockup físico y digital en 3D armado.`;
    desc5 = `Comprobación de resistencia de pestañas de pegue, calce de tapas, códigos de barra y modo CMYK.`;
    evid5 = `Lista de cotejo de control estructural de empaque y pruebas de armado y lectura de código.`;
    desc6 = `Presentación de la línea de empaques ante el cliente simulado, coevaluación y manual de armado.`;
    evid6 = `Rúbrica de sustentación comercial de empaque y portafolio con plano mecánico y dummy.`;
  } else if (is3D) {
    desc1 = `Investigación conceptual, búsqueda de referencias anatómicas, arquitectura y hojas de modelo (model sheets).`;
    evid1 = `Moodboard de estilo visual 3D, referencias de iluminación y model sheet con vistas ortogonales.`;
    desc2 = `Planificación del pipeline 3D (bloqueo, topología, texturizado, rigging, animación y render).`;
    evid2 = `Cronograma de pipeline 3D y storyboard / animatic de la escena a modelar.`;
    desc3 = `Decisión sobre el motor de render, nivel de poligonización (low/high poly) y mapas de textura (PBR).`;
    evid3 = `Documento de especificaciones de render, resolución y configuración de materiales PBR.`;
    desc4 = `Modelado 3D, mapeo UV, creación de shaders, iluminación de tres puntos, animación y renderizado.`;
    evid4 = `Archivos fuente de escena 3D, texturas 4K/2K y secuencia de renders o video final en alta definición.`;
    desc5 = `Control de optimización de malla, eliminación de n-gons, balance de ruido de render y consistencia visual.`;
    evid5 = `Lista de cotejo técnica 3D (topología, UVs sin solapamiento y tiempos de render).`;
    desc6 = `Proyección del reel o render final, sustentación del proceso técnico de modelado y coevaluación.`;
    evid6 = `Rúbrica de sustentación de animación/3D, ficha de coevaluación y portafolio digital (Artstation/PDF).`;
  } else if (isBrand) {
    desc1 = `Investigación de identidad, valores de marca, arquetipos, público meta y benchmarking de la competencia.`;
    evid1 = `Brief de marca, auditoría de identidad visual de la competencia y mapa de posicionamiento.`;
    desc2 = `Lluvia de ideas, mapas mentales, cronograma de diseño de identidad y pliego de bocetos de imagotipos.`;
    evid2 = `Láminas de bocetos a lápiz (mínimo 30 propuestas), mapa mental y cronograma de branding.`;
    desc3 = `Selección de la propuesta ganadora, construcción geométrica de isotipo, paleta cromática y tipografías corporativas.`;
    evid3 = `Construcción en retícula modular, selección de fuentes institucionales y fórmulas Pantone/CMYK/RGB/HEX.`;
    desc4 = `Vectorización del identificador, diseño de aplicaciones institucionales (papelería, señalética, digital) y manual de marca.`;
    evid4 = `Manual de identidad visual corporativa completo (PDF vectorial) y artes de aplicaciones institucionales.`;
    desc5 = `Control de legibilidad en reducciones mínimas, contrastes cromáticos y consistencia en soportes reales.`;
    evid5 = `Lista de cotejo de validación de manual de marca y pruebas de reducción a 1 cm.`;
    desc6 = `Presentación de la marca ante el cliente, defensa conceptual, coevaluación y entrega de activos digitales.`;
    evid6 = `Rúbrica de pitch de marca, instrumentos de coevaluación y paquete de activos (brand assets).`;
  }

  return [
    {
      id: 1,
      etapa: 'Etapa 1: Informarse',
      nombreCorto: '1. Informarse',
      tiempo: '10% tiempo',
      tiempoPorcentajeNum: 10,
      horasEstimadas: h1,
      faseId: 'FASE_I',
      faseNombre: 'Fase I: Formativa Procesual / Diagnóstico e Investigación',
      fasePonderacionGlobal: 'FPP (25%)',
      fasePonderacionGlobalNum: 25,
      ponderacionInternaFaseTexto: `${w1_internal}% de Fase I`,
      ponderacionInternaFaseNum: w1_internal,
      ponderacionGlobalModuloTexto: `${w1_global}% Nota Global (FPP)`,
      ponderacionGlobalModuloNum: w1_global,
      ponderacionSugerida: `FPP (${w1_global}%)`,
      ponderacionNum: w1_global,
      descripcion: desc1,
      evidenciasSugeridas: evid1,
      instrumentoEvaluacion: 'Ficha de diagnóstico y Guía de investigación técnica',
    },
    {
      id: 2,
      etapa: 'Etapa 2: Planificar',
      nombreCorto: '2. Planificar',
      tiempo: '10% tiempo',
      tiempoPorcentajeNum: 10,
      horasEstimadas: h2,
      faseId: 'FASE_I',
      faseNombre: 'Fase I: Formativa Procesual / Diagnóstico e Investigación',
      fasePonderacionGlobal: 'FPP (25%)',
      fasePonderacionGlobalNum: 25,
      ponderacionInternaFaseTexto: `${w2_internal}% de Fase I`,
      ponderacionInternaFaseNum: w2_internal,
      ponderacionGlobalModuloTexto: `${w2_global}% Nota Global (FPP)`,
      ponderacionGlobalModuloNum: w2_global,
      ponderacionSugerida: `FPP (${w2_global}%)`,
      ponderacionNum: w2_global,
      descripcion: desc2,
      evidenciasSugeridas: evid2,
      instrumentoEvaluacion: 'Escala estimativa de cronograma y bocetería preliminar',
    },
    {
      id: 3,
      etapa: 'Etapa 3: Decidir',
      nombreCorto: '3. Decidir',
      tiempo: '10% tiempo',
      tiempoPorcentajeNum: 10,
      horasEstimadas: h3,
      faseId: 'FASE_II',
      faseNombre: 'Fase II: Formativa de Ejecución de Proyecto / Producción Técnica',
      fasePonderacionGlobal: 'FEP (50%)',
      fasePonderacionGlobalNum: 50,
      ponderacionInternaFaseTexto: `${w3_internal}% de Fase II`,
      ponderacionInternaFaseNum: w3_internal,
      ponderacionGlobalModuloTexto: `${w3_global}% Nota Global (FEP)`,
      ponderacionGlobalModuloNum: w3_global,
      ponderacionSugerida: `FEP (${w3_global}%)`,
      ponderacionNum: w3_global,
      descripcion: desc3,
      evidenciasSugeridas: evid3,
      instrumentoEvaluacion: 'Matriz técnica de decisión y justificación conceptual',
    },
    {
      id: 4,
      etapa: 'Etapa 4: Ejecutar',
      nombreCorto: '4. Ejecutar',
      tiempo: '40% tiempo',
      tiempoPorcentajeNum: 40,
      horasEstimadas: h4,
      faseId: 'FASE_II',
      faseNombre: 'Fase II: Formativa de Ejecución de Proyecto / Producción Técnica',
      fasePonderacionGlobal: 'FEP (50%)',
      fasePonderacionGlobalNum: 50,
      ponderacionInternaFaseTexto: `${w4_internal}% de Fase II`,
      ponderacionInternaFaseNum: w4_internal,
      ponderacionGlobalModuloTexto: `${w4_global}% Nota Global (FEP)`,
      ponderacionGlobalModuloNum: w4_global,
      ponderacionSugerida: `FEP (${w4_global}%)`,
      ponderacionNum: w4_global,
      descripcion: desc4,
      evidenciasSugeridas: evid4,
      instrumentoEvaluacion: 'Rúbrica de ejecución técnica y calidad del producto final',
    },
    {
      id: 5,
      etapa: 'Etapa 5: Controlar',
      nombreCorto: '5. Controlar',
      tiempo: '15% tiempo',
      tiempoPorcentajeNum: 15,
      horasEstimadas: h5,
      faseId: 'FASE_III',
      faseNombre: 'Fase III: Formativa de Valoración y Control / Calidad y Cierre',
      fasePonderacionGlobal: 'FVP (25%)',
      fasePonderacionGlobalNum: 25,
      ponderacionInternaFaseTexto: `${w5_internal}% de Fase III`,
      ponderacionInternaFaseNum: w5_internal,
      ponderacionGlobalModuloTexto: `${w5_global}% Nota Global (FVP)`,
      ponderacionGlobalModuloNum: w5_global,
      ponderacionSugerida: `FVP (${w5_global}%)`,
      ponderacionNum: w5_global,
      descripcion: desc5,
      evidenciasSugeridas: evid5,
      instrumentoEvaluacion: 'Lista de cotejo técnica y registro de control de calidad',
    },
    {
      id: 6,
      etapa: 'Etapa 6: Valorar',
      nombreCorto: '6. Valorar',
      tiempo: '15% tiempo',
      tiempoPorcentajeNum: 15,
      horasEstimadas: h6,
      faseId: 'FASE_III',
      faseNombre: 'Fase III: Formativa de Valoración y Control / Calidad y Cierre',
      fasePonderacionGlobal: 'FVP (25%)',
      fasePonderacionGlobalNum: 25,
      ponderacionInternaFaseTexto: `${w6_internal}% de Fase III`,
      ponderacionInternaFaseNum: w6_internal,
      ponderacionGlobalModuloTexto: `${w6_global}% Nota Global (FVP)`,
      ponderacionGlobalModuloNum: w6_global,
      ponderacionSugerida: `FVP (${w6_global}%)`,
      ponderacionNum: w6_global,
      descripcion: desc6,
      evidenciasSugeridas: evid6,
      instrumentoEvaluacion: 'Rúbrica de sustentación oral, coevaluación y autoevaluación',
    },
  ];
}

export const ETAPAS_ACCION_COMPLETA: EtapaAccionCompletaInfo[] = getModuleStagesAccionCompleta();

export const METODOLOGIA_DEFAULT_TEXT = `Metodología por Proyectos · Las 6 Etapas de la Acción Completa:
1. Informarse (10% del tiempo)
2. Planificar (10% del tiempo)
3. Decidir (10% del tiempo)
4. Ejecutar (25% del tiempo)
5. Controlar (25% del tiempo)
6. Valorar (20% del tiempo)

El facilitador debe orientar al grupo de estudiantes durante todas las etapas del módulo para el desarrollo integral de las competencias técnicas, procedimentales y actitudinales de Diseño Gráfico, mediante el desarrollo de proyectos orientados a la acción y estructurando las evidencias en las tres fases oficiales de evaluación: Fase I (FPP 25%), Fase II (FEP 50%) y Fase III (FVP 25%).`;

export function getDefaultDidacticPlan(
  module: ModuleDescriptor,
  anoLectivo: string,
  lmsModule?: LMSModule
): DidacticPlan {
  if (module.planDidactico) {
    return module.planDidactico;
  }

  const jornalizacion = lmsModule?.jornalizacion as StageJornalizacionItem[] | undefined;

  const dateRange = jornalizacion && jornalizacion.length > 0
    ? `${formatDateSpanish(jornalizacion[0].startDate)} al ${formatDateSpanish(jornalizacion[jornalizacion.length - 1].endDate)}`
    : formatModuleDateRange(module, anoLectivo);

  // Helper para obtener fecha de etapa desde jornalización
  const getFechaEtapa = (etapaIds: number[]): string => {
    if (!jornalizacion || jornalizacion.length === 0) return dateRange;
    const matching = etapaIds.map(id => jornalizacion[id - 1]).filter(Boolean);
    if (matching.length === 0) return dateRange;
    const start = formatDateSpanish(matching[0].startDate);
    const end = formatDateSpanish(matching[matching.length - 1].endDate);
    return `${start} al ${end}`;
  };

  if (module.codigo.includes('0') || module.nombre.toLowerCase().includes('orientación')) {
    return {
      trimestrePeriodo: `${module.semanas} ${module.semanas === 1 ? 'Semana' : 'Semanas'}`,
      competenciasUnidad:
        'Consolidar los conocimientos del proceso de aprendizaje con enfoque por competencias orientada a la acción y la identificación con el área de especialidad.',
      conceptuales: [
        'Proceso de aprendizaje con enfoque de competencias orientadas a la acción.',
        'Estructura curricular de los módulos del Bachillerato Técnico Vocacional en Diseño Gráfico.',
        'Áreas especializadas y perfiles ocupacionales de la carrera técnica.',
      ],
      procedimentales: [
        'Elabora investigaciones orientadas al desarrollo de nuevos proyectos de diseño.',
        'Realiza una síntesis descriptiva de los conocimientos adquiridos utilizando el enfoque por competencias orientadas a la acción.',
        'Identifica la ruta de trabajo y aprendizaje para la inserción laboral y autoempleo.',
      ],
      actitudinales: [
        'Demuestra interés por asumir el rol de constructor de su aprendizaje.',
        'Fortalece su decisión de desarrollo profesional en esta especialidad del bachillerato.',
        'Participa colaborativamente en equipos de trabajo interdisciplinarios.',
      ],
      metodologia: METODOLOGIA_DEFAULT_TEXT,
      indicadoresTexto: `• ${module.totalIndicadores} Indicadores descritos en el PLAN DE ESTUDIO DEL BACHILLERATO TÉCNICO VOCACIONAL EN DISEÑO GRÁFICO Edición: 2015`,
      actividades: [
        {
          no: 1,
          etapa: 'Etapa 1 (Informarse: 10% tiempo) y Etapa 2 (Planificar: 10% tiempo)',
          tiempo: '20% tiempo',
          fase: 'Fase I: Formativa Procesual (FPP)',
          actividad:
            'Realizar investigación documental sobre la ruta de trabajo y aprendizaje en el enfoque de competencias orientadas a la acción y la forma en cómo contribuyen para la obtención de empleo y el auto-empleo.',
          evidencia: 'Informe documental de ruta de formación y plan de trabajo de especialidad.',
          ponderacion: 'FPP (25%)',
          fecha: getFechaEtapa([1, 2]),
        },
        {
          no: 2,
          etapa: 'Etapa 3 (Decidir: 10% tiempo) y Etapa 4 (Ejecutar: 25% tiempo)',
          tiempo: '35% tiempo',
          fase: 'Fase II: Formativa de Ejecución de Proyecto (FEP)',
          actividad:
            'Exposición creativa de áreas especializadas de la carrera: fotografía, ilustración, publicidad, artes, editorial, multimedia y producción gráfica.',
          evidencia: 'Muestra gráfica preliminar y presentación de especialidad técnica.',
          ponderacion: 'FEP (50%)',
          fecha: getFechaEtapa([3, 4]),
        },
        {
          no: 3,
          etapa: 'Etapa 5 (Controlar: 25% tiempo) y Etapa 6 (Valorar: 20% tiempo)',
          tiempo: '45% tiempo',
          fase: 'Fase III: Formativa de Valoración y Control (FVP)',
          actividad:
            'Cada equipo de trabajo crítica constructivamente el progreso de trabajo de los otros equipos, evalúa resultados técnicos y reflexiona sobre los aprendizajes.',
          evidencia: 'Ficha de coevaluación reflexiva, lista de cotejo y autoevaluación.',
          ponderacion: 'FVP (25%)',
          fecha: getFechaEtapa([5, 6]),
        },
      ],
      recursos:
        'Mesas de dibujo individuales, pizarras acrílicas, escritorio, bancos y sillas según altura de mesas, muestras gráficas.',
      tic: 'Computadora, cañón multimedia, bocinas, software de diseño e Internet.',
      bibliografia: [
        'Ortega, Ramón (2014). Metodología para la ilustración desde el pensamiento creativo. IX Encuentro Latinoamericano de Diseño "Diseño en Palermo" V Congreso Latinoamericano de Enseñanza del Diseño.',
        'MINED (2015). Plan de Estudio del Bachillerato Técnico Vocacional en Diseño Gráfico. San Salvador, El Salvador.',
      ],
    };
  }

  return {
    trimestrePeriodo: `${module.semanas} Semanas (${module.duracionHoras} horas)`,
    competenciasUnidad:
      module.competenciaGeneral ||
      `Desarrollar competencias técnicas y profesionales orientadas a la acción en ${module.nombre}.`,
    conceptuales: [
      `Fundamentos teóricos, principios y normativas de ${module.nombre}.`,
      'Metodología proyectual, fases de diseño y conceptualización de piezas gráficas.',
      'Criterios de composición, estética, tipografía, cromática y comunicación visual aplicada.',
    ],
    procedimentales: [
      `Aplica técnicas y procedimientos estructurados para el desarrollo práctico de ${module.nombre}.`,
      'Desarrolla bocetería, prototipado digital y artes finales optimizados para producción gráfica.',
      'Ejecuta proyectos integrales siguiendo las seis etapas de la acción completa (informarse, planificar, decidir, ejecutar, controlar y valorar).',
    ],
    actitudinales: [
      'Muestra rigor, limpieza, creatividad y proactividad en el desarrollo de sus proyectos técnicos.',
      'Respeta los derechos de autor, propiedad intelectual y normativas éticas del diseño.',
      'Acepta la crítica constructiva y colabora eficazmente con sus compañeros de equipo.',
    ],
    metodologia: METODOLOGIA_DEFAULT_TEXT,
    indicadoresTexto: `• ${module.totalIndicadores} Indicadores descritos en el PLAN DE ESTUDIO DEL BACHILLERATO TÉCNICO VOCACIONAL EN DISEÑO GRÁFICO Edición: 2015`,
    actividades: [
      {
        no: 1,
        etapa: 'Etapa 1 (Informarse: 10% tiempo) y Etapa 2 (Planificar: 10% tiempo)',
        tiempo: '20% tiempo',
        fase: 'Fase I: Formativa Procesual (FPP)',
        actividad: `Fase de Investigación y Planificación Técnica: Análisis del brief, recopilación de información, estudio de referentes visuales y elaboración de cronograma de trabajo con bocetería preliminar para ${module.nombre}.`,
        evidencia: `Brief de requerimientos, árbol de ideas, cronograma Gantt y pliego de bocetos preliminares.`,
        ponderacion: 'FPP (25%)',
        fecha: getFechaEtapa([1, 2]),
      },
      {
        no: 2,
        etapa: 'Etapa 3 (Decidir: 10% tiempo) y Etapa 4 (Ejecutar: 25% tiempo)',
        tiempo: '35% tiempo',
        fase: 'Fase II: Formativa de Ejecución de Proyecto (FEP)',
        actividad: `Fase de Decisión y Ejecución Técnica: Selección de la propuesta aprobada, vectorización/maquetación digital, aplicación de jerarquía tipográfica y cromática, y elaboración del producto o arte final de ${module.nombre}.`,
        evidencia: `Archivos editables (.AI, .PSD, .INDD), artes finales de prueba y prototipo listo para producción.`,
        ponderacion: 'FEP (50%)',
        fecha: getFechaEtapa([3, 4]),
      },
      {
        no: 3,
        etapa: 'Etapa 5 (Controlar: 25% tiempo) y Etapa 6 (Valorar: 20% tiempo)',
        tiempo: '45% tiempo',
        fase: 'Fase III: Formativa de Valoración y Control (FVP)',
        actividad: `Fase de Control y Valoración de los Aprendizajes: Verificación de estándares técnicos mediante lista de cotejo, sustentación oral del proyecto gráfico y aplicación de instrumentos de coevaluación y autoevaluación.`,
        evidencia: `Lista de cotejo técnica verificada, rúbrica de sustentación evaluada y portafolio de evidencias.`,
        ponderacion: 'FVP (25%)',
        fecha: getFechaEtapa([5, 6]),
      },
    ],
    recursos:
      'Mesas de dibujo individuales, pizarras acrílicas, instrumentos de trazo, papeles especiales, tintas y muestras de impresión.',
    tic: 'Computadoras de alto rendimiento, suite de diseño (Adobe CC: Illustrator, Photoshop, InDesign), proyector multimedia y conexión a Internet.',
    bibliografia: [
      'MINED (2015). Plan de Estudio del Bachillerato Técnico Vocacional en Diseño Gráfico. Dirección Nacional de Educación Media Tecnológica, El Salvador.',
      'Lupton, Ellen (2014). Intuición, Acción, Creación: Graphic Design Thinking. Editorial Gustavo Gili, Barcelona.',
      'Meggs, Philip B. & Purvis, Alston W. (2018). Historia del Diseño Gráfico. Editorial RM / Trillas.',
    ],
  };
}

export function getGranular6StagesPlan(
  module: ModuleDescriptor,
  anoLectivo: string,
  internalWeightPreset: 'standard' | 'execution_heavy' = 'standard',
  lmsModule?: LMSModule
): DidacticEvaluationActivity[] {
  const jornalizacion = lmsModule?.jornalizacion as StageJornalizacionItem[] | undefined;
  const stages = getModuleStagesAccionCompleta(module, internalWeightPreset);

  return stages.map((st) => {
    let fecha = formatModuleDateRange(module, anoLectivo);
    if (jornalizacion && jornalizacion[st.id - 1]) {
      const stageJ = jornalizacion[st.id - 1];
      fecha = `${formatDateSpanish(stageJ.startDate)} al ${formatDateSpanish(stageJ.endDate)}`;
    }
    return {
      no: st.id,
      etapa: `${st.etapa} (${st.tiempo} · ${st.horasEstimadas}h | ${st.ponderacionInternaFaseTexto})`,
      tiempo: `${st.tiempo} (${st.horasEstimadas}h)`,
      fase: st.faseNombre,
      actividad: `${st.etapa}: ${st.descripcion}`,
      evidencia: st.evidenciasSugeridas,
      ponderacion: st.ponderacionSugerida,
      fecha,
    };
  });
}

export function exportDidacticPlanToWord(
  headerData: InstitutionalHeader,
  module: ModuleDescriptor,
  lmsModule?: LMSModule
) {
  const plan = getDefaultDidacticPlan(module, headerData.anoLectivo, lmsModule);
  const jornalizacion = lmsModule?.jornalizacion as StageJornalizacionItem[] | undefined;
  const dateRange = jornalizacion && jornalizacion.length > 0
    ? `${formatDateSpanish(jornalizacion[0].startDate)} al ${formatDateSpanish(jornalizacion[jornalizacion.length - 1].endDate)}`
    : formatModuleDateRange(module, headerData.anoLectivo);

  const htmlContent = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Planificación Didáctica - ${module.codigo} - ${headerData.institucion}</title>
<style>
  @page {
    size: 21.59cm 27.94cm;
    margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    mso-page-orientation: portrait;
  }
  body {
    font-family: Calibri, 'Segoe UI', Arial, sans-serif;
    font-size: 10pt;
    color: #1a1a1a;
    line-height: 1.25;
  }
  .header-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 8px;
  }
  .header-title {
    font-size: 14pt;
    font-weight: bold;
    color: #0d47a1;
    text-align: center;
  }
  .header-badge {
    text-align: right;
    font-size: 9pt;
    font-weight: bold;
    color: #333;
  }
  .main-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }
  .main-table th, .main-table td {
    border: 1px solid #4b5563;
    padding: 4px 6px;
    font-size: 8.5pt;
    vertical-align: top;
  }
  .section-header {
    background-color: #f1f5f9;
    font-weight: bold;
    text-align: center;
    font-size: 9pt;
    color: #0f172a;
  }
  .green-header {
    background-color: #d1fae5;
    font-weight: bold;
    text-align: center;
    color: #065f46;
  }
  .stage-badge {
    display: inline-block;
    background-color: #e0f2fe;
    color: #0369a1;
    font-weight: bold;
    font-size: 7.5pt;
    padding: 2px 4px;
    border-radius: 3px;
    margin-bottom: 3px;
  }
  .evidence-box {
    font-size: 7.5pt;
    color: #475569;
    margin-top: 3px;
    font-style: italic;
  }
  .field-label {
    font-weight: bold;
    color: #1e293b;
  }
  ul {
    margin: 0;
    padding-left: 14px;
  }
  li {
    margin-bottom: 2px;
  }
  .page-break {
    page-break-after: always;
  }
  .cover-box {
    text-align: center;
    padding-top: 150px;
  }
  .cover-inst {
    font-size: 18pt;
    font-weight: bold;
    color: #1e3a8a;
  }
  .cover-title {
    font-size: 26pt;
    font-weight: 900;
    color: #1e40af;
    margin-top: 40px;
    margin-bottom: 20px;
  }
  .cover-sub {
    font-size: 16pt;
    font-weight: bold;
    color: #334155;
  }
  .cover-doc {
    font-size: 12pt;
    font-weight: bold;
    color: #475569;
    margin-top: 80px;
  }
</style>
</head>
<body>

  <div class="cover-box">
    <div class="cover-inst">${headerData.institucion.toUpperCase()}</div>
    <div class="cover-title">Planificación Didáctica</div>
    <div class="cover-sub">${headerData.gradoSeccion}</div>
    <div class="cover-doc">Docente: ${headerData.docente}</div>
    <div style="margin-top: 60px; font-weight: bold; color: #1e3a8a;">CSSJ – ${headerData.anoLectivo}</div>
  </div>

  <div class="page-break"></div>

  <div class="cover-box">
    <div class="cover-inst">${headerData.institucion.toUpperCase()}</div>
    <div style="font-size: 20pt; font-weight: 900; color: #1e40af; margin-top: 50px; margin-bottom: 20px;">
      Módulo: ${module.nombre}
    </div>
    <div style="font-size: 13pt; font-weight: bold; color: #334155;">
      Código: ${module.codigo} · Duración: ${module.duracionHoras} horas (${module.semanas} semanas)
    </div>
    <div class="cover-doc">Docente: ${headerData.docente}</div>
    <div style="margin-top: 60px; font-weight: bold; color: #1e3a8a;">CSSJ – ${headerData.anoLectivo}</div>
  </div>

  <div class="page-break"></div>

  <table class="header-table">
    <tr>
      <td style="width: 15%; text-align: left; font-size: 16pt;">⭐</td>
      <td class="header-title">${headerData.institucion}</td>
      <td class="header-badge" style="width: 15%;">CSSJ – ${headerData.anoLectivo}</td>
    </tr>
  </table>

  <table class="main-table">
    <tr>
      <td colspan="4" class="section-header">DATOS GENERALES</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Nombre del Centro Educativo:</span><br>${headerData.institucion}</td>
      <td colspan="2"><span class="field-label">Competencias de la Asignatura:</span><br>Desarrollo Técnico, Humano, Emprendedor y Académico Aplicado</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Docente:</span> ${headerData.docente}</td>
      <td><span class="field-label">Módulo:</span> ${module.codigo}</td>
      <td><span class="field-label">Grado:</span> ${headerData.gradoSeccion}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Número y nombre de la Unidad:</span><br>${module.codigo} - ${module.nombre}</td>
      <td><span class="field-label">Tiempo:</span> ${module.duracionHoras} horas</td>
      <td><span class="field-label">Trimestre o período:</span> ${plan.trimestrePeriodo || `${module.semanas} Semanas`}</td>
    </tr>
    <tr>
      <td colspan="4"><span class="field-label">Fechas:</span> <strong>${dateRange}</strong></td>
    </tr>
    <tr>
      <td colspan="4"><span class="field-label">Competencias de la unidad:</span><br>${plan.competenciasUnidad || module.competenciaGeneral || ''}</td>
    </tr>

    <tr>
      <td style="width: 33%;" class="green-header">CONTENIDOS CONCEPTUALES<br><span style="font-weight: normal; font-size: 7.5pt;">(Saber Conocer)</span></td>
      <td colspan="2" style="width: 34%;" class="green-header">CONTENIDOS PROCEDIMENTALES<br><span style="font-weight: normal; font-size: 7.5pt;">(Saber Hacer)</span></td>
      <td style="width: 33%;" class="green-header">CONTENIDOS ACTITUDINALES<br><span style="font-weight: normal; font-size: 7.5pt;">(Saber Ser)</span></td>
    </tr>
    <tr>
      <td>
        <ul>
          ${plan.conceptuales.map((c) => `<li>${c}</li>`).join('')}
        </ul>
      </td>
      <td colspan="2">
        <ul>
          ${plan.procedimentales.map((p) => `<li>${p}</li>`).join('')}
        </ul>
      </td>
      <td>
        <ul>
          ${plan.actitudinales.map((a) => `<li>${a}</li>`).join('')}
        </ul>
      </td>
    </tr>

    <tr>
      <td colspan="2" style="width: 50%;">
        <span class="field-label">Metodología:</span><br>
        ${plan.metodologia || ''}
      </td>
      <td colspan="2" style="width: 50%;">
        <span class="field-label">Indicadores de logro:</span><br>
        ${plan.indicadoresTexto || `• ${module.totalIndicadores} Indicadores descritos en el PLAN DE ESTUDIO DEL BACHILLERATO TÉCNICO VOCACIONAL EN DISEÑO GRÁFICO Edición: 2015`}
      </td>
    </tr>

    <tr>
      <th style="width: 5%;">NO.</th>
      <th style="width: 55%; text-align: left;">ACTIVIDADES DE EVALUACIÓN (ETAPAS Y FASES DE ACCIÓN COMPLETA)</th>
      <th style="width: 18%; text-align: center;">PONDERACIÓN</th>
      <th style="width: 22%; text-align: center;">FECHA DE REALIZACIÓN</th>
    </tr>
    ${plan.actividades
      .map(
        (act) => `
    <tr>
      <td style="text-align: center; font-weight: bold;">${act.no}</td>
      <td>
        <div style="margin-bottom: 3px;">
          ${act.etapa ? `<span class="stage-badge">${act.etapa}</span>` : ''}
          ${act.tiempo ? `<span style="font-size: 8pt; font-weight: bold; background-color: #f1f5f9; color: #334155; padding: 2px 5px; border: 1px solid #cbd5e1; margin-left: 4px;">⏱️ ${act.tiempo}</span>` : ''}
        </div>
        <div style="font-size: 9pt;">${act.actividad}</div>
        ${act.evidencia ? `<div class="evidence-box"><strong>Evidencia esperada:</strong> ${act.evidencia}</div>` : ''}
      </td>
      <td style="text-align: center; font-weight: bold;">${act.ponderacion}</td>
      <td style="text-align: center; font-weight: bold;">${act.fecha || dateRange}</td>
    </tr>
    `
      )
      .join('')}
    <tr>
      <td colspan="2" style="font-weight: bold; background-color: #f8fafc; font-size: 8.5pt;">
        TOTAL METODOLOGÍA POR PROYECTOS (6 ETAPAS DE ACCIÓN COMPLETA): 100% TIEMPO
      </td>
      <td style="text-align: center; font-weight: bold; background-color: #eff6ff; font-size: 9pt;">
        100%
      </td>
      <td style="text-align: center; font-size: 8pt; font-weight: bold; color: #475569; background-color: #f8fafc;">
        FPP (25%) + FEP (50%) + FVP (25%)
      </td>
    </tr>

    <tr>
      <td colspan="2">
        <span class="field-label">Recursos:</span><br>
        ${plan.recursos}
      </td>
      <td colspan="2">
        <span class="field-label">TIC:</span><br>
        ${plan.tic}
      </td>
    </tr>

    <tr>
      <td colspan="4" class="section-header">BIBLIOGRAFÍA O EGRAFÍA</td>
    </tr>
    <tr>
      <td colspan="4">
        <ul>
          ${plan.bibliografia.map((b) => `<li>${b}</li>`).join('')}
        </ul>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const fileName = `Planificacion_Didactica_${module.codigo}_${headerData.anoLectivo}.doc`;
  saveAs(blob, fileName);
}
