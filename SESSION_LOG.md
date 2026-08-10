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
