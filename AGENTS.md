# Campus Salesiano San José (SIAI - Premium Version)

## 🌟 Directivas de Preservación de Diseño Premium (Instrucciones para OpenCode / DeepSeek)

> **IMPORTANTE PARA IA / OPENCODE / DEEPSEEK:** Este proyecto ha sido elevado a un estándar de mercado de nivel **Premium**. Para cualquier solicitud futura de cambios, adición de módulos, o refactorización, la IA **DEBE obedecer estrictamente las siguientes directivas** para conservar la consistencia de diseño visual, la fluidez y la seguridad.

### 1. Paleta de Colores y Estética Institucional
* **Verde Institucional (Principal):** `#12562E` (`text-primary`, `bg-primary`, `hover:bg-primary-dark`). No usar verdes chillones o genéricos de Tailwind.
* **Tipografías:** Outfit para títulos (`font-display`), Plus Jakarta Sans para el cuerpo (`font-sans`).
* **Efectos Visuales Premium:**
  * Usar bordes suaves `border-slate-200/80` con sombras sutiles `shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all`.
  * Los fondos translúcidos en modales deben tener un difuminado sutil usando `backdrop-blur-xs` y fondo `bg-slate-900/60`.

### 2. Estructura de Formularios (Cero Layout-Shifting)
* **PROHIBIDO:** Colocar formularios de creación o edición directamente en la misma línea o expandiendo filas de tablas (ya que empujan el contenido y causan desorden visual).
* **OBLIGATORIO:** Todos los formularios de registro, creación y edición (para alumnos, profesores, grados, laboratorios, edificios, etc.) se deben abrir en **Modales Superpuestos Centrados** utilizando la biblioteca `motion/react` o `framer-motion` para transiciones de escala (`scale` de 0.95 a 1) y opacidad (`opacity` de 0 a 1).

### 3. Tarjetas Administrativas de KPI (Premium KPI Cards)
* Las tarjetas de listados de elementos administrativos (Edificios, Laboratorios, Materias, Profesores) deben usar la estructura Premium unificada:
  ```tsx
  className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between"
  ```
* Se debe usar una cuadrícula responsiva estandarizada para todos los paneles:
  ```tsx
  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
  ```
* Los botones de acción (Editar, Eliminar) deben permanecer siempre visibles en el pie de la tarjeta, de forma elegante y no invasiva.
* En `SectionsManager.tsx`, las tarjetas representan KPIs consolidados (total de alumnos, capacidad, progreso de ocupación), postergando la administración granular de las secciones dentro del modal analítico interactivo de la letra de sección.

### 4. Ordenamiento Cronológico Obligatorio (Kínder a Bachillerato)
* En cualquier vista que liste grados o secciones (`SectionsManager`, `GradesManager`, reportes, etc.), el ordenamiento **nunca** debe ser alfabético plano por ID (ej: "10" antes que "2").
* Se debe aplicar la función de pesos cronológicos `getGradeSortWeight` para ordenar correctamente:
  1. Parvularia/Kínder: K4, K5, K6 (Prep.) (Rango de pesos 10-12).
  2. Básica: 1° a 9° Grado (Rango de pesos 21-29).
  3. Bachillerato: 1°, 2°, 3° Año (Rango de pesos 40-45).
* Incluir los filtros rápidos cronológicos de niveles (*Todos, Parvularia, Básica, Bachillerato*) mediante botones tipo píldora (`filter-pill`).

### 5. Estándares Técnicos y Rendimiento
* **Paginación Local Fluida:** Para listas que manejen más de 50 registros (como `StudentsManager.tsx` con más de 700 estudiantes), se debe implementar paginación del lado del cliente de 20 en 20 elementos para evitar retardos o congelamiento del navegador.
* **Seguridad (AuthContext):** El registro libre está estrictamente restringido. Solo pueden registrarse los correos presentes en la colección `/teachers` o el correo del Super Admin (`jose.marquez@salesianosanjose.edu.sv`).
* **Soporte Offline (Firestore):** Se conserva la inicialización de caché local persistente con soporte multi-pestaña:
  ```typescript
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
  ```
* **Visualizaciones:** Los gráficos de barras en Recharts (`AdminDashboard.tsx`) deben usar barras con bordes superiores redondeados utilizando la propiedad `radius={[12, 12, 0, 0]}` para un look ultra-moderno.
* **Exportador PDF:** Las plantillas de impresión PDF en `SummaryModal.tsx` utilizan estilos de vectores limpios y bloques de firmas para coordinadores y docentes. No alterar esta estructura.

---

## Stack
React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase (Auth + Firestore)

## Arquitectura
- `src/types.ts` — Tipos compartidos: UserRole, RoleConfig, SystemModuleId
- `src/firebase.ts` — Inicialización Firebase + `saveAttendanceReport` con Offline Persistence
- `src/lib/firestore.ts` — CRUD completo: users, teachers, grades, students, roles, sections + Registro de Actividades / Auditoría (`logActivity()`)
- `src/contexts/AuthContext.tsx` — Auth con roles dinámicos, `hasPermission()`, `isRole()`, y pre-autorización de correos institucional/docentes.
- `src/components/Login.tsx` — Login con toggle registro
- `src/components/Dashboard.tsx` — Dashboard del docente para tomar asistencia
- `src/components/SummaryModal.tsx` — Modal de resumen con sync a Firestore + export CSV/JSON + Exportador PDF de alta fidelidad para impresión física
- `src/components/shared/RoleLayout.tsx` — Layout reutilizable para roles no-admin
- `src/components/admin/` — Panel admin: Dashboard (con Recharts), CRUD (StudentsManager con paginación local), SectionsManager (Analytics cronológico), GradesManager (Catálogo a pantalla completa sin sidecards), TeachersManager, GradeSectionAssignment (Modal interactivo para asignación de edificios)
- `src/components/coordinacion/` — Dashboard de Coordinación Académica
- `src/components/registro/` — Dashboard de Registro Académico
- `src/components/enfermeria/` — Dashboard de Enfermería
- `src/components/psicopedagogia/` — Dashboard de Psicopedagogía
- `src/components/InstitutionLogo.tsx` — Logo institucional con fallback SVG

## Firebase
- Proyecto: `campus-27248`
- Colección principal: `attendance_reports`
- Colección roles: `roles` (permisos por módulo)
- Colección auditoría: `activity_logs`
- Firestore rules en `firestore.rules` (Con lectura pública en `teachers` exclusivamente para pre-autorizar registros sin iniciar sesión).

## Roles del Sistema
| Rol | ID | Módulos |
|-----|-----|---------|
| Administrador | `admin` | Todos |
| Coordinación | `coordinacion` | formacion, notas, clase, horario, eventos, avisos, proyectos |
| Registro Académico | `registro_academico` | notas, horario |
| Enfermería | `enfermeria` | formacion, avisos |
| Psicopedagogía | `psicopedagogio` | formacion, notas, avisos |
| Docente | `docente` | formacion, proyectos |
| Alumno | `alumno` | formacion, proyectos |

## Módulos del Sistema
- `formacion` — Formación Buenos Días (asistencia + disciplina)
- `notas` — Calificaciones y evaluaciones
- `clase` — Control de clases del día
- `horario` — Horarios de clases
- `eventos` — Eventos del colegio
- `avisos` — Comunicados y anuncios
- `proyectos` — Semana de la Juventud

## Comandos
- `npm run dev` — Dev server en puerto 3000
- `npm run build` — Build producción a `dist/`
- `npm run lint` — TypeScript check
- `npm run deploy` — Build + firebase deploy hosting
- `npm run rules` — firebase deploy firestore:rules

## Super Admin
- Email: jose.marquez@salesianosanjose.edu.sv
- Rol: admin
