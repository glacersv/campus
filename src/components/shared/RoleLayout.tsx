import React, { useState, ReactNode } from 'react';
import { LogOut, ChevronRight, Menu, Search, LayoutDashboard, BookOpen, School, ClipboardCheck, CheckCircle2 } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { SystemModuleId, SYSTEM_MODULES, ROLE_LABELS, UserRole } from '../../types';
import InstitutionLogo from './InstitutionLogo';
import ThemeSwitcher from './ThemeSwitcher';
import NotificationCenter from './NotificationCenter';
import QuickStatsSidebar from './QuickStatsSidebar';

interface RoleLayoutProps {
  modules: SystemModuleId[];
  moduleIcons: Record<SystemModuleId, React.ElementType>;
  moduleColors: Record<SystemModuleId, string>;
  children?: ReactNode;
}

export default function RoleLayout({ modules, moduleIcons, moduleColors, children }: RoleLayoutProps) {
  const { userProfile, signOut, userRole } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const roleLabel = userRole ? ROLE_LABELS[userRole] : 'Rol';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F4F8] dark:bg-[#0b1120]">
      {/* Sidebar - Soft Glass rounded container */}
      <aside className={`${collapsed ? 'w-[76px]' : 'w-64'} flex flex-col justify-between shrink-0 border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-all duration-300 z-30 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 shrink-0 dark:border-slate-700/60">
            {!collapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <InstitutionLogo className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 font-display dark:text-slate-100">Campus</h1>
                  <p className="text-[0.625rem] text-slate-500 font-medium truncate">Salesiano San José</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm mx-auto">
                <InstitutionLogo className="w-5 h-5" />
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors dark:hover:bg-slate-700/60"
            >
              {collapsed ? <Menu className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 min-h-0 p-3 space-y-5 overflow-y-auto">
            {/* Overview / Home link */}
            <div>
              {!collapsed && (
                <div className="sidebar-section-title">GENERAL</div>
              )}
              <button
                onClick={() => navigate(`/${userRole}`)}
                className={`sidebar-item ${currentPath === userRole || currentPath === 'dashboard' ? 'active' : ''}`}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Panel Principal</span>}
              </button>
            </div>

            {/* Aula Virtual Section - Solo para alumno con permiso lms */}
            {userRole === 'alumno' && modules.includes('lms') && (
              <div>
                {!collapsed && (
                  <div className="sidebar-section-title">AULA VIRTUAL</div>
                )}
                <div className="space-y-0.5">
                  <button
                    onClick={() => navigate('/alumno/aula-virtual')}
                    className={`sidebar-item ${currentPath === 'aula-virtual' ? 'active' : ''}`}
                    title={collapsed ? 'Mi Aula Virtual' : undefined}
                  >
                    <BookOpen className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Mi Aula Virtual</span>}
                  </button>
                  <button
                    onClick={() => navigate('/alumno/aula-virtual/cursos')}
                    className={`sidebar-item ${currentPath === 'cursos' ? 'active' : ''}`}
                    title={collapsed ? 'Mis Cursos' : undefined}
                  >
                    <School className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Mis Cursos</span>}
                  </button>
                  <button
                    onClick={() => navigate('/alumno/aula-virtual/actividades')}
                    className={`sidebar-item ${currentPath === 'actividades' ? 'active' : ''}`}
                    title={collapsed ? 'Mis Actividades' : undefined}
                  >
                    <ClipboardCheck className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Mis Actividades</span>}
                  </button>
                  <button
                    onClick={() => navigate('/alumno/aula-virtual/progreso')}
                    className={`sidebar-item ${currentPath === 'progreso' ? 'active' : ''}`}
                    title={collapsed ? 'Mi Progreso' : undefined}
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Mi Progreso</span>}
                  </button>
                </div>
              </div>
            )}

            {/* Modules Section */}
            {(() => {
              const visibleModules = modules.filter((moduleId) => {
                if (userRole === 'alumno' && moduleId === 'lms') return false;
                return true;
              });
              if (visibleModules.length === 0) return null;
              return (
                <div>
                  {!collapsed && (
                    <div className="sidebar-section-title">MÓDULOS DE GESTIÓN</div>
                  )}
                  <div className="space-y-0.5">
                    {visibleModules.map((moduleId) => {
                      const mod = SYSTEM_MODULES.find(m => m.id === moduleId);
                      const Icon = moduleIcons[moduleId];
                      const isActive = currentPath === moduleId;
                      return (
                        <button
                          key={moduleId}
                          onClick={() => navigate(`/${userRole}/${moduleId}`)}
                          className={`sidebar-item ${isActive ? 'active' : ''}`}
                          title={collapsed ? mod?.label : undefined}
                        >
                          {Icon && <Icon className="w-5 h-5 shrink-0" />}
                          {!collapsed && <span className="truncate">{mod?.label}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </nav>
        </div>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-slate-100/80 shrink-0 dark:border-slate-700/60">
          {!collapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-900 truncate dark:text-slate-100">{userProfile?.displayName}</p>
              <p className="text-[0.625rem] text-slate-400 truncate">{userProfile?.email}</p>
              <span className="text-[0.625rem] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                {roleLabel}
              </span>
            </div>
          )}
          <button
            onClick={signOut}
            className="sidebar-item w-full text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header - Glass style with Global Search */}
        <header className="h-16 flex items-center justify-between shrink-0 border-b border-slate-800 bg-[#0f172a] px-6 z-20 gap-4 dark:border-slate-700/60 dark:bg-slate-900/80">
          {/* Global Search Bar */}
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar módulos, alumnos, grados..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-800 text-slate-300 focus:bg-slate-700 border border-transparent focus:border-primary/30 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-500 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
            <ThemeSwitcher />
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
               <span className="text-xs font-semibold text-white dark:text-slate-300">San José</span>
            </div>
            <div className="w-px h-5 bg-slate-200 hidden md:block" />
            <span className="text-xs font-bold bg-[#124D37] text-white px-3 py-1 rounded-full font-display">
              {roleLabel}
            </span>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 md:p-10 lg:p-12">
            {children || <Outlet />}
          </div>
          {/* Right Panel Overview */}
          <QuickStatsSidebar />
        </div>
      </main>
    </div>
  );
}
