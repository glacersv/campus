import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Plus, Edit2, Trash2, Save, X, Search, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { getAllStudents, createStudent, updateStudent, deleteStudent, getAllGrades, getAllSections, getCurrentSchoolYear, createPendingApprovalForStudent } from '../../lib/firestore';
import { Student, Grade, Section } from '../../types';
import StudentHistory from './StudentHistory';

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', carnet: '', gender: 'M' as 'M' | 'F', gradeId: '', sectionId: '', enrollmentYear: new Date().getFullYear() });
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterGrade, filterSection]);

  const loadData = async () => {
    try {
      const [s, g, sec, cy] = await Promise.all([
        getAllStudents(),
        getAllGrades(),
        getAllSections(),
        getCurrentSchoolYear()
      ]);
      setStudents(s);
      setGrades(g);
      setSections(sec);
      if (cy) setCurrentYear(cy);
    } finally { setLoading(false); }
  };

  const getGradeName = (id: string) => grades.find(g => g.id === id)?.name || id;
  const getSectionName = (id: string) => {
    const activeSection = sections.find(s => s.id === id);
    if (activeSection) return activeSection.name;
    if (id && id.includes('-')) {
      const parts = id.split('-');
      const lastPart = parts[parts.length - 1] || 'A';
      return lastPart.replace(/[0-9]/g, '').replace('g', '').replace('t', '').toUpperCase();
    }
    return id || '—';
  };

  const resetForm = () => {
    setForm({ firstName: '', lastName: '', carnet: '', gender: 'M', gradeId: '', sectionId: '', enrollmentYear: new Date().getFullYear() });
  };

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
        enrollmentYear: form.enrollmentYear
      };
      if (editingId) {
        const existing = students.find(item => item.id === editingId);
        const existingHistory = existing?.enrollmentHistory || [];
        const updatedHistory = existingHistory.map(record => ({ ...record }));
        const currentRecord = {
          year: form.enrollmentYear,
          gradeId: form.gradeId,
          sectionId: form.sectionId,
          status: 'EN_CURSO' as const
        };
        updatedHistory.push(currentRecord);
        await updateStudent(editingId, {
          ...data,
          enrollmentHistory: updatedHistory
        });
      } else {
        const newRecord = {
          year: form.enrollmentYear,
          gradeId: form.gradeId,
          sectionId: form.sectionId,
          status: 'EN_CURSO' as const
        };
        const newStudentId = `s${Date.now()}`;
        await createStudent({
          id: newStudentId,
          ...data,
          enrollmentHistory: [newRecord]
        });
        await createPendingApprovalForStudent(newStudentId);
      }
      toast.success('Alumno guardado con historial');
      setShowForm(false); setEditingId(null); resetForm(); loadData();
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
    const matchSection = filterSection === 'all' || (() => {
      const studentSec = sections.find(sec => sec.id === s.sectionId);
      return studentSec?.name.trim().toUpperCase() === filterSection.trim().toUpperCase();
    })();
    return matchSearch && matchGrade && matchSection;
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedStudents = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const hasYearSections = sections.some(s => s.schoolYear === currentYear);
  const activeSections = sections.filter(s =>
    hasYearSections ? s.schoolYear === currentYear : !s.schoolYear
  );

  const uniqueByName = (list: Section[]) => list.filter(
    (s, i, arr) => arr.findIndex(x => x.name.trim().toUpperCase() === s.name.trim().toUpperCase()) === i
  );

  const filteredSections = uniqueByName(activeSections.filter(s => s.gradeId === form.gradeId));

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-accent/10">
            <UserCheck className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="module-title">Alumnos</h1>
            <p className="module-subtitle">{filtered.length} alumno(s) registrado(s)</p>
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Alumno
        </button>
      </div>

      {/* Búsqueda y filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o carnet..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => { setFilterGrade('all'); setFilterSection('all'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterGrade === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}>
            Todos
          </button>
          {grades.map(g => (
            <button key={g.id} onClick={() => { setFilterGrade(g.id); setFilterSection('all'); }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterGrade === g.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200/50'
              }`}>
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => setFilterSection('all')} disabled={filterGrade === 'all'}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
              filterSection === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}>
            Todas Secciones
          </button>
          {uniqueByName(activeSections.filter(s => s.gradeId === filterGrade)).map(section => {
            const secLetter = section.name.trim().toUpperCase();
            return (
              <button
                key={section.id}
                onClick={() => setFilterSection(secLetter)}
                disabled={filterGrade === 'all'}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterSection === secLetter
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {section.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulario Modal */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col"
            >
              <div className="bg-slate-50 border-b border-slate-100 p-5 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-slate-900 text-base">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombres *</label>
                    <input type="text" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Apellidos *</label>
                    <input type="text" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Carnet</label>
                    <input type="text" value={form.carnet} onChange={e => setForm({ ...form, carnet: e.target.value })} placeholder="Ej: 20270001" className="input" />
                  </div>
                  <div>
                    <label className="form-label">Género *</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'M' | 'F' })} className="input">
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Grado *</label>
                    <select required value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value, sectionId: '' })} className="input">
                      <option value="">Seleccionar grado</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Sección *</label>
                    <select required value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} className="input" disabled={!form.gradeId}>
                      <option value="">Seleccionar sección</option>
                      {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Año de Ingreso</label>
                    <input type="number" min="2000" max="2099" value={form.enrollmentYear} onChange={e => setForm({ ...form, enrollmentYear: parseInt(e.target.value) || 2027 })} className="input" />
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

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alumno</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Carnet</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Género</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Grado</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sección</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Año en Curso</th>
              <th className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Año de Ingreso</th>
              <th className="text-right px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map(s => (
              <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${s.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <span className="text-sm font-medium text-slate-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-500 font-mono">{s.carnet || '—'}</td>
                <td className="px-4 py-2.5 text-sm text-slate-500">{s.gender === 'M' ? 'Masculino' : 'Femenino'}</td>
                <td className="px-4 py-2.5"><span className="badge badge-green">{getGradeName(s.gradeId)}</span></td>
                <td className="px-4 py-2.5"><span className="badge badge-blue">{getSectionName(s.sectionId)}</span></td>
                <td className="px-4 py-2.5 text-sm text-slate-500 font-mono font-semibold">{currentYear}</td>
                <td className="px-4 py-2.5 text-sm text-slate-500 font-mono">{s.enrollmentYear || '—'}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setSelectedStudent(s)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Ver historial"><BookOpen className="w-4 h-4 text-slate-500" /></button>
                    <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title="Editar"><Edit2 className="w-4 h-4 text-slate-500" /></button>
                    <button onClick={() => handleDelete(s.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No se encontraron alumnos</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 border border-slate-200 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Mostrando {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)} de {filtered.length} alumnos
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="btn-secondary py-1.5 px-3.5 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-xs font-bold text-slate-600 px-3">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary py-1.5 px-3.5 rounded-xl text-xs font-bold disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal historial */}
      {selectedStudent && (
        <StudentHistory student={selectedStudent} grades={grades} sections={sections} onClose={() => setSelectedStudent(null)} />
      )}
    </div>
  );
}
