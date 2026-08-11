import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { Brain } from 'lucide-react';

export default function PsicopedagogiaDashboard() {
  return (
    <ModuleGridDashboard
      title="Psicopedagogía"
      subtitle="Selecciona un módulo."
      basePath="/psicopedagogico"
      icon={Brain}
      iconBgClassName="bg-purple-50"
      iconTextClassName="text-purple-600"
    />
  );
}
