import { ModuleDescriptor, InstitutionalHeader, GuionDeClase, GuionEvaluacionRow, LMSModule } from '../types';
import { getModuleStagesAccionCompleta } from './didacticPlanHelper';
import { formatDateSpanish, StageJornalizacionItem } from './jornalizacionHelper';

export function getSessionWeekAndDates(
  module: ModuleDescriptor,
  anoLectivo: string,
  sessionIndex: number,
  totalSessions: number,
  jornalizacion?: StageJornalizacionItem[]
): { semanaTexto: string; fechaTexto: string; semanaNumero: number } {
  const semanaNumero = sessionIndex + 1;
  const totalSemanasModulo = module.semanas || totalSessions;

  const semanaTexto = `Semana ${semanaNumero} de ${totalSemanasModulo} (Cronograma del Módulo)`;

  let fechaTexto: string;
  if (jornalizacion && jornalizacion[sessionIndex]) {
    const stage = jornalizacion[sessionIndex];
    const startFormatted = formatDateSpanish(stage.startDate);
    const endFormatted = formatDateSpanish(stage.endDate);
    fechaTexto = `Del ${startFormatted} al ${endFormatted}`;
  } else {
    const startStr = `${module.diaInicio} de ${module.mesInicio}`;
    const endStr = `${module.diaFin} de ${module.mesFin}`;
    fechaTexto = `Del ${startStr} al ${endStr} de ${anoLectivo}`;
  }

  return { semanaTexto, fechaTexto, semanaNumero };
}

export function generateModuleGuiones(
  module: ModuleDescriptor,
  headerData: InstitutionalHeader,
  anoLectivo: string = '2026',
  lmsModule?: LMSModule
): GuionDeClase[] {
  const stages = getModuleStagesAccionCompleta(module);
  const modNombre = module.nombre || 'Módulo Técnico';
  const modCodigo = module.codigo || 'BTVDG';
  const docente = headerData.docente || 'Profesor Especialista';
  const gradoSeccion = headerData.gradoSeccion || '2° Año Tec. Voc. Diseño Gráfico';
  const totalSemanas = module.semanas || stages.length;
  const jornalizacion = lmsModule?.jornalizacion as StageJornalizacionItem[] | undefined;

  return stages.map((st, idx) => {
    const sesionNumero = idx + 1;
    const totalSesiones = stages.length;
    const stageId = st.id;
    const horasSesion = st.horasEstimadas;
    const { semanaTexto, fechaTexto, semanaNumero } = getSessionWeekAndDates(
      module,
      anoLectivo,
      idx,
      totalSesiones,
      jornalizacion
    );

    let unidadTitle = `Unidad ${Math.min(module.unidades || 3, Math.ceil((idx + 1) / 2))}: `;
    if (stageId === 1 || stageId === 2) {
      unidadTitle += `Diagnóstico, Briefing e Investigación Técnica (${st.nombreCorto})`;
    } else if (stageId === 3 || stageId === 4) {
      unidadTitle += `Desarrollo, Producción y Maquetación de ${modNombre} (${st.nombreCorto})`;
    } else {
      unidadTitle += `Control de Calidad, Sustentación y Cierre de Proyecto (${st.nombreCorto})`;
    }

    let contenido = '';
    let objetivoClase = '';
    let indicadorLogro = '';
    let competencias = '';
    let ejeTransversal = 'Trabajo colaborativo y cultura del emprendimiento, aplicando pensamiento crítico e innovación tecnológica en la resolución de problemas reales de diseño.';
    let inicioSit = '';
    let inicioEval = '';
    let desSit = '';
    let desEval = '';
    let cierreSit = '';
    let cierreEval = '';
    let adaptaciones = 'Atención diversificada a ritmos de trabajo; provisión de guías paso a paso con capturas de pantalla de software, atajos de teclado y tutoría personalizada entre pares para estudiantes que requieran apoyo.';
    let tarea = '';
    let biblio = `MINED. (2026). Descriptor del Módulo ${modCodigo}: ${modNombre}. San Salvador, El Salvador.\nAmbrose, G., & Harris, P. (2020). Fundamentos del Diseño Gráfico y Comunicación Visual (3.ª ed.). Parramón.`;
    let recursos = `Guía técnica de trabajo, proyector multimedia, pizarra acrílica, muestras impresas, pliego de papel bond y lápices de grafito.`;
    let tics = `Estaciones de trabajo con Adobe Creative Cloud / Blender, pantalla interactiva, plataforma TBox / Google Classroom y repositorio de recursos digitales.`;

    if (stageId === 1) {
      contenido = `1.1 Levantamiento del Briefing de diseño, diagnóstico de requerimientos del cliente y análisis de referentes visuales para ${modNombre}.`;
      objetivoClase = `Investigar y recolectar información técnica y conceptual mediante el levantamiento estructurado del brief para fundamentar el diagnóstico de diseño.`;
      indicadorLogro = `1.1 Identifica con precisión los requerimientos del cliente y elabora el brief técnico cumpliendo con los estándares de la especialidad.`;
      competencias = `Capacidad de análisis contextual, recolección de requerimientos técnicos, interpretación de necesidades del cliente y diagnóstico inicial de comunicación visual.`;
      inicioSit = `Dinámica de activación: Presentación de un caso de estudio real con brief incompleto. Preguntas exploratorias para detectar variables críticas de diseño y conocimientos previos.`;
      inicioEval = `Evaluación Diagnóstica: Lluvia de ideas guiada y ficha KWL (¿Qué sé? ¿Qué quiero aprender? ¿Qué aprendí?) para sondear conceptos previos sin ponderación numérica.`;
      desSit = `Explicación magistral sobre la estructura del brief técnico. Conformación de equipos de trabajo y simulación de entrevista con el cliente para completar la ficha de investigación y matriz comparativa de referentes.`;
      desEval = `Evaluación Formativa: Observación directa y acompañamiento guiado durante la entrevista de brief y análisis de referentes con retroalimentación oral inmediata.`;
      cierreSit = `Puesta en común de hallazgos por equipo. Consolidación del brief final y recapitulación de los lineamientos clave del proyecto.`;
      cierreEval = `Evaluación Sumativa: Entrega y revisión del Brief de Diseño estructurado e informe de diagnóstico (ponderado en Fase I - FPP ${st.ponderacionGlobalModuloTexto}). Análisis de logro de competencias.`;
      tarea = `Recopilar mínimo 5 referentes visuales directos e indirectos del sector y anexarlos al expediente digital del proyecto.`;
    } else if (stageId === 2) {
      contenido = `2.1 Cronograma de producción (Diagrama de Gantt), estimación y asignación de recursos/insumos, y pliego de bocetos preliminares a mano alzada.`;
      objetivoClase = `Estructurar el plan operativo de trabajo y explorar soluciones gráficas preliminares mediante bocetería para optimizar tiempos y recursos.`;
      indicadorLogro = `2.1 Elabora el cronograma de actividades de producción y diseña propuestas preliminares de bocetos con creatividad y viabilidad técnica.`;
      competencias = `Planificación estratégica, gestión eficiente de tiempos y recursos, formulación de cronogramas y destreza en bocetería conceptual rápida.`;
      inicioSit = `Activación: Análisis de un cronograma de producción industrial. Reflexión sobre las consecuencias de cuellos de botella y desabastecimiento de insumos en el taller de diseño.`;
      inicioEval = `Evaluación Diagnóstica: Preguntas generadoras sobre cálculo de tiempos de producción y flujo de trabajo editorial/gráfico.`;
      desSit = `Taller práctico de elaboración de diagrama de Gantt. Sesión intensiva de bocetería a mano alzada (Brainstorming visual) con iteraciones rápidas y matriz de insumos necesarios.`;
      desEval = `Evaluación Formativa: Revisión intermedia en mesa de trabajo de las láminas de bocetos y cronogramas, aplicando rúbrica de proceso sin nota sumativa directa.`;
      cierreSit = `Galería de bocetos (Pin-up session) en el aula. Validación grupal de viabilidad del cronograma de cada equipo de trabajo.`;
      cierreEval = `Evaluación Sumativa: Calificación del Cronograma Gantt y lámina de bocetos conceptuales aprobados (Fase I - FPP ${st.ponderacionGlobalModuloTexto}).`;
      tarea = `Digitalizar el cronograma Gantt en formato editable y pulir los 3 mejores bocetos a lápiz con entintado preliminar.`;
    } else if (stageId === 3) {
      contenido = `3.1 Toma de decisiones técnicas y conceptuales: Selección justificada de la propuesta final, definición de paleta cromática (Pantone/CMYK), tipografía y especificaciones de salida.`;
      objetivoClase = `Fundamentar y decidir técnicamente la propuesta gráfica definitiva mediante matrices de decisión y criterios profesionales de diseño.`;
      indicadorLogro = `3.1 Selecciona y argumenta con criterios técnicos la propuesta de diseño más óptima, definiendo especificaciones cromáticas y tipográficas precisas.`;
      competencias = `Pensamiento crítico, toma de decisiones fundamentadas, dominio de teoría del color y armonía tipográfica aplicada al proyecto.`;
      inicioSit = `Presentación de dilemas técnicos de producción (costos de impresión, perfiles de color, legibilidad tipográfica).`;
      inicioEval = `Evaluación Diagnóstica: Sondeo interactivo rápido sobre contrastes cromáticos y legibilidad en soportes físicos y digitales.`;
      desSit = `Elaboración de moodboard de estilo, matriz de decisión ponderada (criterios: funcionalidad, costo, impacto, viabilidad) y ficha técnica de especificaciones del proyecto.`;
      desEval = `Evaluación Formativa: Asesoría personalizada por equipo validando la coherencia entre el brief de la Etapa 1 y la decisión tomada.`;
      cierreSit = `Pitch de 2 minutos por equipo justificando la propuesta ganadora ante el docente y compañeros.`;
      cierreEval = `Evaluación Sumativa: Registro de la Propuesta Seleccionada debidamente justificada y Matriz Técnica (Fase II - FEP ${st.ponderacionGlobalModuloTexto}).`;
      tarea = `Configurar el espacio de trabajo en software nativo con las dimensiones, sangrías y perfiles de color definidos en la matriz.`;
    } else if (stageId === 4) {
      contenido = `4.1 Producción integral en software especializado: Digitalización vectorial, maquetación, composición, modelado y generación del arte final.`;
      objetivoClase = `Desarrollar y materializar el producto gráfico final utilizando herramientas tecnológicas avanzadas con rigor técnico y altos estándares estéticos.`;
      indicadorLogro = `4.1 Opera fluidamente las herramientas de software especializado para construir el arte final cumpliendo con todas las normas de producción.`;
      competencias = `Destreza técnica en software de diseño (.AI, Photoshop, InDesign, Blender), precisión en trazados vectoriales, maquetación profesional y modelado.`;
      inicioSit = `Demostración docente (Masterclass) de técnicas avanzadas de digitalización, atajos de teclado y optimización de flujos de trabajo.`;
      inicioEval = `Evaluación Diagnóstica: Comprobación de configuración inicial de archivos (.AI/.PSD/.INDD) en cada terminal de cómputo.`;
      desSit = `Laboratorio de producción técnica intensiva: Vectorización, aplicación de estilos tipográficos, ajuste de capas, renderizado/maquetación y ensamble de piezas.`;
      desEval = `Evaluación Formativa: Monitoreo continuo estación por estación, resolución de incidencias técnicas en tiempo real y registro en bitácora de taller.`;
      cierreSit = `Renderizado y exportación de avances al servidor local/carpeta compartida de entrega. Verificación de integridad de archivos fuente.`;
      cierreEval = `Evaluación Sumativa: Evaluación del Producto/Arte Gráfico Final y archivos nativos editables con rúbrica técnica de ejecución (Fase II - FEP ${st.ponderacionGlobalModuloTexto}).`;
      tarea = `Comprobar empaquetado de fuentes y vínculos de imágenes para evitar pérdidas de enlace en la estación de trabajo.`;
    } else if (stageId === 5) {
      contenido = `5.1 Control de calidad técnica: Verificación de sangrías, resolución (300 DPI), modo de color (CMYK/RGB), sobreimpresión y aplicación estricta de lista de cotejo.`;
      objetivoClase = `Verificar y auditar la calidad técnica de las piezas gráficas producidas mediante listas de cotejo e instrumentos de control industrial.`;
      indicadorLogro = `5.1 Aplica rigurosamente protocolos de control de calidad para validar que el producto gráfico esté listo para su salida o publicación sin errores.`;
      competencias = `Auditoría técnica de artes finales, detección temprana de errores de producción, control de calidad y dominio de pre-prensa y salida digital.`;
      inicioSit = `Exhibición de errores clásicos de imprenta y salida web (textos sin trazar, imágenes pixeladas, modo RGB en offset) y su impacto económico.`;
      inicioEval = `Evaluación Diagnóstica: Ejercicio de 'Caza de errores' en artes con defectos técnicos intencionales para agudizar el ojo crítico.`;
      desSit = `Aplicación individual y por pares de la Lista de Cotejo Técnica Oficial (sangrías, modo de color, incrustación de perfiles, legibilidad y ortografía). Corrección inmediata de hallazgos.`;
      desEval = `Evaluación Formativa: Supervisión docente en la revisión de pruebas de galera, dummies físicos o previsualización de separaciones de color.`;
      cierreSit = `Elaboración del dictamen técnico de conformidad de la pieza gráfica y firma de visto bueno para salida.`;
      cierreEval = `Evaluación Sumativa: Calificación de la Lista de Cotejo Técnica diligenciada e informe de control de calidad (Fase III - FVP ${st.ponderacionGlobalModuloTexto}).`;
      tarea = `Generar el PDF/X-1a o paquete final para imprenta/cliente con la certificación de control de calidad aprobada.`;
    } else {
      contenido = `6.1 Sustentación oral del proyecto, coevaluación constructiva entre pares, autoevaluación reflexiva y consolidación del portafolio técnico de evidencias.`;
      objetivoClase = `Defender y evaluar críticamente los resultados del proyecto ante la comunidad educativa, promoviendo la autorreflexión y la retroalimentación formativa.`;
      indicadorLogro = `6.1 Sustenta con claridad, vocabulario técnico y elocuencia la propuesta de diseño realizada, participando con ética en la coevaluación y autoevaluación.`;
      competencias = `Comunicación oral asertiva, argumentación profesional, pensamiento metacognitivo, autocrítica constructiva y trabajo en equipo.`;
      inicioSit = `Acondicionamiento del auditorio/aula para la jornada de defensas públicas. Explicación de los criterios de la rúbrica de sustentación.`;
      inicioEval = `Evaluación Diagnóstica: Breve ejercicio de respiración y modulación de voz para manejo escénico antes de la presentación.`;
      desSit = `Ronda de presentaciones orales (Pitch de 5-7 minutos por equipo) apoyados en diapositivas y muestras físicas/digitales. Ronda de preguntas técnicas por el jurado/docente.`;
      desEval = `Evaluación Formativa: Retroalimentación cualitativa inmediata al término de cada intervención destacando fortalezas y oportunidades de mejora.`;
      cierreSit = `Diligenciamiento de los instrumentos de coevaluación entre pares y autoevaluación individual. Cierre formal del módulo con reflexiones de aprendizaje.`;
      cierreEval = `Evaluación Sumativa: Rúbrica de sustentación oral, registro de coevaluación/autoevaluación y nota final de cierre de módulo (Fase III - FVP ${st.ponderacionGlobalModuloTexto}).`;
      tarea = `Subir el portafolio final consolidado en formato PDF al repositorio institucional de la especialidad.`;
    }

    const evalRow: GuionEvaluacionRow = {
      no: 1,
      actividad: `${st.etapa}: ${st.evidenciasSugeridas}`,
      ponderacion: `Fase ${st.faseId}: ${st.ponderacionGlobalModuloTexto}`,
      fechaRealizacion: fechaTexto,
    };

    return {
      id: `guion_${modCodigo}_s${sesionNumero}`,
      sesionNumero,
      totalSesiones,
      moduloCodigo: modCodigo,
      moduloNombre: modNombre,
      docente,
      gradoSeccion,
      semanaModulo: semanaTexto,
      semanaNumero,
      fecha: fechaTexto,
      unidad: unidadTitle,
      contenido,
      tiempo: `${horasSesion} Horas pedagógicas (${st.tiempo})`,
      horas: horasSesion,
      etapaAccionCompleta: st.etapa,
      etapaNumero: stageId,
      faseEvaluacion: `${st.faseNombre} [${st.fasePonderacionGlobal}]`,
      objetivoClase,
      indicadorLogro,
      competenciasEspecificas: competencias,
      ejeTransversal,
      inicioSituacion: inicioSit,
      inicioEvaluacion: inicioEval,
      desarrolloSituacion: desSit,
      desarrolloEvaluacion: desEval,
      cierreSituacion: cierreSit,
      cierreEvaluacion: cierreEval,
      adaptacionesCurriculares: adaptaciones,
      actividadesEvaluacion: [evalRow],
      tarea,
      bibliografia: biblio,
      recursosClase: recursos,
      tics,
    };
  });
}

export function exportGuionesToWord(
  guiones: GuionDeClase[],
  headerData: InstitutionalHeader,
  module?: ModuleDescriptor,
  mode: 'single' | 'all' = 'all'
) {
  const modNombre = module?.nombre || guiones[0]?.moduloNombre || 'Módulo Técnico';
  const modCodigo = module?.codigo || guiones[0]?.moduloCodigo || 'BTVDG';
  const anoLectivo = headerData.anoLectivo || '2026';
  const fileName =
    mode === 'single' && guiones.length === 1
      ? `Guion_Clase_${modCodigo}_Semana_${guiones[0].semanaNumero || guiones[0].sesionNumero}_${guiones[0].etapaNumero}.doc`
      : `Guiones_Clase_Cronograma_${modCodigo}_${anoLectivo}.doc`;

  let bodyHtml = '';

  guiones.forEach((g, index) => {
    const isLast = index === guiones.length - 1;
    const pageBreak = !isLast ? '<div style="page-break-after: always; mso-special-character: line-break;"></div>' : '';

    bodyHtml += `
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
          <td style="width: 65%; vertical-align: middle;">
            <h1 style="font-size: 16pt; font-weight: bold; color: #1e3a8a; margin: 0; padding: 0; text-transform: uppercase;">
              Guion de clase ${anoLectivo}
            </h1>
            <div style="font-size: 9pt; color: #475569; margin-top: 2px;">
              <strong>Módulo [${g.moduloCodigo}]:</strong> ${g.moduloNombre} &nbsp;|&nbsp; <strong>${g.etapaAccionCompleta}</strong>
            </div>
          </td>
          <td style="width: 35%; text-align: right; vertical-align: middle;">
            <div style="font-size: 11pt; font-weight: bold; color: #0f172a; text-transform: uppercase; line-height: 1.1;">
              COLEGIO SALESIANO<br><span style="color: #2563eb; font-size: 13pt;">SAN JOSÉ</span>
            </div>
            <div style="font-size: 8pt; color: #64748b;">Santa Ana, El Salvador</div>
          </td>
        </tr>
      </table>

      <hr style="border: 0; height: 2px; background-color: #2563eb; margin-bottom: 10px;" />

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 9.5pt;">
        <tr style="background-color: #f1f5f9;">
          <td style="width: 15%; font-weight: bold; padding: 5px; border: 1px solid #cbd5e1;">Docente :</td>
          <td colspan="5" style="padding: 5px; border: 1px solid #cbd5e1; font-weight: 600; color: #0f172a;">${g.docente}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Grado y sección:</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; width: 25%;">${g.gradoSeccion}</td>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc; width: 14%;">Semana Cronograma:</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; width: 20%; font-weight: 600; color: #1e40af;">${g.semanaModulo}</td>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc; width: 8%;">Fecha:</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; width: 18%;">${g.fecha}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Unidad :</td>
          <td colspan="5" style="padding: 5px; border: 1px solid #cbd5e1; font-weight: 600;">${g.unidad}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Contenido :</td>
          <td colspan="3" style="padding: 5px; border: 1px solid #cbd5e1;">${g.contenido}</td>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Tiempo:</td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: bold; color: #1e40af;">${g.tiempo}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Objetivo de la clase:</td>
          <td colspan="5" style="padding: 5px; border: 1px solid #cbd5e1; line-height: 1.3;">${g.objetivoClase}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Indicador de logro:</td>
          <td colspan="5" style="padding: 5px; border: 1px solid #cbd5e1; line-height: 1.3; font-weight: 600; color: #0369a1;">${g.indicadorLogro}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc;">Competencias específicas:</td>
          <td colspan="5" style="padding: 5px; border: 1px solid #cbd5e1; line-height: 1.3;">${g.competenciasEspecificas}</td>
        </tr>
      </table>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 6px 10px; margin-bottom: 12px; font-size: 9pt; border-left: 4px solid #2563eb;">
        <strong>Eje transversal (si aplica):</strong> ${g.ejeTransversal}
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt;">
        <thead>
          <tr style="background-color: #1e3a8a; color: #ffffff;">
            <th style="width: 55%; padding: 7px; border: 1px solid #1e3a8a; text-align: center; text-transform: uppercase; font-size: 9.5pt;">
              SITUACIONES DE APRENDIZAJE
            </th>
            <th style="width: 45%; padding: 7px; border: 1px solid #1e3a8a; text-align: center; text-transform: uppercase; font-size: 9.5pt;">
              EVALUACIÓN<br><span style="font-size: 8pt; font-weight: normal; opacity: 0.9;">(diagnóstica, formativa o sumativas)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 7px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="font-weight: bold; color: #1e40af; font-size: 9.5pt; margin-bottom: 4px;">Inicio</div>
              <div style="line-height: 1.35; color: #1e293b;">${g.inicioSituacion}</div>
            </td>
            <td style="padding: 7px; border: 1px solid #cbd5e1; vertical-align: top; background-color: #f8fafc;">
              <div style="font-weight: bold; color: #0284c7; font-size: 8.5pt; margin-bottom: 3px;">Estrategia Diagnóstica (Sin valor numérico)</div>
              <div style="line-height: 1.35; color: #334155; font-size: 8.5pt;">${g.inicioEvaluacion}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 7px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="font-weight: bold; color: #1e40af; font-size: 9.5pt; margin-bottom: 4px;">Desarrollo</div>
              <div style="line-height: 1.35; color: #1e293b;">${g.desarrolloSituacion}</div>
            </td>
            <td style="padding: 7px; border: 1px solid #cbd5e1; vertical-align: top; background-color: #f8fafc;">
              <div style="font-weight: bold; color: #059669; font-size: 8.5pt; margin-bottom: 3px;">Evaluación Formativa (Comprensión e interpretación)</div>
              <div style="line-height: 1.35; color: #334155; font-size: 8.5pt;">${g.desarrolloEvaluacion}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 7px; border: 1px solid #cbd5e1; vertical-align: top;">
              <div style="font-weight: bold; color: #1e40af; font-size: 9.5pt; margin-bottom: 4px;">Cierre / finalización</div>
              <div style="line-height: 1.35; color: #1e293b;">${g.cierreSituacion}</div>
            </td>
            <td style="padding: 7px; border: 1px solid #cbd5e1; vertical-align: top; background-color: #f8fafc;">
              <div style="font-weight: bold; color: #d97706; font-size: 8.5pt; margin-bottom: 3px;">Sumativa / Desempeño (% Cuadro de Actividades)</div>
              <div style="line-height: 1.35; color: #334155; font-size: 8.5pt;">${g.cierreEvaluacion}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 7px; border: 1px solid #cbd5e1; font-weight: bold; background-color: #f1f5f9; color: #334155;">
              Adaptaciones curriculares
            </td>
            <td style="padding: 6px 7px; border: 1px solid #cbd5e1; font-size: 8.5pt; color: #475569; background-color: #ffffff;">
              ${g.adaptacionesCurriculares}
            </td>
          </tr>
        </tbody>
      </table>

      <div style="font-size: 9.5pt; font-weight: bold; color: #1e3a8a; margin-bottom: 4px; text-transform: uppercase;">
        Actividades de Evaluación
      </div>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9pt;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #0f172a;">
            <th style="width: 8%; padding: 5px; border: 1px solid #cbd5e1; text-align: center;">N°</th>
            <th style="width: 52%; padding: 5px; border: 1px solid #cbd5e1; text-align: left;">Actividad de evaluación</th>
            <th style="width: 20%; padding: 5px; border: 1px solid #cbd5e1; text-align: center;">Ponderación</th>
            <th style="width: 20%; padding: 5px; border: 1px solid #cbd5e1; text-align: center;">Fecha de realización</th>
          </tr>
        </thead>
        <tbody>
          ${g.actividadesEvaluacion
            .map(
              (act, aIdx) => `
            <tr>
              <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold;">${act.no || aIdx + 1}</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1;">${act.actividad}</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center; font-weight: bold; color: #1e40af;">${act.ponderacion}</td>
              <td style="padding: 5px; border: 1px solid #cbd5e1; text-align: center;">${act.fechaRealizacion}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-bottom: 15px;">
        <tr>
          <td style="width: 18%; font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top;">
            Tarea:
          </td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${g.tarea || 'Consolidar bitácora técnica de avance.'}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top;">
            Bibliografía:
          </td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; font-size: 8pt; color: #475569; line-height: 1.3;">
            ${g.bibliografia.replace(/\n/g, '<br>')}
          </td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top;">
            Recursos de clase:
          </td>
          <td style="padding: 5px; border: 1px solid #cbd5e1;">${g.recursosClase}</td>
        </tr>
        <tr>
          <td style="font-weight: bold; padding: 5px; border: 1px solid #cbd5e1; background-color: #f8fafc; vertical-align: top;">
            Tics:
          </td>
          <td style="padding: 5px; border: 1px solid #cbd5e1; font-weight: 600; color: #2563eb;">${g.tics}</td>
        </tr>
      </table>

      ${pageBreak}
    `;
  });

  const fullWordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Guiones de Clase ${anoLectivo} - ${modCodigo}</title>
      <style>
        @page {
          size: letter portrait;
          margin: 1.8cm 1.5cm 1.8cm 1.5cm;
          mso-page-orientation: portrait;
        }
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 9.5pt;
          color: #0f172a;
          line-height: 1.25;
        }
        h1, h2, h3 {
          font-family: 'Calibri', 'Arial', sans-serif;
        }
      </style>
    </head>
    <body>
      ${bodyHtml}
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', fullWordHtml], {
    type: 'application/msword;charset=utf-8',
  });

  const downloadLink = document.createElement('a');
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = fileName;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(downloadLink.href);
}
