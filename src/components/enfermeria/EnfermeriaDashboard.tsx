import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { HeartPulse } from 'lucide-react';

export default function EnfermeriaDashboard() {
  return (
    <ModuleGridDashboard
      title="Enfermería"
      subtitle="Gestione formación, avisos y comunicados de salud institucional desde su panel de enfermería."
      basePath="/enfermeria"
      icon={HeartPulse}
      iconBgClassName="bg-red-50"
      iconTextClassName="text-red-600"
      bannerArea="enfermeria"
    />
  );
}
