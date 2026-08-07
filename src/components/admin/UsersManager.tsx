import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Edit2, Trash2, Save, X, Search, Shield, Mail, UserCheck, HelpCircle, FileText, Copy, Check, Send, Download, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsers, updateUser, getAllTeachers, getPendingApprovalRequests, getAllApprovalRequests, updateApprovalRequest, getNewUserNotifications, markNotificationAsNotified, approveUser, rejectUser } from '../../lib/firestore';
import { User, Teacher, UserRole, ROLE_LABELS, ApprovalRequest, NewUserNotification } from '../../types';
import jsPDF from 'jspdf';

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'users' | 'approvals' | 'notifications'>('users');

  // Approval State
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [newNotifications, setNewNotifications] = useState<NewUserNotification[]>([]);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('docente');
  const [editTeacherId, setEditTeacherId] = useState<string>('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [u, t, approvals, notifications] = await Promise.all([
        getAllUsers(),
        getAllTeachers(),
        getPendingApprovalRequests(),
        getNewUserNotifications()
      ]);
      setUsers(u);
      setTeachers(t);
      setPendingApprovals(approvals);
      setNewNotifications(notifications);
    } finally { setLoading(false); }
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return null;
    return teachers.find(t => t.id === teacherId)?.name || null;
  };

  const handleUpdateUser = async (uid: string) => {
    try {
      const payload: Partial<User> = {
        role: editRole,
        teacherId: editRole === 'docente' && editTeacherId ? editTeacherId : undefined
      };

      await updateUser(uid, payload);
      toast.success('Usuario actualizado correctamente');
      setEditingUid(null);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar usuario';
      toast.error(msg);
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

  const handleReject = async (requestId: string) => {
    const reason = prompt('Motivo del rechazo (opcional):') || '';
    try {
      await rejectUser(requestId, reason);
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
    doc.setFillColor(37, 133, 90);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('Campus Salesiano San José', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Credenciales de Acceso', 105, 30, { align: 'center' });

    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Nombre: ${notification.displayName}`, 20, 60);
    doc.text(`Usuario (correo): ${notification.email}`, 20, 70);
    doc.text(`Contraseña: ${notification.password}`, 20, 80);
    
    if (notification.studentName) {
      doc.text(`Alumno: ${notification.studentName}`, 20, 95);
      doc.text(`Grado: ${notification.gradeName}`, 20, 105);
      doc.text(`Sección: ${notification.sectionName}`, 20, 115);
    }
    if (notification.teacherName) {
      doc.text(`Docente: ${notification.teacherName}`, 20, 95);
    }

    doc.text(`Rol: ${ROLE_LABELS[notification.role] || notification.role}`, 20, 130);
    doc.text('URL de acceso: https://campus-27248.web.app', 20, 140);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${new Date().toLocaleString()}`, 20, 155);

    // Save
    doc.save(`credenciales_${notification.displayName.replace(/\s+/g, '_')}.pdf`);
    toast.success('PDF generado correctamente');
  };

  const copyToClipboard = async (notification: NewUserNotification) => {
    const text = `Usuario: ${notification.email}\nContraseña: ${notification.password}\nURL: https://campus-27248.web.app`;
    await navigator.clipboard.writeText(text);
    toast.success('Credenciales copiadas al portapapeles');
  };

  const handleMarkNotified = async (notificationId: string) => {
    try {
      await markNotificationAsNotified(notificationId);
      toast.success('Marcado como enviado');
      loadData();
    } catch (err) {
      toast.error('Error al actualizar notificación');
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      admin: 'bg-red-100 text-red-700',
      docente: 'bg-blue-100 text-blue-700',
      alumno: 'bg-green-100 text-green-700',
      coordinacion: 'bg-purple-100 text-purple-700',
      coordinacion_academica: 'bg-purple-100 text-purple-700',
      coordinacion_convivencia: 'bg-purple-100 text-purple-700',
      coordinacion_primaria: 'bg-purple-100 text-purple-700',
      coordinacion_parvularia: 'bg-purple-100 text-purple-700',
      registro_academico: 'bg-amber-100 text-amber-700',
      enfermeria: 'bg-pink-100 text-pink-700',
      psicopedagogico: 'bg-cyan-100 text-cyan-700',
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  const filtered = users.filter(u => {
    const matchSearch = `${u.displayName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-amber-100">
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="module-title">Usuarios</h1>
            <p className="module-subtitle">{filtered.length} usuario(s) registrado(s)</p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex gap-3 text-slate-600 text-xs">
        <HelpCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-slate-800">¿Cómo funciona la relación con los Docentes?</p>
          <p className="mt-1 leading-relaxed">
            Para que las cuentas de los usuarios con rol <strong>Docente</strong> puedan ver su respectivo grado guía y sus alumnos en el Dashboard, deben estar vinculados a un perfil de docente de la sección de personal. Puedes asociarlos manualmente aquí utilizando el botón de <strong>Editar (Lápiz)</strong> y eligiendo su nombre.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'users'
              ? 'bg-primary text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Usuarios
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Aprobaciones
          {pendingApprovals.length > 0 && (
            <span className="bg-amber-400 text-amber-900 text-xs px-2 py-0.5 rounded-full font-bold">
              {pendingApprovals.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === 'notifications'
              ? 'bg-green-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Credenciales
          {newNotifications.filter(n => n.status === 'new').length > 0 && (
            <span className="bg-green-400 text-green-900 text-xs px-2 py-0.5 rounded-full font-bold">
              {newNotifications.filter(n => n.status === 'new').length}
            </span>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(roleCounts).slice(0, 4).map(([role, count]) => (
          <div key={role} className="card p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-xs text-slate-500 capitalize">{ROLE_LABELS[role as UserRole] || role}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar usuario..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="input w-auto">
          <option value="">Todos los roles</option>
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Usuario</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Email</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Rol</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Vínculo Docente</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u, i) => (
              <motion.tr key={u.uid} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="table-row border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {u.displayName?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{u.displayName}</p>
                      <p className="text-xs text-slate-400 font-mono">{u.uid.slice(0, 12)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {editingUid === u.uid ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase w-10">Rol:</span>
                        <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}
                          className="input text-xs py-1 px-2 w-48">
                          {Object.entries(ROLE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>

                      {editRole === 'docente' && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase w-10">Docente:</span>
                          <select value={editTeacherId} onChange={e => setEditTeacherId(e.target.value)}
                            className="input text-xs py-1 px-2 w-48">
                            <option value="">— Sin vincular —</option>
                            {teachers.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.email})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-1 pl-12">
                        <button onClick={() => handleUpdateUser(u.uid)} className="btn-primary text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5">
                          <Save className="w-3.5 h-3.5" /> Guardar
                        </button>
                        <button onClick={() => setEditingUid(null)} className="btn-secondary text-xs py-1 px-2.5 rounded-lg flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getRoleBadgeColor(u.role)}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.teacherId ? (
                    <p className="text-sm text-primary font-bold flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> {getTeacherName(u.teacherId)}
                    </p>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingUid !== u.uid && (
                    <button onClick={() => {
                      setEditingUid(u.uid);
                      setEditRole(u.role);
                      setEditTeacherId(u.teacherId || '');
                    }}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                      <Edit2 className="w-4 h-4 text-slate-500" />
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">No se encontraron usuarios</p>
        </div>
      )}

      {/* Approval Requests Tab */}
      {activeTab === 'approvals' && (
        <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
          <div className="bg-amber-50 border-b border-amber-200 p-5">
            <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Solicitudes Pendientes de Aprobación
            </h2>
            <p className="text-sm text-amber-700 mt-1">
              Usuarios que han solicitado acceso y esperan revisión del administrador
            </p>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Check className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay solicitudes pendientes</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {pendingApprovals.map((req, i) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white border border-amber-100 rounded-xl p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-amber-700">
                            {req.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{req.displayName}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {req.email}
                          </p>
                        </div>
                      </div>

                      <div className="ml-13 pl-13 space-y-1.5">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold">Rol solicitado:</span>{' '}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            {ROLE_LABELS[req.requestedRole || 'docente'] || req.requestedRole}
                          </span>
                        </p>

                        {req.teacherId && (
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold">Docente vinculado:</span>{' '}
                            <span className="text-primary font-medium">{req.teacherName}</span>
                          </p>
                        )}

                        {req.studentId && (
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold">Alumno:</span>{' '}
                            <span className="text-accent font-medium">{req.studentName}</span>
                          </p>
                        )}

                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-2">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(req.createdAt as any).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(req)}
                        className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Aprobar
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" /> Rechazar
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Credentials Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-green-200 overflow-hidden">
          <div className="bg-green-50 border-b border-green-200 p-5">
            <h2 className="text-lg font-bold text-green-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Credenciales Generadas
            </h2>
            <p className="text-sm text-green-700 mt-1">
              Usuarios auto-registrados con credenciales listas para enviar
            </p>
          </div>

          {newNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No hay credenciales pendientes de envío</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {newNotifications.map((notif, i) => (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`rounded-xl p-5 border ${
                    notif.status === 'new'
                      ? 'bg-white border-green-200'
                      : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {notif.displayName?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{notif.displayName}</h3>
                          <p className="text-sm text-slate-500 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> {notif.email}
                          </p>
                        </div>
                        {notif.status === 'notified' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Enviado
                          </span>
                        )}
                      </div>

                      <div className="ml-13 pl-13 space-y-1.5">
                        <p className="text-sm text-slate-600">
                          <span className="font-semibold">Rol:</span>{' '}
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                            {ROLE_LABELS[notif.role] || notif.role}
                          </span>
                        </p>

                        {notif.studentName && (
                          <>
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold">Alumno:</span>{' '}
                              <span className="text-accent font-medium">{notif.studentName}</span>
                            </p>
                            <p className="text-sm text-slate-600">
                              <span className="font-semibold">Grado:</span>{' '}
                              <span className="font-medium">{notif.gradeName}</span>
                              <span className="mx-2 text-slate-300">|</span>
                              <span className="font-semibold">Sección:</span>{' '}
                              <span className="font-medium">{notif.sectionName}</span>
                            </p>
                          </>
                        )}

                        {notif.teacherName && (
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold">Docente:</span>{' '}
                            <span className="text-primary font-medium">{notif.teacherName}</span>
                          </p>
                        )}

                        {/* Credentials Box */}
                        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Credenciales</p>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs text-slate-500 w-16">Usuario:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono flex-1">
                              {notif.email}
                            </code>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-16">Contraseña:</span>
                            <code className="text-xs bg-white px-2 py-1 rounded border border-slate-200 font-mono flex-1">
                              {notif.password}
                            </code>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {notif.status === 'new' && (
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <button
                              onClick={() => sendEmail(notif)}
                              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                              title="Enviar por correo"
                            >
                              <Mail className="w-4 h-4" /> Email
                            </button>
                            <button
                              onClick={() => generatePDF(notif)}
                              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                              title="Descargar PDF"
                            >
                              <FileText className="w-4 h-4" /> PDF
                            </button>
                            <button
                              onClick={() => copyToClipboard(notif)}
                              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                              title="Copiar al portapapeles"
                            >
                              <Copy className="w-4 h-4" /> Copiar
                            </button>
                            <button
                              onClick={() => handleMarkNotified(notif.id)}
                              className="text-xs py-2 px-3 flex items-center gap-1.5 text-slate-500 hover:text-slate-700"
                              title="Marcar como enviado"
                            >
                              <Check className="w-4 h-4" /> Marcar enviado
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
