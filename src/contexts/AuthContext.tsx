import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { getUser, createUser, getRole, isEmailPreAuthorized, getStudentByCarnet, createApprovalRequest, createNewUserNotification, updateUser, getTeacherByEmail, getTeacher, createUserForTeacher, createUserForStudent, getStudent, updateApprovalRequest } from '../lib/firestore';
import { User, UserRole, SystemModuleId, RoleConfig, ApprovalRequest } from '../types';

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        const profile = await getUser(user.uid);
        setUserProfile(profile);
        if (profile?.role) {
          const rc = await getRole(profile.role);
          setRoleConfig(rc);
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

  const signUp = async (email: string, password: string, displayName: string, role: UserRole = 'docente') => {
    // Restrict registration to institutional email domain
    if (!email.endsWith('@salesianosanjose.edu.sv')) {
      throw new Error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
    }

    // Check pre-authorization against teacher, student or admin emails
    const preAuthorized = await isEmailPreAuthorized(email);
    if (!preAuthorized) {
      throw new Error('Este correo institucional no está pre-autorizado por la administración. Por favor, solicita a tu coordinador que registre tu correo antes de crear tu cuenta.');
    }

    // Import on-the-fly dynamically to avoid circular dependencies
    const { getTeacherByEmail } = await import('../lib/firestore');

    // Detect if they are a super-admin override
    const superAdmin = 'jose.marquez@salesianosanjose.edu.sv';
    const isSuperAdmin = email.toLowerCase() === superAdmin.toLowerCase();

    // Detect if they are a pre-registered Student (auto-approve)
    const carnet = email.split('@')[0];
    const student = await getStudentByCarnet(carnet);

    let detectedRole: UserRole | null = null;
    let teacherId: string | undefined = undefined;
    let studentId: string | undefined = undefined;
    let userStatus: 'pending' | 'approved' = 'pending';
    let approvalRequest: Omit<ApprovalRequest, 'createdAt'> | null = null;

    if (isSuperAdmin) {
      detectedRole = 'admin';
      userStatus = 'approved';
    } else if (student) {
      // AUTO-APPROVE: alumno existe en el sistema
      detectedRole = 'alumno';
      studentId = student.id;
      userStatus = 'approved';
    } else {
      // Check if they are a pre-registered Teacher
      const teacher = await getTeacherByEmail(email);
      if (teacher) {
        detectedRole = 'docente';
        teacherId = teacher.id;
        userStatus = 'pending'; // Docentes necesitan aprobación manual
        approvalRequest = {
          id: `temp_${Date.now()}`,
          userId: `temp_${Date.now()}`,
          email,
          displayName,
          requestedRole: 'docente',
          teacherId: teacher.id,
          teacherName: teacher.name,
          status: 'pending',
        };
      } else {
        // No pre-registered profile found
        throw new Error('No se encontró un perfil pre-registrado para este correo. Solicita a la administración que registre tu perfil primero.');
      }
    }

    // First create the user with Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const uid = result.user.uid;

    // Create the user profile
    const userData: Omit<User, 'createdAt' | 'updatedAt'> = {
      uid,
      email,
      displayName,
      role: detectedRole,
      status: userStatus,
      teacherId,
      studentId,
      requestedRole: detectedRole || undefined,
    };
    await createUser(userData);

    // If pending, create approval request for admin notification
    if (approvalRequest && userStatus === 'pending') {
      await createApprovalRequest({
        ...approvalRequest,
      });
    }

    // If auto-approved (student), create notification for admin
    if (userStatus === 'approved' && student) {
      await createNewUserNotification({
        id: `notif_${Date.now()}_${uid}`,
        userId: uid,
        email,
        displayName,
        role: 'alumno',
        studentId: student.id,
        studentName: student.name,
        gradeName: student.gradeId,
        sectionName: student.sectionId,
        password,
        status: 'new',
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
    await updateUser(uid, {
      role,
      status: 'approved',
      requestedRole: undefined,
      updatedAt: new Date() as any,
    });

    // Actualizar solicitud de aprobación
    const { updateApprovalRequest } = await import('../lib/firestore');
    await updateApprovalRequest(uid, {
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