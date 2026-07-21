import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  UserCheck,
  Search,
  Filter
} from 'lucide-react';
import {
  getAllStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getAllGrades
} from '../../lib/firestore';
import { Student, Grade } from '../../types';

interface StudentFormData {
  id: string;
  name: string;
  gender: 'M' | 'F';
  gradeId: string;
}

const emptyForm: StudentFormData = {
  id: '',
  name: '',
  gender: 'M',
  gradeId: ''
};

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(emptyForm);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, gradesData] = await Promise.all([
        getAllStudents(),
        getAllGrades()
      ]);
      setStudents(studentsData);
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
        await updateStudent(editingId, {
          name: formData.name,
          gender: formData.gender,
          gradeId: formData.gradeId
        });
      } else {
        await createStudent({
          id: formData.id || `s${Date.now()}`,
          name: formData.name,
          gender: formData.gender,
          gradeId: formData.gradeId
        });
      }
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
      loadData();
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const handleEdit = (student: Student) => {
    setFormData({
      id: student.id,
      name: student.name,
      gender: student.gender,
      gradeId: student.gradeId
    });
    setEditingId(student.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este alumno?')) {
      await deleteStudent(id);
      loadData();
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === 'all' || s.gradeId === filterGrade;
    return matchesSearch && matchesGrade;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-salesiano-green border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500">Cargando alumnos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestión de Alumnos</h2>
          <p className="text-sm text-slate-500">Administra los alumnos por grado</p>
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
          Nuevo Alumno
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar alumno por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
          >
            <option value="all">Todos los grados</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>{grade.name}</option>
            ))}
          </select>
        </div>
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
              {editingId ? 'Editar Alumno' : 'Nuevo Alumno'}
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
                placeholder="Ej: s01"
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
                placeholder="Nombre Completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Género *</label>
              <select
                required
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-salesiano-green"
              >
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Grado *</label>
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

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const grade = grades.find(g => g.id === student.gradeId);
          return (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    student.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                  }`}>
                    {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">
                        {student.gender === 'M' ? 'Masculino' : 'Femenino'}
                      </span>
                      <span className="text-xs bg-salesiano-green/10 text-salesiano-green px-2 py-0.5 rounded font-medium">
                        {grade?.name || student.gradeId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(student.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}