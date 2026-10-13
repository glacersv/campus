# Campus Salesiano San José - Plan Completo

## Stack
- React 19 + TypeScript + Vite + Tailwind CSS v4
- Firebase (Auth + Firestore + Hosting)
- Logo: Escudo oficial "AD ASTRA - SAN JOSÉ"

## Credenciales
- **Admin**: `admin@salesianosanjose.edu.sv` / `12345`
- **Teacher**: `jose.marquez@salesianosanjose.edu.sv` / `12345`
- **Firebase Project**: `campus-27248`
- **Hosting**: https://campus-27248.web.app

---

## Estructura de Archivos

```
src/
├── types.ts                          # Tipos: Cycle, BaccalaureateType, Grade, Section, Building, ComputerLab, Teacher, Student
├── firebase.ts                       # Inicialización Firebase
├── App.tsx                           # Router principal (admin/teacher)
├── index.css                         # Estilos TailAdmin + glassmorphism
├── assets/
│   └── logo-salesiano.png            # Logo oficial del escudo
├── lib/
│   └── firestore.ts                  # CRUD completo + seed data
├── contexts/
│   └── AuthContext.tsx               # Auth con email/password
├── components/
│   ├── Login.tsx                     # Login con Microsoft placeholder
│   ├── InstitutionLogo.tsx           # Logo local
│   ├── TeacherDashboard.tsx          # Dashboard docente
│   ├── Dashboard.tsx                 # Dashboard asistencia
│   ├── SummaryModal.tsx              # Modal resumen
│   └── admin/
│       ├── AdminLayout.tsx           # Sidebar con logo verde
│       ├── AdminDashboard.tsx        # Stats + módulos
│       ├── GradesManager.tsx         # Grados por ciclo
│       ├── SectionsManager.tsx       # Secciones con edificio
│       ├── SubjectsManager.tsx       # Materias CRUD
│       ├── TeachersManager.tsx       # Docentes con perfil completo
│       ├── StudentsManager.tsx       # Alumnos por grado/sección
│       ├── BuildingsManager.tsx      # Edificios glassmorphism
│       ├── ComputerLabsManager.tsx   # Laboratorios CRUD
│       ├── BaccalaureateTypesManager.tsx  # Tipos de bachillerato
│       └── GradeSectionAssignment.tsx     # Asignación grado-sección-edificio
└── scripts/
    ├── clear-firestore.cjs           # Limpiar Firestore
    └── seed-firestore.cjs            # Seed completo
```

---

## Sistema de Grados por Ciclos

### Estructura Académica
| Ciclo | Grados | Color |
|-------|--------|-------|
| **1° Ciclo** | 1°, 2°, 3° | Verde (#059669) |
| **2° Ciclo** | 4°, 5°, 6° | Azul (#2563EB) |
| **3° Ciclo** | 7°, 8°, 9° | Púrpura (#7C3AED) |
| **Bachillerato General** | 10°, 11° | Celeste (#0EA5E9) |
| **Bachillerato Técnico** | 10°, 11°, 12° | Naranja (#F97316) |

### Tipos de Bachillerato
- **General**: Hasta 11° (2 años)
- **Técnico**: Hasta 12° (3 años)

---

## Edificios (Seed)

| Código | Nombre | Color | Descripción |
|--------|--------|-------|-------------|
| EP | Edificio Principal | #12562E | Administración y oficinas |
| EA | Edificio Académico | #0D71B9 | Aulas de clases |
| ET | Edificio Técnico | #FAB700 | Laboratorios y talleres |
| ED | Edificio Deportivo | #D32F2F | Gimnasio y deportes |

---

## Laboratorios de Cómputo (Seed)

| Lab | Edificio | Capacidad | Dispositivos |
|-----|----------|-----------|--------------|
| Lab 1-3 | Edificio Técnico | 30 | 28-30 |
| Lab 4-6 | Edificio Académico | 25 | 24-25 |
| Lab 7-10 | Edificio Técnico | 30-35 | 30-35 |

---

## Firestore Rules

```javascript
// Colecciones permitidas
users           // CRUD por rol
teachers        // Admin write, admin+teacher read
grades          // Admin write, admin+teacher read
sections        // Admin write, admin+teacher read
subjects        // Admin write, admin+teacher read
students        // Admin write, admin+teacher read
baccalaureate_types  // Admin write, admin+teacher read
buildings       // Admin write, admin+teacher read
computer_labs   // Admin write, admin+teacher read
attendance_reports   // Teacher create, admin write
```

---

## Funcionalidades por Sección

### Sidebar
- **Dashboard** → Stats y módulos
- **GESTIÓN ACADÉMICA**
  - Grados (filtro por ciclo, cards agrupadas)
  - Secciones (con edificio, sin lab)
  - Asignación Grado-Sección (asignar edificio)
  - Materias
  - Edificios (4 cards glassmorphism)
  - Laboratorios
- **BACHILLERATO**
  - Tipos de Bachillerato (General/Técnico)
- **PERSONAL**
  - Docentes
- **ALUMNOS**
  - Alumnos

### Formularios Corregidos
- Todos eliminan `undefined` antes de enviar a Firestore
- Firestore no acepta campos con valor `undefined`

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Dev server en puerto 3000

# Build
npm run build                  # Build producción a dist/

# Deploy
npm run deploy                 # Build + firebase deploy hosting
firebase deploy --only hosting # Solo hosting
firebase deploy --only firestore:rules  # Solo reglas

# Scripts
node scripts/clear-firestore.cjs   # Limpiar datos
node scripts/seed-firestore.cjs    # Seed completo
```

---

## Pendiente

- [ ] Integración Microsoft Azure AD (botón placeholder)
- [ ] Exportación PDF
- [ ] Historial de reportes
- [ ] Dashboard estadístico
- [ ] Asignar laboratorios a secciones (asignación grade-section-lab)

---

## Notas Importantes

1. **Seed automático**: Solo ejecuta si `grades` está vacío
2. **Para resetear datos**: Ejecutar `clear-firestore.cjs` luego `seed-firestore.cjs`
3. **Firestore rules**: Siempre deploy después de cambiar reglas
4. **Logo**: Guardado en `src/assets/logo-salesiano.png`
