import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { Brain } from 'lucide-react';

export default function PsicopedagogiaDashboard() {
  return (
    <ModuleGridDashboard
      title="Psicopedagogía"
      subtitle="Acompañamiento estudiantil, formación integral, notas y avisos institucionales desde su panel de psicopedagogía."
      basePath="/psicopedagogico"
      icon={Brain}
      iconBgClassName="bg-purple-50"
      iconTextClassName="text-purple-600"
      bannerArea="psicopedagogico"
    />
  );
}
