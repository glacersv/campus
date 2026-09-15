# Campus Salesiano San José

## Stack
React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase (Auth + Firestore)

## Arquitectura
- `src/types.ts` — Tipos compartidos: UserRole, RoleConfig, SystemModuleId, TipoActividad (incluye arduino)
- `src/firebase.ts` — Inicialización Firebase + `saveAttendanceReport`
- `src/lib/firestore.ts` — CRUD completo: users, teachers, grades, students, roles + `seedInitialData()` + `fixRolesPermissions()` + `calificarActividad()` + `resetCalificacion()`
- `src/contexts/AuthContext.tsx` — Auth con roles dinámicos, `hasPermission()`, llama `fixRolesPermissions()` en login
- `src/components/shared/Login.tsx` — Login con toggle registro
- `src/components/docente/Dashboard.tsx` — Dashboard del docente para tomar asistencia
- `src/components/docente/SummaryModal.tsx` — Modal de resumen con sync a Firestore + export CSV/JSON
- `src/components/shared/RoleLayout.tsx` — Layout reutilizable para roles no-admin (sidebar con `.sidebar-item`)
- `src/components/docente/TeacherLayout.tsx` — Layout para docente
- `src/components/admin/AdminLayout.tsx` — Layout admin
- `src/components/admin/` — Panel admin: Dashboard, CRUD, RolesManager, UsersManager (filtros/paginación)
- `src/components/proyectos/ProjectsModule.tsx` — Vista proyecto: alumno (card + rúbrica + fecha evaluación) y docente
- `src/components/proyectos/ActividadEvaluada.tsx` — CRUD actividades + ModalCalificacion + Reset + dropdown herramientas
- `src/components/coordinacion/` — Dashboard de Coordinación Académica
- `src/components/registro/` — Dashboard de Registro Académico
- `src/components/enfermeria/` — Dashboard de Enfermería
- `src/components/psicopedagogia/` — Dashboard de Psicopedagogía
- `src/components/InstitutionLogo.tsx` — Logo institucional con fallback SVG
- `SESSION_LOG.md` — Log de cambios por sesión

## Firebase
- Proyecto: `campus-27248`
- Colección principal: `attendance_reports`
- Colección roles: `roles` (permisos por módulo)
- Firestore rules en `firestore.rules`

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

## Estado Actual
- Login con email/password funcional
- 7 roles configurados con permisos por módulo
- Panel admin: CRUD docentes, grados, alumnos, roles
- Dashboard por rol con módulos habilitados
- Seed data ejecuta automáticamente al iniciar sesión
- Roles pueden crearse desde el admin (RolesManager)

## Pendiente (Fase 2)
- Integración Microsoft Azure AD
- Exportación PDF
- Historial de reportes
- Dashboard estadístico
- Desarrollo de vistas internas de cada módulo (notas, horario, etc.)

## Comandos
- `npm run dev` — Dev server en puerto 3000
- `npm run build` — Build producción a `dist/`
- `npm run lint` — TypeScript check
- `npm run deploy` — Build + firebase deploy hosting
- `npm run rules` — firebase deploy firestore:rules

## Super Admin
- Email: admin@salesianosanjose.edu.sv
- Rol: admin

## Docente Principal (BTV)
- Email: jose.marquez@salesianosanjose.edu.sv
- Nombre: Giovanni Marquez
- Rol: docente (11° Técnico)