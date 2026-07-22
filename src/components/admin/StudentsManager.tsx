import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { UserCheck, Plus, Edit2, Trash2, Save, X, Search, Filter, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { getAllStudents, createStudent, updateStudent, deleteStudent, getAllGrades, getAllSections } from '../../lib/firestore';
import { Student, Grade, Section } from '../../types';

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', carnet: '', gender: 'M' as 'M' | 'F', gradeId: '', sectionId: '', enrollmentYear: new Date().getFullYear() });
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [s, g, sec] = await Promise.all([getAllStudents(), getAllGrades(), getAllSections()]);
      setStudents(s); setGrades(g); setSections(sec);
    } finally { setLoading(false); }
  };

  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;
  const getSectionName = (id: string) => sections.find(s => s.id === id)?.name || id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim() || !form.gradeId || !form.sectionId) return;
    try {
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`;
      const data = {
        carnet: form.carnet.trim() || `s${Date.now()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: fullName,
        gender: form.gender,
        gradeId: form.gradeId,
        sectionId: form.sectionId,
        enrollmentYear: form.enrollmentYear,
        enrollmentHistory: [{ year: form.enrollmentYear, gradeId: form.gradeId, sectionId: form.sectionId }]
      };
      if (editingId) {
        await updateStudent(editingId, data);
        toast.success('Alumno actualizado correctamente');
      } else {
        await createStudent({ id: `s${Date.now()}`, ...data });
        toast.success('Alumno creado correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ firstName: '', lastName: '', carnet: '', gender: 'M', gradeId: '', sectionId: '', enrollmentYear: new Date().getFullYear() });
      loadData();
    } catch (err) { toast.error('Error al guardar alumno'); console.error(err); }
  };

  const handleEdit = (s: Student) => {
    setEditingId(s.id);
    setForm({
      firstName: s.firstName || s.name.split(' ').slice(0, -1).join(' ') || '',
      lastName: s.lastName || s.name.split(' ').pop() || '',
      carnet: s.carnet || '',
      gender: s.gender,
      gradeId: s.gradeId,
      sectionId: s.sectionId,
      enrollmentYear: s.enrollmentYear || new Date().getFullYear()
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este alumno?')) {
      try { await deleteStudent(id); toast.success('Alumno eliminado'); loadData(); }
      catch (err) { toast.error('Error al eliminar alumno'); }
    }
  };

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.carnet?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade === 'all' || s.gradeId === filterGrade;
    const matchSection = filterSection === 'all' || s.sectionId === filterSection;
    return matchSearch && matchGrade && matchSection;
  });

  const filteredSections = sections.filter(s => s.gradeId === form.gradeId);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-accent/10 p-2 rounded-lg"><UserCheck className="w-5 h-5 text-accent" /></div>
            Alumnos
          </h2>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} alumno(s) registrado(s)</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ firstName: '', lastName: '', carnet: '', gender: 'M', gradeId: '', sectionId: '', enrollmentYear: new Date().getFullYear() }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Alumno
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar alumno..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setFilterSection('all'); }} className="input w-auto">
          <option value="all">Todos los grados</option>
          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)} className="input w-auto" disabled={filterGrade === 'all'}>
          <option value="all">Todas las secciones</option>
          {sections.filter(s => s.gradeId === filterGrade).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Nombres *</label>
              <input type="text" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Apellidos *</label>
              <input type="text" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Carnet</label>
              <input type="text" value={form.carnet} onChange={e => setForm({ ...form, carnet: e.target.value })} placeholder="Ej: 20270001" className="input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Género *</label>
              <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'M' | 'F' })} className="input">
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Grado *</label>
              <select required value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value, sectionId: '' })} className="input">
                <option value="">Seleccionar grado</option>
                {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Sección *</label>
              <select required value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} className="input" disabled={!form.gradeId}>
                <option value="">Seleccionar sección</option>
                {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Año de Ingreso</label>
              <input type="number" min="2000" max="2099" value={form.enrollmentYear} onChange={e => setForm({ ...form, enrollmentYear: parseInt(e.target.value) || 2027 })} className="input" />
            </div>
            <div className="flex justify-end gap-2 col-span-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Alumno</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Carnet</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Género</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Grado</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Sección</th>
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Ingreso</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="table-row">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-sm text-gray-500 font-mono">{s.carnet || '—'}</td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{s.gender === 'M' ? 'Masculino' : 'Femenino'}</td>
                <td className="px-4 py-2.5"><span className="badge badge-green">{getGradeName(s.gradeId)}</span></td>
                <td className="px-4 py-2.5"><span className="badge badge-blue">{getSectionName(s.sectionId)}</span></td>
                <td className="px-4 py-2.5 text-sm text-gray-500">{s.enrollmentYear || '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No se encontraron alumnos</p>
          </div>
        )}
      </div>
    </div>
  );
}
