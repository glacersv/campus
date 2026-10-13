# Session Log — 2026-08-24

## Objetivo Principal
Migrar toda la data hardcodeada del Bachillerato Técnico Vocacional (BTV) Diseño Gráfico a Firestore para que admin, docente y alumno lean de una sola fuente de verdad.

---

## 1. Tipo `LMSModule` extendido (`src/types.ts`)

Se agregaron campos al tipo `LMSModule` para soportar toda la información del BTV:

**Campos del módulo:**
- `description`, `icon`, `color`, `affineArea`, `schedule`, `classroom`
- `sectionId`, `sectionName`, `progress`, `averageGrade`, `minedLevel`

**Campos del descriptor (nuevo):**
- `actionStages` — 6 etapas de la Acción Completa con nombre, porcentaje y horas
- `saberesNecesarios` — Saberes que el alumno debe traer
- `currentProject` — Proyecto anual integrador (título, tema, cliente, brief creativo, entregables, software)
- `problematicSituation` — Situación problemática del módulo
- `resources` — Recursos didácticos
- `prerequisite` — Prerrequisitos
- `promotionCriteria` — Criterios de promoción
- `evaluationCriteria` — Criterios de evaluación
- `bibliography` — Fuentes (libros, websites)
- `developmentAxes` — Ejes de desarrollo (técnico, emprendedor, humano-social, académico)

---

## 2. Función `seedBTVCurriculumToFirestore()` (`src/lib/firestore.ts`)

Migra los 27 cursos BTV hardcodeados a documentos `lms_modules` en Firestore.

**Qué hace:**
- Recorre `BTV_GRAPHIC_DESIGN_COURSES` (27 cursos, 9 por año)
- Para cada curso: obtiene descriptor con `getModuleDescriptorData()`, genera proyecto con `GENERATE_ANNUAL_PROJECT()`
- Crea documento en `lms_modules` con todos los campos del descriptor
- Verifica duplicados por código antes de crear
- Se ejecuta automáticamente cuando el admin carga el panel de materias (`SubjectsManager.loadData()`)

**Firestore collections:**
- `lms_modules` — Metadata del módulo + descriptor completo
- `lms_module_content` — Contenido editado por el docente (teoría, ejemplos, ejercicios)

---

## 3. Dashboard del Alumno (`src/components/lms/LMSModule.tsx`)

**Componente:** `StudentLMSDashboard` (renombrado de `LMSModule` para evitar conflicto con el tipo)

**Qué hace:**
- Lee todos los módulos desde Firestore via `lmsService.getAllModules()`
- Filtra por el `gradeId` del alumno logueado
- Solo muestra módulos con `status: 'active'`
- Selector de año técnico (1°, 2°, 3°)
- 3 tarjetas de métricas: módulos, nivel MINED, promedio
- Infographic de 6 etapas de la Acción Completa
- Cards de módulos con `CourseCard`

---

## 4. Aula Virtual del Alumno (`src/components/alumno/aula-virtual/AlumnoAulaVirtual.tsx`)

**Qué hace:**
- Lee módulos desde Firestore
- Filtra por `gradeId` del alumno
- Muestra: área afín, descripción, proyecto actual del descriptor
- Selector de año y tarjetas de módulos

---

## 5. Detalle del Módulo (`src/components/lms/LMSCourseDetail.tsx`)

**5 pestañas que leen todo desde Firestore:**

| Pestaña | Contenido |
|---------|-----------|
| **Información** | Horas, docente, grado, estado |
| **Descriptor** | Objetivo, ejes de desarrollo, saberes previos |
| **Etapas** | 6 etapas de la Acción Completa con % y horas expandibles |
| **Proyecto** | Proyecto anual, situación problemática, brief creativo, entregables, software |
| **Evaluación** | Criterios de evaluación, bibliografía, saberes necesarios |

---

## 6. Fixes Aplicados

### Fix 1: `Duplicate declaration "LMSModule"` (Error de Babel)
- **Problema:** El componente `LMSModule.tsx` exportaba un componente con el mismo nombre que el tipo `LMSModule` importado
- **Solución:** Renombrado el componente a `StudentLMSDashboard`
- **Archivos afectados:** `src/components/lms/LMSModule.tsx`, `src/App.tsx`

### Fix 2: `GENERATE_ANNUAL_PROJECT` args incorrectos
- **Problema:** Se pasaba `course.technicalYear` como segundo argumento (era el año técnico, no el académico)
- **Solución:** Cambiado a `'2026'` como segundo argumento
- **Archivo:** `src/lib/firestore.ts:291`

### Fix 3: Import dinámico fallido
- **Problema:** `await import('../services/btvCurriculumData')` fallaba en runtime causando error 500
- **Solución:** Cambiado a import estático en la parte superior del archivo
- **Archivo:** `src/lib/firestore.ts:18`

### Fix 4: Permisos Firestore
- **Problema:** `fixRolesPermissions()` se ejecutaba en cada login causando permisos insuficientes
- **Solución:** Restringido a solo admin en `AuthContext.tsx`

---

## 7. Firestore Rules (`firestore.rules`)

```javascript
match /lms_modules/{moduleId} {
  allow read: if isAuthenticated();
  allow create, update: if isAdmin() || isDocente();
  allow delete: if isAdmin();
}

match /lms_module_content/{moduleId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin() || isDocente();
}
```

---

## 8. Grados del Sistema

| ID | Nombre |
|----|--------|
| `10g` | 10° General |
| `11g` | 11° General |
| `11t` | 11° Técnico (BTV) |

**Eliminados:** `10t` y `12t` (no existen en el plan BTV)

---

## 9. Flujo Completo

```
Admin crea módulo → Firestore (lms_modules)
         ↓
Admin visita Materias → seedBTVCurriculumToFirestore() migra 27 cursos BTV
         ↓
Docente ve módulos → Firestore → edita contenido (lms_module_content)
         ↓
Alumno ve módulos → Firestore → abre módulo → toda la info del descriptor
```

---

## 10. Comandos Útiles

```bash
# Dev server
npm run dev

# Build
npm run build

# Deploy Firebase (hosting + rules)
npm run deploy
npm run rules

# Git
git fetch origin
git checkout feature/integracion-lms
git pull
```

---

## 11. Pendiente

- [ ] Verificar que los errores 500 en alumno/docente se resolvieron
- [ ] Probar flujo completo: admin → docente → alumno
- [ ] Verificar que `seedBTVCurriculumToFirestore()` popula los 27 módulos correctamente
- [ ] Asegurar que el docente pueda editar contenido y alumno lo vea
- [ ] Exportación PDF
- [ ] Historial de reportes
- [ ] Dashboard estadístico

---

## 12. Sesión Oficina — Tarde 24 Agosto 2026

### Commits realizados
```
870f3d7 fix: GradesManager ejecuta cleanupDuplicateGrades() al cargar
11dc9a1 fix: grades duplicados - crea 10t/11t/12t + limpia duplicados de Firestore
ec5f98b fix: ensureTechnicalGrades() crea 15 grados + filtro SubjectsManager muestra todos
```

### Fix 1: `ensureTechnicalGrades()` solo creaba 3 grados
- **Problema:** La función solo creaba 10g, 11g, 11t — faltaban Kinder, 1°-9°
- **Solución:** Ahora crea los 15 grados completos (k4-k6, 1-9, 10g, 11g, 10t, 11t, 12t)
- **Archivo:** `src/lib/firestore.ts:257`

### Fix 2: Filtro de grados en SubjectsManager ocultaba grados sin materias
- **Problema:** `gradesByCycle` filtraba grados que no tuvieran al menos 1 materia asignada
- **Solución:** Eliminado el filtro `hasSubjects` — ahora muestra todos los grados
- **Archivo:** `src/components/admin/SubjectsManager.tsx:444`

### Fix 3: Grados duplicados en Firestore (° vs º)
- **Problema:** Existían documentos como "10° Bachillerato Técnico" y "10º Bachillerato Técnico" con diferentes IDs
- **Solución:** Nueva función `cleanupDuplicateGrades()` que elimina documentos con IDs fuera de la lista válida
- **IDs válidos:** k4, k5, k6, 1-9, 10g, 11g, 10t, 11t, 12t
- **Archivos:** `src/lib/firestore.ts` (función), `SubjectsManager.tsx` y `GradesManager.tsx` (la llaman al cargar)

### Fix 4: Grados técnicos actualizados
- **Antes:** Solo existía 11t
- **Ahora:** 10t (10° Bachillerato Técnico), 11t (11° Bachillerato Técnico), 12t (12° Bachillerato Técnico)
- **Archivo:** `src/lib/firestore.ts` ensureTechnicalGrades()

### Estado al finalizar
| Grado | ID | Estado |
|-------|-----|--------|
| Kinder 4 | k4 | Creado |
| Kinder 5 | k5 | Creado |
| Preparatoria | k6 | Creado |
| 1°-9° Grado | 1-9 | Creados |
| 10° Bachillerato General | 10g | Creado |
| 11° Bachillerato General | 11g | Creado |
| 10° Bachillerato Técnico | 10t | Creado |
| 11° Bachillerato Técnico | 11t | Creado |
| 12° Bachillerato Técnico | 12t | Creado |

### Para sincronizar en iMac (casa)
```bash
git pull
```
Al recargar el admin, `cleanupDuplicateGrades()` eliminará los duplicados automáticamente.
