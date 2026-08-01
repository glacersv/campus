import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [form, setForm] = useState({
    name: '', email: '', phone: '', specialty: '', subjects: [] as string[],
    schedule: '', guideGradeId: '', guideSectionId: '', avatarUrl: '',
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

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

  const resetForm = () => {
    setForm({
      name: '', email: '', phone: '', specialty: '', subjects: [],
      schedule: '', guideGradeId: '', guideSectionId: '', avatarUrl: '',
      status: 'ACTIVO'
    });
  };

  const checkEmailUnique = (email: string, excludeId?: string): boolean => {
    return !teachers.some(t => t.email.toLowerCase() === email.toLowerCase() && t.id !== excludeId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) { toast.error('Nombre y email son obligatorios'); return; }

    if (!checkEmailUnique(form.email, editingId || undefined)) {
      toast.error('Ya existe un docente con ese email');
      return;
    }

    try {
      const data: Partial<Teacher> = {
        name: form.name.trim(),
        email: form.email.trim(),
        subjects: form.subjects,
        status: form.status,
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
      setShowForm(false); setEditingId(null); resetForm(); loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar docente';
      toast.error(msg);
      console.error(err);
    }
  };

  const handleEdit = (t: Teacher) => {
    setEditingId(t.id);
    setForm({
      name: t.name, email: t.email, phone: t.phone || '', specialty: t.specialty || '',
      subjects: t.subjects || [], schedule: t.schedule || '',
      guideGradeId: t.guideGradeId || '', guideSectionId: t.guideSectionId || '',
      avatarUrl: t.avatarUrl || '', status: t.status || 'ACTIVO'
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar este docente?')) {
      try { await deleteTeacher(id); toast.success('Docente eliminado'); loadData(); }
      catch (err) { toast.error('Error al eliminar docente'); }
    }
  };

  const filtered = teachers.filter(t => {
    const matchSearch = `${t.name} ${t.email} ${t.specialty || ''} ${(t.subjects || []).map(s => getSubjectName(s)).join(' ')}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || (t.status || 'ACTIVO') === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredSections = sections.filter(s => s.gradeId === form.guideGradeId);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-primary/10">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Docentes</h1>
            <p className="module-subtitle">{filtered.length} docente(s) registrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Docente
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar docente..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto">
          <option value="">Todos</option>
          <option value="ACTIVO">Activos</option>
          <option value="INACTIVO">Inactivos</option>
        </select>
      </div>

      {/* Formulario Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Editar Docente' : 'Nuevo Docente'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombre *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prof. Nombre" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@..." className="input" />
                  </div>
                  <div>
                    <label className="form-label">Teléfono</label>
                    <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="7012-3456" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Especialidad</label>
                    <input type="text" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ej: Ciencias Naturales" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Horario</label>
                    <input type="text" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Ej: 06:40 - 12:00" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Estado</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'ACTIVO' | 'INACTIVO' })} className="input">
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Foto URL</label>
                    <input type="url" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." className="input" />
                  </div>
                </div>

                <div>
                  <label className="form-label mb-2">Materias que Imparte</label>
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(s => (
                      <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.subjects.includes(s.id) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <p className="form-label mb-3">Asignación como Guía (Opcional)</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label-normal">Grado Guía</label>
                      <select value={form.guideGradeId} onChange={e => setForm({ ...form, guideGradeId: e.target.value, guideSectionId: '' })} className="input">
                        <option value="">Sin grado</option>
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label-normal">Sección Guía</label>
                      <select value={form.guideSectionId} onChange={e => setForm({ ...form, guideSectionId: e.target.value })} className="input" disabled={!form.guideGradeId}>
                        <option value="">Sin sección</option>
                        {filteredSections.map(s => <option key={s.id} value={s.id}>Sección {s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 shrink-0">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between h-full hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative min-h-[220px]"
          >
            <div>
              {/* Encabezado */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=25855A&color=fff`}
                    alt={t.name}
                    className="w-10 h-10 rounded-full border border-slate-100 object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 truncate leading-tight">{t.name}</h3>
                    <p className="text-[11px] text-slate-400 font-semibold truncate mt-0.5">{t.email}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                  (t.status || 'ACTIVO') === 'INACTIVO'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {t.status || 'ACTIVO'}
                </span>
              </div>

              {/* Cuerpo */}
              <div className="space-y-1.5 text-xs text-slate-600 my-3">
                {t.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{t.phone}</span>
                  </p>
                )}
                {t.specialty && (
                  <p className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-medium">{t.specialty}</span>
                  </p>
                )}
                {t.schedule && (
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{t.schedule}</span>
                  </p>
                )}
                {t.guideGradeId && (
                  <p className="text-[11px] text-primary font-bold flex items-center gap-2 bg-emerald-50/50 border border-emerald-100/50 px-2.5 py-1 rounded-lg w-fit">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> Guía: {getGradeName(t.guideGradeId)} "{getSectionName(t.guideSectionId)}"
                  </p>
                )}
              </div>
            </div>

            {/* Pie de página con materias y acciones */}
            <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100">
              <div className="flex flex-wrap gap-1 min-w-0 mr-2">
                {(t.subjects || []).slice(0, 2).map(s => (
                  <span key={s} className="px-2 py-0.5 bg-slate-50 text-slate-600 border border-slate-100 text-[10px] font-bold rounded-md truncate max-w-[80px]">
                    {getSubjectName(s)}
                  </span>
                ))}
                {(t.subjects || []).length > 2 && (
                  <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 border border-slate-100 text-[10px] font-bold rounded-md shrink-0">
                    +{(t.subjects || []).length - 2}
                  </span>
                )}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => handleEdit(t)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No se encontraron docentes</p>
        </div>
      )}
    </div>
  );
}
