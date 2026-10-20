import React, { useState, useEffect } from 'react';
import {
  Compass,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  ListPlus,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import {
  AccompanimentArea,
  AccompanimentIndicator,
} from '../../types';
import {
  getAllAccompanimentAreas,
  saveAccompanimentArea,
  deleteAccompanimentArea,
  seedAccompanimentDefaultAreas,
  DEFAULT_ACCOMPANIMENT_AREAS,
} from '../../lib/firestore';

export default function AccompanimentManager() {
  const [areas, setAreas] = useState<AccompanimentArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal / Edición de Área
  const [editingArea, setEditingArea] = useState<AccompanimentArea | null>(null);
  const [isNewArea, setIsNewArea] = useState(false);

  // Nuevo Indicador rápido dentro del modal
  const [newIndicatorName, setNewIndicatorName] = useState('');

  const loadAreas = async () => {
    setLoading(true);
    try {
      let list = await getAllAccompanimentAreas();
      if (list.length === 0) {
        // Auto-seed si está vacío
        await seedAccompanimentDefaultAreas();
        list = await getAllAccompanimentAreas();
      }
      setAreas(list);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar las áreas de acompañamiento.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAreas();
  }, []);

  const handleOpenNewArea = () => {
    setIsNewArea(true);
    setEditingArea({
      id: `area-${Date.now()}`,
      name: '',
      description: '',
      order: areas.length + 1,
      status: 'ACTIVO',
      applicableLevels: ['parvularia', 'primaria', 'tercer_ciclo', 'bachillerato_general', 'bachillerato_tecnico'],
      indicators: [],
    });
    setNewIndicatorName('');
  };

  const handleEditArea = (area: AccompanimentArea) => {
    setIsNewArea(false);
    setEditingArea(JSON.parse(JSON.stringify(area)));
    setNewIndicatorName('');
  };

  const handleSaveArea = async () => {
    if (!editingArea || !editingArea.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre del área es obligatorio.' });
      return;
    }

    setSaving(true);
    try {
      await saveAccompanimentArea(editingArea);
      setMessage({ type: 'success', text: 'Área guardada exitosamente.' });
      setEditingArea(null);
      await loadAreas();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al guardar el área.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArea = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el área "${name}" y todos sus indicadores?`)) {
      return;
    }
    setSaving(true);
    try {
      await deleteAccompanimentArea(id);
      setMessage({ type: 'success', text: `Área "${name}" eliminada.` });
      await loadAreas();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar el área.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddIndicator = () => {
    if (!newIndicatorName.trim() || !editingArea) return;
    const newInd: AccompanimentIndicator = {
      id: `ind-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newIndicatorName.trim(),
      order: (editingArea.indicators?.length || 0) + 1,
    };
    setEditingArea({
      ...editingArea,
      indicators: [...(editingArea.indicators || []), newInd],
    });
    setNewIndicatorName('');
  };

  const handleRemoveIndicator = (indId: string) => {
    if (!editingArea) return;
    setEditingArea({
      ...editingArea,
      indicators: editingArea.indicators.filter(i => i.id !== indId),
    });
  };

  const handleSeedDefaults = async () => {
    if (!window.confirm('¿Deseas restaurar o cargar las áreas predeterminadas del Cuadro 2026?')) return;
    setSaving(true);
    try {
      await seedAccompanimentDefaultAreas();
      setMessage({ type: 'success', text: 'Dimensiones salesianas 2026 restauradas con éxito.' });
      await loadAreas();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al sembrar dimensiones predeterminadas.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Institucional */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-10 pointer-events-none">
          <Compass className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Gestión Curricular & Formativa
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              Cuadro de Acompañamiento
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Configuración de áreas, dimensiones formativas e indicadores cualitativos salesianos (E, MB, B, NM) disponibles para la evaluación docente en todos los niveles.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleSeedDefaults}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-sm font-medium transition-all shadow-sm"
              title="Cargar las 4 dimensiones y 14 criterios oficiales del Excel 2026"
            >
              <RefreshCw className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              Recargar Criterios 2026
            </button>
            <button
              onClick={handleOpenNewArea}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              Nueva Área
            </button>
          </div>
        </div>
      </div>

      {/* Alerta de feedback */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' 
            : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-auto text-xs underline opacity-70 hover:opacity-100">
            Cerrar
          </button>
        </div>
      )}

      {/* Resumen de escala */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          <HelpCircle className="w-4 h-4 text-indigo-500" />
          <span>Escala de Evaluación Oficial:</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            E = Excelente
          </span>
          <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            MB = Muy Bueno
          </span>
          <span className="px-3 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            B = Bueno
          </span>
          <span className="px-3 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            NM = Necesita Mejorar
          </span>
        </div>
      </div>

      {/* Grid de Áreas e Indicadores */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No hay áreas configuradas</h3>
          <p className="text-sm text-slate-500 mt-1 mb-4">Puedes cargar la configuración oficial 2026 de inmediato.</p>
          <button
            onClick={handleSeedDefaults}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-500 transition-all shadow-md"
          >
            Cargar Criterios 2026
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {areas.map((area) => (
            <div
              key={area.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {area.order}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {area.name}
                    </h3>
                  </div>
                  {area.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {area.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEditArea(area)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                    title="Editar área e indicadores"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteArea(area.id, area.name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Eliminar área"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Card Body - Lista de Indicadores */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                    <span>Indicadores / Criterios ({area.indicators?.length || 0})</span>
                  </div>

                  <div className="space-y-2">
                    {area.indicators && area.indicators.length > 0 ? (
                      area.indicators.map((ind, idx) => (
                        <div
                          key={ind.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="text-slate-700 dark:text-slate-200 font-medium">
                              {ind.name}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic py-2">
                        No hay indicadores registrados en esta área.
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    Disponible en todos los niveles
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-medium text-[10px]">
                    {area.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Creación / Edición */}
      {editingArea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isNewArea ? 'Nueva Área de Acompañamiento' : 'Editar Área de Acompañamiento'}
                </h3>
                <p className="text-xs text-slate-500">Configura el nombre y sus criterios evaluativos</p>
              </div>
              <button
                onClick={() => setEditingArea(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Nombre del Área / Dimensión
                </label>
                <input
                  type="text"
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                  placeholder="Ej: EVANGELIZACIÓN Y CATEQUESIS"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Descripción (Opcional)
                </label>
                <input
                  type="text"
                  value={editingArea.description || ''}
                  onChange={(e) => setEditingArea({ ...editingArea, description: e.target.value })}
                  placeholder="Ej: Vivencia de la fe y el carisma salesiano"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Orden de Visualización
                  </label>
                  <input
                    type="number"
                    value={editingArea.order}
                    onChange={(e) => setEditingArea({ ...editingArea, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Estado
                  </label>
                  <select
                    value={editingArea.status}
                    onChange={(e) => setEditingArea({ ...editingArea, status: e.target.value as 'ACTIVO' | 'INACTIVO' })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              {/* Indicadores dentro del área */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase">
                  Criterios / Indicadores ({editingArea.indicators?.length || 0})
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newIndicatorName}
                    onChange={(e) => setNewIndicatorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddIndicator();
                      }
                    }}
                    placeholder="Escribe un nuevo indicador y presiona Agregar"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddIndicator}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <ListPlus className="w-4 h-4" />
                    Agregar
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {editingArea.indicators && editingArea.indicators.length > 0 ? (
                    editingArea.indicators.map((ind, i) => (
                      <div
                        key={ind.id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-bold">{i + 1}.</span>
                          <span className="text-slate-800 dark:text-slate-200">{ind.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIndicator(ind.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Sin indicadores aún. Agrega al menos uno.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30">
              <button
                type="button"
                onClick={() => setEditingArea(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveArea}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando...' : 'Guardar Área'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
