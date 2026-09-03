import React from 'react';
import ModuleGridDashboard from '../shared/ModuleGridDashboard';
import { BookOpen } from 'lucide-react';

export default function RegistroDashboard() {
  return (
    <ModuleGridDashboard
      title="Registro Académico"
      subtitle="Consulte y gestione calificaciones, horarios y registros estudiantiles desde su panel de registro académico."
      basePath="/registro"
      icon={BookOpen}
      iconBgClassName="bg-accent/10"
      iconTextClassName="text-accent"
      bannerArea="registro"
    />
  );
}
