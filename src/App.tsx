import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
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
import Dashboard from './components/Dashboard';
import { Teacher } from './types';
import { getTeacher, seedInitialData } from './lib/firestore';

import { Routes, Route, Navigate } from 'react-router-dom';

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
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="grades" element={<GradesManager />} />
          <Route path="sections" element={<SectionsManager />} />
          <Route path="subjects" element={<SubjectsManager />} />
          <Route path="computer-labs" element={<ComputerLabsManager />} />
          <Route path="baccalaureate-types" element={<BaccalaureateTypesManager />} />
          <Route path="buildings" element={<BuildingsManager />} />
          <Route path="grade-section-assignment" element={<GradeSectionAssignment />} />
          <Route path="teachers" element={<TeachersManager />} />
          <Route path="students" element={<StudentsManager />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // Teacher view
  return (
    <Routes>
      <Route path="/" element={
        <TeacherDashboard
          teacherName={userProfile.displayName}
          onLogout={signOut}
        />
      } />
      <Route path="/attendance" element={
        teacherData ? (
          <Dashboard teacher={teacherData} onLogout={signOut} />
        ) : (
          <div className="min-h-screen flex justify-center items-center">Cargando datos del docente...</div>
        )
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
