import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Edit2, Trash2, Save, X, Search, Shield, Mail, UserCheck, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getAllUsers, updateUser, getAllTeachers } from '../../lib/firestore';
import { User, Teacher, UserRole, ROLE_LABELS } from '../../types';

export default function UsersManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');

  // Edit State
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('docente');
  const [editTeacherId, setEditTeacherId] = useState<string>('');

  useEffect(() => { loadData(); }, []);

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
    </div>
  );
}
