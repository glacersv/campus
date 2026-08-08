import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../firebase';
import { getUser, createUser, getRole, isEmailPreAuthorized } from '../lib/firestore';
import { User, UserRole, SystemModuleId, RoleConfig } from '../types';

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
  };

  const signUp = async (email: string, password: string, displayName: string, role: UserRole = 'docente') => {
    // Restrict registration to institutional email domain
    if (!email.endsWith('@salesianosanjose.edu.sv')) {
      throw new Error('Solo se permiten correos institucionales (@salesianosanjose.edu.sv)');
    }

    // Check pre-authorization against teacher or admin emails
    const preAuthorized = await isEmailPreAuthorized(email);
    if (!preAuthorized) {
      throw new Error('Este correo institucional no está pre-autorizado por la administración. Por favor, solicita a tu coordinador que registre tu correo en el panel de Docentes antes de crear tu cuenta.');
    }

    // First create the user with Firebase Auth
    const result = await createUserWithEmailAndPassword(auth, email, password);

    // Then create the user profile in Firestore with the default role
    // The role will be validated by Cloud Function if needed
    await createUser({
      uid: result.user.uid,
      email,
      displayName,
      role: 'docente' // Always default to docente for security
    });

    // If an admin is creating a user with a different role, they should use assignUserRole Cloud Function
    // For self-registration, we always use 'docente' as default
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
      isRole
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