import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import TeachersManager from './components/admin/TeachersManager';
import GradesManager from './components/admin/GradesManager';
import SectionsManager from './components/admin/SectionsManager';
import SubjectsManager from './components/admin/SubjectsManager';
import ComputerLabsManager from './components/admin/ComputerLabsManager';
import StudentsManager from './components/admin/StudentsManager';
import BaccalaureateTypesManager from './components/admin/BaccalaureateTypesManager';
import BuildingsManager from './components/admin/BuildingsManager';
import GradeSectionAssignment from './components/admin/GradeSectionAssignment';
import TeacherDashboard from './components/TeacherDashboard';
import { Teacher } from './types';
import { getTeacher, seedInitialData } from './lib/firestore';

function AdminPanel() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderSection = () => {
    switch (activeSection) {
      case 'grades': return <GradesManager />;
      case 'sections': return <SectionsManager />;
      case 'subjects': return <SubjectsManager />;
      case 'computer-labs': return <ComputerLabsManager />;
      case 'baccalaureate-types': return <BaccalaureateTypesManager />;
      case 'buildings': return <BuildingsManager />;
      case 'grade-section-assignment': return <GradeSectionAssignment />;
      case 'teachers': return <TeachersManager />;
      case 'students': return <StudentsManager />;
      default: return <AdminDashboard />;
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
  const [teacherData, setTeacherData] = useState<Teacher | null>(null);

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      seedInitialData();
    }
    if (userProfile?.teacherId) {
      getTeacher(userProfile.teacherId).then(setTeacherData);
    }
  }, [userProfile?.teacherId, userProfile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cargando Campus...</span>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return <Login />;
  }

  // Admin view
  if (userProfile.role === 'admin') {
    return <AdminPanel />;
  }

  // Teacher view
  return (
    <TeacherDashboard
      teacherName={userProfile.displayName}
      onLogout={signOut}
      onModuleClick={(id) => console.log('Module clicked:', id)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
