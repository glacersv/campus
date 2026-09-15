import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserCheck, Plus, Edit2, Trash2, Save, X, Search, BookOpen, Beaker, Trash, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getAllStudents, createStudent, updateStudent, deleteStudent, getAllGrades, getAllSections, getCurrentSchoolYear, createPendingApprovalForStudent, createUser, deleteUser } from '../../lib/firestore';
import { Student, Grade, Section } from '../../types';
import StudentHistory from './StudentHistory';

const FIREBASE_API_KEY = 'AIzaSyATVsRNPWADga7le5h8bxogza_HVmQr_Z8';

const TEST_FIRST_NAMES = ['Carlos', 'María', 'José', 'Ana', 'Pedro', 'Laura', 'Miguel', 'Sofía', 'Diego', 'Valentina', 'Andrés', 'Camila', 'Roberto', 'Isabella', 'Fernando'];
const TEST_LAST_NAMES = ['López', 'Martínez', 'García', 'Rodríguez', 'Hernández', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz'];

export default function StudentsManager() {
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', carnet: '', gender: 'M' as 'M' | 'F', gradeId: '', sectionId: '', enrollmentYear: new Date().getFullYear() });
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [testCredentials, setTestCredentials] = useState<{ email: string; password: string; name: string }[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterGrade, filterSection]);

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

  const TEST_PASSWORD = 'Alumno2026!';

  const createTestStudents = async () => {
    if (grades.length === 0 || sections.length === 0) {
      toast.error('No hay grados o secciones disponibles');
      return;
    }
    try {
      const credentials: { email: string; password: string; name: string }[] = [];
      for (let i = 0; i < 5; i++) {
        const firstName = TEST_FIRST_NAMES[Math.floor(Math.random() * TEST_FIRST_NAMES.length)];
        const lastName = TEST_LAST_NAMES[Math.floor(Math.random() * TEST_LAST_NAMES.length)];
        const grade = grades[Math.floor(Math.random() * grades.length)];
        const gradeSections = sections.filter(s => s.gradeId === grade.id);
        if (gradeSections.length === 0) continue;
        const section = gradeSections[Math.floor(Math.random() * gradeSections.length)];
        const num = String(Date.now()).slice(-4) + i;
        const carnet = `TEST${num}`;
        const id = `test_${Date.now()}_${i}`;
        const email = `${carnet.toLowerCase()}@salesianosanjose.edu.sv`;
        
        // Crear registro de alumno
        await createStudent({
          id,
          carnet,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          gender: Math.random() > 0.5 ? 'M' : 'F',
          gradeId: grade.id,
          sectionId: section.id,
          enrollmentYear: currentYear,
          enrollmentHistory: [{ year: currentYear, gradeId: grade.id, sectionId: section.id, status: 'EN_CURSO' as const }]
        });

        // Crear cuenta de Firebase Auth
        const authRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: TEST_PASSWORD, displayName: `${firstName} ${lastName}`, returnSecureToken: true }),
          }
        ).then(r => r.json()).catch(() => ({}));
        const authUid = authRes.localId || `auth_${id}`;

        // Crear documento de usuario con el UID de Auth
        await createUser({
          uid: authUid,
          email,
          displayName: `${firstName} ${lastName}`,
          role: 'alumno',
          status: 'approved',
          studentId: id,
        });

        credentials.push({ email, password: TEST_PASSWORD, name: `${firstName} ${lastName}` });
      }
      setTestCredentials(credentials);
      setShowCredentials(true);
      toast.success(`${credentials.length} alumnos de prueba creados con cuenta`);
      loadData();
    } catch (err) { toast.error('Error al crear alumnos de prueba'); console.error(err); }
  };

  const deleteTestStudents = async () => {
    const testStudents = students.filter(s => s.id.startsWith('test_'));
    if (testStudents.length === 0) {
      toast.info('No hay alumnos de prueba para eliminar');
      return;
    }
    try {
      for (const s of testStudents) {
        await deleteStudent(s.id);
        deleteUser(s.id).catch(() => {});
      }
      toast.success(`${testStudents.length} alumnos de prueba eliminados`);
      loadData();
    } catch (err) { toast.error('Error al eliminar alumnos de prueba'); console.error(err); }
  };

  const copyCredential = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
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
        createPendingApprovalForStudent(newStudentId).catch(() => {
          toast.warning('Alumno creado. La solicitud de aprobacion se creara cuando el alumno se registre.');
        });
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
    const matchGrade = filterGrade === 'all' || filterGrade === 'test' || s.gradeId === filterGrade;
    const matchTest = filterGrade === 'test' ? s.id.startsWith('test_') : true;
    const matchSection = filterSection === 'all' || (() => {
      const studentSec = sections.find(sec => sec.id === s.sectionId);
      return studentSec?.name.trim().toUpperCase() === filterSection.trim().toUpperCase();
    })();
    return matchGrade && matchTest && matchSection;
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
        <div className="flex items-center gap-2">
          <button onClick={createTestStudents} className="btn-secondary text-xs" title="Crear 5 alumnos de prueba">
            <Beaker className="w-4 h-4" /> Prueba
          </button>
          <button onClick={deleteTestStudents} className="btn-secondary text-xs text-red-600 hover:bg-red-50" title="Eliminar todos los alumnos de prueba">
            <Trash className="w-4 h-4" />
          </button>
          <button onClick={() => { setShowForm(true); setEditingId(null); resetForm(); }} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo Alumno
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
          <button onClick={() => { setFilterGrade('all'); setFilterSection('all'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterGrade === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}>
            Todos
          </button>
          <button onClick={() => { setFilterGrade('test'); setFilterSection('all'); }}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterGrade === 'test'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}>
            Prueba
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

      {/* Formulario Modal — CREMA */}
      <AnimatePresence>
        {showForm && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="modal-container max-w-lg"
            >
              <div className="modal-header">
                <h3 className="modal-title">{editingId ? 'Editar Alumno' : 'Nuevo Alumno'}</h3>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="modal-close-btn"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Nombres *</label>
                    <input type="text" required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} placeholder="Nombres" className="input-crema" />
                  </div>
                  <div>
                    <label className="form-label">Apellidos *</label>
                    <input type="text" required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} placeholder="Apellidos" className="input-crema" />
                  </div>
                  <div>
                    <label className="form-label">Carnet</label>
                    <input type="text" value={form.carnet} onChange={e => setForm({ ...form, carnet: e.target.value })} placeholder="Ej: 20270001" className="input-crema" />
                  </div>
                  <div>
                    <label className="form-label">Género *</label>
                    <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value as 'M' | 'F' })} className="input-crema">
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Grado *</label>
                    <select required value={form.gradeId} onChange={e => setForm({ ...form, gradeId: e.target.value, sectionId: '' })} className="input-crema">
                      <option value="">Seleccionar grado</option>
                      {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Sección *</label>
                    <select required value={form.sectionId} onChange={e => setForm({ ...form, sectionId: e.target.value })} className="input-crema" disabled={!form.gradeId}>
                      <option value="">Seleccionar sección</option>
                      {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="form-label">Año de Ingreso</label>
                    <input type="number" min="2000" max="2099" value={form.enrollmentYear} onChange={e => setForm({ ...form, enrollmentYear: parseInt(e.target.value) || 2027 })} className="input-crema" />
                  </div>
                </div>
              </form>
              <div className="modal-footer">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary">Cancelar</button>
                <button type="submit" onClick={handleSubmit} className="btn-primary"><Save className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Crear'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tabla — CREMA */}
      <div className="card-crema overflow-hidden">
        <div className="overflow-x-auto">
        <table className="table-crema">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Carnet</th>
              <th>Género</th>
              <th>Grado</th>
              <th>Sección</th>
              <th>Año en Curso</th>
              <th>Año de Ingreso</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map(s => (
              <tr key={s.id} className={s.id.startsWith('test_') ? 'bg-amber-50/50' : ''}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${s.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                      {s.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                      {s.id.startsWith('test_') && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">PRUEBA</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-sm text-slate-500 font-mono">{s.carnet || '—'}</td>
                <td className="text-sm text-slate-500">{s.gender === 'M' ? 'Masculino' : 'Femenino'}</td>
                <td><span className="status-badge status-active">{getGradeName(s.gradeId)}</span></td>
                <td><span className="status-badge status-inactive">{getSectionName(s.sectionId)}</span></td>
                <td className="text-sm text-slate-500 font-mono font-semibold">{currentYear}</td>
                <td className="text-sm text-slate-500 font-mono">{s.enrollmentYear || '—'}</td>
                <td className="text-right">
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
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-secondary">
            <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No se encontraron alumnos</p>
          </div>
        )}
      </div>

      {/* Paginación — CREMA */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-5 py-3.5 border border-slate-100 rounded-2xl shadow-sm">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
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

      {/* Modal credenciales de prueba */}
      <AnimatePresence>
        {showCredentials && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="modal-container max-w-md"
            >
              <div className="modal-header">
                <h3 className="modal-title">Cuentas de Prueba Creadas</h3>
                <button type="button" onClick={() => setShowCredentials(false)} className="modal-close-btn"><X className="w-4 h-4" /></button>
              </div>
              <div className="modal-body space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 mb-1">Contrasena global: <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">{TEST_PASSWORD}</code></p>
                  <p className="text-[10px] text-amber-600">Los alumnos deben ir a la pantalla de Login e Iniciar Sesión con este correo institucional y contraseña.</p>
                </div>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {testCredentials.map((cred, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{cred.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{cred.email}</p>
                      </div>
                      <button
                        onClick={() => copyCredential(cred.email, idx)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                        title="Copiar email"
                      >
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCredentials(false)} className="btn-primary">Entendido</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
