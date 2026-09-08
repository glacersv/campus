# Session Log - 9 Agosto 2026

## Cambios realizados

### 1. Sidebar unificado (RoleLayout + TeacherLayout)
- Section headers usan CSS class `.sidebar-section-title` (igual que admin)
- Menu items usan `.sidebar-item` CSS class (igual que admin)
- Logo `w-8 h-8 rounded-xl` consistente
- User card sin fondo `bg-slate-50`

### 2. Banner verde en "Mi Proyecto"
- Cambiado de naranja `#EA580C` a verde primary `#25855A`
- Gradiente, decoraciones, badge y botón — todo verde

### 3. Evaluación de rúbrica (docente)
- **ModalCalificacion** en `ActividadEvaluada.tsx`
- Botón 1-5 por criterio con label y color
- Puntos calculados: `(peso ÷ 5) × nivel`
- Total `XX/100 → X.X/10`
- Campo de observaciones
- `calificarActividad()` en `firestore.ts` ahora acepta `calificacionesCriterios`

### 4. Botón Reset (docente)
- `resetCalificacion()` en `firestore.ts` — limpia nota y vuelve estado a `publicada`
- Botón "Reset" amarillo en actividades calificadas
- Confirma antes de borrar

### 5. Vista alumno mejorada
- Badge verde "Nota: X.X/10" directamente en la card
- Fecha de evaluación "Evaluado el 9 de agosto de 2026"
- Botón "Ver calificación" expande carrusel con desglose
- Stats "Total/Calificadas" eliminados
- URL de entrega eliminada

### 6. Puntos por nivel en rúbrica
- Cada nivel muestra cuántos puntos vale
- Badge de color alineado al nivel

### 7. Permisos de roles arreglados
- `getDefaultModulesForRole()` como fallback en `App.tsx`
- `fixRolesPermissions()` corrige IDs incorrectos en Firestore
- Seed crea todos los roles: admin, docente, alumno, coordinacion, coordinacion_academica, registro_academico, enfermeria, psicopedagogico

### 8. Filtros en "Alumnos sin Cuenta"
- Buscador por nombre/carnet
- Filtro por grado (select)
- Paginación 20 por página

### 9. Tipo de actividad Arduino
- Nuevo `arduino` en `TipoActividad` con icono 🔧
- Dropdown de herramientas con sugerencias incluyendo Arduino

### 10. Herramientas con dropdown
- Sugerencias: Google Docs, Canva, Arduino, Scratch, Python, VS Code, etc.
- Filtro en tiempo real al escribir

## Archivos modificados principales
- `src/types.ts` — Arduino tipo actividad
- `src/lib/firestore.ts` — `calificarActividad()`, `resetCalificacion()`, `fixRolesPermissions()`, seed roles
- `src/contexts/AuthContext.tsx` — llama `fixRolesPermissions()` en login
- `src/App.tsx` — fallback `getDefaultModulesForRole()` para permisos
- `src/components/admin/AdminLayout.tsx` — sidebar unificado
- `src/components/shared/RoleLayout.tsx` — sidebar unificado
- `src/components/docente/TeacherLayout.tsx` — sidebar unificado
- `src/components/proyectos/ProjectsModule.tsx` — vista alumno, fecha evaluación, sin URL
- `src/components/proyectos/ActividadEvaluada.tsx` — ModalCalificacion, botón Reset, dropdown herramientas, Arduino
- `src/components/admin/UsersManager.tsx` — filtros y paginación alumnos

## Deploy
- Firebase: `npm run deploy`
- GitHub: push a `feature/diseno-moderno-premium`

---

# Session Log - 28 Agosto 2026

## Objetivo
Integrar en el admin de campus la mejora de carga de archivos del repo `jornalizacion` (parsers inteligentes), enfocado SOLO en calendario (sin módulos, que son del docente). Y replicar el diseño HTML de carga de documentos de jornalizacion en el admin de campus.

## Repos
- campus: `https://github.com/glacersv/campus.git`
- jornalizacion: `https://github.com/glacersv/jornalizacion.git` (commit relevante `1582bab`)
- Copia local de jornalizacion en `C:\campus\jornalizacion-latest` (EXCLUIDA de git vía `.gitignore`)

## Rama de trabajo (IMPORTANTE)
- Todo el trabajo de calendario quedó en **`feature/calendario-institucional-unificado`** (push a origin, SIN merge a `main`).
- Se eliminó la rama `feature/integracion-lms` (local y remota) porque duplicaba a la unificada.
- Para continuar en otra máquina: `git fetch origin && git checkout feature/calendario-institucional-unificado`

## Qué se hizo
1. **Parsers inteligentes** (commit `9e4789f`): creado `src/utils/fileImportParsers.ts` adaptado a tipos campus (`MonthStats`, `AcademicPeriod`), SIN módulos. Funciones: `extractHorizontalMonthsFromGrid`, `extractVerticalMonthsFromGrid`, `extractMonthsFromFreeText`, `extractAcademicPeriodsFromText`, `parseExcelFile`, `parseWordFile` (mammoth), `parsePdfFile` (pdfjs jsdelivr), `parseTextFile`, `parseJsonContent`, `analyzeExtractedText`, `generateExcelTemplateWorkbook` (2 hojas: `Periodos_Evaluaciones_2026`, `Calendario_Dias_Habiles`), `createEmpty12Months`, `createDefault12Months`.
   - Dependencias agregadas: `mammoth`, `file-saver`, `@types/file-saver`.
2. **InstitutionalCalendar.tsx**: handlers `handleImportExcel/Word/Pdf/Json/Text` usan parsers; export Excel usa `generateExcelTemplateWorkbook`+`saveAs`; export JSON usa `saveAs`; se aceptan `.txt/.md`. Botones "Vaciar Calendario" (modal confirm) y "Restaurar Valores Predeterminados".
3. **Rediseño Parte 5 (commit `253200f`)**: replicado el HTML de jornalizacion (sin módulos/grado):
   - Banner "Vaciar Calendario Anual (12 Meses)" con badge `{totalSemanas} sem • {totalDias} días`
   - 3 métodos: Lector Inteligente / Plantilla Excel Oficial / Edición Manual
   - Container con 3 pestañas: Subir Archivo Local (dropzone), Pegar Texto o Tabla (`analyzeExtractedText`), JSON / Respaldo (pegar o subir .json)
   - Estado Actual en Memoria: Semanas, Días Hábiles, Bimestres, Pausas/Asuetos
   - Descargar y Respaldar: JSON, Excel, Restaurar Predeterminados
4. Se eliminó de admin el botón "Sincronizar Fechas" (es del docente). Módulos NO van en admin.

## Notas técnicas
- `analyzeExtractedText(fileName, fileSize, rawText, fileType)` requiere 4 args (no 2).
- La sección "Cronograma de Actividades, Descansos y Pausas Pedagógicas" (Parte 3 / `SuspensionesManager.tsx:343`) queda LIMPIA tras subir archivos: parsers solo extraen meses+bimestres, NO eventos/pausas (igual que jornalizacion).
- `tsc --noEmit` tiene errores PRE-EXISTENTES en `GradesManager.tsx`, `TeacherLMSDashboard.tsx`, `LMSModule.tsx`, `firestore.ts` — NO relacionados con calendario.

## Archivos modificados
- `src/components/admin/InstitutionalCalendar.tsx` (núcleo)
- `src/utils/fileImportParsers.ts` (nuevo)
- `src/data/calendarData.ts` (datos base)
- `.gitignore` (jornalizacion-latest/)
- `package.json` (mammoth, file-saver)

## Pendiente
- Investigar si `SuspensionesManager.tsx` de campus está desactualizado vs jornalizacion `1582bab` (ese commit cambió 773 líneas ese archivo).
- Decidir si las pausas/suspensiones deben auto-detectarse desde documentos (hoy NO se hace).
- Lint errores previos fuera de alcance de calendario.

---

# Session Log - 3 Septiembre 2026

## Separación de Niveles en Calendario Académico 2026 (Educación Básica y Parvularia vs Educación Media)

### Qué se hizo
1. **Lector de PDF (`src/utils/fileImportParsers.ts`)**:
   - Resuelto bug donde solo se procesaba la Página 1 (`page1Data || page2Data`), descartando la Página 2 (Educación Parvularia y Básica).
   - Implementado agrupamiento de líneas con tolerancia geométrica vertical (`extractPeriodsFromPdfLines`) para extraer fielmente:
     - **Página 1**: Educación Media con 4 Bimestres (`periodsMedia`).
     - **Página 2**: Educación Parvularia y Básica con 3 Trimestres (`periodsBasica`).
   - Soporte en exportación e importación Excel (`Trimestres_Parvularia_Basica` y `Periodos_Educacion_Media`) y JSON.
2. **Datos Base Oficiales (`src/data/calendarData.ts`)**:
   - `academicPeriodsBasica2026`: 3 Trimestres completos (actividades 35%, diagnósticas, refuerzo, PO 30%, entrega de boletas K4-9°, temarios y proyectos).
   - `academicPeriodsMedia2026`: 4 Bimestres completos.
3. **Tipos (`src/types.ts`)**:
   - Añadido `nivel?: 'media' | 'basica' | 'todos'` a `AcademicPeriod`.
   - Soporte de `periodsMedia` y `periodsBasica` en `ParsedDocumentResult`.
4. **Diseño en Panel Admin (`src/components/admin/InstitutionalCalendar.tsx`)**:
   - Pestañas ergonómicas en Parte 2 para alternar entre **Educación Parvularia y Básica** (3 Trimestres) y **Educación Media** (4 Bimestres).
   - Tarjetas interactivas adaptables (3 columnas en Básica `T1-T3` y 4 columnas en Media `P1-P4`).
   - Tabla de detalle de actividades con fechas, ingreso TBox y ponderaciones.
   - KPI superior con ambos conteos (`3 Trimestres / 4 Bimestres`).

## Session Log - 3 Septiembre 2026

### Migraci�n a clases CSS unificadas (Tier 1)

#### Card containers ? card-crema
Migrados 20+ componentes que usaban bg-white rounded-2xl/3xl border border-slate-* hacia la clase CSS unificada .card-crema:
- Admin: AdminDashboard, AttendanceReportsHistory, SuspensionesManager, SchoolYearManager, UsersManager
- InstitutionalCalendar, Proyectos (ActividadEvaluada, ProjectsModule, AdminPanel, EvaluacionProyecto, ProyectosDashboard, SugerenciaInformatica)
- Shared: StatPillCards
- Other modules: HorarioView, AvisosView, EventosView, ModulePlaceholder, ProyectosAdmin

#### Modal overlays/containers
- SuspensionesManager: 2 modal overlays ? .modal-backdrop, 2 containers ? .modal-container
- InstitutionalCalendar: modal overlay ? .modal-backdrop, container ? .modal-container

#### Inputs ? input-crema
- AttendanceReportsHistory, SuspensionesManager, ActividadEvaluada, ProjectsModule, Login, NotasView

#### Buttons ? btn-primary/btn-secondary/btn-danger
- SuspensionesManager, ActividadEvaluada, ProjectsModule

#### Verification
- npx tsc --noEmit ? 0 errors
- npm run build ? success (11.40s)

---

# Session Log - 8 Septiembre 2026

## Integración de Documentos Docente (Guiones de Clase + Planificación Didáctica)

### Objetivo
Integrar las funcionalidades de generación de documentos del repo externo `jornalizacion-latest/` hacia la sección **docente** de la app principal, habilitado **únicamente para docentes de Bachillerato Técnico** (grados 10t, 11t, 12t).

### Rama
- `feature/documentos-docente-btv` (merge a `main`)

### Qué se hizo

#### 1. Tipos (`src/types.ts`)
- Agregado `EtapaAccionCompletaInfo` interface (15 campos para las 6 etapas de la acción completa)
- Agregado `StageJornalizacionItem` interface (para jornalización)

#### 2. Helper BTV (`src/utils/isBTVTeacher.ts`) - NUEVO
- `isTeacherBTVByGrade(teacher)` - Verifica por `guideGradeId` ∈ ['10t', '11t', '12t']
- `isTeacherBTVByModules(teacherId, modules)` - Verifica por módulos LMS con `gradeId` técnico
- `isBTBaccalaureateGrade(gradeId)` - Verifica si un gradeId es BTV
- `isTechnicalGrade(grade)` - Verifica `baccalaureateType === 'tecnico'`
- `getBTVGrades(grades)` - Retorna grados BTV de una lista
- `BTV_GRADE_IDS` - Constante ['10t', '11t', '12t']

#### 3. Guiones de Clase (`src/utils/guionDeClaseHelper.ts`) - NUEVO
- `getSessionWeekAndDates()` - Calcula fechas y semana del módulo
- `generateModuleGuiones()` - Genera 6 guiones (uno por etapa) con contenido contextualizado
- `exportGuionesToWord()` - Exporta a Word (.doc) con formato oficial MINED
- Soporta: Diseño Gráfico, Empaque, 3D, Marca, Editorial, Inglés, Orientación, Genérico

#### 4. Planificación Didáctica (`src/utils/didacticPlanHelper.ts`) - NUEVO
- `getMonthNumber()` - Convierte nombre mes español a número
- `formatModuleDateRange()` - Formato "DD/MM/YYYY - DD/MM/YYYY"
- `getModuleStagesAccionCompleta()` - Genera 6 etapas con horas y ponderaciones
- `getDefaultDidacticPlan()` - Plan por defecto para cualquier módulo
- `getGranular6StagesPlan()` - 6 actividades (una por etapa)
- `exportDidacticPlanToWord()` - Exporta a Word con portada, separador y matriz

#### 5. Firestore CRUD (`src/lib/firestore.ts`)
- `getPlanDidactico(moduleId)` - Lee plan de Firestore
- `savePlanDidactico(moduleId, plan)` - Guarda plan en Firestore
- `getGuiones(moduleId)` - Lee guiones de Firestore
- `saveGuiones(moduleId, guiones)` - Guarda guiones en Firestore
- Subcolección: `lms_modules/{moduleId}/docente_docs/`

#### 6. Componente GuionDeClaseView (`src/components/docente/documentos/GuionDeClaseView.tsx`) - NUEVO
- Selector de módulo
- Timeline de sesiones (6 guiones)
- Modo edición/visualización
- Tabla de datos generales
- Situaciones de aprendizaje vs evaluación
- Actividades de evaluación (add/remove/edit)
- Export Word (sesión actual / todos)
- Guardar en Firestore

#### 7. Componente PlanificacionDidacticaView (`src/components/docente/documentos/PlanificacionDidacticaView.tsx`) - NUEVO
- Selector de módulo
- Guía de 6 etapas
- Datos generales del módulo
- Saberes (conceptuales/procedimentales/actitudinales)
- Actividades de evaluación
- Recursos, TICs, Bibliografía
- Export Word con portada y matriz oficial

#### 8. Sidebar (`src/components/docente/TeacherLayout.tsx`)
- Nueva sección "DOCUMENTACIÓN DOCENTE" (visible solo para BTV)
- Iconos: `FileText` (guiones), `ClipboardList` (planificación)
- Gate: `permissions.includes('lms') && isBTV`
- useEffect para cargar teacher y verificar BTV

#### 9. Rutas (`src/App.tsx`)
- `/docente/documentos/guiones` → `GuionDeClaseView`
- `/docente/documentos/planificacion` → `PlanificacionDidacticaView`
- Gate: `permissions.includes('lms') && isBTVTeacher`
- Wrapper components para cargar módulos del docente

#### 10. Dashboard (`src/components/docente/DocenteDashboard.tsx`)
- Tarjetas "Guiones de Clase" y "Planificación Didáctica" (solo BTV)
- useEffect para verificar BTV al cargar

### Dependencia agregada
- `file-saver` (ya estaba instalada)

### Verificación
- `npx tsc --noEmit` → 2 errores pre-existentes (no relacionados)
- `npm run build` → ✅ success (28s)

### Archivos modificados
| Archivo | Acción |
|---------|--------|
| `src/types.ts` | Modificado (+36 líneas) |
| `src/App.tsx` | Modificado (+69/-5) |
| `src/lib/firestore.ts` | Modificado (+40 líneas) |
| `src/components/docente/TeacherLayout.tsx` | Modificado (+45/-2) |
| `src/components/docente/DocenteDashboard.tsx` | Modificado (+38/-5) |
| `src/components/docente/documentos/GuionDeClaseView.tsx` | NUEVO (413 líneas) |
| `src/components/docente/documentos/PlanificacionDidacticaView.tsx` | NUEVO (339 líneas) |
| `src/utils/isBTVTeacher.ts` | NUEVO (50 líneas) |
| `src/utils/guionDeClaseHelper.ts` | NUEVO (428 líneas) |
| `src/utils/didacticPlanHelper.ts` | NUEVO (750 líneas) |

**Total: 10 archivos, +2203 líneas**

### Cómo funciona
1. Login como docente BTV → sidebar muestra "Guiones de Clase" y "Planificación Didáctica"
2. Login como docente NO-BTV → esas opciones NO aparecen
3. Los datos se guardan en Firestore subcolección `docente_docs`
4. Exporta a Word (.doc) con formato oficial MINED

### Pendiente (Fase 2)
- Integrar `PlanificacionDidacticaView` con modo "todos los módulos"
- Agregar selector de grado (10°, 11°, 12°)
- Exportación a PDF nativa
- Historial de versiones de documentos
