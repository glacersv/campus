import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { ClipboardCheck } from 'lucide-react';

export default function CoordinacionDashboard() {
  return (
    <ModuleGridDashboard
      title="Coordinación Académica"
      subtitle="Selecciona un módulo."
      basePath="/coordinacion"
      icon={ClipboardCheck}
      iconBgClassName="bg-primary/10"
      iconTextClassName="text-primary"
    />
  );
}
