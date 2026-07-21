# Campus Salesiano San José

## Stack
React 19 + TypeScript + Vite + Tailwind CSS v4 + Firebase (Auth + Firestore)

## Arquitectura
- `src/types.ts` — Tipos compartidos
- `src/firebase.ts` — Inicialización Firebase + `saveAttendanceReport`
- `src/lib/firestore.ts` — CRUD completo: users, teachers, grades, students + `seedInitialData()`
- `src/contexts/AuthContext.tsx` — Auth con email/password, rol admin/teacher
- `src/components/Login.tsx` — Login con toggle registro
- `src/components/Dashboard.tsx` — Dashboard del docente para tomar asistencia
- `src/components/SummaryModal.tsx` — Modal de resumen con sync a Firestore + export CSV/JSON
- `src/components/admin/` — Panel admin: Dashboard, CRUD Docentes, Grados, Alumnos
- `src/components/InstitutionLogo.tsx` — Logo institucional con fallback SVG

## Firebase
- Proyecto: `campus-27248`
- Colección principal: `attendance_reports`
- Firestore rules en `firestore.rules`

## Estado Actual
- Login con email/password funcional
- Dashboard de asistencia con disciplina (cabello, uñas, uniforme)
- Sincronización automática a Firestore al finalizar jornada
- Panel admin con CRUD de docentes, grados, alumnos
- Seed data se ejecuta automáticamente al iniciar sesión

## Pendiente (Fase 2)
- Integración Microsoft Azure AD
- Exportación PDF
- Historial de reportes
- Dashboard estadístico

## Comandos
- `npm run dev` — Dev server en puerto 3000
- `npm run build` — Build producción a `dist/`
- `npm run lint` — TypeScript check
- `npm run deploy` — Build + firebase deploy hosting
- `npm run rules` — firebase deploy firestore:rules

## Super Admin
- Email: jose.marquez@salesianosanjose.edu.sv
- Rol: admin + teacher
