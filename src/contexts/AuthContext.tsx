import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { getUser, createUser, getRole, isEmailPreAuthorized, getStudentByCarnet, createApprovalRequest, createNewUserNotification, updateUser, getTeacherByEmail, getTeacher, createUserForTeacher, createUserForStudent, getStudent, updateApprovalRequest, getAllRoles, getUserByEmail, getUserByStudentId, deleteUser, fixRolesPermissions } from '../lib/firestore';
import { User, UserRole, SystemModuleId, RoleConfig, ApprovalRequest } from '../types';
import { updateRoleLabelsFromFirestore } from '../types';

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  userRole: UserRole | null;
  roleConfig: RoleConfig | null;
  hasPermission: (module: SystemModuleId) => boolean;
  isRole: (...roles: UserRole[]) => boolean;
  approveUser: (uid: string, role: UserRole) => Promise<void>;
  rejectUser: (uid: string, reason?: string) => Promise<void>;
  getPendingApprovals: () => Promise<ApprovalRequest[]>;
  getNewUserNotifications: () => Promise<any[]>;
  markNotificationAsNotified: (notificationId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [roleConfig, setRoleConfig] = useState<RoleConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV BYPASS FOR OFFLINE FRONTEND VISUAL VERIFICATION AND PLAYWRIGHT SCRIPTS
    if (import.meta.env.DEV && typeof window !== 'undefined' && window.location.search.includes('bypass_admin=true')) {
      setFirebaseUser({ uid: 'admin_bypass', email: 'admin@salesianosanjose.edu.sv' } as any);
      setUserProfile({
        uid: 'admin_bypass',
        email: 'admin@salesianosanjose.edu.sv',
        displayName: 'Administrador (Bypass)',
        role: 'admin',
        status: 'approved'
      });
      setRoleConfig({
        id: 'admin',
        name: 'Administrador',
        permissions: ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos']
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        let profile = await getUser(user.uid);
        if (!profile) {
          // SELF-HEALING FLOW
          console.log('[Self-Healing] Inicializando perfil en Firestore para usuario:', user.uid);
          const email = user.email || '';
          let detectedRole: UserRole | null = null;
          let studentId: string | undefined;
          let studentName: string | undefined;
          let gradeId: string | undefined;
          let sectionId: string | undefined;
          let teacherId: string | undefined;
          let teacherName: string | undefined;

          const isSuperAdmin = email === 'admin@salesianosanjose.edu.sv' || email === 'jose.marquez@salesianosanjose.edu.sv';
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
            role: detectedRole,
            status: detectedRole ? 'approved' : 'pending',
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

        setUserProfile(profile);
        if (profile?.role) {
          const rc = await getRole(profile.role);
          setRoleConfig(rc);
          
          const allRoles = await getAllRoles();
          updateRoleLabelsFromFirestore(allRoles);
          
          fixRolesPermissions().catch(console.error);
        } else {
          setRoleConfig(null);
        }
      } else {
        setUserProfile(null);
        setRoleConfig(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    if (email === 'admin@salesianosanjose.edu.sv' || email === 'jose.marquez@salesianosanjose.edu.sv') return;
    
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
    if (!email.endsWith('@salesianosanjose.edu.sv')) {
      throw new Error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
    }

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

    let detectedRole: UserRole | null = null;
    let studentId: string | undefined;
    let studentName: string | undefined;
    let gradeId: string | undefined;
    let sectionId: string | undefined;
    let teacherId: string | undefined;
    let teacherName: string | undefined;

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
    let existingApprovedUser: User | null = null;
    if (studentId) {
      existingApprovedUser = await getUserByStudentId(studentId);
    }
    if (existingApprovedUser?.status === 'approved' && existingApprovedUser?.role) {
      userData.role = existingApprovedUser.role;
      userData.status = 'approved';
      userData.requestedRole = undefined;
      userData.studentId = studentId;
      await deleteUser(existingApprovedUser.uid).catch(() => {});
    }
    await createUser(userData);

    if (userData.status !== 'approved') {
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

    const updatePayload: any = {
      role,
      status: 'approved',
      updatedAt: new Date() as any,
    };
    if (user.requestedRole) {
      updatePayload.requestedRole = undefined;
    }
    await updateUser(uid, updatePayload);

    const { updateApprovalRequestByUserId } = await import('../lib/firestore');
    await updateApprovalRequestByUserId(uid, {
      status: 'approved',
      reviewedBy: 'admin',
      reviewedAt: new Date() as any,
    });

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

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      loading,
      signIn,
      signUp,
      signOut,
      userRole,
      roleConfig,
      hasPermission,
      isRole,
      approveUser,
      rejectUser,
      getPendingApprovals,
      getNewUserNotifications,
      markNotificationAsNotified,
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