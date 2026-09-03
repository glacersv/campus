import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';

export default function TeacherHome() {
  return (
    <ModuleGridDashboard
      title="Panel Docente"
      subtitle="Gestione proyectos estudiantiles, actividades LMS y módulos curriculares desde su panel de docente."
      basePath="/docente"
      showMondayNotice={true}
      exclude={['formacion']}
      bannerArea="docente"
    />
  );
}
