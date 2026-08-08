import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Plus, Pencil, Trash2, X, Check, Lock } from 'lucide-react';
import { getAllRoles, createRole, updateRole, deleteRole, getAllUsers, updateUserRole } from '../../lib/firestore';
import { RoleConfig, SystemModuleId, SYSTEM_MODULES, UserRole, ROLE_LABELS_BASE } from '../../types';
import { updateRoleLabelsFromFirestore } from '../../types';
import { toast } from 'sonner';

export default function RolesManager() {
  const [roles, setRoles] = useState<RoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<Partial<RoleConfig> | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [userCount, setUserCount] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rolesData, users] = await Promise.all([getAllRoles(), getAllUsers()]);
      setRoles(rolesData);
      const counts: Record<string, number> = {};
      users.forEach(u => { counts[u.role] = (counts[u.role] || 0) + 1; });
      setUserCount(counts);
    } catch (err) {
      toast.error('Error cargando roles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!editingRole?.id || !editingRole.name) return;
    try {
      if (isCreating) {
        await createRole({
          id: editingRole.id,
          name: editingRole.name,
          description: editingRole.description || '',
          permissions: editingRole.permissions || [],
          isSystem: false,
        });
        toast.success('Rol creado');
      } else {
        await updateRole(editingRole.id, {
          name: editingRole.name,
          description: editingRole.description,
          permissions: editingRole.permissions,
        });
        toast.success('Rol actualizado');
      }
      setEditingRole(null);
      setIsCreating(false);
      
      // Actualizar ROLE_LABELS dinámicamente
      const allRoles = await getAllRoles();
      updateRoleLabelsFromFirestore(allRoles);
      
      await loadData();
    } catch (err) {
      toast.error('Error guardando rol');
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) {
      toast.error('No se puede eliminar un rol del sistema');
      return;
    }
    if (!confirm(`¿Eliminar el rol "${role?.name}"?`)) return;
    try {
      await deleteRole(id);
      toast.success('Rol eliminado');
      
      // Actualizar ROLE_LABELS dinámicamente
      const allRoles = await getAllRoles();
      updateRoleLabelsFromFirestore(allRoles);
      
      await loadData();
    } catch (err) {
      toast.error('Error eliminando rol');
      console.error(err);
    }
  }

  function togglePermission(moduleId: SystemModuleId) {
    if (!editingRole) return;
    const perms = editingRole.permissions || [];
    const newPerms = perms.includes(moduleId)
      ? perms.filter(p => p !== moduleId)
      : [...perms, moduleId];
    setEditingRole({ ...editingRole, permissions: newPerms });
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="module-header">
        <div className="module-title-group">
          <div className="module-icon bg-primary/10">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="module-title">Gestión de Roles</h1>
            <p className="module-subtitle">Define roles y asigna módulos del sistema</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingRole({ id: '', name: '', description: '', permissions: [] }); setIsCreating(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> Nuevo Rol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role, i) => (
          <motion.div
            key={role.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{role.name}</h3>
                   <p className="text-[10px] text-tertiary font-mono">{role.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingRole({ ...role }); setIsCreating(false); }}
                  className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                >
                   <Pencil className="w-3.5 h-3.5 text-secondary" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}
              </div>
            </div>

            {role.description && (
               <p className="text-xs text-secondary mb-3">{role.description}</p>
            )}

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold text-tertiary uppercase">Usuarios:</span>
              <span className="text-xs font-bold text-slate-700">{userCount[role.id] || 0}</span>
              {role.isSystem && (
                <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-full font-semibold">Sistema</span>
              )}
            </div>

            <div>
              <p className="text-[10px] font-semibold text-tertiary uppercase mb-2">Módulos habilitados</p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.map(p => (
                  <span key={p} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                    {SYSTEM_MODULES.find(m => m.id === p)?.label || p}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-[10px] text-tertiary italic">Sin módulos</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {editingRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-6 w-full max-w-lg shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900">{isCreating ? 'Crear Rol' : 'Editar Rol'}</h3>
                <button onClick={() => { setEditingRole(null); setIsCreating(false); }} className="p-1 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-tertiary" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="form-label">ID del Rol</label>
                  <input
                    type="text"
                    value={editingRole.id || ''}
                    onChange={e => setEditingRole({ ...editingRole, id: e.target.value })}
                    disabled={!isCreating}
                    className={`w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono ${!isCreating ? 'bg-slate-50 text-tertiary' : ''}`}
                    placeholder="ej: mi_rol"
                  />
                </div>
                <div>
                  <label className="form-label">Nombre</label>
                  <input
                    type="text"
                    value={editingRole.name || ''}
                    onChange={e => setEditingRole({ ...editingRole, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Mi Nuevo Rol"
                  />
                </div>
                <div>
                  <label className="form-label">Descripción</label>
                  <input
                    type="text"
                    value={editingRole.description || ''}
                    onChange={e => setEditingRole({ ...editingRole, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Describe las funciones de este rol"
                  />
                </div>
                <div>
                  <label className="form-label mb-2">Módulos Habilitados</label>
                  <div className="grid grid-cols-2 gap-2">
                    {SYSTEM_MODULES.map(mod => {
                      const isActive = editingRole.permissions?.includes(mod.id);
                      return (
                        <button
                          key={mod.id}
                          onClick={() => togglePermission(mod.id)}
                          className={`p-3 rounded-xl border text-left text-xs transition-all ${
                            isActive
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-white border-slate-200 text-secondary hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isActive ? <Check className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-slate-300" />}
                            <div>
                              <p className="font-semibold">{mod.label}</p>
                              <p className="text-[10px] opacity-70">{mod.desc}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button onClick={() => { setEditingRole(null); setIsCreating(false); }} className="btn-secondary">Cancelar</button>
                <button onClick={handleSave} className="btn-primary"><Check className="w-4 h-4" /> Guardar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}