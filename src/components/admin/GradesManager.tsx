import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Users,
  Search
} from 'lucide-react';
import {
  getAllGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  getAllTeachers
} from '../../lib/firestore';
import { Grade, Teacher } from '../../types';

interface GradeFormData {
  id: string;
  name: string;
  teacherId: string;
}

const emptyForm: GradeFormData = {
  id: '',
  name: '',
  teacherId: ''
};

export default function GradesManager() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<GradeFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gradesData, teachersData] = await Promise.all([
        getAllGrades(),
        getAllTeachers()
      ]);
      setGrades(gradesData);
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateGrade(editingId, {
          name: formData.name,
          teacherId: formData.teacherId
        });
      } else {
        await createGrade({
          id: formData.id || `g${Date.now()}`,
          name: formData.name,
          teacherId: formData.teacherId
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadData();
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const handleEdit = (grade: Grade) => {
    setFormData({
      id: grade.id,
      name: grade.name,
      teacherId: grade.teacherId
    });
    setEditingId(grade.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este grado?')) {
      await deleteGrade(id);
      loadData();
    }
  };

  const filteredGrades = grades.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-salesiano-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Cargando grados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Grados</h2>
          <p className="text-sm text-slate-500">Administra los grados y sus tutores</p>
        </div>
        <button
          onClick={() => {
            setFormData(emptyForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-salesiano-green hover:bg-salesiano-green-dark text-white font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Grado
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar grado..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">
              {editingId ? 'Editar Grado' : 'Nuevo Grado'}
            </h3>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="p-2 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ID *</label>
              <input
                type="text"
                required
                disabled={!!editingId}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green disabled:bg-slate-100"
                placeholder="Ej: 9a"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
                placeholder="9° Grado 'A'"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Tutor Asignado *</label>
              <select
                required
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
              >
                <option value="">Seleccionar tutor</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-salesiano-green text-white rounded-lg hover:bg-salesiano-green-dark flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Grades List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGrades.map((grade) => {
          const teacher = teachers.find(t => t.id === grade.teacherId);
          return (
            <motion.div
              key={grade.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-salesiano-green/10 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-salesiano-green" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{grade.name}</h3>
                    <p className="text-xs text-slate-500">ID: {grade.id}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(grade)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(grade.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500">Tutor:</p>
                {teacher ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img
                      src={teacher.avatarUrl}
                      alt={teacher.name}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-slate-700">{teacher.name}</span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">Sin tutor asignado</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}