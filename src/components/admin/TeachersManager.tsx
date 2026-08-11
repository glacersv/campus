import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Plus, Edit2, Trash2, Save, X, Phone, Clock, Award, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { getAllTeachers, createTeacher, updateTeacher, deleteTeacher, getAllGrades, getAllSections, getAllSubjects, getCurrentSchoolYear } from '../../lib/firestore';
import { Teacher, Grade, Section, Subject } from '../../types';

export default function TeachersManager() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', specialty: '', subjects: [] as string[],
    schedule: '', guideGradeId: '', guideSectionId: '', avatarUrl: '',
    status: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
  });
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, g, s, sub, cy] = await Promise.all([
        getAllTeachers(),
        getAllGrades(),
        getAllSections(),
        getAllSubjects(),
        getCurrentSchoolYear()
      ]);
      setTeachers(t);
      setGrades(g);
      setSections(s);
      setSubjects(sub);
      if (cy) setCurrentYear(cy);
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
        avatarUrl: form.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name)}&background=E8F5EE&color=25855A&bold=true`
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
      catch { toast.error('Error al eliminar docente'); }
    }
  };

  const filtered = teachers.filter(t => {
    const matchStatus = !filterStatus || (t.status || 'ACTIVO') === filterStatus;
    return matchStatus;
  });

  const hasYearSections = sections.some(s => s.schoolYear === currentYear);
  const activeSections = sections.filter(s =>
    hasYearSections ? s.schoolYear === currentYear : !s.schoolYear
  );
  const filteredSections = activeSections.filter(s => s.gradeId === form.guideGradeId);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => setFilterStatus('')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterStatus === '' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Todos</button>
          <button onClick={() => setFilterStatus('ACTIVO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterStatus === 'ACTIVO' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Activos</button>
          <button onClick={() => setFilterStatus('INACTIVO')} className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${filterStatus === 'INACTIVO' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}>Inactivos</button>
        </div>
      </div>

      {/* CREMA Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="modal-container max-w-4xl"
            >
              <div className="modal-header">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="modal-title">{editingId ? 'Editar Docente' : 'Nuevo Docente'}</h3>
                </div>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="modal-close-btn">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="modal-body space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="form-label">Nombre *</label>
                      <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prof. Nombre" className="input-crema" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Email *</label>
                      <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@salesiano.edu.sv" className="input-crema" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Teléfono</label>
                      <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="7012-3456" className="input-crema" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Especialidad</label>
                      <input type="text" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} placeholder="Ej: Ciencias Naturales" className="input-crema" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Horario</label>
                      <input type="text" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} placeholder="Ej: 06:40 - 12:00" className="input-crema" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="form-label">Estado</label>
                      <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'ACTIVO' | 'INACTIVO' })} className="input-crema">
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="form-label">Foto URL</label>
                      <input type="url" value={form.avatarUrl} onChange={e => setForm({ ...form, avatarUrl: e.target.value })} placeholder="https://..." className="input-crema" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="form-label">Materias que Imparte</label>
                    <div className="flex flex-wrap gap-2">
                      {subjects.map(s => (
                        <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${form.subjects.includes(s.id) ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}`}>
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50/80 rounded-2xl p-4 space-y-3">
                    <p className="form-label">Asignación como Guía (Opcional)</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="form-label-normal">Grado Guía</label>
                        <select value={form.guideGradeId} onChange={e => setForm({ ...form, guideGradeId: e.target.value, guideSectionId: '' })} className="input-crema">
                          <option value="">Sin grado</option>
                          {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="form-label-normal">Sección Guía</label>
                        <select value={form.guideSectionId} onChange={e => setForm({ ...form, guideSectionId: e.target.value })} className="input-crema" disabled={!form.guideGradeId}>
                          <option value="">Sin sección</option>
                          {filteredSections.map(s => <option key={s.id} value={s.id}>Sección {s.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear Docente'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREMA Teacher Cards */}
      <div className="grid-cards">
        {filtered.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-crema overflow-hidden group"
          >
            {/* Header: avatar + name + status */}
            <div className="p-5 flex items-center gap-3 border-b border-slate-50">
              <img
                src={t.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=E8F5EE&color=25855A&bold=true`}
                alt={t.name}
                className="avatar-circle"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 truncate font-display">{t.name}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${(t.status || 'ACTIVO') === 'INACTIVO' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                    {t.status || 'ACTIVO'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{t.email}</p>
              </div>
            </div>

            {/* Body: details */}
            <div className="p-4 space-y-2">
              {t.phone && <p className="text-xs text-slate-500 flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-400" /> {t.phone}</p>}
              {t.specialty && <p className="text-xs text-slate-500 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-slate-400" /> {t.specialty}</p>}
              {t.schedule && <p className="text-xs text-slate-500 flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-slate-400" /> {t.schedule}</p>}
              {t.guideGradeId && (
                <p className="text-xs text-primary font-semibold flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Guía: {getGradeName(t.guideGradeId)} &quot;{getSectionName(t.guideSectionId)}&quot;
                </p>
              )}
              {(t.subjects || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-50">
                  {(t.subjects || []).map(s => (
                    <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-lg border border-emerald-100">{getSubjectName(s)}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-end gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button onClick={() => handleEdit(t)} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors" title="Editar"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                <button onClick={() => handleDelete(t.id)} className="p-1.5 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar"><Trash2 className="w-4 h-4 text-red-500" /></button>
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
