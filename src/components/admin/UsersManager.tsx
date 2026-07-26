import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Edit2, Trash2, Save, X, Search, Shield, Mail, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../../firebase';
import { getAllUsers, updateUserRole, getAllTeachers, createUser as createUserDoc } from '../../lib/firestore';
import { User, Teacher, UserRole, ROLE_LABELS } from '../../types';

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('docente');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ email: '', password: '', displayName: '', role: 'docente' as UserRole, adminPassword: '' });

  useEffect(() => { loadData(); }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const admin = auth.currentUser;
      if (!admin?.email) throw new Error('No hay sesión de administrador activa');
      if (!createForm.adminPassword) throw new Error('Debes ingresar tu contraseña de administrador');

      const adminEmail = admin.email;

      await createUserWithEmailAndPassword(auth, createForm.email, createForm.password);

      await createUserDoc({
        uid: auth.currentUser!.uid,
        email: createForm.email,
        displayName: createForm.displayName,
        role: createForm.role,
      });

      await signOut(auth);

      await signInWithEmailAndPassword(auth, adminEmail, createForm.adminPassword);

      toast.success('Usuario creado correctamente');
      setShowCreateModal(false);
      setCreateForm({ email: '', password: '', displayName: '', role: 'docente', adminPassword: '' });
      loadData();
    } catch (err: any) {
      const msg = err?.message || 'Error al crear usuario';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const loadData = async () => {
    try {
      const [u, t] = await Promise.all([getAllUsers(), getAllTeachers()]);
      setUsers(u);
      setTeachers(t);
    } finally { setLoading(false); }
  };

  const getTeacherName = (teacherId?: string) => {
    if (!teacherId) return null;
    return teachers.find(t => t.id === teacherId)?.name || null;
  };

  const handleUpdateRole = async (uid: string) => {
    try {
      await updateUserRole(uid, editRole);
      toast.success('Rol actualizado correctamente');
      setEditingUid(null);
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar rol';
      toast.error(msg);
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
        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(roleCounts).slice(0, 4).map(([role, count]) => (
          <div key={role} className="card p-3 text-center">
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-xs text-slate-500 capitalize">{ROLE_LABELS[role as UserRole] || role}</p>
          </div>
        ))}
      </div>

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
                    <div className="flex items-center gap-2">
                      <select value={editRole} onChange={e => setEditRole(e.target.value as UserRole)}
                        className="input text-xs py-1 px-2 w-40">
                        {Object.entries(ROLE_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                      <button onClick={() => handleUpdateRole(u.uid)} className="p-1 hover:bg-green-100 rounded-lg">
                        <Save className="w-4 h-4 text-green-600" />
                      </button>
                      <button onClick={() => setEditingUid(null)} className="p-1 hover:bg-slate-100 rounded-lg">
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ) : (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getRoleBadgeColor(u.role)}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.teacherId ? (
                    <p className="text-sm text-primary flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" /> {getTeacherName(u.teacherId)}
                    </p>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingUid !== u.uid && (
                    <button onClick={() => { setEditingUid(u.uid); setEditRole(u.role); }}
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

      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !creating && setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900">Nuevo Usuario</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="label">Nombre Completo</label>
                  <input type="text" required value={createForm.displayName}
                    onChange={e => setCreateForm(f => ({ ...f, displayName: e.target.value }))}
                    className="input" placeholder="Ej. Juan Pérez" />
                </div>
                <div>
                  <label className="label">Correo Electrónico</label>
                  <input type="email" required value={createForm.email}
                    onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
                    className="input" placeholder="usuario@salesianosanjose.edu.sv" />
                </div>
                <div>
                  <label className="label">Contraseña del nuevo usuario</label>
                  <input type="text" required value={createForm.password}
                    onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
                    className="input" placeholder="Mínimo 6 caracteres" minLength={6} />
                </div>
                <div>
                  <label className="label">Rol</label>
                  <select value={createForm.role}
                    onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as UserRole }))}
                    className="input">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="border-t border-slate-200 pt-4">
                  <label className="label text-amber-700">
                    Tu contraseña de administrador (para re-autenticarte)
                  </label>
                  <input type="password" required value={createForm.adminPassword}
                    onChange={e => setCreateForm(f => ({ ...f, adminPassword: e.target.value }))}
                    className="input" placeholder="Ingresa tu contraseña actual" />
                  <p className="text-xs text-slate-400 mt-1">Necesaria para volver a iniciar sesión como admin después de crear el usuario.</p>
                </div>
                <button type="submit" disabled={creating}
                  className="btn-primary w-full justify-center py-3 rounded-xl disabled:opacity-50">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {creating ? 'Creando...' : 'Crear Usuario'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}