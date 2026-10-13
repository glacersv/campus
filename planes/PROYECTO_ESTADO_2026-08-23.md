# Estado del Proyecto Campus - 22 a 23 de Agosto 2026

## 1. Resumen Ejecutivo

Se realizó la integración completa del módulo LMS (Aula Virtual) en la aplicación del colegio, junto con la gestión de Módulos Técnicos BTV en el panel de administración. El trabajo incluye tipos TypeScript extendidos, CRUD Firestore, componentes docentes, reglas de seguridad y la UI administrativa para crear/editar módulos técnicos por año/grado.

## 2. Estado por Rol

### 2.1 Alumno - Completado
- Visualización de módulos detallada en `LMSCourseDetail.tsx`.
- Proceso de Desarrollo por Competencias con las 6 etapas MINED: Informar, Planificar, Decidir, Ejecutar, Controlar, Valorar.
- Descriptor y saberes previos visibles.
- Auto-evaluación de saberes previos.

### 2.2 Administrador - Completado con ajustes pendientes
**Listo:**
- Pestaña "Módulos Técnicos" en `SubjectsManager.tsx`.
- CRUD completo: crear, editar, eliminar módulos técnicos.
- Modal condicional con formulario especializado.
- Cards y tabla renderizan `lmsModules` cuando `isModuleTab === true`.
- Botón "Sincronizar BTV" para re-seed de 27 módulos oficiales.
- Filtrado por grado/año técnico.

**Problemas identificados:**
- Modal "Editar Módulo Técnico" está desorganizado visualmente, apretado y sin jerarquía clara.
- Botón "Sincronizar BTV" no actualiza la vista tras sincronizar.
- Algunos módulos seed tienen `gradeId` incorrectos (`10`, `11`, `12` en vez de `10t`, `11t`, `12t`).

### 2.3 Docente - Completado con ajustes pendientes
**Listo:**
- `TeacherLMSDashboard.tsx` reescrito para cargar módulos desde `lms_modules`.
- `ModuleContentEditor.tsx` con tabs Teoría/Ejemplos/Ejercicios.
- Ruta `/docente/lms/crear` añadida en `App.tsx`.

**Pendiente:**
- Filtrado dinámico por docente autenticado.
- Edición del descriptor general del módulo desde la vista docente.

## 3. Archivos Modificados

### Backend / Datos
- `src/types.ts` - Tipos extendidos LMS
- `src/lib/firestore.ts` - CRUD módulos LMS + reseed
- `src/firestore.rules` - Reglas para colecciones LMS

### Frontend - Admin
- `src/components/admin/SubjectsManager.tsx` - CRUD módulos técnicos

### Frontend - Docente
- `src/components/lms/TeacherLMSDashboard.tsx`
- `src/components/lms/ModuleContentEditor.tsx`
- `src/components/lms/ModulePlaceholder.tsx`

### Configuración
- `src/App.tsx` - Ruta docente LMS
- `src/contexts/AuthContext.tsx` - Permisos LMS

## 4. Problemas Pendientes

### 4.1 Critico - Modal de Módulo Técnico
**Ubicación:** `src/components/admin/SubjectsManager.tsx` líneas 699-834

**Problema:**
- Formulario muy apretado visualmente.
- Falta jerarquía entre secciones.
- Espaciado insuficiente.
- Detalles visuales pobres (sin secciones delimitadas, sin títulos visuales, mala presentación de campos relacionados).

**Solución requerida:**
- Reescribir el modal con secciones visuales delimitadas.
- Agregar títulos de sección con estilo `text-[10px] font-black text-tertiary uppercase tracking-wider`.
- Mejorar grid layouts para campos relacionados.
- Aumentar `space-y` general.
- Mejorar footer del modal con botones bien diferenciados.

### 4.2 Critico - Botón "Sincronizar BTV" no actualiza
**Ubicación:** `src/components/admin/SubjectsManager.tsx` línea 364-375

**Problema:**
- `handleReseedModules` llama a `reseedLMSModules()` y actualiza `lmsModules`, pero la vista no se refresca.
- Los filtros y cards/tabla siguen mostrando datos antiguos.

**Causa raíz:**
- Solo se actualiza `setLmsModules(modules)` pero no se recargan `grades`, `teachers` ni otros datos dependientes.
- `filteredModules` depende de `grades` para filtrar por `gradeId` y `technicalYear`.

**Solución requerida:**
- Llamar a `loadData()` después de `reseedLMSModules()` para refrescar todos los datos.
- O actualizar manualmente `grades` y `teachers` si es necesario.

### 4.3 Medio - Filtrado docente no implementado
**Ubicación:** `src/components/lms/TeacherLMSDashboard.tsx`

**Problema:**
- El dashboard muestra todos los módulos, no solo los del docente autenticado.
- Falta filtrar por `teacherId === currentUser.uid`.

### 4.4 Medio - Edición de descriptor desde docente
**Ubicación:** `src/components/lms/ModuleContentEditor.tsx`

**Problema:**
- El docente solo edita contenido Teoría/Ejemplos/Ejercicios.
- No puede editar el descriptor general del módulo (objetivo, criterios, ejes de desarrollo).

## 5. Próximos Pasos

1. **Reescribir modal de Módulo Técnico** con mejor organización visual.
2. **Corregir botón Sincronizar BTV** para que actualice la vista completa.
3. **Implementar filtrado por docente** en `TeacherLMSDashboard.tsx`.
4. **Agregar edición de descriptor** en `ModuleContentEditor.tsx`.
5. Verificar build y realizar deploy de reglas Firestore.

## 6. Notas de Build
- Último commit: `9b76970` del 16 de agosto 2026
- Trabajo del 22-23/08 en working directory sin commitear
- Build pendiente de verificar tras correcciones
