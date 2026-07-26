# Plan: Reestructuración Admin + Coordinaciones

> **Fecha:** 25 julio 2026
> **Estado:** Plan aprobado
> **Prioridad:** C → B → A

---

## RESUMEN DE DECISIONES

### Estructura de Grados
| Nivel | Grados |
|-------|--------|
| Parvularia | K4, K5, K6 |
| Primaria | 1° - 6° |
| Secundaria | 7° - 12° |

### Roles y Permisos
| Rol | Módulos | Ve horarios/carga docente |
|-----|---------|---------------------------|
| **admin** | Todos (configura todo) | Sí |
| **coordinacion_academica** | Notas, evaluaciones, horarios | Sí |
| **coordinacion_convivencia** | Asistencia, disciplina, incidentes | Sí |
| **coordinacion_primaria** | Módulos filtrados 1°-6° | Sí |
| **coordinacion_parvularia** | Módulos filtrados K4-K6 | Sí |
| **docente** | Su clase, asistencia | Sí |
| **alumno** | Su info | No |

### Admin - Áreas Especiales (ocultas)
El admin ve TODO clasificado por áreas, pero las coordinaciones NO ven esta clasificación:
```
Admin Panel
├── 🏠 Dashboard General
├── 📚 ACADÉMICA (grados, secciones, materias, horarios, carga docente)
├── 🤝 CONVIVENCIA (asistencia, disciplina)
├── 🏫 INFRAESTRUCTURA (edificios, laboratorios)
├── 👥 PERSONAL (docentes, coordinadores)
├── 🎓 ALUMNOS
├── 🔒 SEGURIDAD (roles, permisos)
└── ⚙️ CONFIGURACIÓN (áreas ocultas)
    └── Configuración de coordinaciones (solo admin ve)
```

---

## FASE C: Reestructurar Admin por Áreas (PRIMERO)

### C.1 Actualizar Sidebar del Admin
**Archivo:** `src/components/admin/AdminLayout.tsx`

Cambiar la navegación actual por secciones agrupadas:

```
Sidebar Admin (nuevo):
─────────────────────
🏠 Dashboard

📚 ACADÉMICA
   - Grados
   - Secciones
   - Asignación Grado-Sección
   - Materias
   - Horarios (pendiente)
   - Carga Docente (pendiente)

🤝 CONVIVENCIA
   - Asistencia (reportes)
   - Disciplina (pendiente)

🏫 INFRAESTRUCTURA
   - Edificios
   - Laboratorios

👥 PERSONAL
   - Docentes

🎓 ALUMNOS
   - Alumnos

🔒 SEGURIDAD
   - Roles

⚙️ SISTEMA
   - Tipos de Bachillerato
   - Año Escolar
```

### C.2 Crear Componente de Configuración de Coordinaciones
**Archivo nuevo:** `src/components/admin/CoordinacionesConfig.tsx`

Panel oculto que solo el admin ve:
- Definir qué módulos tiene cada coordinación
- Asignar coordinadores a cada área
- Configurar filtros de grados por coordinación

### C.3 Actualizar Rutas en App.tsx
**Archivo:** `src/App.tsx`

```tsx
// Rutas admin (agregar nuevas)
/admin/coordinaciones-config  → CoordinacionesConfig (solo admin)
```

### C.4 Mover Archivos (mantener estructura)
No mover archivos, solo reorganizar el sidebar. Los componentes existentes ya están en `src/components/admin/`.

---

## FASE B: Dashboard de Coordinación con Sub-secciones (SEGUNDO)

### B.1 Actualizar RoleLayout
**Archivo:** `src/components/shared/RoleLayout.tsx`

Agregar sub-secciones por área:

```
Coordinación Académica:
├── 📊 Dashboard
├── 📚 Materias y Horarios
├── 📝 Calificaciones
└── 📋 Carga Docente

Coordinación Convivencia:
├── 📊 Dashboard
├── ✅ Asistencia
├── ⚠️ Disciplina
└── 📄 Incidentes

Coordinación Primaria:
├── 📊 Dashboard
├── 📚 Grados 1°-6°
├── 👥 Alumnos Primaria
└── 📋 Secciones

Coordinación Parvularia:
├── 📊 Dashboard
├── 🎒 Grados K4-K6
├── 👥 Alumnos Parvularia
└── 📋 Actividades
```

### B.2 Crear Sub-componentes por Coordinación

| Coordinación | Componentes a crear |
|--------------|---------------------|
| **Académica** | `AcademicaDashboard.tsx`, `HorariosView.tsx`, `CalificacionesView.tsx` |
| **Convivencia** | `ConvivenciaDashboard.tsx`, `AsistenciaView.tsx`, `DisciplinaView.tsx` |
| **Primaria** | `PrimariaDashboard.tsx`, `GradosPrimariaView.tsx` |
| **Parvularia** | `ParvulariaDashboard.tsx`, `GradosParvulariaView.tsx` |

### B.3 Actualizar App.tsx con Nuevas Rutas
```tsx
/coordinacion-academica/* → CoordinacionAcademicaLayout
/coordinacion-convivencia/* → CoordinacionConvivenciaLayout
/coordinacion-primaria/* → CoordinacionPrimariaLayout
/coordinacion-parvularia/* → CoordinacionParvulariaLayout
```

---

## FASE A: Crear Roles de Coordinación (TERCERO)

### A.1 Actualizar tipos.ts
**Archivo:** `src/types.ts`

```typescript
export type UserRole = 
  | 'admin' 
  | 'coordinacion_academica'
  | 'coordinacion_convivencia'
  | 'coordinacion_primaria'
  | 'coordinacion_parvularia'
  | 'docente' 
  | 'alumno'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  coordinacion_academica: 'Coord. Académica',
  coordinacion_convivencia: 'Coord. Convivencia',
  coordinacion_primaria: 'Coord. Primaria',
  coordinacion_parvularia: 'Coord. Parvularia',
  docente: 'Docente',
  alumno: 'Alumno'
}
```

### A.2 Actualizar AuthContext
**Archivo:** `src/contexts/AuthContext.tsx`

- Mapear roles de Firestore a roles del sistema
- Mantener compatibilidad con roles existentes (`coordinacion` → mapear a nuevos)

### A.3 Crear/Actualizar Roles en Firestore
**Script:** `scripts/setup-coordinacion-roles.cjs`

```javascript
// Roles a crear:
coordinacion_academica: {
  name: 'Coordinación Académica',
  permissions: ['notas', 'horario', 'clase'],
  modules: ['horarios', 'carga-docente']
}

coordinacion_convivencia: {
  name: 'Coordinación Convivencia', 
  permissions: ['formacion', 'notas'],
  modules: ['asistencia', 'disciplina']
}

coordinacion_primaria: {
  name: 'Coordinación Primaria',
  permissions: ['formacion', 'notas'],
  filters: { grades: ['1', '2', '3', '4', '5', '6'] }
}

coordinacion_parvularia: {
  name: 'Coordinación Parvularia',
  permissions: ['formacion'],
  filters: { grades: ['k4', 'k5', 'k6'] }
}
```

### A.4 Seed Data Actualizado
**Archivo:** `src/lib/firestore.ts`

Actualizar `seedInitialData()` para incluir:
- Nuevos roles de coordinación
- Coordinadores de ejemplo por área

---

## ORDEN DE EJECUCIÓN

```
FASE C (Admin):
  Día 1: Actualizar sidebar AdminLayout.tsx
  Día 2: Crear CoordinacionesConfig.tsx
  Día 3: Actualizar App.tsx rutas

FASE B (Dashboard Coordinación):
  Día 4: Actualizar RoleLayout.tsx
  Día 5: Crear AcademicaDashboard.tsx + ConvivenciaDashboard.tsx
  Día 6: Crear PrimariaDashboard.tsx + ParvulariaDashboard.tsx
  Día 7: Integrar en App.tsx

FASE A (Roles):
  Día 8: Actualizar types.ts
  Día 9: Actualizar AuthContext.tsx
  Día 10: Crear roles en Firestore + seed
```

---

## VERIFICACIÓN

- [ ] `npm run lint` sin errores en `src/`
- [ ] Admin muestra sidebar reestructurado
- [ ] Cada coordinación ve solo sus módulos
- [ ] Admin ve todo clasificado por áreas
- [ ] Roles funcionan correctamente
- [ ] Login redirige al dashboard correcto por rol

---

**Estado:** Esperando aprobación para iniciar Fase C
