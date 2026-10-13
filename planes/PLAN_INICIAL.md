# PLAN INICIAL - Campus Colegio Salesiano San José

**Fecha:** 20 de julio de 2026
**Estado:** Fase 1 Completa - Firebase Auth + Firestore
**Próxima fase:** Integración Microsoft Azure AD (pendiente)

---

## 1. Información General del Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | Campus Colegio Salesiano San José |
| **Proyecto Firebase** | campus-27248 |
| **URL Hosting** | https://campus-27248.web.app |
| **Tecnologías** | React 19, TypeScript, Vite, Tailwind CSS, Firebase |
| **Super Admin** | jose.marquez@salesianosanjose.edu.sv |

---

## 2. Estructura de Archivos

```
campus/
├── src/
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx        # Layout del panel admin
│   │   │   ├── AdminDashboard.tsx     # Dashboard principal admin
│   │   │   ├── TeachersManager.tsx    # CRUD de docentes
│   │   │   ├── GradesManager.tsx      # CRUD de grados
│   │   │   └── StudentsManager.tsx    # CRUD de alumnos
│   │   ├── Dashboard.tsx              # Dashboard del docente
│   │   ├── Login.tsx                  # Pantalla de login
│   │   ├── InstitutionLogo.tsx        # Logo institucional
│   │   └── SummaryModal.tsx           # Modal de resumen
│   ├── contexts/
│   │   └── AuthContext.tsx            # Contexto de autenticación
│   ├── lib/
│   │   └── firestore.ts              # Funciones CRUD Firestore
│   ├── types.ts                       # Tipos TypeScript
│   ├── firebase.ts                    # Configuración Firebase
│   ├── App.tsx                        # Componente principal
│   └── main.tsx                       # Entry point
├── firestore.rules                    # Reglas de seguridad
├── firebase-applet-config.json        # Config Firebase
├── firebase-blueprint.json            # Esquema DB
└── PLAN_INICIAL.md                    # Este archivo
```

---

## 3. Estructura Firestore

### 3.1 Colecciones

```
users/{uid}
  ├── uid: string
  ├── email: string
  ├── displayName: string
  ├── role: 'admin' | 'teacher'
  ├── teacherId?: string
  ├── createdAt: Timestamp
  └── microsoftId?: string

teachers/{teacherId}
  ├── id: string
  ├── name: string
  ├── email: string
  ├── gradeId: string
  ├── avatarUrl?: string
  └── createdAt: Timestamp

grades/{gradeId}
  ├── id: string
  ├── name: string
  ├── teacherId: string
  └── createdAt: Timestamp

students/{studentId}
  ├── id: string
  ├── name: string
  ├── gender: 'M' | 'F'
  ├── gradeId: string
  └── createdAt: Timestamp

attendance_reports/{reportId}
  ├── (estructura existente)
  └── ...
```

### 3.2 Reglas de Seguridad

| Colección | Admin | Teacher | Owner |
|-----------|-------|---------|-------|
| users | CRUD completo | Lee propio | Lee propio |
| teachers | CRUD completo | Solo lectura | - |
| grades | CRUD completo | Solo lectura | - |
| students | CRUD completo | Solo lectura | - |
| attendance_reports | CRUD completo | Crear + Leer | - |

---

## 4. Autenticación

### 4.1 Estado Actual: Email/Password

El sistema usa Firebase Auth con email/password.

**Cuenta Super Admin:**
- Email: jose.marquez@salesianosanjose.edu.sv
- Rol: admin + teacher
- Acceso total al sistema

### 4.2 Integración Microsoft (Pendiente)

**Requisitos:**
1. Acceso a Azure Portal
2. Crear App Registration
3. Obtener Tenant ID
4. Configurar en Firebase Console

**Configuración futura:**
```typescript
// src/lib/microsoft.ts (pendiente)
import { OAuthProvider } from 'firebase/auth';

const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.setCustomParameters({
  tenant: 'TENANT_ID_AZURE'
});
```

---

## 5. Panel de Administración

### 5.1 Funcionalidades

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Estadísticas generales, docentes recientes |
| **Docentes** | Crear, editar, eliminar docentes |
| **Grados** | Crear, editar, eliminar grados, asignar tutores |
| **Alumnos** | Crear, editar, eliminar alumnos, filtrar por grado |

### 5.2 Acceso

- URL: `/admin` (futuro)
- Requiere rol: `admin`
- Botón "Ver como Docente" para alternar vistas

---

## 6. Despliegue

### 6.1 Requisitos

```bash
# Node.js 18+
node --version

# Firebase CLI
npm install -g firebase-tools
firebase login
```

### 6.2 Comandos

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build producción
npm run build

# Desplegar a Firebase Hosting
firebase deploy --only hosting

# Desplegar reglas Firestore
firebase deploy --only firestore:rules
```

### 6.3 Scripts Útiles

```bash
# Agregar a package.json
{
  "scripts": {
    "deploy": "npm run build && firebase deploy --only hosting",
    "rules": "firebase deploy --only firestore:rules"
  }
}
```

---

## 7. Datos Iniciales (Seed Data)

El archivo `src/lib/firestore.ts` contiene una función `seedInitialData()` que crea:

- 2 grados: 9° Grado "A" y 1° Año Bachillerato "A"
- 2 docentes: Prof. Roberto Henríquez y Profra. Andrea Melara
- 20 alumnos (10 por grado)

**Nota:** Solo se ejecuta si la colección está vacía.

---

## 8. Próximos Pasos

### Fase 2: Integración Microsoft Azure AD
- [ ] Obtener acceso a Azure Portal
- [ ] Crear App Registration
- [ ] Configurar Microsoft en Firebase Console
- [ ] Implementar login con Microsoft
- [ ] Restringir a tenant específico

### Fase 3: Funcionalidades Avanzadas
- [ ] Exportación PDF
- [ ] Historial de reportes
- [ ] Dashboard estadístico
- [ ] Notificaciones
- [ ] Gestión de usuarios/auth desde admin

---

## 9. Comandos Importantes

```bash
# Verificar TypeScript
npm run lint

# Build producción
npm run build

# Verificar reglas Firestore
firebase emulators:start --only firestore

# Ver logs de Firebase
firebase functions:log
```

---

## 10. Contacto y Soporte

| Rol | Email |
|-----|-------|
| Super Admin | jose.marquez@salesianosanjose.edu.sv |
| Proyecto Firebase | campus-27248 |

---

**Última actualización:** 20 de julio de 2026