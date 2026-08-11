import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';

export default function TeacherHome() {
  return (
    <ModuleGridDashboard
      title="Panel Docente"
      subtitle="Acceda a los módulos de control de asistencia, proyectos y gestión de alumnos habilitados para su usuario."
      basePath="/docente"
      showMondayNotice={true}
    />
  );
}
