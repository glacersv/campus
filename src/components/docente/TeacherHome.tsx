import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';

export default function TeacherHome() {
  return (
    <ModuleGridDashboard
      title="Panel Docente"
      subtitle="Acceda a los módulos de gestión de alumnos y proyectos habilitados para su usuario."
      basePath="/docente"
      showMondayNotice={true}
      exclude={['formacion']}
    />
  );
}
