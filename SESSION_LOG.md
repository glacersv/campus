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
