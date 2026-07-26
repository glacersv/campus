import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Users, BookOpen, Handshake, Baby, GraduationCap, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface CoordinacionArea {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  description: string;
  modules: string[];
  gradeRange?: string;
}

const COORDINACION_AREAS: CoordinacionArea[] = [
  {
    id: 'academica',
    name: 'Coordinación Académica',
    icon: BookOpen,
    color: '#0D71B9',
    description: 'Gestión de notas, evaluaciones, horarios y carga docente',
    modules: ['notas', 'horario', 'clase', 'carga-docente'],
  },
  {
    id: 'convivencia',
    name: 'Coordinación de Convivencia',
    icon: Handshake,
    color: '#D32F2F',
    description: 'Control de asistencia, disciplina e incidentes (7°-12°)',
    modules: ['formacion', 'asistencia', 'disciplina'],
    gradeRange: '7° - 12°',
  },
  {
    id: 'primaria',
    name: 'Coordinación de Primaria',
    icon: GraduationCap,
    color: '#25855A',
    description: 'Módulos de formación para grados 1° - 6°',
    modules: ['formacion', 'notas', 'horario'],
    gradeRange: '1° - 6°',
  },
  {
    id: 'parvularia',
    name: 'Coordinación de Parvularia',
    icon: Baby,
    color: '#FAB700',
    description: 'Módulos de formación para grados K4 - K6',
    modules: ['formacion', 'actividades'],
    gradeRange: 'K4 - K6',
  },
];

export default function CoordinacionesConfig() {
  const [areas, setAreas] = useState<CoordinacionArea[]>(COORDINACION_AREAS);
  const [editingArea, setEditingArea] = useState<CoordinacionArea | null>(null);

  const handleToggleModule = (areaId: string, moduleId: string) => {
    setAreas(prev => prev.map(area => {
      if (area.id !== areaId) return area;
      const hasModule = area.modules.includes(moduleId);
      return {
        ...area,
        modules: hasModule
          ? area.modules.filter(m => m !== moduleId)
          : [...area.modules, moduleId]
      };
    }));
  };

  const handleSave = () => {
    toast.success('Configuración de coordinaciones guardada');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-slate-100">
            <Settings className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="module-title">Configuración de Coordinaciones</h1>
            <p className="module-subtitle">Administra las áreas y módulos de cada coordinación</p>
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Check className="w-4 h-4" /> Guardar Cambios
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-800">Configuración Solo Admin</h4>
            <p className="text-xs text-amber-700 mt-1">
              Estas configuraciones solo son visibles para el administrador. Las coordinaciones solo ven los módulos que les corresponden.
            </p>
          </div>
        </div>
      </div>

      {/* Coordinaciones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map((area, i) => {
          const Icon = area.icon;
          return (
            <motion.div
              key={area.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
            >
              {/* Header with color */}
              <div className="p-4 border-b border-slate-100" style={{ borderLeftColor: area.color, borderLeftWidth: '4px' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: area.color + '18' }}>
                      <Icon className="w-5 h-5" style={{ color: area.color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{area.name}</h3>
                      {area.gradeRange && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: area.color + '18', color: area.color }}>
                          {area.gradeRange}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">{area.description}</p>
              </div>

              {/* Modules */}
              <div className="p-4">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Módulos Habilitados</p>
                <div className="flex flex-wrap gap-2">
                  {['formacion', 'notas', 'horario', 'clase', 'asistencia', 'disciplina', 'carga-docente', 'actividades'].map(moduleId => {
                    const isActive = area.modules.includes(moduleId);
                    const moduleLabels: Record<string, string> = {
                      'formacion': 'Formación',
                      'notas': 'Calificaciones',
                      'horario': 'Horarios',
                      'clase': 'Control de Clases',
                      'asistencia': 'Asistencia',
                      'disciplina': 'Disciplina',
                      'carga-docente': 'Carga Docente',
                      'actividades': 'Actividades',
                    };
                    return (
                      <button
                        key={moduleId}
                        onClick={() => handleToggleModule(area.id, moduleId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isActive
                            ? 'text-white shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                        }`}
                        style={isActive ? { backgroundColor: area.color, borderColor: area.color } : {}}
                      >
                        {moduleLabels[moduleId] || moduleId}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Coordinator assignment */}
              <div className="px-4 pb-4">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Coordinador Asignado</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">Sin asignar</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
