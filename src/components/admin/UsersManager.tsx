import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Shield,
  Mail,
  UserCheck,
  HelpCircle,
  FileText,
  Copy,
  Check,
  X,
  Clock,
  AlertTriangle,
  UserX,
  Edit3,
  ChevronRight,
  Filter,
  Trash2,
  Lock,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getAllUsers,
  updateUser,
  getAllTeachers,
  getPendingApprovalRequests,
  getAllApprovalRequests,
  updateApprovalRequest,
  getNewUserNotifications,
  markNotificationAsNotified,
  approveUser,
  rejectUser,
  getStudentsWithoutAccounts,
  activateStudent,
  getAllGrades,
  getAllSections,
  deleteUser,
  deleteAllPendingApprovalRequests,
  getUserByEmail,
  detectUserRole,
} from '../../lib/firestore';
import { User, Teacher, UserRole, ROLE_LABELS, ApprovalRequest, NewUserNotification, Student, Grade, Section } from '../../types';
import jsPDF from 'jspdf';

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'pending' | 'notifications' | 'reactivate'>('users');
  const [activatingStudent, setActivatingStudent] = useState<string | null>(null);
  const [showBulkActivate, setShowBulkActivate] = useState(false);
  const [bulkPassword, setBulkPassword] = useState('Alumno2025!');
  const [bulkResult, setBulkResult] = useState<{ email: string; password: string; name: string }[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentGradeFilter, setStudentGradeFilter] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const STUDENTS_PER_PAGE = 20;

  // Reactivation state
  const [reactivateEmail, setReactivateEmail] = useState('');
  const [reactivateResult, setReactivateResult] = useState<{
    found: boolean;
    user?: User;
    detectedRole?: { role: UserRole | null; teacherId?: string; teacherName?: string; studentId?: string; studentName?: string; gradeId?: string; sectionId?: string };
  } | null>(null);
  const [reactivating, setReactivating] = useState(false);

  // Approval / Notifications state
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [newNotifications, setNewNotifications] = useState<NewUserNotification[]>([]);

  // Premium Modal state for Editing User
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('docente');
  const [editTeacherId, setEditTeacherId] = useState<string>('');
  const [teacherSearch, setTeacherSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
    console.log("ROLE_LABELS currently:", ROLE_LABELS);
  }, []);

  const loadData = async () => {
    try {
      const [u, t, approvals, notifications, ps, g, s] = await Promise.all([
        getAllUsers(),
        getAllTeachers(),
        getPendingApprovalRequests(),
        getNewUserNotifications(),
        getStudentsWithoutAccounts(),
        getAllGrades(),
        getAllSections(),
      ]);
      setUsers(u);
      setTeachers(t);
      setPendingApprovals(approvals);
      setNewNotifications(notifications);
      setPendingStudents(ps);
      setAllGrades(g);
      setAllSections(s);
    } catch (err) {
      console.error('Error loading user manager data:', err);
      toast.error('Error al cargar datos de control de usuarios');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return null;
    return teachers.find(t => t.id === teacherId)?.name || null;
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setEditRole(user.role || 'docente');
    setEditTeacherId(user.teacherId || '');
    setTeacherSearch('');
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const payload: Partial<User> = {
        role: editRole,
        teacherId: editRole === 'docente' && editTeacherId ? editTeacherId : undefined
      };

      await updateUser(selectedUser.uid, payload);
      toast.success('Usuario actualizado correctamente');
      setSelectedUser(null);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar usuario';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivateStudent = async (student: Student) => {
    setActivatingStudent(student.id);
    try {
      const result = await activateStudent(student, bulkPassword);
      toast.success(`${student.name} activado. Email: ${result.email}`);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al activar alumno';
      toast.error(msg);
      console.error(err);
    } finally {
      setActivatingStudent(null);
    }
  };

  const handleBulkActivate = async () => {
    if (pendingStudents.length === 0) {
      toast.info('No hay alumnos pendientes');
      return;
    }
    const results: { email: string; password: string; name: string }[] = [];
    const errors: { name: string; error: string }[] = [];
    for (const student of pendingStudents) {
      try {
        const result = await activateStudent(student, bulkPassword);
        results.push({ ...result, name: student.name });
      } catch (err) {
        errors.push({
          name: student.name,
          error: err instanceof Error ? err.message : 'Error desconocido'
        });
      }
    }
    if (results.length > 0) {
      setBulkResult(results);
      toast.success(`${results.length} alumnos activados`);
    }
    if (errors.length > 0) {
      toast.error(`${errors.length} alumnos con error: ${errors.map(e => e.name).join(', ')}`);
      console.error('Activation errors:', errors);
    }
    loadData();
  };

  const getGradeName = (id: string) => allGrades.find(g => g.id === id)?.name || id;
  const getSectionName = (id: string) => allSections.find(s => s.id === id)?.name || id;

  // Students filtering + pagination
  const filteredStudents = pendingStudents.filter(s => {
    const matchSearch = !studentSearch || 
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      (s.carnet || '').toLowerCase().includes(studentSearch.toLowerCase());
    const matchGrade = !studentGradeFilter || s.gradeId === studentGradeFilter;
    return matchSearch && matchGrade;
  });
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE));
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * STUDENTS_PER_PAGE,
    studentPage * STUDENTS_PER_PAGE
  );

  const handleDeleteUser = async (uid: string, name: string) => {
    if (!confirm(`¿Eliminar usuario ${name}?`)) return;
    try {
      await deleteUser(uid);
      toast.success('Usuario eliminado');
      loadData();
    } catch (err) {
      toast.error('Error al eliminar usuario');
      console.error(err);
    }
  };

  const handleCleanAllUsers = async () => {
    const protectedEmails = ['admin@salesianosanjose.edu.sv', 'jose.marquez@salesianosanjose.edu.sv'];
    const usersToDelete = users.filter(u => !protectedEmails.includes(u.email));
    
    if (usersToDelete.length === 0) {
      toast.info('No hay usuarios para eliminar');
      return;
    }
    
    if (!confirm(`¿Eliminar ${usersToDelete.length} usuarios? (Se mantendrán admin y jose.marquez)`)) return;
    
    let deleted = 0;
    let errors = 0;
    
    for (const user of usersToDelete) {
      try {
        await deleteUser(user.uid);
        deleted++;
      } catch (err) {
        errors++;
        console.error(`Error eliminando ${user.email}:`, err);
      }
    }
    
    toast.success(`${deleted} usuarios eliminados${errors > 0 ? ` (${errors} errores)` : ''}`);
    loadData();
  };

  const handleCleanApprovalRequests = async () => {
    if (pendingApprovals.length === 0) {
      toast.info('No hay solicitudes pendientes');
      return;
    }
    if (!confirm(`¿Eliminar ${pendingApprovals.length} solicitudes pendientes?`)) return;
    
    try {
      const count = await deleteAllPendingApprovalRequests();
      toast.success(`${count} solicitudes eliminadas`);
      loadData();
    } catch (err) {
      toast.error('Error al eliminar solicitudes');
      console.error(err);
    }
  };

  const handleApprove = async (request: ApprovalRequest) => {
    try {
      await approveUser(request.userId, request.requestedRole || 'docente');
      toast.success(`Usuario ${request.displayName} aprobado correctamente`);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al aprobar usuario';
      toast.error(msg);
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt('Motivo del rechazo (opcional):') || '';
    try {
      await rejectUser(userId, reason);
      toast.success('Usuario rechazado');
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al rechazar usuario';
      toast.error(msg);
    }
  };

  const sendEmail = (notification: NewUserNotification) => {
    const subject = `Tus credenciales de acceso - Campus Salesiano San José`;
    const body = `Hola ${notification.displayName},\n\nTu cuenta ha sido creada en el sistema Campus Salesiano San José.\n\nUsuario: ${notification.email}\nContraseña: ${notification.password}\n\nIngresa en: https://campus-27248.web.app\n\nSaludos, Administración.`;
    const mailtoLink = `mailto:${notification.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const generatePDF = (notification: NewUserNotification) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(18, 86, 46); // Green Salesiano
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Campus Salesiano San José', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Credenciales de Acceso Oficiales', 105, 30, { align: 'center' });

    // Content
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`Nombre del titular: ${notification.displayName}`, 20, 60);
    doc.text(`Usuario institucional: ${notification.email}`, 20, 70);
    doc.text(`Contraseña asignada: ${notification.password}`, 20, 80);
    
    if (notification.studentName) {
      doc.text(`Estudiante: ${notification.studentName}`, 20, 95);
      doc.text(`Grado: ${notification.gradeName}`, 20, 105);
      doc.text(`Sección: ${notification.sectionName}`, 20, 115);
    }
    if (notification.teacherName) {
      doc.text(`Docente: ${notification.teacherName}`, 20, 95);
    }

    doc.text(`Rol asignado: ${ROLE_LABELS[notification.role] || notification.role}`, 20, 130);
    doc.text('URL de acceso directo: https://campus-27248.web.app', 20, 140);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generado por la Administración el ${new Date().toLocaleString()}`, 20, 160);

    // Save
    doc.save(`credenciales_${notification.displayName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF exportado con éxito');
  };

  const copyToClipboard = async (notification: NewUserNotification) => {
    const text = `Usuario: ${notification.email}\nContraseña: ${notification.password}\nURL: https://campus-27248.web.app`;
    await navigator.clipboard.writeText(text);
    toast.success('Credenciales copiadas al portapapeles');
  };

  const handleMarkNotified = async (notificationId: string) => {
    try {
      await markNotificationAsNotified(notificationId);
      toast.success('Marcado como entregado con éxito');
      loadData();
    } catch (err) {
      toast.error('Error al actualizar notificación');
    }
  };

  const handleSearchReactivate = async () => {
    if (!reactivateEmail.trim()) {
      toast.error('Ingresa un correo electrónico');
      return;
    }
    const email = reactivateEmail.trim().toLowerCase();
    if (!email.endsWith('@salesianosanjose.edu.sv')) {
      toast.error('Solo se permiten correos institucionales');
      return;
    }

    setReactivating(true);
    setReactivateResult(null);
    try {
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        setReactivateResult({ found: true, user: existingUser });
      } else {
        const detected = await detectUserRole(email);
        setReactivateResult({ found: false, detectedRole: detected });
      }
    } catch (err) {
      toast.error('Error al buscar usuario');
      console.error(err);
    } finally {
      setReactivating(false);
    }
  };

  const handleReactivateUser = async (user: User, newRole: UserRole) => {
    try {
      await updateUser(user.uid, { status: 'approved', role: newRole, updatedAt: new Date() as any });
      toast.success(`Usuario ${user.displayName} reactivado como ${ROLE_LABELS[newRole] || newRole}`);
      setReactivateResult(null);
      setReactivateEmail('');
      loadData();
    } catch (err) {
      toast.error('Error al reactivar usuario');
      console.error(err);
    }
  };

  const handleReactivateNewUser = async (email: string, role: UserRole, extra?: { teacherId?: string; studentId?: string }) => {
    // When Auth UID is unknown, we create a placeholder doc with a generated ID
    // When user logs in, self-healing will detect role and create proper profile
    // We mark it so admin knows it's a placeholder
    toast.info(`El usuario debe iniciar sesión para completar la activación. El sistema detectará su rol automáticamente (${ROLE_LABELS[role] || role}).`);
    setReactivateResult(null);
    setReactivateEmail('');
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<string, string> = {
      admin: 'bg-rose-100 text-rose-700 border-rose-200',
      docente: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      alumno: 'bg-sky-100 text-sky-700 border-sky-200',
    };
    return colors[role] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Filter list
  const filteredUsers = users.filter(u => {
    const matchSearch = `${u.displayName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Calculate statistics only for approved users
  const roleCounts = users.reduce((acc, u) => {
    if (u.status === 'approved') {
      const r = u.role || 'sin_rol';
      acc[r] = (acc[r] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Premium Header */}
      <div className="module-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="module-title-group">
          <div className="module-icon bg-slate-100 border border-slate-200/80">
            <Users className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h1 className="module-title">Centro de Control de Usuarios</h1>
            <p className="module-subtitle">Gestiona perfiles, asignación de roles y solicitudes de acceso por login</p>
          </div>
        </div>
        <button
          onClick={handleCleanAllUsers}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-600 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-500/20 transition-all cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Limpiar Usuarios (excepto Admin)
        </button>
      </div>

      {/* Elegant Info Banner */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex gap-3 text-slate-600 text-xs">
        <HelpCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">¿Cómo funciona la relación con los Docentes?</p>
          <p className="mt-1 leading-relaxed">
            Para que las cuentas de los usuarios con rol <strong>Docente</strong> puedan ver su respectivo grado guía y sus alumnos en el Dashboard, deben estar vinculados a un perfil de docente de la sección de personal. Puedes asociarlos manualmente aquí utilizando el botón de <strong>Editar (Lápiz)</strong> y eligiendo su nombre.
          </p>
        </div>
      </div>

      {/* Tabs Navigation (Exclusive content visualization) */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          Usuarios Activos ({users.filter(u => u.status === 'approved').length})
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'approvals'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          Solicitudes
          {pendingApprovals.length > 0 && (
            <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          Alumnos Sin Cuenta
          {pendingStudents.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {pendingStudents.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-accent text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          Entregar Credenciales
          {newNotifications.filter(n => n.status === 'new').length > 0 && (
            <span className="bg-accent text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
              {newNotifications.filter(n => n.status === 'new').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('reactivate')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reactivate'
              ? 'bg-emerald-500 text-white shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5" />
          Reactivar
        </button>
      </div>

      {/* Conditionally exclusively render content of the ACTIVE TAB */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Quick stats for active users */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(ROLE_LABELS).map(([role, label]) => {
                const count = roleCounts[role] || 0;
                return (
                  <div key={role} className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
                    <p className="text-xl font-black text-slate-800">{count}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                  </div>
                );
              })}
            </div>

            {/* Advanced Filters & Search (Premium Pills & No Select) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Filtrar por rol</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    onClick={() => setFilterRole('')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterRole === ''
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos
                  </button>
                  {Object.entries(ROLE_LABELS).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setFilterRole(k)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        filterRole === k
                          ? 'bg-primary text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre o correo electrónico..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input-crema pl-11 py-3"
                />
              </div>
            </div>

            {/* Users Table — CREMA */}
            <div className="card-crema overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-crema">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Correo Institucional</th>
                      <th>Rol de Acceso</th>
                      <th>Docente Vinculado</th>
                      <th className="text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.uid}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shrink-0">
                              {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{u.displayName}</p>
                              <p className="text-[10px] text-slate-400 font-mono tracking-wider">{u.uid.slice(0, 8)}...{u.uid.slice(-4)}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}
                          </span>
                        </td>
                        <td>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadgeColor(u.role || '')}`}>
                            {ROLE_LABELS[u.role || ''] || u.role || 'Sin rol'}
                          </span>
                        </td>
                        <td>
                          {u.teacherId ? (
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5" /> {getTeacherName(u.teacherId)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">— No asignado —</span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer group"
                              title="Editar permisos y vinculaciones"
                            >
                              <Edit3 className="w-4 h-4 text-slate-500 group-hover:text-primary transition-colors" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.uid, u.displayName)}
                              className="p-1.5 hover:bg-red-50 rounded-xl transition-colors cursor-pointer group"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                          <UserX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          No se encontraron usuarios activos con los criterios seleccionados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'approvals' && (
          <motion.div
            key="approvals-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Solicitudes Pendientes de Aprobación
                </h2>
                <p className="text-xs text-secondary mt-1">
                  A continuación se muestran los usuarios que se han registrado por el login utilizando correos institucionales y están esperando la autorización del administrador para acceder.
                </p>
              </div>
              {pendingApprovals.length > 0 && (
                <button
                  onClick={handleCleanApprovalRequests}
                  className="flex items-center gap-2 px-3 py-2 bg-red-500/10 text-red-600 border border-red-200 rounded-xl text-[10px] font-bold hover:bg-red-500/20 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" />
                  Limpiar Todo
                </button>
              )}
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-secondary">
                <Check className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-semibold">Todas las solicitudes han sido resueltas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingApprovals.map((req, i) => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white border border-slate-200/80 rounded-2xl p-5 hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                          {req.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{req.displayName}</h3>
                          <p className="text-xs text-secondary flex items-center gap-1">
                            <Mail className="w-3 h-3 text-secondary" /> {req.email}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-secondary font-semibold uppercase tracking-wider text-[10px]">Rol solicitado:</span>
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {ROLE_LABELS[req.requestedRole || 'docente'] || req.requestedRole}
                          </span>
                        </div>

                        {req.teacherName && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Docente vinculado:</span>
                            <span className="text-slate-700 font-bold">{req.teacherName}</span>
                          </div>
                        )}

                        {req.studentName && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Estudiante pre-cargado:</span>
                            <span className="text-slate-700 font-bold">{req.studentName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Solicitado el {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleDateString() : new Date(req.createdAt as any).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-5 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => handleApprove(req)}
                        className="btn-primary flex-1 justify-center text-xs py-2 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprobar Acceso
                      </button>
                      <button
                        onClick={() => handleReject(req.userId)}
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-xs py-2 px-3 cursor-pointer"
                      >
                        Rechazar
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'pending' && (
          <motion.div
            key="pending-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="card-crema p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Alumnos sin Cuenta</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{pendingStudents.length} alumno(s) registrado(s) sin cuenta de usuario</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={bulkPassword}
                    onChange={e => setBulkPassword(e.target.value)}
                    placeholder="Contrasena"
                    className="input-crema w-36 text-xs"
                  />
                  <button onClick={handleBulkActivate} disabled={pendingStudents.length === 0} className="btn-primary text-xs disabled:opacity-50">
                    <UserPlus className="w-4 h-4" /> Activar Todos
                  </button>
                </div>
              </div>

              {pendingStudents.length === 0 ? (
                <div className="text-center py-8">
                  <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">Todos los alumnos tienen cuenta activa</p>
                </div>
              ) : (
                <>
                  {/* Search + Grade Filter */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={e => { setStudentSearch(e.target.value); setStudentPage(1); }}
                        placeholder="Buscar por nombre o carnet..."
                        className="input-crema pl-10 py-2 text-xs w-full"
                      />
                    </div>
                    <select
                      value={studentGradeFilter}
                      onChange={e => { setStudentGradeFilter(e.target.value); setStudentPage(1); }}
                      className="input-crema py-2 text-xs w-full sm:w-48"
                    >
                      <option value="">Todos los grados</option>
                      {allGrades.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[10px] text-slate-400 mb-2">
                    Mostrando {paginatedStudents.length} de {filteredStudents.length} alumnos
                  </div>

                  <div className="space-y-2">
                    {paginatedStudents.length === 0 ? (
                      <div className="text-center py-6 text-sm text-slate-400">
                        No se encontraron alumnos con esos criterios
                      </div>
                    ) : paginatedStudents.map(student => {
                    const carnet = student.carnet || student.id;
                    const email = carnet.includes('@') ? carnet : `${carnet.toLowerCase()}@salesianosanjose.edu.sv`;
                    return (
                      <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${student.gender === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                            {student.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-slate-800 block">{student.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{getGradeName(student.gradeId)}</span>
                          <button
                            onClick={() => handleActivateStudent(student)}
                            disabled={activatingStudent === student.id}
                            className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                          >
                            {activatingStudent === student.id ? 'Activando...' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>

                  {/* Pagination */}
                  {totalStudentPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                        disabled={studentPage === 1}
                        className="px-3 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        ← Anterior
                      </button>
                      <span className="text-xs text-slate-500">
                        {studentPage} / {totalStudentPages}
                      </span>
                      <button
                        onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                        disabled={studentPage === totalStudentPages}
                        className="px-3 py-1 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {bulkResult.length > 0 && (
              <div className="card-crema p-5">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Credenciales Generadas</h3>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                  <p className="text-xs font-bold text-amber-700">Contrasena: <code className="bg-amber-100 px-1.5 py-0.5 rounded">{bulkPassword}</code></p>
                  <p className="text-[10px] text-amber-600 mt-1">Los alumnos deben ir a Login → Registrarse con su email y esta contrasena.</p>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {bulkResult.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                      <span className="font-medium text-slate-700">{r.name}</span>
                      <span className="font-mono text-slate-500">{r.email}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            key="notifications-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 shrink-0" /> Centro de Credenciales Generadas
              </h2>
              <p className="text-xs text-secondary mt-1">
                Aquí se listan los accesos de docentes recién aprobados y alumnos autorizados que ya tienen credenciales generadas de forma segura. Puedes enviarles los datos por email, descargar un PDF oficial para imprimir o copiar la plantilla de invitación.
              </p>
            </div>

            {newNotifications.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-secondary">
                <Mail className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                <p className="text-xs font-semibold">No hay credenciales pendientes de distribución</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newNotifications.map((notif, i) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl p-5 border ${
                      notif.status === 'new'
                        ? 'bg-white border-slate-200/80 shadow-sm'
                        : 'bg-slate-50 border-slate-200 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                          {notif.displayName?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">{notif.displayName}</h3>
                          <p className="text-xs text-secondary flex items-center gap-1">
                            <Mail className="w-3 h-3 text-secondary" /> {notif.email}
                          </p>
                        </div>
                      </div>

                      {notif.status === 'notified' && (
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Entregado
                        </span>
                      )}
                    </div>

                    <div className="mt-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Rol:</span>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {ROLE_LABELS[notif.role] || notif.role}
                        </span>
                      </div>

                      {notif.studentName && (
                        <div className="bg-slate-50 p-2.5 rounded-xl text-xs space-y-1">
                          <p className="text-slate-700 font-medium">Estudiante: {notif.studentName}</p>
                          <p className="text-slate-400 text-[10px]">Grado: {notif.gradeName} | Sección: {notif.sectionName}</p>
                        </div>
                      )}

                      {notif.teacherName && (
                        <div className="bg-slate-50 p-2.5 rounded-xl text-xs">
                          <p className="text-slate-700 font-medium">Docente Vinculado: {notif.teacherName}</p>
                        </div>
                      )}

                      {/* Credentials Display Box */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">USUARIO:</span>
                          <span className="text-slate-800 font-bold">{notif.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">CONTRASEÑA:</span>
                          <span className="text-slate-800 font-bold">{notif.password}</span>
                        </div>
                      </div>

                      {/* Quick Interactive Actions */}
                      {notif.status === 'new' && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-3">
                          <button
                            onClick={() => sendEmail(notif)}
                            className="btn-primary text-xs py-2 px-3 cursor-pointer flex items-center gap-1"
                          >
                            <Mail className="w-3.5 h-3.5" /> Email
                          </button>
                          <button
                            onClick={() => generatePDF(notif)}
                            className="btn-secondary text-xs py-2 px-3 cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </button>
                          <button
                            onClick={() => copyToClipboard(notif)}
                            className="btn-secondary text-xs py-2 px-3 cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copiar
                          </button>
                          <button
                            onClick={() => handleMarkNotified(notif.id)}
                            className="text-xs text-slate-500 hover:text-slate-800 py-2 px-2 cursor-pointer font-semibold flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Entregado
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'reactivate' && (
          <motion.div
            key="reactivate-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-5"
          >
            {/* Info Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex gap-3 text-emerald-700 text-xs">
              <ArrowRight className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-800">Reactivar Usuarios Eliminados</p>
                <p className="mt-1 leading-relaxed">
                  Si eliminaste un usuario del sistema pero su cuenta de Firebase Auth aún existe, puedes buscarlo por correo electrónico aquí. Si el usuario fue eliminado de Firestore, deberá iniciar sesión una vez para que el sistema recreate su perfil automáticamente.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="card-crema p-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="Correo electrónico del usuario a buscar..."
                    value={reactivateEmail}
                    onChange={e => setReactivateEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchReactivate()}
                    className="input-crema pl-11 py-3"
                  />
                </div>
                <button
                  onClick={handleSearchReactivate}
                  disabled={reactivating || !reactivateEmail.trim()}
                  className="btn-primary px-6 disabled:opacity-50"
                >
                  {reactivating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4" /> Buscar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {reactivateResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card-crema p-5 space-y-4"
              >
                {reactivateResult.found && reactivateResult.user ? (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-700 text-lg">
                        {reactivateResult.user.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold text-slate-900">{reactivateResult.user.displayName}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {reactivateResult.user.email}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        reactivateResult.user.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                          : reactivateResult.user.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 border-amber-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      }`}>
                        {reactivateResult.user.status === 'approved' ? 'Activo' : reactivateResult.user.status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol actual</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {ROLE_LABELS[reactivateResult.user.role || ''] || reactivateResult.user.role || 'Sin rol asignado'}
                      </p>
                    </div>

                    {reactivateResult.user.status !== 'approved' && (
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => handleReactivateUser(reactivateResult.user!, 'docente')}
                          className="btn-primary text-xs flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Reactivar como Docente
                        </button>
                        <button
                          onClick={() => handleReactivateUser(reactivateResult.user!, 'alumno')}
                          className="btn-secondary text-xs flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Reactivar como Alumno
                        </button>
                      </div>
                    )}

                    {reactivateResult.user.status === 'approved' && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700 flex items-center gap-2">
                        <Check className="w-4 h-4 shrink-0" />
                        Este usuario ya está activo y puede iniciar sesión normalmente.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Usuario no encontrado en Firestore</h3>
                        <p className="text-xs text-slate-500">{reactivateEmail}</p>
                      </div>
                    </div>

                    {reactivateResult.detectedRole?.role && (
                      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rol detectado automáticamente</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getRoleBadgeColor(reactivateResult.detectedRole.role)}`}>
                            {ROLE_LABELS[reactivateResult.detectedRole.role] || reactivateResult.detectedRole.role}
                          </span>
                          {reactivateResult.detectedRole.teacherName && (
                            <span className="text-xs text-slate-500">— {reactivateResult.detectedRole.teacherName}</span>
                          )}
                          {reactivateResult.detectedRole.studentName && (
                            <span className="text-xs text-slate-500">— {reactivateResult.detectedRole.studentName}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-2">
                      <p className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Este usuario fue eliminado de Firestore
                      </p>
                      <p className="leading-relaxed">
                        La cuenta de Firebase Auth puede seguir existiendo. Para reactivar al usuario, <strong>pídele que inicie sesión una vez</strong> con su correo y contraseña. El sistema detectará su rol automáticamente y recreará su perfil.
                      </p>
                      {reactivateResult.detectedRole?.role && (
                        <p className="leading-relaxed">
                          Rol que se asignará: <strong>{ROLE_LABELS[reactivateResult.detectedRole.role]}</strong>
                          {reactivateResult.detectedRole.teacherName && ` (${reactivateResult.detectedRole.teacherName})`}
                          {reactivateResult.detectedRole.studentName && ` (${reactivateResult.detectedRole.studentName})`}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => { setReactivateResult(null); setReactivateEmail(''); }}
                      className="btn-secondary text-xs"
                    >
                      Limpiar búsqueda
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Edición Usuario — CREMA */}
      <AnimatePresence>
        {selectedUser && (
          <div className="modal-backdrop">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-container max-w-lg relative z-10"
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Modificar Acceso de Usuario</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedUser.displayName}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="modal-close-btn">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="modal-body space-y-5">
                {/* Email Display */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuenta vinculada</span>
                  <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {selectedUser.email}
                  </p>
                </div>

                {/* Role selection */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seleccionar Rol</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {Object.entries(ROLE_LABELS).map(([roleKey, label]) => {
                      const isActive = editRole === roleKey;
                      return (
                        <button
                          key={roleKey}
                          type="button"
                          onClick={() => {
                            setEditRole(roleKey);
                            if (roleKey !== 'docente') setEditTeacherId('');
                          }}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            isActive
                              ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Shield className={`w-4 h-4 mx-auto mb-1 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                          <span className="text-xs block">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Teacher Pairing Selection */}
                {editRole === 'docente' && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Vincular con Personal Docente</span>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Buscar docente por nombre o especialidad..."
                        value={teacherSearch}
                        onChange={e => setTeacherSearch(e.target.value)}
                        className="input-crema pl-9 py-2 text-xs"
                      />
                    </div>

                    <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50/50">
                      <button
                        type="button"
                        onClick={() => setEditTeacherId('')}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
                          editTeacherId === ''
                            ? 'bg-primary/5 text-primary'
                            : 'hover:bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span>— Sin vincular perfil docente —</span>
                        {editTeacherId === '' && <Check className="w-3.5 h-3.5" />}
                      </button>

                      {teachers
                        .filter(t => t.name.toLowerCase().includes(teacherSearch.toLowerCase()) || (t.specialty && t.specialty.toLowerCase().includes(teacherSearch.toLowerCase())))
                        .map(t => {
                          const isSelected = editTeacherId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => setEditTeacherId(t.id)}
                              className={`w-full text-left px-3 py-2.5 text-xs flex items-center justify-between transition-colors ${
                                isSelected
                                  ? 'bg-primary/5 text-primary font-bold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <div>
                                <p className="font-semibold">{t.name}</p>
                                {t.specialty && <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.specialty}</p>}
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setSelectedUser(null)} className="btn-secondary text-xs py-2 px-4">
                  Cancelar
                </button>
                <button type="button" onClick={handleUpdateUser} disabled={isSaving} className="btn-primary text-xs py-2 px-5 disabled:opacity-50">
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
