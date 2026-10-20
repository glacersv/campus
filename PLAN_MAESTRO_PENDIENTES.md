# Plan Maestro Consolidado: Tareas Pendientes

> **Proyecto:** Campus Salesiano San José  
> **Fecha:** 13 de octubre de 2026  
> **Estado:** Activo / En ejecución  
> **Contexto:** Consolidación de todos los planes anteriores (archivados en `planes/`) depurando lo ya implementado y priorizando el trabajo pendiente.

---

## 1. Diagnóstico y Visión General

El sistema cuenta con un núcleo funcional completo (autenticación Office 365 con cola de aprobación, asistencia/disciplina con sync Firestore, CRUD de infraestructura y gestión de proyectos escolares).

Este plan consolida las tareas técnicas pendientes categorizadas por criticidad:

```mermaid
flowchart TD
    A[Plan Maestro Pendientes] --> B[Fase 1: Datos & Backend Firestore]
    A --> C[Fase 2: Rendimiento & Offline PWA]
    A --> D[Fase 3: Estandarización Visual de Dashboards]
    A --> E[Fase 4: Exportación Nativa PDF & Reportes]
    A --> F[Fase 5: Inteligencia Artificial Contextual]

    B --> B1[Migrar 26 módulos BTV a Firestore]
    B --> B2[Limpiar student-glacer y seeds estáticos]
    B --> B3[Reglas de validación estricta en Firestore]

    C --> C1[Paginación server-side 728+ alumnos]
    C --> C2[Caché offline persistente]

    D --> D1[Hero banner institucional en Coordinaciones]
    D --> D2[Llenar módulos vacíos de coordinación]

    E --> E1[Generación de reportes PDF nativos]

    F --> F1[Router híbrido Ollama / Gemini]
```

---

## 2. Desglose de Fases y Tareas Pendientes

### FASE 1: Datos y Desacoplamiento de Memoria (Prioridad Alta 🔴)
*Objetivo: Cero datos curriculares o de prueba quemados en código estático; todo editable desde Firestore.*

- [x] **1.1 Seeder oficial de Módulos BTV a Firestore:**
  - Crear script/función (`seedBTVCurriculumToFirestore` y `reseedLMSModules`) para cargar los 26 módulos técnicos y descriptores de `src/services/btvCurriculumData.ts` hacia la colección `lms_modules`.
  - Asegurar la asociación correcta de grados (`10t`, `11t`, `12t`) y secciones (Completado y disponible en panel admin).
- [x] **1.2 Desacoplar `lmsService.ts` de datos estáticos:**
  - Eliminar los objetos en memoria y las entregas fijas con ID `student-glacer` y `Estudiante Salesiano` en `src/services/lmsService.ts`.
  - Eliminar fallbacks estáticos de docentes (`t1786176116597`, `Giovanni Marquez`) y grados inválidos.
- [x] **1.3 Reforzar validaciones en `firestore.rules`:**
  - Agregar reglas de formato y restricción de elevación del campo `role` en la colección `users/{userId}` para evitar modificaciones no autorizadas por usuarios no administradores.

---

### FASE 2: Rendimiento, Paginación y Resiliencia (Prioridad Alta 🔴)
*Objetivo: Escalar el sistema para operar con más de 700 alumnos sin sobrecargar lectura ni fallar ante pérdidas de red.*

- [x] **2.1 Paginación del lado del servidor para Alumnos:**
  - Creada función `getPaginatedStudents()` en `src/lib/firestore.ts` con soporte de cursores (`limit()`, `startAfter()`) y filtros directos por grado/sección a nivel de query.
  - Actualizado `StudentsManager.tsx` con buscador en tiempo real por nombre/carnet y paginación optimizada.
- [x] **2.2 Resiliencia de Red y Soporte Offline (Patio/Canchas):**
  - Verificada y activa la persistencia local de Firestore SDK (`persistentLocalCache` con `persistentMultipleTabManager` en `src/firebase.ts`).
  - Creado e integrado componente `NetworkStatusIndicator.tsx` en las cabeceras principales (`RoleLayout` y `AdminLayout`) con alerta visual del estado de sincronización (🟢 En línea / 🟡 Offline - guardado local).

---

### FASE 3: Estandarización Estética de Dashboards (Prioridad Media 🟡)
*Objetivo: Llevar todas las pantallas al estándar visual de `InstitutionalCalendar.tsx`.*

- [ ] **3.1 Header institucional unificado en Coordinaciones:**
  - Reemplazar el contenedor plano de `src/components/coordinacion/` (`AcademicaDashboard`, `ConvivenciaDashboard`, `PrimariaDashboard`, `ParvulariaDashboard`) con el componente de Hero Banner oscuro con métricas KPI y badges con borde luminoso.
- [ ] **3.2 Implementación funcional de vistas secundarias:**
  - Reemplazar placeholders en `NotasView.tsx`, `HorarioView.tsx` y `ClaseView.tsx` con datos reales conectados a colecciones de Firestore.
  - Estandarizar formularios administrativos pendientes con la clase unificada `.card-crema` e `.input-crema`.

---

### FASE 4: Exportación Nativa de Documentos y PDF (Prioridad Media 🟡)
*Objetivo: Generar documentación institucional imprimible con formato oficial.*

- [ ] **4.1 Exportación a PDF nativo:**
  - Integrar motor de generación PDF (`jspdf` / `@react-pdf/renderer` o similar) para reportes de asistencia diaria y mensual de formación.
  - Exportación de boletas de notas y reportes consolidados por grado/sección.
- [ ] **4.2 Historial de versiones en Documentos Docente:**
  - Permitir guardar histórico o versiones previas de Guiones de Clase y Planificación Didáctica en Firestore (`lms_modules/{id}/docente_docs/versions`).

---

### FASE 5: Inteligencia Artificial Contextual (Pospuesta para Etapa Futura ⏳)
*Objetivo: Integración de asistencia pedagógica asistida por IA (planificada para una fase posterior acorde a la infraestructura tecnológica).*

- [ ] **5.1 Router Híbrido (Ollama Local / Gemini Cloud):** *(Pospuesto)*
  - Implementar en una etapa futura según disponibilidad de infraestructura y servidores locales.
- [ ] **5.2 Asistente Pedagógico Contextual:** *(Pospuesto)*
  - Integrar sugerencias IA en planificación y análisis de convivencia en una etapa futura.

---

### FASE 6: Cuadro de Acompañamiento Salesiano (Implementada ✅)
*Objetivo: Evaluación cualitativa de dimensiones humanas, cristianas y vocacionales salesianas (E, MB, B, NM) en todos los niveles.*

- [x] **6.1 Configuración de Dimensiones y Criterios en Admin:**
  - Componente `AccompanimentManager.tsx` con soporte para crear, editar y sembrar con 1 clic las 4 dimensiones y 14 criterios oficiales del Excel 2026.
- [x] **6.2 Matriz de Evaluación Docente por Periodo:**
  - Componente `AccompanimentModule.tsx` con selección de Grado, Sección, Periodo (PI, PII, PIII, PIV), buscador en tiempo real, escala cualitativa y guardado en Firestore.
- [x] **6.3 Modelo de Datos y Seguridad:**
  - Tipos en `src/types.ts`, CRUD en `src/lib/firestore.ts` y reglas de seguridad en `firestore.rules`.

---

## 3. Matriz de Ejecución Inmediata

| # | Tarea | Componente / Archivo | Esfuerzo Estimado |
|---|---|---|---|
| **1** | Seeder de 26 módulos BTV a Firestore | `scripts/seed-btv-modules.cjs` | ✅ Completado |
| **2** | Limpieza de `student-glacer` y fallback en memoria | `src/services/lmsService.ts` | ✅ Completado |
| **3** | Paginación server-side de alumnos (728+) | `src/lib/firestore.ts`, `StudentsManager.tsx` | ✅ Completado |
| **4** | Cuadro de Acompañamiento (Admin & Docente) | `AccompanimentManager.tsx`, `AccompanimentModule.tsx` | ✅ Completado |
| **5** | Hero Banner y métricas en Dashboards de Coordinación | `src/components/coordinacion/` | 2 - 3 horas |
| **6** | Exportación PDF de reportes de formación | `src/components/docente/SummaryModal.tsx` | 2 - 3 horas |

