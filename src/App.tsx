import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import TeachersManager from './components/admin/TeachersManager';
import GradesManager from './components/admin/GradesManager';
import StudentsManager from './components/admin/StudentsManager';
import Dashboard from './components/Dashboard';
import { Teacher } from './types';
import { getTeacher, seedInitialData } from './lib/firestore';

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'teachers':
        return <TeachersManager />;
      case 'grades':
        return <GradesManager />;
      case 'students':
        return <StudentsManager />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderSection()}
    </AdminLayout>
  );
}

function AppContent() {
  const { firebaseUser, userProfile, loading, signOut } = useAuth();
  const [view, setView] = useState<'admin' | 'teacher'>('admin');
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);

  useEffect(() => {
    seedInitialData();
    if (userProfile?.teacherId) {
      getTeacher(userProfile.teacherId).then(setTeacherData);
    }
  }, [userProfile?.teacherId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-salesiano-green border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Cargando Campus...
          </span>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return <Login />;
  }

  const buildTeacher = (): Teacher => ({
    id: userProfile.teacherId || userProfile.uid,
    name: userProfile.displayName,
    email: userProfile.email,
    gradeId: teacherData?.gradeId || '9a',
    avatarUrl: teacherData?.avatarUrl || ''
  });

  // Admin view
  if (userProfile.role === 'admin' && view === 'admin') {
    return (
      <div>
        <AdminPanel />
        <button
          onClick={() => setView('teacher')}
          className="fixed bottom-4 right-4 px-4 py-2 bg-salesiano-blue text-white rounded-lg shadow-lg hover:bg-blue-700 text-sm font-medium z-50"
        >
          Ver como Docente
        </button>
      </div>
    );
  }

  // Teacher view (or admin viewing as teacher)
  return (
    <div>
      <Dashboard
        teacher={buildTeacher()}
        onLogout={signOut}
      />
      {userProfile.role === 'admin' && (
        <button
          onClick={() => setView('admin')}
          className="fixed bottom-4 right-4 px-4 py-2 bg-salesiano-green text-white rounded-lg shadow-lg hover:bg-salesiano-green-dark text-sm font-medium z-50"
        >
          Volver al Admin
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}