# Auditoría de Datos Hardcodeados - Repo Temporal LMS

Repo temporal clonado: /tmp/lms-repo  
GitHub: https://github.com/glacersv/lms  
Fecha: 30 de agosto 2026

## Hallazgo principal

Sí, ese repo tiene datos hardcodeados, sobre todo curriculares y de prueba. No se detectaron secretos críticos tipo API keys, tokens, passwords o claves privadas.

## Dónde están los datos hardcodeados

- src/services/btvCurriculumData.ts
  - 26 módulos BTV hardcodeados
  - Nombres reales de docentes: Licda. Karla Hernández, Licda. Brenda Alvarado
  - Datos de estudiante de prueba: student-glacer / Estudiante Salesiano
  - Calificaciones, fechas y feedback de prueba
  - Códigos, horas, semanas y secciones fijas

- src/services/lmsService.ts
  - Seed inicial con actividades, entregas y calificaciones de prueba
  - Fechas fijas 2026
  - Niveles MINED hardcodeados

- src/services/curriculumDocsService.ts
  - Rúbrica de 29 ítems oficial MINED hardcodeada
  - Criterios, pesos y descriptores por nivel

- src/App.tsx
  - Rutas y rol inicial hardcodeado
  - IDs iniciales de curso y actividad

- src/types.ts
  - Constantes de módulos y niveles MINED

## Riesgo

- Medio-Alto: PII de docentes y datos de prueba que pueden confundirse con producción.
- Medio: calificaciones, feedback y fechas de prueba.
- Bajo: códigos curriculares y rúbrica oficial.

## Recomendación prioritaria

Externalizar BTV_GRAPHIC_DESIGN_COURSES a JSON/DB y reemplazar nombres reales por placeholders antes de seguir integrándolo al proyecto principal.
