import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  ThumbsUp,
  ThumbsDown,
  Tag,
  Hash,
} from 'lucide-react';
import { BehaviorIndicator, BehaviorCategoryType } from '../../types';
import {
  getAllBehaviorIndicators,
  saveBehaviorIndicator,
  deleteBehaviorIndicator,
  seedDefaultBehaviorIndicators,
  DEFAULT_BEHAVIOR_INDICATORS,
} from '../../lib/firestore';

const CATEGORY_OPTIONS: { id: BehaviorCategoryType; label: string; defaultType: 'positivo' | 'negativo' }[] = [
  { id: 'presentacion_uniforme', label: 'Uniforme / Presentación', defaultType: 'negativo' },
  { id: 'puntualidad_asistencia', label: 'Puntualidad y Asistencia', defaultType: 'negativo' },
  { id: 'academico_laboratorio', label: 'Académico y Laboratorio', defaultType: 'negativo' },
  { id: 'convivencia_respeto', label: 'Convivencia y Respeto', defaultType: 'negativo' },
  { id: 'leve', label: 'Falta Leve General', defaultType: 'negativo' },
  { id: 'grave', label: 'Falta Grave General', defaultType: 'negativo' },
  { id: 'muy_grave', label: 'Falta Muy Grave', defaultType: 'negativo' },
  { id: 'positivo', label: 'Méritos y Positivos', defaultType: 'positivo' },
  { id: 'merito', label: 'Mérito Académico / Convivencia', defaultType: 'positivo' },
  { id: 'valores_salesianos', label: 'Valores Salesianos', defaultType: 'positivo' },
];

export default function BehaviorIndicatorsManager() {
  const [indicators, setIndicators] = useState<BehaviorIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'positivo' | 'negativo'>('all');

  // Modal / Edición
  const [editingIndicator, setEditingIndicator] = useState<BehaviorIndicator | null>(null);
  const [isNew, setIsNew] = useState(false);

  const loadIndicators = async () => {
    setLoading(true);
    try {
      let list = await getAllBehaviorIndicators();
      if (list.length === 0) {
        await seedDefaultBehaviorIndicators();
        list = await getAllBehaviorIndicators();
      }
      setIndicators(list);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al cargar los indicadores de conducta.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIndicators();
  }, []);

  const handleOpenNew = () => {
    setIsNew(true);
    setEditingIndicator({
      id: `ind_${Date.now()}`,
      code: '',
      name: '',
      description: '',
      category: 'leve',
      categoryLabel: 'Falta Leve General',
      type: 'negativo',
      value: -0.25,
      order: indicators.length + 1,
      status: 'ACTIVO',
      applicableLevels: ['todos'],
    });
  };

  const handleEdit = (ind: BehaviorIndicator) => {
    setIsNew(false);
    setEditingIndicator({ ...ind });
  };

  const handleSave = async () => {
    if (!editingIndicator) return;

    if (!editingIndicator.code.trim()) {
      setMessage({ type: 'error', text: 'El código del indicador es obligatorio (ej: L-01, G-02).' });
      return;
    }
    if (!editingIndicator.name.trim()) {
      setMessage({ type: 'error', text: 'El nombre o descripción breve es obligatorio.' });
      return;
    }

    // Auto-ajustar signo del valor según el tipo
    let adjustedValue = Math.abs(Number(editingIndicator.value) || 0);
    if (editingIndicator.type === 'negativo') {
      adjustedValue = -adjustedValue;
    }

    const catObj = CATEGORY_OPTIONS.find(c => c.id === editingIndicator.category);
    const indicatorToSave: BehaviorIndicator = {
      ...editingIndicator,
      code: editingIndicator.code.trim().toUpperCase(),
      name: editingIndicator.name.trim(),
      description: editingIndicator.description?.trim() || '',
      categoryLabel: catObj ? catObj.label : editingIndicator.categoryLabel || 'General',
      value: adjustedValue,
    };

    setSaving(true);
    try {
      await saveBehaviorIndicator(indicatorToSave);
      setMessage({ type: 'success', text: `Indicador ${indicatorToSave.code} guardado en Firebase.` });
      setEditingIndicator(null);
      await loadIndicators();
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al guardar el indicador en Firebase.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`¿Estás seguro de eliminar el indicador ${code}?`)) return;
    try {
      await deleteBehaviorIndicator(id);
      setMessage({ type: 'success', text: `Indicador ${code} eliminado.` });
      setIndicators(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al eliminar el indicador.' });
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm('¿Deseas restaurar/asegurar los indicadores predeterminados del reglamento?')) return;
    setSaving(true);
    try {
      await seedDefaultBehaviorIndicators();
      await loadIndicators();
      setMessage({ type: 'success', text: 'Indicadores predeterminados sincronizados en Firebase.' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al restaurar indicadores.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredIndicators = indicators.filter(ind => {
    const matchesSearch =
      ind.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ind.description && ind.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = filterCategory === 'all' || ind.category === filterCategory;
    const matchesType = filterType === 'all' || ind.type === filterType;
    return matchesSearch && matchesCat && matchesType;
  });

  const totalPositivos = indicators.filter(i => i.type === 'positivo').length;
  const totalNegativos = indicators.filter(i => i.type === 'negativo').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Indicadores de Conducta (Catálogo Oficial)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Códigos categorizados con puntaje (+ / -) para cálculo de conducta base (8.5) y reporte de periodo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors shadow-sm"
            title="Sincronizar códigos base"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Restaurar Base
          </button>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo Indicador
          </button>
        </div>
      </div>

      {/* Alerta de Mensaje */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between text-xs font-semibold ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {message.text}
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Indicadores</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{indicators.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase">Faltas / Negativos (-)</div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{totalNegativos}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
            <ThumbsDown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Méritos / Positivos (+)</div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{totalPositivos}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600">
            <ThumbsUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Todas las Categorías</option>
            {CATEGORY_OPTIONS.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
          >
            <option value="all">Todos los Tipos</option>
            <option value="negativo">Negativo (-)</option>
            <option value="positivo">Positivo (+)</option>
          </select>
        </div>
      </div>

      {/* Tabla de Indicadores */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs font-semibold">Cargando indicadores de conducta...</span>
          </div>
        ) : filteredIndicators.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <ShieldAlert className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No se encontraron indicadores</p>
            <p className="text-xs text-slate-500 mt-1">Prueba cambiando los filtros o crea uno nuevo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Indicador / Conducta</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4 text-center">Valor</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredIndicators.map((ind) => {
                  const isPos = ind.type === 'positivo';
                  return (
                    <tr key={ind.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {ind.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {ind.categoryLabel || ind.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{ind.name}</div>
                        {ind.description && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {ind.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isPos
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {isPos ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                          {ind.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-sm">
                        <span className={isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {ind.value > 0 ? `+${ind.value}` : ind.value}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ind.status === 'ACTIVO'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {ind.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(ind)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(ind.id, ind.code)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      {editingIndicator && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center font-bold">
                  <Hash className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isNew ? 'Nuevo Indicador de Conducta' : `Editar Indicador: ${editingIndicator.code}`}
                  </h3>
                  <p className="text-xs text-slate-500">Configuración para cálculo del periodo</p>
                </div>
              </div>
              <button
                onClick={() => setEditingIndicator(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Código Asignado *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: L-01, G-02, POS-01"
                    value={editingIndicator.code}
                    onChange={(e) => setEditingIndicator({ ...editingIndicator, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Impacto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingIndicator({ ...editingIndicator, type: 'negativo' })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                        editingIndicator.type === 'negativo'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      Resta (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIndicator({ ...editingIndicator, type: 'positivo' })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1 ${
                        editingIndicator.type === 'positivo'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Suma (+)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={editingIndicator.category}
                    onChange={(e) => {
                      const cat = e.target.value as BehaviorCategoryType;
                      const catObj = CATEGORY_OPTIONS.find(c => c.id === cat);
                      setEditingIndicator({
                        ...editingIndicator,
                        category: cat,
                        categoryLabel: catObj?.label,
                        type: catObj?.defaultType || editingIndicator.type,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Numérico (+ / -)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="0.25, 0.5, 1.0"
                    value={Math.abs(editingIndicator.value)}
                    onChange={(e) => setEditingIndicator({ ...editingIndicator, value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Se guardará como: <strong className={editingIndicator.type === 'positivo' ? 'text-emerald-600' : 'text-rose-600'}>
                      {editingIndicator.type === 'positivo' ? `+${Math.abs(editingIndicator.value)}` : `-${Math.abs(editingIndicator.value)}`}
                    </strong>
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre o Criterio *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Presentación del uniforme incorrecta o incompleta"
                  value={editingIndicator.name}
                  onChange={(e) => setEditingIndicator({ ...editingIndicator, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción o Fundamento Reglamentario
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalle de cuándo aplica este indicador de conducta..."
                  value={editingIndicator.description || ''}
                  onChange={(e) => setEditingIndicator({ ...editingIndicator, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={editingIndicator.status}
                    onChange={(e) => setEditingIndicator({ ...editingIndicator, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Orden
                  </label>
                  <input
                    type="number"
                    value={editingIndicator.order || 1}
                    onChange={(e) => setEditingIndicator({ ...editingIndicator, order: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingIndicator(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/30 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Guardando en Firebase...' : 'Guardar Indicador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
