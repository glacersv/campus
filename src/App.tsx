import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import Login from './components/shared/Login';
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
import RolesManager from './components/admin/RolesManager';
import UsersManager from './components/admin/UsersManager';
import SchoolYearManager from './components/admin/SchoolYearManager';
import CoordinacionesConfig from './components/admin/CoordinacionesConfig';
import ConvivenciaPanel from './components/admin/ConvivenciaPanel';
import AttendanceReportsHistory from './components/admin/AttendanceReportsHistory';
import EstadisticasDashboard from './components/admin/EstadisticasDashboard';
import InstitutionalCalendar from './components/admin/InstitutionalCalendar';
import NotasView from './components/notas/NotasView';
import HorarioView from './components/horario/HorarioView';
import ClaseView from './components/clase/ClaseView';
import EventosView from './components/eventos/EventosView';
import AvisosView from './components/avisos/AvisosView';
import RoleLayout from './components/shared/RoleLayout';
import FloatingStyleWidget from './components/shared/FloatingStyleWidget';
import CoordinacionDashboard from './components/coordinacion/CoordinacionDashboard';
import AcademicaDashboard from './components/coordinacion/AcademicaDashboard';
import ConvivenciaDashboard from './components/coordinacion/ConvivenciaDashboard';
import PrimariaDashboard from './components/coordinacion/PrimariaDashboard';
import ParvulariaDashboard from './components/coordinacion/ParvulariaDashboard';
import RegistroDashboard from './components/registro/RegistroDashboard';
import EnfermeriaDashboard from './components/enfermeria/EnfermeriaDashboard';
import PsicopedagogiaDashboard from './components/psicopedagogico/PsicopedagogicoDashboard';
import TeacherLayout from './components/docente/TeacherLayout';
import TeacherHome from './components/docente/TeacherHome';
import ModulePlaceholder from './components/docente/ModulePlaceholder';
import StudentDashboard from './components/alumno/StudentDashboard';
import AlumnoAulaVirtual from './components/alumno/aula-virtual/AlumnoAulaVirtual';
import AlumnoMisCursos from './components/alumno/aula-virtual/AlumnoMisCursos';
import AlumnoMisActividades from './components/alumno/aula-virtual/AlumnoMisActividades';
import AlumnoMiProgreso from './components/alumno/aula-virtual/AlumnoMiProgreso';
import ProjectsModule from './components/proyectos/ProjectsModule';
import DocenteProyectosCRUD from './components/docente/DocenteProyectosCRUD';
import EvaluacionProyecto from './components/proyectos/EvaluacionProyecto';
import ProyectosAdmin from './components/coordinacion/ProyectosAdmin';
import { SystemModuleId } from './types';
import { seedInitialData, ensureAdminAccount, seedProyectoCultivoBacterias } from './lib/firestore';

// LMS real components
import { StudentLMSDashboard } from './components/lms/LMSModule';
import { LMSCourseList } from './components/lms/LMSCourseList';
import { LMSCourseDetail } from './components/lms/LMSCourseDetail';
import { LMSActivityList } from './components/lms/LMSActivityList';
import { LMSActivityDetail } from './components/lms/LMSActivityDetail';
import { LMSProgress } from './components/lms/LMSProgress';
import { LMSSubmissionForm } from './components/lms/LMSSubmissionForm';
// LMS docente components
import TeacherLMSDashboard from './components/lms/docente/TeacherLMSDashboard';
import ModuleContentEditor from './components/lms/docente/ModuleContentEditor';

import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';

// Icons for role layouts
import { ClipboardCheck, BookOpen, School, Calendar, CalendarDays, Bell, Medal, GraduationCap } from 'lucide-react';

const roleModuleIcons: Record<SystemModuleId, React.ElementType> = {
  formacion: ClipboardCheck,
  notas: BookOpen,
  clase: School,
  horario: Calendar,
  eventos: CalendarDays,
  avisos: Bell,
  proyectos: Medal,
  'semana-juventud': Medal,
  'semana-juventud-admin': Medal,
  lms: GraduationCap,
};

const roleModuleColors: Record<SystemModuleId, string> = {
  formacion: 'bg-primary',
  notas: 'bg-accent',
  clase: 'bg-secondary',
  horario: 'bg-purple-500',
  eventos: 'bg-emerald-500',
  avisos: 'bg-amber-500',
  proyectos: 'bg-orange-500',
  'semana-juventud': 'bg-indigo-500',
  'semana-juventud-admin': 'bg-indigo-500',
  lms: 'bg-indigo-500',
};

function getDefaultModulesForRole(role: string): SystemModuleId[] {
  switch (role) {
    case 'admin':
      return ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'];
    case 'docente':
      return ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'proyectos'];
    case 'alumno':
      return ['formacion', 'notas', 'clase', 'horario', 'eventos', 'avisos', 'semana-juventud', 'lms'];
    default:
      return [];
  }
}

function AppContent() {
  const { firebaseUser, userProfile, loading, signOut, userRole, hasPermission, roleConfig } = useAuth();

  useEffect(() => {
    ensureAdminAccount();
    if (userProfile?.role === 'admin') {
      seedInitialData();
      // Exponer función de seed en consola para el admin
      (window as any).seedProyecto = seedProyectoCultivoBacterias;
    }
  }, [userProfile?.role]);

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

  if (userProfile.status === 'pending' || userProfile.status === 'rejected') {
    return <Login />;
  }

  const getModules = () => {
    const normalizedRole = (userRole || '').toLowerCase();
    if (normalizedRole === 'admin') return getDefaultModulesForRole('admin');
    return roleConfig?.permissions || getDefaultModulesForRole(normalizedRole);
  };

  const withStyleWidget = (content: React.ReactNode) => (
    <>
      {content}
      <FloatingStyleWidget />
    </>
  );

  // Admin view
  const normalizedRoleForView = (userRole || '').toLowerCase();
  if (normalizedRoleForView === 'admin') {
    return withStyleWidget(
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
          <Route path="roles" element={<RolesManager />} />
          <Route path="users" element={<UsersManager />} />
          <Route path="coordinaciones-config" element={<CoordinacionesConfig />} />
          <Route path="convivencia" element={<ConvivenciaPanel />} />
          <Route path="attendance-reports" element={<AttendanceReportsHistory />} />
          <Route path="estadisticas" element={<EstadisticasDashboard />} />
          <Route path="school-year" element={<SchoolYearManager />} />
          <Route path="calendar" element={<InstitutionalCalendar />} />
          <Route path="proyectos" element={<ProjectsModule view="admin" />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  if (normalizedRoleForView === 'coordinacion') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/coordinacion" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <CoordinacionDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/coordinacion" replace />} />
      </Routes>
    );
  }

  // Coordinacion Academica view
  if (normalizedRoleForView === 'coordinacion_academica') {
    const modules = getModules();
    const permissions = roleConfig?.permissions || [];
    return withStyleWidget(
      <Routes>
        <Route path="/coordinacion-academica" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <AcademicaDashboard />
          </RoleLayout>
        } />
        <Route path="/coordinacion-academica/notas" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('notas') ? <NotasView /> : <Navigate to="/coordinacion-academica" replace />}
          </RoleLayout>
        } />
        <Route path="/coordinacion-academica/horario" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('horario') ? <HorarioView /> : <Navigate to="/coordinacion-academica" replace />}
          </RoleLayout>
        } />
        <Route path="/coordinacion-academica/clase" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('clase') ? <ClaseView /> : <Navigate to="/coordinacion-academica" replace />}
          </RoleLayout>
        } />
        <Route path="/coordinacion-academica/semana-juventud-admin" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('semana-juventud-admin') ? (
              <ProyectosAdmin />
            ) : <Navigate to="/coordinacion-academica" replace />}
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/coordinacion-academica" replace />} />
      </Routes>
    );
  }

  // Coordinacion Convivencia view
  if (normalizedRoleForView === 'coordinacion_convivencia') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/coordinacion-convivencia" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <ConvivenciaDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/coordinacion-convivencia" replace />} />
      </Routes>
    );
  }

  // Coordinacion Primaria view
  if (normalizedRoleForView === 'coordinacion_primaria') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/coordinacion-primaria" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <PrimariaDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/coordinacion-primaria" replace />} />
      </Routes>
    );
  }

  // Coordinacion Parvularia view
  if (normalizedRoleForView === 'coordinacion_parvularia') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/coordinacion-parvularia" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <ParvulariaDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/coordinacion-parvularia" replace />} />
      </Routes>
    );
  }

  // Registro academico view
  if (normalizedRoleForView === 'registro_academico') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/registro" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <RegistroDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/registro" replace />} />
      </Routes>
    );
  }

  // Enfermeria view
  if (normalizedRoleForView === 'enfermeria') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/enfermeria" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <EnfermeriaDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/enfermeria" replace />} />
      </Routes>
    );
  }

  // Psicopedagogia view
  if (normalizedRoleForView === 'psicopedagogico') {
    const modules = getModules();
    return withStyleWidget(
      <Routes>
        <Route path="/psicopedagogico" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <PsicopedagogiaDashboard />
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/psicopedagogico" replace />} />
      </Routes>
    );
  }


  // Teacher view (Docente)
  if (userRole === 'docente') {
    const permissions = roleConfig?.permissions || getDefaultModulesForRole('docente');

    return withStyleWidget(
      <Routes>
        <Route path="/docente" element={<TeacherLayout />}>
          <Route index element={<TeacherHome />} />

          <Route path="proyectos" element={
            permissions.includes('proyectos') ? (
              <DocenteProyectosCRUD />
            ) : <Navigate to="/docente" replace />
          } />

          <Route path="evaluar/:proyectoId" element={
            permissions.includes('proyectos') ? (
              <EvaluacionProyectoRoute />
            ) : <Navigate to="/docente" replace />
          } />

          {/* Placeholders for other modules */}
          <Route path="notas" element={permissions.includes('notas') ? <NotasView /> : <Navigate to="/docente" replace />} />
          <Route path="clase" element={permissions.includes('clase') ? <ClaseView /> : <Navigate to="/docente" replace />} />
          <Route path="horario" element={permissions.includes('horario') ? <HorarioView /> : <Navigate to="/docente" replace />} />
          <Route path="eventos" element={permissions.includes('eventos') ? <EventosView /> : <Navigate to="/docente" replace />} />
          <Route path="avisos" element={permissions.includes('avisos') ? <AvisosView /> : <Navigate to="/docente" replace />} />

          {/* LMS Docente */}
          <Route path="lms" element={
            permissions.includes('lms') ? <TeacherLMSDashboard /> : <Navigate to="/docente" replace />
          } />
          <Route path="lms/crear" element={
            permissions.includes('lms') ? <TeacherLMSDashboard /> : <Navigate to="/docente" replace />
          } />
          <Route path="lms/:moduleId/contenido" element={
            permissions.includes('lms') ? <ModuleContentEditor /> : <Navigate to="/docente" replace />
          } />
          <Route path="lms/:moduleId/calendario" element={
            permissions.includes('lms') ? <ModulePlaceholder title="Calendario del Módulo" subtitle="Gestión de fechas y eventos del módulo" /> : <Navigate to="/docente" replace />
          } />
        </Route>
        <Route path="*" element={<Navigate to="/docente" replace />} />
      </Routes>
    );
  }

  // Student view (alumno)
  if (normalizedRoleForView === 'alumno') {
    const modules = getModules();
    const permissions = roleConfig?.permissions || getDefaultModulesForRole('alumno');
    return withStyleWidget(
      <Routes>
        <Route path="/alumno" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            <StudentDashboard studentName={userProfile.displayName} onLogout={signOut} />
          </RoleLayout>
        } />
        <Route path="/alumno/formacion" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('formacion') ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
                <p className="text-sm text-slate-600">Módulo de Formación — Próximamente</p>
              </div>
            ) : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/semana-juventud" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('semana-juventud') ? (
              <ProjectsModule view="alumno" />
            ) : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <AlumnoAulaVirtual /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual/cursos" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSCourseList /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual/cursos/:courseId" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSCourseDetailRoute /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual/actividades" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSActivityList /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual/actividades/:activityId" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSActivityDetailRoute /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual/progreso" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSProgress /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/aula-virtual/entregar/:activityId" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSSubmissionFormRoute /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <AlumnoAulaVirtual /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms/cursos" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSCourseList /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms/cursos/:courseId" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSCourseDetailRoute /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms/actividades" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSActivityList /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms/actividades/:activityId" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSActivityDetailRoute /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms/progreso" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSProgress /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="/alumno/lms/entregar/:activityId" element={
          <RoleLayout modules={modules} moduleIcons={roleModuleIcons} moduleColors={roleModuleColors}>
            {permissions.includes('lms') ? <LMSSubmissionFormRoute /> : <Navigate to="/alumno" replace />}
          </RoleLayout>
        } />
        <Route path="*" element={<Navigate to="/alumno" replace />} />
      </Routes>
    );
  }

  return withStyleWidget(
    <Routes>
      <Route path="/" element={
        <StudentDashboard
          studentName={userProfile.displayName}
          onLogout={signOut}
        />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function EvaluacionProyectoRoute() {
  const { proyectoId } = useParams();
  const navigate = useNavigate();
  if (!proyectoId) return <Navigate to="/docente/proyectos" replace />;
  return <EvaluacionProyecto proyectoId={proyectoId} onBack={() => navigate('/docente/proyectos')} />;
}

function StudentLMSModule() {
  const navigate = useNavigate();
  return (
    <StudentLMSDashboard
      onViewAllCourses={() => navigate('/alumno/aula-virtual/cursos')}
      onNavigateCourse={(courseId) => navigate(`/alumno/aula-virtual/cursos/${courseId}`)}
      onViewProgress={() => navigate('/alumno/aula-virtual/progreso')}
    />
  );
}

function LMSCourseDetailRoute() {
  const { courseId } = useParams<{ courseId: string }>();
  if (!courseId) return <Navigate to="/alumno/aula-virtual/cursos" replace />;
  return <LMSCourseDetail courseId={courseId} />;
}

function LMSActivityDetailRoute() {
  const { activityId } = useParams<{ activityId: string }>();
  if (!activityId) return <Navigate to="/alumno/aula-virtual/actividades" replace />;
  return <LMSActivityDetail activityId={activityId} />;
}

function LMSSubmissionFormRoute() {
  const { activityId } = useParams<{ activityId: string }>();
  if (!activityId) return <Navigate to="/alumno/aula-virtual/actividades" replace />;
  return <LMSSubmissionForm activityId={activityId} />;
}

export default function App() {
  return (
    <ThemeProvider>
      <DarkModeProvider>
        <NotificationsProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </NotificationsProvider>
      </DarkModeProvider>
    </ThemeProvider>
  );
}
