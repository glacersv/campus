import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { ClipboardCheck } from 'lucide-react';

export default function CoordinacionDashboard() {
  return (
    <ModuleGridDashboard
      title="Coordinación Académica"
      subtitle="Gestione formación, notas, clases, horarios, eventos y proyectos institucionales desde su panel central."
      basePath="/coordinacion"
      icon={ClipboardCheck}
      iconBgClassName="bg-primary/10"
      iconTextClassName="text-primary"
      bannerArea="coordinacion"
    />
  );
}
