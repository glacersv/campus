import React from 'react';
import { Handshake, Shield, Users, AlertTriangle } from 'lucide-react';

export default function ConvivenciaPanel() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-red-100">
            <Handshake className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h1 className="module-title">Panel de Convivencia</h1>
            <p className="module-subtitle">Gestión de convivencia escolar (7° - 12°)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Asistencia</h3>
              <p className="text-xs text-secondary">Control diario</p>
            </div>
          </div>
          <p className="text-xs text-tertiary">Módulo en desarrollo</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Disciplina</h3>
              <p className="text-xs text-secondary">Infracciones</p>
            </div>
          </div>
          <p className="text-xs text-tertiary">Módulo en desarrollo</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Incidentes</h3>
              <p className="text-xs text-secondary">Reportes</p>
            </div>
          </div>
          <p className="text-xs text-tertiary">Módulo en desarrollo</p>
        </div>
      </div>
    </div>
  );
}
