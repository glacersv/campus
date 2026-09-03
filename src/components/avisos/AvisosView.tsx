import React from 'react';
import { Bell, Plus, Megaphone, Pin } from 'lucide-react';

export default function AvisosView() {
  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-blue-100">
            <Bell className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="module-title">Avisos y Comunicados</h1>
            <p className="module-subtitle">Publicación y gestión de comunicados oficiales</p>
          </div>
        </div>
        <button className="btn-primary">
          <Plus className="w-4 h-4" />
          Nuevo Aviso
        </button>
      </div>

      <div className="card-crema p-8 text-center">
        <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">Vista de Avisos</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Aquí podrás crear y gestionar avisos y comunicados dirigidos a docentes, alumnos y padres de familia.
          Podrás fijar avisos importantes y programar su publicación.
        </p>
        <div className="mt-4">
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Próximamente</span>
        </div>
      </div>
    </div>
  );
}
