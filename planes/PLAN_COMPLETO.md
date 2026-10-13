# Plan Completo — Campus Salesiano San José

> **Proyecto Firebase:** `campus-27248`  
> **URL Hosting:** https://campus-27248.web.app  
> **Stack:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase (Auth + Firestore + Hosting)  
> **Super Admin:** jose.marquez@salesianosanjose.edu.sv  
> **Último deploy:** 22 julio 2026

---

## 1. Origen del Proyecto

Sistema de **Control de Asistencia y Disciplina en Formación** para el Colegio Salesiano San José. Surge para reemplazar un sistema anterior (`gestion-escolar-cssj`) con una plataforma web moderna.

### Objetivos
- Control de asistencia diaria por grado/sección con 3 estados (Presente / Tarde / Ausente)
- Registro de disciplina (cabello largo, uñas pintadas, uniforme incorrecto)
- Gestión administrativa completa (docentes, grados, secciones, alumnos, materias)
- Infraestructura escolar: edificios, laboratorios de cómputo
- Exportación de reportes (CSV/JSON)
- Sincronización automática a Firestore

---

## 2. Arquitectura del Sistema

### 2.1 Flujo de commits

| Commit | Descripción |
|--------|-------------|
| `3bdc8af` | **Fix inicial** — Correcciones TypeScript, AGENTS.md con contexto del proyecto |
| `6aa48cf` | **Sistema completo** — Gestión académica con ciclos y bachillerato |
| `7adb4d9` | **Documentación** — Plan completo del proyecto (PLAN.md) |
| `202db56` | **Últimos cambios** — Estadísticas de laboratorio, estado grados/secciones, año escolar, migración alumnos |

### 2.2 Estructura de directorios

```
campus/
├── scripts/
│   ├── clear-firestore.cjs        # Limpiar toda la base de datos
│   ├── seed-firestore.cjs          # Seed completo (14 grados, 25 secciones, etc.)
│   └── migrate-alumnos.cjs         # Migración de 728 alumnos desde gestion-escolar-cssj
├── src/
│   ├── types.ts                    # Todos los tipos compartidos
│   ├── firebase.ts                 # Inicialización Firebase
│   ├── App.tsx                     # Router: /admin (admin) o /attendance (teacher)
│   ├── main.tsx                    # Entry point
│   ├── index.css                   # Tailwind v4 + glassmorphism + tema claro/oscuro
│   ├── vite-env.d.ts               # Tipos Vite
│   ├── contexts/
│   │   ├── AuthContext.tsx         # Auth con Firebase email/password
│   │   └── ThemeContext.tsx        # Tema claro/oscuro (localStorage)
│   ├── lib/
│   │   └── firestore.ts           # CRUD completo + seed + toggles + año escolar
│   ├── components/
│   │   ├── Login.tsx               # Login + registro toggle
│   │   ├── InstitutionLogo.tsx     # Logo oficial con fallback SVG
│   │   ├── ThemeSwitcher.tsx       # Botón sol/luna
│   │   ├── TeacherDashboard.tsx    # Dashboard del docente
│   │   ├── Dashboard.tsx           # Toma de asistencia (3 estados + disciplina)
│   │   ├── SummaryModal.tsx        # Resumen + sync Firestore + export CSV/JSON
│   │   ├── dashboard/
│   │   │   ├── AttendanceStats.tsx  # Estadísticas en vivo (asistencia, disciplina)
│   │   │   ├── SimulatorControls.tsx # Simulador de llegadas tarde
│   │   │   └── StudentCard.tsx      # Card de estudiante con estados
│   │   └── admin/
│   │       ├── AdminLayout.tsx       # Sidebar con navegación
│   │       ├── AdminDashboard.tsx    # Dashboard admin + inicio año escolar
│   │       ├── GradesManager.tsx     # CRUD grados + filtro por ciclo + estado
│   │       ├── SectionsManager.tsx   # CRUD secciones + edificio + laboratorio
│   │       ├── SubjectsManager.tsx   # CRUD materias
│   │       ├── BuildingsManager.tsx  # CRUD edificios + estadísticas por edificio
│   │       ├── ComputerLabsManager.tsx # CRUD laboratorios + estadísticas
│   │       ├── BaccalaureateTypesManager.tsx  # Tipos de bachillerato
│   │       ├── GradeSectionAssignment.tsx     # Asignación grado-sección-edificio
│   │       ├── TeachersManager.tsx   # CRUD docentes con perfil completo
│   │       └── StudentsManager.tsx   # CRUD alumnos por grado/sección
│   └── assets/
│       └── logo-salesiano.png       # Escudo oficial
├── firestore.rules                  # Reglas de seguridad Firestore
├── firebase.json                    # Config Firebase Hosting
├── firebase-blueprint.json          # Esquemas de datos
├── firebase-applet-config.json
├── metadata.json
├── PLAN_INICIAL.md                  # Plan inicial (20 julio 2026)
├── PLAN.md                          # Plan detallado
├── PLAN_COMPLETO.md                 # Este archivo
└── AGENTS.md                        # Contexto para la IA
```

### 2.3 Tipos principales (`src/types.ts`)

| Tipo | Campos clave |
|------|--------------|
| `User` | uid, email, displayName, role (admin\|teacher), teacherId, microsoftId |
| `Grade` | id, name, cycle (1\|2\|3\|4), baccalaureateType, **status** (ACTIVO\|INACTIVO), **schoolYear** |
| `Section` | id, name, gradeId, capacity, buildingId, **computerLabId**, **status**, **schoolYear** |
| `Building` | id, name, code, color, description |
| `ComputerLab` | id, name, buildingId, capacity, devices |
| `Teacher` | id, name, email, phone, specialty, subjects[], guideGradeId, guideSectionId |
| `Student` | id, **carnet?**, **firstName?**, **lastName?**, name, gender, gradeId, sectionId, **enrollmentYear?**, status, enrollmentHistory[] |
| `Subject` | id, name |
| `AttendanceSession` | date, teacherId, gradeId, sectionId, civicAct, records{} |
| `StudentSessionState` | studentId, status (Presente\|Tarde\|Ausente), discipline (cabello, uñas, uniforme) |

### 2.4 Firestore — Colecciones

| Colección | Uso |
|-----------|-----|
| `users/{uid}` | Perfiles de usuario (admin/teacher) |
| `teachers/{id}` | Docentes |
| `grades/{id}` | Grados con ciclo y estado |
| `sections/{id}` | Secciones con edificio y laboratorio |
| `subjects/{id}` | Materias |
| `students/{id}` | Alumnos |
| `buildings/{id}` | Edificios |
| `computer_labs/{id}` | Laboratorios de cómputo |
| `baccalaureate_types/{id}` | Tipos de bachillerato (General/Técnico) |
| `attendance_reports/{id}` | Reportes de asistencia |

---

## 3. Funcionalidades por Componente

### 3.1 Autenticación (`AuthContext.tsx`, `Login.tsx`)
- Firebase Auth con email/password
- Roles: `admin` y `teacher`
- Super Admin con doble rol (ve botón "Ver como Docente")
- Registro de nuevos usuarios (solo crea cuenta, no asigna rol)
- Placeholder para Microsoft Azure AD (Fase 2)

### 3.2 Dashboard del Docente (`TeacherDashboard.tsx`)
- Bienvenida con nombre del docente
- Acceso a toma de asistencia
- Botón de cerrar sesión

### 3.3 Toma de Asistencia (`Dashboard.tsx`)
- Selección de grado y sección (filtro por guía del docente)
- 3 estados: **Presente**, **Tarde**, **Ausente** con colores (verde/amarillo/rojo)
- Disciplina: cabello largo, uñas pintadas, uniforme incorrecto
- Checkbox de acto cívico
- Simulador de llegadas tarde programadas
- Estadísticas en vivo (asistentes, tarde, ausentes, infracciones)
- **SummaryModal**: resumen final con opción de enviar a Firestore + exportar CSV/JSON

### 3.4 Panel Administrativo

#### AdminLayout
- Sidebar fijo con logo verde y escudo
- Secciones: Dashboard, Gestión Académica (Grados, Secciones, Asignación, Materias, Edificios, Laboratorios), Bachillerato, Personal, Alumnos
- Tema claro/oscuro
- Botón "Ver como Docente"

#### AdminDashboard
- Tarjetas de resumen (docentes, grados, secciones, alumnos)
- Lista de docentes registrados
- **Modal "Iniciar Año Escolar"**: confirma año, marca todos los grados y secciones como ACTIVOS con el nuevo año

#### GradesManager
- CRUD completo con cards agrupadas por ciclo
- **Filtro por estado**: Todos / Activos / Inactivos
- **Píldoras de estado**: ACTIVO = color del ciclo, INACTIVO = gris
- **Toggle de estado**: botón para activar/desactivar
- Vista card y tabla
- Ciclos: 1° (verde), 2° (azul), 3° (púrpura), 4° Bachillerato (celeste/naranja según tipo)
- Validación: no permite borrar grado con alumnos

#### SectionsManager
- CRUD completo con selección de grado, edificio y **laboratorio de cómputo**
- Filtro por grado
- **Estado ACTIVO/INACTIVO** con toggle
- Muestra `schoolYear` actual
- Vista card y tabla

#### BuildingsManager
- CRUD completo
- **Estadísticas por edificio**: al hacer clic en un edificio, panel expandible con:
  - 4 tarjetas de resumen (secciones, capacidad total, alumnos matriculados, laboratorios)
  - Desglose por grado con barras de uso anidadas
  - Etiquetas de sección con conteo de alumnos
  - Animaciones al expandir

#### ComputerLabsManager
- CRUD completo
- **Estadísticas por laboratorio** (mismo patrón que edificios):
  - 4 tarjetas: Secciones asignadas, Capacidad total aulas, Alumnos matriculados, Dispositivos
  - Desglose por grado con barras de uso
  - Etiquetas de sección
- Asignación de laboratorio a sección desde SectionsManager

#### GradeSectionAssignment
- Asignar edificio y laboratorio a combinaciones grado-sección
- Vista en tabla con todas las combinaciones

#### TeachersManager
- CRUD completo con avatares Unsplash
- Campos: nombre, email, teléfono, especialidad, materias, horario, grado guía, sección guía
- Vista card y tabla
- Selección múltiple con eliminación masiva

#### StudentsManager
- CRUD completo por grado/sección
- Filtros por grado y sección
- Búsqueda por nombre
- Vista card y tabla
- Selección múltiple con eliminación masiva
- Campos: carnet, nombre, género, grado, sección, año de matrícula, estado

### 3.5 Tema Claro/Oscuro (`ThemeContext.tsx`)
- Persistencia en localStorage
- Botón sol/luna en sidebar
- CSS personalizado con variables `--theme-bg`, `--theme-card`, etc.

---

## 4. Datos Semilla (Seed)

### 4.1 Seed automático (`seedInitialData` en `firestore.ts`)
Se ejecuta al iniciar sesión como admin **solo si la colección `grades` está vacía**.

#### Edificios
| Código | Nombre | Color |
|--------|--------|-------|
| EP | Edificio Principal | #12562E |
| EA | Edificio Académico | #0D71B9 |
| ET | Edificio Técnico | #FAB700 |
| ED | Edificio Deportivo | #D32F2F |

#### Laboratorios de Cómputo
10 laboratorios (Lab 1–10) distribuidos en Edificio Técnico y Académico, capacidades 25–35, dispositivos 24–35.

#### Grados (14)
| Grado | Ciclo | Tipo |
|-------|-------|------|
| 1°–3° | Primer Ciclo | General |
| 4°–6° | Segundo Ciclo | General |
| 7°–9° | Tercer Ciclo | General |
| 10°–11° BG | Bachillerato | General |
| 10°–12° BT | Bachillerato | Técnico |

#### Secciones (25)
Distribuidas en 25 secciones (A y B) con capacidad 30–45, asignadas a Edificio Académico (EP=EA) o Técnico (Bach. Técnico).

#### Materias (16)
Matemáticas, Física, Química, Biología, Español, Literatura, Inglés, Historia, Geografía, Cívica, Informática, Educación Física, Música, Arte, Religión, Filosofía.

#### Docentes (10)
Con nombres, emails, especialidades, materias asignadas, horario y grado/sección guía.

#### Alumnos semilla (36)
Distribuidos en 1°, 2°, 7°, 10° BG, 10° BT, 11° BT, 12° BT. Todos con carnet SEED-XXX, firstName, lastName y enrollmentYear.

### 4.2 Scripts adicionales

#### `scripts/seed-firestore.cjs`
Seed completo independiente (Firestore + Auth). Crea los mismos datos que seedInitialData pero como script Node.js.

#### `scripts/clear-firestore.cjs`
Elimina **todos los documentos** de todas las colecciones.

#### `scripts/migrate-alumnos.cjs`
Migra alumnos desde el proyecto anterior (`gestion-escolar-cssj`) usando su backup JSON.

---

## 5. Migración de Alumnos

### Proceso
1. Se extrajeron datos del proyecto `gestion-escolar-cssj` (Firebase project anterior)
2. Se procesaron 1200+ registros
3. **Resultado**: 728 alumnos importados exitosamente
4. **Omitidos**: 1358 inactivos/graduados, 114 sin grado mappeable

### Mapeo de grados
| Old ID | Grado destino |
|--------|---------------|
| 1, 1A, 1B → `1` | 1° Grado |
| 2, 2A, 2B → `2` | 2° Grado |
| ... | ... |
| 10B → `10g` | 10° Bach. General |
| 10T → `10t` | 10° Bach. Técnico |
| 12T → `12t` | 12° Bach. Técnico |

### Campos de alumno migrado
```typescript
{
  id: string,          // carnet sin guiones (ej: "20250001")
  name: string,        // "Apellido, Nombre"
  gender: 'M' | 'F',
  gradeId: string,
  sectionId: string,
  enrollmentYear: number,
  status?: 'ACTIVO' | 'INACTIVO' | 'GRADUADO',
  carnet?: string,     // formateado (ej: "2025-0001")
  firstName?: string,
  lastName?: string,
  enrollmentHistory?: EnrollmentRecord[]
}
```

---

## 6. Características Implementadas

### 6.1 Sistema de Asistencia
- [x] Login con email/password y roles
- [x] Dashboard docente con selección de grado/sección
- [x] 3 estados de asistencia (Presente, Tarde, Ausente)
- [x] Registro de disciplina (cabello, uñas, uniforme)
- [x] Checkbox acto cívico
- [x] Simulador de llegadas tarde
- [x] Estadísticas en vivo
- [x] Resumen con envío a Firestore
- [x] Exportación CSV y JSON
- [x] Reportes guardados en `attendance_reports`

### 6.2 Gestión Administrativa
- [x] CRUD completo de docentes, grados, secciones, alumnos, materias
- [x] Filtro de grados por ciclo con códigos de color
- [x] Asignación de edificios a secciones
- [x] Sistema de ciclos (1°, 2°, 3°, Bachillerato)
- [x] Tipos de bachillerato (General hasta 11°, Técnico hasta 12°)
- [x] CRUD de edificios y laboratorios de cómputo
- [x] Asignación grado-sección-edificio-laboratorio
- [x] Vista card y tabla en todos los módulos
- [x] Selección múltiple con eliminación masiva

### 6.3 Últimas Mejoras (Commit `202db56`)
- [x] **Estado de grados** (ACTIVO/INACTIVO) con filtro y toggle
- [x] **Estado de secciones** (ACTIVO/INACTIVO) con toggle
- [x] **Año escolar** en grados y secciones
- [x] **Modal "Iniciar Año Escolar"**: marca todos como ACTIVOS con año nuevo
- [x] **Estadísticas de edificios**: panel expandible con resumen, barras, secciones
- [x] **Campo `computerLabId`** en secciones + selector en formulario
- [x] **Estadísticas de laboratorios**: panel expandible (secciones, capacidad, alumnos, dispositivos)
- [x] **Campos opcionales** en Student (`carnet?`, `firstName?`, `lastName?`, `enrollmentYear?`)
- [x] **Timestamps** en createStudent/updateStudent (`createdAt`, `updatedAt`)
- [x] **Migración de 728 alumnos** desde sistema anterior
- [x] **Tema claro/oscuro** con persistencia
- [x] **0 errores TypeScript** (`tsc --noEmit`)
- [x] **Deploy exitoso** a Firebase Hosting

---

## 7. Pendiente (Fase 2)

- [ ] Integración Microsoft Azure AD (botón placeholder en Login)
- [ ] Exportación PDF de reportes
- [ ] Historial de reportes de asistencia
- [ ] Dashboard estadístico con gráficos
- [ ] Notificaciones push
- [ ] Gestión de usuarios/auth desde admin
- [ ] Subida de foto de perfil para docentes y alumnos
- [ ] App móvil (PWA)

---

## 8. Comandos

```bash
npm run dev          # Dev server en puerto 3000
npm run build        # Build producción a dist/
npm run lint         # TypeScript check (tsc --noEmit)
npm run deploy       # Build + firebase deploy hosting
npm run rules        # firebase deploy firestore:rules
```

## 9. Notas Técnicas

- **Firestore no acepta `undefined`**: todos los formularios limpian `undefined` antes de enviar
- **Seed automático**: solo se ejecuta si la colección `grades` está vacía
- **Para resetear datos**: `node scripts/clear-firestore.cjs` luego `node scripts/seed-firestore.cjs`
- **Las reglas Firestore** deben deployarse después de cualquier cambio: `npm run rules`
- **Tailwind v4**: sin `tailwind.config.js`, configuración vía `@import "tailwindcss"` en `index.css`
- **Animaciones**: `motion/react` para transiciones suaves
- **Notificaciones**: `sonner` para toasts

---

**Última actualización:** 22 julio 2026
