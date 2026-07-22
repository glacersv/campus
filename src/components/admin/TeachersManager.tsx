import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Plus, Edit2, Trash2, Save, X, Search, Phone, Clock, Award, BookOpen, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher, getAllGrades, getAllSections, getAllSubjects } from '../../lib/firestore';
import { Teacher, Grade, Section, Subject } from '../../types';

export default function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', specialty: '', subjects: [] as string[], schedule: '', guideGradeId: '', guideSectionId: '', avatarUrl: '' });
  const [search, setSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, g, s, sub] = await Promise.all([getAllTeachers(), getAllGrades(), getAllSections(), getAllSubjects()]);
      setTeachers(t); setGrades(g); setSections(s); setSubjects(sub);
    } finally { setLoading(false); }
  };

  const getGradeName = (id?: string) => id ? grades.find(g => g.id === id)?.name : null;
  const getSectionName = (id?: string) => id ? sections.find(s => s.id === id)?.name : null;
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  const toggleSubject = (id: string) => {
    setForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(id) ? prev.subjects.filter(s => s !== id) : [...prev.subjects, id]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    try {
      const data: Partial<Teacher> = {
        name: form.name.trim(),
        email: form.email.trim(),
        subjects: form.subjects,
        avatarUrl: form.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=12562E&color=fff`
      };
      if (form.phone.trim()) data.phone = form.phone.trim();
      if (form.specialty.trim()) data.specialty = form.specialty.trim();
      if (form.schedule.trim()) data.schedule = form.schedule.trim();
      if (form.guideGradeId) data.guideGradeId = form.guideGradeId;
      if (form.guideSectionId) data.guideSectionId = form.guideSectionId;
      
      if (editingId) {
        await updateTeacher(editingId, data);
        toast.success('Docente actualizado correctamente');
      } else {
        await createTeacher({ id: `t${Date.now()}`, name: data.name!, email: data.email!, subjects: data.subjects!, ...data });
        toast.success('Docente creado correctamente');
      }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', email: '', phone: '', specialty: '', subjects: [], schedule: '', guideGradeId: '', guideSectionId: '', avatarUrl: '' });
      loadData();
    } catch (err) { toast.error('Error al guardar docente'); console.error(err); }
  };

  const handleEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({
      name: t.name, email: t.email, phone: t.phone || '', specialty: t.specialty || '',
      subjects: t.subjects || [], schedule: t.schedule || '',
      guideGradeId: t.guideGradeId || '', guideSectionId: t.guideSectionId || '',
      avatarUrl: t.avatarUrl || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este docente?')) {
      try { await deleteTeacher(id); toast.success('Docente eliminado'); loadData(); }
      catch (err) { toast.error('Error al eliminar docente'); }
    }
  };

  const filtered = teachers.filter(t =>
    `${t.name} ${t.email} ${t.specialty || ''} ${(t.subjects || []).map(s => getSubjectName(s)).join(' ')}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSections = sections.filter(s => s.gradeId === form.guideGradeId);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg"><GraduationCap className="w-5 h-5 text-primary" /></div>
            Docentes
          </h2>
          <p className="text-sm text-gray-500 mt-1">Gestiona el personal docente del colegio</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', email: '', phone: '', specialty: '', subjects: [], schedule: '', guideGradeId: '', guideSectionId: '', avatarUrl: '' }); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Docente
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar docente..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">{editingId ? 'Editar Docente' : 'Nuevo Docente'}</h3>
            <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prof. Nombre" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@..." className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1"><Phone className="w-3 h-3 inline mr-1" />Teléfono</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="7012-3456" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1"><Award className="w-3 h-3 inline mr-1" />Especialidad</label>
                <input type="text" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ej: Ciencias Naturales" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1"><Clock className="w-3 h-3 inline mr-1" />Horario</label>
                <input type="text" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Ej: 06:40 - 12:00" className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Foto URL</label>
                <input type="url" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." className="input" />
              </div>
            </div>

            {/* Subjects */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2"><BookOpen className="w-3 h-3 inline mr-1" />Materias que Imparte</label>
              <div className="flex flex-wrap gap-2">
                {subjects.map(s => (
                  <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${form.subjects.includes(s.id) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Guide Assignment */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-medium text-gray-500 mb-3"><MapPin className="w-3 h-3 inline mr-1" />Asignación como Guía (Opcional)</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Grado Guía</label>
                  <select value={form.guideGradeId} onChange={e => setForm({ ...form, guideGradeId: e.target.value, guideSectionId: '' })} className="input">
                    <option value="">Sin grado</option>
                    {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Sección Guía</label>
                  <select value={form.guideSectionId} onChange={e => setForm({ ...form, guideSectionId: e.target.value })} className="input" disabled={!form.guideGradeId}>
                    <option value="">Sin sección</option>
                    {filteredSections.map(s => <option key={s.id} value={s.id}>Sección {s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
              <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(t => (
          <div key={t.id} className="card card-hover overflow-hidden group">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-3">
              <div className="flex items-center gap-3">
                <img src={t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=12562E&color=fff`} alt={t.name} className="w-10 h-10 rounded-full border-2 border-secondary object-cover" />
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{t.name}</h3>
                  <p className="text-xs text-gray-400 truncate">{t.email}</p>
                </div>
              </div>
            </div>
            <div className="p-3 space-y-1.5">
              {t.phone && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {t.phone}</p>}
              {t.specialty && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> {t.specialty}</p>}
              {t.schedule && <p className="text-xs text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {t.schedule}</p>}
              {t.guideGradeId && (
                <p className="text-xs text-primary font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Guía: {getGradeName(t.guideGradeId)} "{getSectionName(t.guideSectionId)}"
                </p>
              )}
              <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
                {(t.subjects || []).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded">{getSubjectName(s)}</span>
                ))}
              </div>
              <div className="flex justify-end gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron docentes</p>
        </div>
      )}
    </div>
  );
}
