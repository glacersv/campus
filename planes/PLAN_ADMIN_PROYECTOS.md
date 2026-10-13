# Plan: Estandarización de Módulos Admin + Integración de Proyectos

> **Fecha:** 25 julio 2026
> **Estado:** Propuesta

---

## RESUMEN EJECUTIVO

### Problemas Detectados

#### 1. Inconsistencias de Diseño en Admin (12+ módulos)
| Problema | Ejemplo |
|----------|---------|
| Contenedores de formulario | `card p-5` vs `card p-4` vs `bg-white rounded-2xl p-5` |
| Wrappers de tarjetas | `.card` vs `.glass-card` vs Tailwind raw |
| Iconos de encabezado | `w-10 h-10 rounded-xl bg-primary/10` vs `bg-accent/10 p-2` |
| Labels de formularios | `uppercase tracking-wider font-semibold` vs `font-medium` |
| Espaciado de página | `space-y-6` vs `space-y-4` vs `grid grid-cols-12` |
| Headers de tabla | `text-xs` vs `text-[11px]` |
| Colores | `gray-*` vs `slate-*`, hex vs tokens |
| Modales | Full overlay vs inline expansion |
| Botón cerrar | `hover:bg-gray-100` vs `hover:bg-slate-100` |
| Animaciones | Con `AnimatePresence` vs sin él |

#### 2. Proyectos Fuera del Core
- `proyectos/` es una app React 18 independiente (no integrada)
- Usa inline styles, no Tailwind
- Firebase project diferente (`salesiano-2026`)
- El main app tiene stubs simplificados (`TeacherProjects`, `StudentProjects`)
- Falta `proyectos/src/lib/firebase.ts` (no compila)

---

## PLAN DE ACCIÓN

### FASE 1: Estandarización de Diseño Admin (Prioridad Alta)

#### 1.1 Crear Design System en `src/styles/design-system.ts`
Definir constantes para:
```typescript
export const DS = {
  // Contenedores
  card: 'bg-white rounded-2xl border border-slate-200/80 shadow-sm',
  cardHover: 'hover:shadow-md transition-shadow',
  formCard: 'bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5',
  
  // Headers de módulo
  moduleHeader: 'flex items-center gap-3 mb-6',
  moduleIcon: 'w-10 h-10 rounded-xl flex items-center justify-center',
  
  // Labels
  label: 'text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider',
  
  // Botones
  btnPrimary: 'bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-full shadow transition-all',
  btnSecondary: 'bg-white border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-full hover:bg-slate-50 transition-all',
  
  // Inputs
  input: 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all',
  
  // Tablas
  tableHeader: 'bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider',
  tableRow: 'border-b border-slate-100 hover:bg-slate-50/50 transition-colors',
  
  // Badges
  badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  
  // Espaciado
  pageWrapper: 'space-y-6',
  
  // Animación
  fadeIn: { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } },
  staggerDelay: 0.03,
}
```

#### 1.2 Actualizar `index.css`
Unificar clases utilitarias:
- Mantener `.card`, `.btn-primary`, `.input` existentes
- Agregar `.module-header`, `.module-icon`, `.form-label`
- Eliminar `.glass-card` (reemplazar por `.card`)
- Estandarizar colores: solo usar tokens `primary`, `secondary`, `accent`, `slate-*`

#### 1.3 Refactorizar Módulos (uno por uno)
**Orden de refactorización:**

| # | Módulo | Prioridad | Cambios Clave |
|---|--------|-----------|---------------|
| 1 | **TeachersManager** | Alta | Modelo base (ya usa `card p-5`) |
| 2 | **StudentsManager** | Alta | Agregar card view, unificar labels |
| 3 | **GradesManager** | Alta | Ya tiene dual view, ajustar sidebar |
| 4 | **SectionsManager** | Media | Reemplazar raw classes por `.card` |
| 5 | **SubjectsManager** | Media | Agregar card/list toggle |
| 6 | **BuildingsManager** | Media | Reemplazar `glass-card` por `.card` |
| 7 | **ComputerLabsManager** | Media | Unificar con BuildingsManager |
| 8 | **BaccalaureateTypesManager** | Baja | Ajustar labels |
| 9 | **GradeSectionAssignment** | Baja | Unificar icono header |
| 10 | **RolesManager** | Baja | Unificar modal pattern |

**Patrón estándar para cada módulo:**
```tsx
// Page wrapper
<div className="space-y-6">

  {/* Header */}
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold text-slate-800">Título</h1>
        <p className="text-sm text-slate-500">Subtítulo</p>
      </div>
    </div>
    <button className="bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-full shadow transition-all flex items-center gap-2">
      <Plus className="w-4 h-4" /> Nuevo
    </button>
  </div>

  {/* Filtros + Búsqueda */}
  <div className="flex items-center gap-4">
    <div className="relative flex-1 max-w-sm">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm ..." />
    </div>
    {/* Filter pills */}
  </div>

  {/* Contenido: Cards o Tabla */}
  {viewMode === 'card' ? (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cards */}
    </div>
  ) : (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
      <table>...</table>
    </div>
  )}
</div>
```

---

### FASE 2: Integración de Proyectos (Prioridad Media)

#### 2.1 Migrar funcionalidad de `proyectos/` a `src/`

**Archivos a migrar:**

| Archivo Origen | Destino en `src/` | Adaptaciones |
|----------------|-------------------|--------------|
| `types/index.ts` | `src/types/proyectos.ts` | Merge con `types.ts` existente |
| `hooks/useProyectos.ts` | `src/hooks/useProyectos.ts` | Usar `firebase.ts` existente |
| `hooks/useCatalogos.ts` | `src/hooks/useCatalogos.ts` | Usar `firebase.ts` existente |
| `hooks/useAuth.tsx` | *Eliminar* | Usar `AuthContext.tsx` existente |
| `components/Dashboard.tsx` | `src/components/proyectos/ProyectosDashboard.tsx` | Adaptar a Tailwind + RoleLayout |
| `components/FormularioProyecto.tsx` | `src/components/proyectos/FormularioProyecto.tsx` | Adaptar a Tailwind |
| `components/Cronograma.tsx` | `src/components/proyectos/Cronograma.tsx` | Adaptar a Tailwind |
| `components/AdminPanel.tsx` | `src/components/proyectos/AdminPanel.tsx` | Adaptar a Tailwind |
| `components/Historial.tsx` | `src/components/proyectos/Historial.tsx` | Adaptar a Tailwind |
| `components/SugerenciaInformatica.tsx` | `src/components/proyectos/SugerenciaInformatica.tsx` | Adaptar a Tailwind |
| `functions/src/index.ts` | `functions/src/index.ts` (nuevo) | Cloud Functions separadas |

#### 2.2 Adaptación de Estilos
- Reemplazar todos los `style={{ }}` inline por clases Tailwind
- Usar design system de FASE 1 (cards, badges, botones, etc.)
- Mantener variables CSS para theming (`--bg-main`, `--bg-card`, etc.)

#### 2.3 Integración con Auth y Roles
```typescript
// src/types.ts - Agregar si no existe
export type UserRole = 'admin' | 'docente' | 'alumno' | 'coordinacion' | 'registro_academico' | 'enfermeria' | 'psicopedagogio'

// Roles con acceso a proyectos
const PROYECTOS_ROLES: UserRole[] = ['admin', 'coordinacion', 'docente', 'alumno']
```

#### 2.4 Integración en Router (`App.tsx`)
```tsx
// Para admin: /admin/proyectos -> ProyectosAdminPanel
// Para docente: /proyectos -> ProyectosDashboard (con workflow)
// Para alumno: /estudiante -> ProyectosDashboard (crear + listar)
// Para coordinacion: /coordinacion -> CoordinacionDashboard (con módulo proyectos)
```

#### 2.5 Cloud Functions (Opcional - Fase 2b)
- Migrar `sugerirComplementoInformatica` a projecto principal
- Cambiar de Anthropic Claude a Gemini (ya que no tienes dinero para Claude)
- O usar Ollama local para esta función

#### 2.6 Eliminar `proyectos/` folder
Una vez migrado y verificado:
```bash
rm -rf proyectos/
```

---

### FASE 3: Verificación y Deploy

#### 3.1 Checks
- [ ] `npm run lint` (TypeScript check)
- [ ] `npm run build` (Build exitoso)
- [ ] Verificar que todos los módulos admin tienen diseño consistente
- [ ] Verificar que proyectos funciona dentro del main app
- [ ] Probar roles: admin, docente, alumno, coordinacion

#### 3.2 Deploy
```bash
npm run deploy  # Build + Firebase hosting
npm run rules   # Firestore rules (si cambiaron)
```

---

## ORDEN DE EJECUCIÓN SUGERIDO

```
DÍA 1: FASE 1.1 - Crear design system + actualizar index.css
DÍA 2: FASE 1.2 - Refactorizar TeachersManager + StudentsManager (modelos base)
DÍA 3: FASE 1.3 - Refactorizar GradesManager + SectionsManager
DÍA 4: FASE 1.4 - Refactorizar módulos restantes
DÍA 5: FASE 2.1 - Migrar tipos y hooks de proyectos
DÍA 6: FASE 2.2 - Migrar componentes de proyectos (adaptar Tailwind)
DÍA 7: FASE 2.3 - Integrar en router + auth
DÍA 8: FASE 3 - Verificar + deploy
```

---

## PREGUNTAS ANTES DE EMPEZAR

1. **¿Empezamos por estandarizar el admin primero o por integrar proyectos?**
   - Admin primero → más orden visual
   - Proyectos primero → más funcionalidad nueva

2. **¿La funcionalidad de Claude AI en proyectos la queremos conservar?**
   - Sí → necesitamos API key de Anthropic (pago)
   - No → eliminamos esa feature o la reemplazamos por Ollama local

3. **¿Los módulos de coordinacion/registro/enfermeria/psicopedagogia ya están desarrollados?**
   - Si no, los dejamos como están (cards con módulos pendientes)

4. **¿Quieres que refactorice todos los módulos admin en un solo día o módulo por módulo con deploy intermedio?**

---

**Estado:** Esperando tus respuestas para proceder.
