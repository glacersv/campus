# Modelo de Usuarios, Roles y Permisos — Campus Salesiano San José

## 1. Objetivo
Definir cómo deben funcionar los usuarios, roles y permisos en el sistema, para que la implementación futura se haga sobre una base clara y acordada.

---

## 2. Usuarios

### 2.1. Quién crea los usuarios
- El **admin** es el único que crea usuarios desde el panel.
- Los usuarios **no se autoregistran** desde el login sin aprobación previa del admin.
- El admin puede crear usuarios de cualquier rol.

### 2.2. Flujo de creación de usuario (deseado)
1. El admin ingresa al panel de administración.
2. El admin crea el usuario desde el panel, indicando:
   - Nombre completo
   - Correo institucional
   - Rol a asignar
3. El sistema guarda el usuario en Firestore con estado `pending`.
4. El sistema envía una notificación al usuario (por correo o Teams) con:
   - Usuario (correo)
   - Contraseña temporal
   - Enlace al sistema
5. El usuario cambia la contraseña en el primer inicio de sesión.

### 2.3. Usuarios existentes (alumnos pre-cargados)
- Los alumnos pueden estar pre-cargados en la colección `students` por el admin.
- Cuando un alumno pre-cargado intenta registrarse, el sistema debe:
  - Detectar que su carnet/email existe en `students`
  - Crear el usuario automáticamente con rol `alumno`
  - Generar credenciales para que el admin las envíe por Teams/correo
  - **No** dar acceso completo hasta que el admin envíe las credenciales

### 2.4. Estados de usuario
| Estado | Significado |
|---|---|
| `pending` | Usuario creado por admin, esperando envío de credenciales |
| `approved` | Usuario activo, puede iniciar sesión |
| `rejected` | Usuario rechazado, no puede acceder |

---

## 3. Roles

### 3.1. Roles base (sistema)
Estos roles existen por defecto y no se pueden eliminar:

| ID | Nombre | Descripción |
|---|---|---|
| `admin` | Administrador | Control total del sistema |
| `docente` | Docente | Profesor de aula |
| `alumno` | Alumno | Estudiante del colegio |

### 3.2. Roles personalizados (creados por admin)
El admin puede crear roles personalizados desde el panel, con:
- Nombre del rol
- Descripción
- Permisos/módulos asignados

Ejemplos de roles personalizados:
- Coordinación Académica
- Coordinación Convivencia
- Coordinación Primaria
- Coordinación Parvularia
- Registro Académico
- Enfermería
- Psicopedagogía

### 3.3. Gestión de roles
- El admin ve todos los roles creados en una tabla.
- Puede crear, editar y eliminar roles (excepto los roles base).
- Al crear/editar un rol, el admin selecciona los módulos a los que tendrá acceso.
- Los cambios se reflejan inmediatamente en los usuarios asignados a ese rol.

---

## 4. Permisos / Módulos

### 4.1. Módulos del sistema
| ID | Nombre | Descripción |
|---|---|---|
| `formacion` | Formación Buenos Días | Registro de asistencia y disciplina |
| `notas` | Notas | Calificaciones y evaluaciones |
| `clase` | Clase | Control de clases del día |
| `horario` | Horario | Horarios de clases |
| `eventos` | Eventos | Eventos del colegio |
| `avisos` | Avisos | Comunicados y anuncios |
| `proyectos` | Semana de la Juventud | Gestión de proyectos estudiantiles |

### 4.2. Asignación de permisos
- Cada rol tiene un conjunto de módulos asignados.
- Un usuario solo puede acceder a los módulos de su rol.
- El admin puede modificar los permisos de cualquier rol en cualquier momento.

### 4.3. Permisos especiales
- **Admin**: acceso a todos los módulos siempre.
- **Docente**: acceso a `formacion` y `proyectos` por defecto.
- **Alumno**: acceso a `formacion` y `proyectos` por defecto.

---

## 5. Panel de administración

### 5.1. Vista de usuarios
- El admin ve todos los usuarios en una tabla.
- Puede filtrar por rol, estado, nombre o correo.
- Puede editar el rol de cualquier usuario.
- Puede ver el estado de cada usuario (pending/approved/rejected).

### 5.2. Vista de roles
- El admin ve todos los roles en una tabla.
- Puede crear nuevos roles.
- Puede editar roles existentes (excepto roles base).
- Puede eliminar roles personalizados.
- Puede asignar módulos a cada rol.

### 5.3. Vista de aprobaciones (pendientes)
- El admin ve usuarios pendientes de aprobación.
- Para cada usuario pendiente, ve:
  - Nombre
  - Correo
  - Rol solicitado
  - Datos adicionales (grado, sección, etc.)
- Puede aprobar o rechazar usuarios.

### 5.4. Vista de credenciales
- El admin ve usuarios cuyas credenciales están listas para enviar.
- Para cada usuario, ve:
  - Nombre
  - Correo
  - Contraseña temporal
  - Rol asignado
  - Datos adicionales (grado, sección, etc.)
- El admin puede:
  - Enviar credenciales por correo
  - Generar PDF con credenciales
  - Copiar credenciales al portapapeles
  - Marcar como enviado

---

## 6. Flujo de registro de usuarios (resumen)

```
Admin crea usuario en el panel
         ↓
Estado: pending
         ↓
Admin envía credenciales por correo/Teams
         ↓
Usuario recibe: correo, contraseña temporal, enlace
         ↓
Usuario inicia sesión por primera vez
         ↓
Sistema solicita cambio de contraseña
         ↓
Estado: approved
         ↓
Usuario accede al sistema con su rol y permisos
```

---

## 7. Consideraciones técnicas

- Los roles y permisos se almacenan en Firestore (`roles` collection).
- Los usuarios se almacenan en Firestore (`users` collection).
- El sistema debe soportar roles personalizados sin necesidad de modificar código.
- Los nombres de roles se actualizan dinámicamente desde Firestore.
- El super-admin es `admin@salesianosanjose.edu.sv` con contraseña `123456`.

---

## 8. Pendiente / Futuro

- [ ] Implementar cambio obligatorio de contraseña en primer inicio
- [ ] Implementar envío automático de credenciales por correo
- [ ] Implementar envío automático de credenciales por Teams
- [ ] Agregar historial de cambios de roles
- [ ] Agregar logs de auditoría
