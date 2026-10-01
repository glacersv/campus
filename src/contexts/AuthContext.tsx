import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { getUser, createUser, getRole, isEmailPreAuthorized, getStudentByCarnet, createApprovalRequest, createNewUserNotification, updateUser, getTeacherByEmail, getTeacher, createUserForTeacher, createUserForStudent, getStudent, updateApprovalRequest, getAllRoles, getUserByEmail, getUserByStudentId, deleteUser, fixRolesPermissions } from '../lib/firestore';
import { User, UserRole, SystemModuleId, RoleConfig, ApprovalRequest } from '../types';
import { updateRoleLabelsFromFirestore } from '../types';
import { lmsService } from '../services/lmsService';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: UserRole | null;
  roleConfig: RoleConfig | null;
  refreshRole: () => Promise<void>;
  hasPermission: (module: SystemModuleId) => boolean;
  isRole: (...roles: UserRole[]) => boolean;
  approveUser: (uid: string, role: UserRole) => Promise<void>;
  rejectUser: (uid: string, reason?: string) => Promise<void>;
  getPendingApprovals: () => Promise<ApprovalRequest[]>;
  getNewUserNotifications: () => Promise<any[]>;
  markNotificationAsNotified: (notificationId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        let profile = await getUser(user.uid);
        if (!profile) {
          // SELF-HEALING FLOW: El usuario está en Auth pero no tiene registro en Firestore (Cuenta Huérfana)
          const email = (
            user.email ||
            user.providerData?.[0]?.email ||
            ''
          ).trim().toLowerCase();
          let detectedRole: UserRole | null = null;
          let studentId: string | undefined;
          let studentName: string | undefined;
          let gradeId: string | undefined;
          let sectionId: string | undefined;
          let teacherId: string | undefined;
          let teacherName: string | undefined;

          // Detectar rol y detalles
          const isSuperAdmin = email === 'admin@salesianosanjose.edu.sv' || email === 'glacersv@gmail.com';
          const teacher = await getTeacherByEmail(email);
          if (isSuperAdmin) {
            detectedRole = 'admin';
          } else if (teacher) {
            detectedRole = 'docente';
            teacherId = teacher.id;
            teacherName = teacher.name;
          } else {
            const carnet = email.split('@')[0];
            const student = await getStudentByCarnet(carnet);
            if (student) {
              detectedRole = 'alumno';
              studentId = student.id;
              studentName = student.name;
              gradeId = student.gradeId;
              sectionId = student.sectionId;
            }
          }

          const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
            uid: user.uid,
            email,
            displayName: user.displayName || email.split('@')[0],
            role: isSuperAdmin ? 'admin' : null,
            status: isSuperAdmin ? 'approved' : 'pending',
            requestedRole: detectedRole || null,
            ...(teacherId ? { teacherId } : {}),
            ...(studentId ? { studentId } : {}),
            ...(studentName ? { studentName } : {}),
            ...(gradeId ? { gradeId } : {}),
            ...(sectionId ? { sectionId } : {}),
          };

          await createUser(userData);

          await createApprovalRequest({
            id: user.uid,
            userId: user.uid,
            email,
            displayName: user.displayName || email.split('@')[0],
            requestedRole: detectedRole || null,
            status: 'pending',
            studentId,
            studentName,
            gradeId,
            sectionId,
            teacherId,
            teacherName,
          });

          profile = await getUser(user.uid);
        }

        if (profile && profile.role === 'alumno' && (!profile.gradeId || !profile.studentId)) {
          try {
            const carnet = (profile.email || user.email || '').split('@')[0];
            let student = profile.studentId ? await getStudent(profile.studentId) : null;
            if (!student) {
              student = await getStudentByCarnet(carnet);
            }
            if (student) {
              profile = {
                ...profile,
                studentId: profile.studentId || student.id,
                studentName: profile.studentName || student.name,
                gradeId: profile.gradeId || student.gradeId,
                sectionId: profile.sectionId || student.sectionId,
              };
            }
          } catch (e) {
            console.warn('[AuthContext] Error enriching student profile:', e);
          }
        }

        setUserProfile(profile);
        lmsService.setUserRole(profile?.role || null);
        if (profile?.role) {
          const rc = await getRole(profile.role);
          setRoleConfig(rc);

          // Cargar roles dinámicos desde Firestore
          const allRoles = await getAllRoles();
          updateRoleLabelsFromFirestore(allRoles);

          // Fix incorrect module IDs in roles (fire-and-forget) - solo admin
          if (profile.role === 'admin') {
            fixRolesPermissions().catch(console.error);
          }

          // Exponer función para corregir permisos manualmente desde consola (solo admin)
          if (profile.role === 'admin') {
            (window as any).fixRolesPermissions = fixRolesPermissions;
          }
        } else {
          setRoleConfig(null);
        }
      } else {
        setUserProfile(null);
        lmsService.setUserRole(null);
        setRoleConfig(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithMicrosoft = async () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      prompt: 'select_account',
      tenant: 'salesianosanjose.edu.sv',
    });

    const result = await signInWithPopup(auth, provider);
    console.log('[Microsoft Login] Raw User Result:', {
      email: result.user.email,
      providerData: result.user.providerData,
      displayName: result.user.displayName,
    });

    const email = (
      result.user.email ||
      result.user.providerData?.[0]?.email ||
      ''
    ).trim().toLowerCase();

    console.log('[Microsoft Login] Detected Email:', email);

    // Validar dominio institucional salesianosanjose.edu.sv
    const isSuperAdmin = email === 'admin@salesianosanjose.edu.sv' || email === 'glacersv@gmail.com';
    if (!email.endsWith('@salesianosanjose.edu.sv') && !isSuperAdmin) {
      await firebaseSignOut(auth);
      throw new Error(`Acceso restringido. Correo detectado: "${email || 'sin correo'}". Solo se admiten cuentas institucionales (@salesianosanjose.edu.sv).`);
    }

    // Verificar si ya existe perfil
    const profile = await getUser(result.user.uid);
    if (!profile) {
      // Perfil recién creado por el listener onAuthStateChanged
      // Si el status es pending, notificar al usuario
      return;
    }

    if (profile.status === 'rejected') {
      await firebaseSignOut(auth);
      throw new Error('Tu solicitud de acceso fue rechazada. Contacta al administrador para más información.');
    }
  };

  const signIn = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Bypass de desarrollo para Super Admin
    if (cleanEmail === 'admin@salesianosanjose.edu.sv') {
      try {
        await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
      } catch (err: any) {
        // En caso de que la contraseña en Auth sea 12345 o 123456
        if (cleanPassword === '12345' || cleanPassword === '123456') {
          const alternatePass = cleanPassword === '12345' ? '123456' : '12345';
          try {
            await signInWithEmailAndPassword(auth, cleanEmail, alternatePass);
          } catch {
            throw err;
          }
        } else {
          throw err;
        }
      }
      return;
    }

    await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);

    // Bypass para otros super admins
    if (cleanEmail === 'glacersv@gmail.com') return;

    // Verificar estado del usuario después del login
    const profile = await getUser(auth.currentUser?.uid || '');
    if (profile?.status === 'pending') {
      await firebaseSignOut(auth);
      throw new Error('Tu cuenta está pendiente de aprobación. Un administrador revisará tu solicitud pronto.');
    }
    if (profile?.status === 'rejected') {
      await firebaseSignOut(auth);
      throw new Error('Tu solicitud de acceso fue rechazada. Contacta al administrador para más información.');
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    console.log('[signUp] Inicio registro', email);
    if (!email.endsWith('@salesianosanjose.edu.sv')) {
      throw new Error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
    }

    console.log('[signUp] Creando en Firebase Auth');
    let result;
    try {
      result = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        throw new Error('Este correo ya está registrado.');
      }
      throw err;
    }
    const uid = result.user.uid;
    console.log('[signUp] Auth OK', uid);

    let detectedRole: UserRole | null = null;
    let studentId: string | undefined;
    let studentName: string | undefined;
    let gradeId: string | undefined;
    let sectionId: string | undefined;
    let teacherId: string | undefined;
    let teacherName: string | undefined;

    // Detectar rol y detalles del usuario registrado
    const teacher = await getTeacherByEmail(email);
    if (teacher) {
      detectedRole = 'docente';
      teacherId = teacher.id;
      teacherName = teacher.name;
    } else {
      const carnet = email.split('@')[0];
      const student = await getStudentByCarnet(carnet);
      if (student) {
        detectedRole = 'alumno';
        studentId = student.id;
        studentName = student.name;
        gradeId = student.gradeId;
        sectionId = student.sectionId;
      }
    }

    const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
      uid,
      email,
      displayName,
      role: null,
      status: 'pending',
      requestedRole: detectedRole || null,
      ...(teacherId ? { teacherId } : {}),
      ...(studentId ? { studentId } : {}),
    };
    console.log('[signUp] Creando user en Firestore');
    // Si ya existe un usuario aprobado para este alumno (ej: creado por admin), migrar al nuevo UID
    let existingApprovedUser: User | null = null;
    if (studentId) {
      existingApprovedUser = await getUserByStudentId(studentId);
    }
    if (existingApprovedUser?.status === 'approved' && existingApprovedUser?.role) {
      // Migrar: crear doc con nuevo UID de Auth, preservar datos aprobados
      userData.role = existingApprovedUser.role;
      userData.status = 'approved';
      userData.requestedRole = undefined;
      userData.studentId = studentId;
      // Eliminar el doc viejo (con ID del alumno como key)
      await deleteUser(existingApprovedUser.uid).catch(() => { });
    }
    await createUser(userData);
    console.log('[signUp] User creado');

    // Si ya esta aprobado, no crear approval request
    if (userData.status !== 'approved') {
      console.log('[signUp] Creando approval request');
      await createApprovalRequest({
        id: uid,
        userId: uid,
        email,
        displayName,
        requestedRole: detectedRole || null,
        status: 'pending',
        studentId,
        studentName,
        gradeId,
        sectionId,
        teacherId,
        teacherName,
      });
      console.log('[signUp] Approval request creada');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
    setRoleConfig(null);
  };

  const userRole = userProfile?.role || null;

  const hasPermission = (module: SystemModuleId): boolean => {
    if (userRole === 'admin') return true;
    if (!roleConfig) return false;
    return roleConfig.permissions.includes(module);
  };

  const isRole = (...roles: UserRole[]): boolean => {
    if (!userRole) return false;
    return roles.includes(userRole);
  };

  const approveUser = async (uid: string, role: UserRole) => {
    const user = await getUser(uid);
    if (!user) throw new Error('Usuario no encontrado');

    // Auto-provisionar según rol
    if (role === 'docente') {
      const { createUserForTeacher } = await import('../lib/firestore');
      const { getTeacherByEmail } = await import('../lib/firestore');
      const teacher = await getTeacherByEmail(user.email);
      if (teacher) {
        await createUserForTeacher(uid, user.email, user.displayName, teacher.id);
      } else {
        await createUserForTeacher(uid, user.email, user.displayName);
      }
    } else if (role === 'alumno') {
      const { createUserForStudent } = await import('../lib/firestore');
      const carnet = user.email.split('@')[0];
      const { getStudentByCarnet } = await import('../lib/firestore');
      const student = await getStudentByCarnet(carnet);
      if (student) {
        await createUserForStudent(uid, user.email, user.displayName, student.id);
      } else {
        await createUserForStudent(uid, user.email, user.displayName);
      }
    }

    // Actualizar usuario
    const updatePayload: any = {
      role,
      status: 'approved',
      updatedAt: new Date() as any,
    };
    if (user.requestedRole) {
      updatePayload.requestedRole = undefined;
    }
    await updateUser(uid, updatePayload);

    // Actualizar solicitud de aprobación
    const { updateApprovalRequestByUserId } = await import('../lib/firestore');
    await updateApprovalRequestByUserId(uid, {
      status: 'approved',
      reviewedBy: 'admin',
      reviewedAt: new Date() as any,
    });

    // Crear notificación para el admin
    const userAfterUpdate = await getUser(uid);
    if (userAfterUpdate?.teacherId) {
      const { getTeacher } = await import('../lib/firestore');
      const teacher = await getTeacher(userAfterUpdate.teacherId);
      await createNewUserNotification({
        id: `notif_${Date.now()}_${uid}`,
        userId: uid,
        email: user.email,
        displayName: user.displayName,
        role,
        teacherId: userAfterUpdate.teacherId,
        teacherName: teacher?.name,
        password: '***',
        status: 'new',
      });
    } else if (userAfterUpdate?.studentId) {
      const { getStudent } = await import('../lib/firestore');
      const student = await getStudent(userAfterUpdate.studentId);
      await createNewUserNotification({
        id: `notif_${Date.now()}_${uid}`,
        userId: uid,
        email: user.email,
        displayName: user.displayName,
        role,
        studentId: userAfterUpdate.studentId,
        studentName: student?.name,
        gradeName: student?.gradeId,
        sectionName: student?.sectionId,
        password: '***',
        status: 'new',
      });
    }
  };

  const rejectUser = async (uid: string, reason?: string) => {
    await updateUser(uid, {
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date() as any,
    });

    const { updateApprovalRequest } = await import('../lib/firestore');
    await updateApprovalRequest(uid, {
      status: 'rejected',
      reviewedBy: 'admin',
      reviewedAt: new Date() as any,
      rejectionReason: reason,
    });
  };

  const getPendingApprovals = async (): Promise<ApprovalRequest[]> => {
    const { getPendingApprovalRequests } = await import('../lib/firestore');
    return getPendingApprovalRequests();
  };

  const getNewUserNotifications = async () => {
    const { getNewUserNotifications: getNotifs } = await import('../lib/firestore');
    return getNotifs();
  };

  const markNotificationAsNotified = async (notificationId: string) => {
    const { markNotificationAsNotified: markNotif } = await import('../lib/firestore');
    return markNotif(notificationId);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshRole = async () => {
    if (!userProfile?.role) return;
    const rc = await getRole(userProfile.role);
    setRoleConfig(rc);
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      loading,
      signIn,
      signInWithMicrosoft,
      signUp,
      signOut,
      userRole,
      roleConfig,
      refreshRole,
      hasPermission,
      isRole,
      approveUser,
      rejectUser,
      getPendingApprovals,
      getNewUserNotifications,
      markNotificationAsNotified,
      resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
