import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  GraduationCap,
  Search
} from 'lucide-react';
import {
  getAllTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getAllGrades
} from '../../lib/firestore';
import { Teacher, Grade } from '../../types';

interface TeacherFormData {
  id: string;
  name: string;
  email: string;
  gradeId: string;
  avatarUrl: string;
}

const emptyForm: TeacherFormData = {
  id: '',
  name: '',
  email: '',
  gradeId: '',
  avatarUrl: ''
};

export default function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<TeacherFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teachersData, gradesData] = await Promise.all([
        getAllTeachers(),
        getAllGrades()
      ]);
      setTeachers(teachersData);
      setGrades(gradesData);
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
        await updateTeacher(editingId, {
          name: formData.name,
          email: formData.email,
          gradeId: formData.gradeId,
          avatarUrl: formData.avatarUrl
        });
      } else {
        await createTeacher({
          id: formData.id || `t${Date.now()}`,
          name: formData.name,
          email: formData.email,
          gradeId: formData.gradeId,
          avatarUrl: formData.avatarUrl
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadData();
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setFormData({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      gradeId: teacher.gradeId,
      avatarUrl: teacher.avatarUrl || ''
    });
    setEditingId(teacher.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este docente?')) {
      await deleteTeacher(id);
      loadData();
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-salesiano-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Cargando docentes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Docentes</h2>
          <p className="text-sm text-slate-500">Administra los docentes del sistema</p>
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
          Nuevo Docente
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar docente..."
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
              {editingId ? 'Editar Docente' : 'Nuevo Docente'}
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
                placeholder="Ej: t1"
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
                placeholder="Prof. Nombre Apellido"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
                placeholder="correo@salesianosanjose.edu.sv"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grado Asignado *</label>
              <select
                required
                value={formData.gradeId}
                onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
              >
                <option value="">Seleccionar grado</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>{grade.name}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">URL Avatar (opcional)</label>
              <input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
                placeholder="https://..."
              />
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

      {/* Teachers List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Docente</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">Grado</th>
                <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={teacher.avatarUrl}
                        alt={teacher.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-800">{teacher.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{teacher.email}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-salesiano-green/10 text-salesiano-green px-2 py-1 rounded font-medium">
                      {grades.find(g => g.id === teacher.gradeId)?.name || teacher.gradeId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(teacher)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}