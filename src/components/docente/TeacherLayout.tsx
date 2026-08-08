import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  School,
  Calendar,
  CalendarDays,
  Bell,
  Medal,
  LogOut,
  ChevronRight,
  Menu,
  Lock
} from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InstitutionLogo from '../shared/InstitutionLogo';
import ThemeSwitcher from '../shared/ThemeSwitcher';

interface TeacherLayoutProps {
  children?: React.ReactNode;
}

const moduleIcons: Record<string, React.ElementType> = {
  formacion: ClipboardCheck,
  notas: BookOpen,
  clase: School,
  horario: Calendar,
  eventos: CalendarDays,
  avisos: Bell,
  proyectos: Medal,
};

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { userProfile, signOut, roleConfig } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Get active path
  const pathParts = location.pathname.split('/');
  const currentPath = pathParts[2] || 'dashboard';

  // Allowed modules based on roleConfig
  const permissions = roleConfig?.permissions || [];

  return (
    <div className="flex h-screen bg-[#F3F5F6] overflow-y-auto">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-white/90 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 z-30`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Section */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 shrink-0">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <InstitutionLogo className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 font-display">Campus</h1>
                  <p className="text-[10px] text-secondary font-medium">Salesiano San José</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-secondary" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 min-h-0 p-3 overflow-y-auto">
            <div className="mb-6">
              {!sidebarCollapsed && (
                <div className="sidebar-section-title">PRINCIPAL</div>
              )}
              <div className="space-y-0.5">
                <button
                  onClick={() => navigate('/docente')}
                  className={`sidebar-item ${currentPath === 'dashboard' ? 'active' : ''}`}
                  title={sidebarCollapsed ? 'Inicio' : undefined}
                >
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>Inicio</span>}
                </button>
              </div>
            </div>

            <div className="mb-6">
              {!sidebarCollapsed && permissions.length > 0 && (
                <div className="sidebar-section-title">MÓDULOS HABILITADOS</div>
              )}
              <div className="space-y-0.5">
                {permissions.includes('formacion') && (
                  <button
                    onClick={() => navigate('/docente/formacion')}
                    className={`sidebar-item ${currentPath === 'formacion' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Formación Buenos Días' : undefined}
                  >
                    <ClipboardCheck className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Formación Buenos Días</span>}
                  </button>
                )}

                {permissions.includes('notas') && (
                  <button
                    onClick={() => navigate('/docente/notas')}
                    className={`sidebar-item ${currentPath === 'notas' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Notas' : undefined}
                  >
                    <BookOpen className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Notas</span>}
                  </button>
                )}

                {permissions.includes('clase') && (
                  <button
                    onClick={() => navigate('/docente/clase')}
                    className={`sidebar-item ${currentPath === 'clase' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Clase' : undefined}
                  >
                    <School className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Clase</span>}
                  </button>
                )}

                {permissions.includes('horario') && (
                  <button
                    onClick={() => navigate('/docente/horario')}
                    className={`sidebar-item ${currentPath === 'horario' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Horario' : undefined}
                  >
                    <Calendar className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Horario</span>}
                  </button>
                )}

                {permissions.includes('eventos') && (
                  <button
                    onClick={() => navigate('/docente/eventos')}
                    className={`sidebar-item ${currentPath === 'eventos' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Eventos' : undefined}
                  >
                    <CalendarDays className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Eventos</span>}
                  </button>
                )}

                {permissions.includes('avisos') && (
                  <button
                    onClick={() => navigate('/docente/avisos')}
                    className={`sidebar-item ${currentPath === 'avisos' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Avisos' : undefined}
                  >
                    <Bell className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Avisos</span>}
                  </button>
                )}

                {permissions.includes('proyectos') && (
                  <button
                    onClick={() => navigate('/docente/proyectos')}
                    className={`sidebar-item ${currentPath === 'proyectos' ? 'active' : ''}`}
                    title={sidebarCollapsed ? 'Semana de la Juventud' : undefined}
                  >
                    <Medal className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Semana de la Juventud</span>}
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* User Info / Profile Section */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-900 truncate">{userProfile?.displayName || 'Docente'}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                Docente
              </span>
            </div>
          )}
          <button
            onClick={signOut}
            className="sidebar-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-slate-900 font-display uppercase tracking-wider">
              {currentPath === 'dashboard' ? 'Inicio' :
               currentPath === 'formacion' ? 'Formación Buenos Días' :
               currentPath === 'notas' ? 'Notas' :
               currentPath === 'clase' ? 'Clase' :
               currentPath === 'horario' ? 'Horario' :
               currentPath === 'eventos' ? 'Eventos' :
               currentPath === 'avisos' ? 'Avisos' :
               currentPath === 'proyectos' ? 'Semana de la Juventud' : 'Campus Docente'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div className="w-px h-5 bg-slate-200" />
            <span className="text-xs text-slate-400 hidden md:inline">Colegio Salesiano San José</span>
            <div className="w-px h-5 bg-slate-200 hidden md:block" />
            <span className="text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full uppercase">Docente</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
