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
  Search,
  Lock
} from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InstitutionLogo from '../shared/InstitutionLogo';
import ThemeSwitcher from '../shared/ThemeSwitcher';
import NotificationCenter from '../shared/NotificationCenter';
import QuickStatsSidebar from '../shared/QuickStatsSidebar';

interface TeacherLayoutProps {
  children?: React.ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { userProfile, signOut, roleConfig } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const pathParts = location.pathname.split('/');
  const currentPath = pathParts[2] || 'dashboard';
  const permissions = roleConfig?.permissions || [];

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden">
      {/* Sidebar - Soft Glass rounded container */}
      <aside className={`${sidebarCollapsed ? 'w-[76px]' : 'w-64'} bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 shadow-sm`}>
        <div className="flex flex-col flex-1 min-h-0">
          {/* Logo Section */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 shrink-0">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm shrink-0">
                  <InstitutionLogo className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 font-display">Campus</h1>
                  <p className="text-[10px] text-slate-500 font-medium truncate">Salesiano San José</p>
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm mx-auto">
                <InstitutionLogo className="w-5 h-5" />
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 min-h-0 p-3 space-y-5 overflow-y-auto">
            <div>
              {!sidebarCollapsed && (
                <div className="sidebar-section-title">GENERAL</div>
              )}
              <div className="space-y-0.5">
                <button
                  onClick={() => navigate('/docente')}
                  className={`sidebar-item ${currentPath === 'dashboard' ? 'active' : ''}`}
                >
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  {!sidebarCollapsed && <span>Inicio</span>}
                </button>
              </div>
            </div>

            <div>
              {!sidebarCollapsed && permissions.length > 0 && (
                <div className="sidebar-section-title">MÓDULOS HABILITADOS</div>
              )}
              <div className="space-y-0.5">
                {permissions.includes('formacion') && (
                  <button
                    onClick={() => navigate('/docente/formacion')}
                    className={`sidebar-item ${currentPath === 'formacion' ? 'active' : ''}`}
                  >
                    <ClipboardCheck className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span className="truncate">Formación Buenos Días</span>}
                  </button>
                )}

                {permissions.includes('notas') && (
                  <button
                    onClick={() => navigate('/docente/notas')}
                    className={`sidebar-item ${currentPath === 'notas' ? 'active' : ''}`}
                  >
                    <BookOpen className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Notas</span>}
                  </button>
                )}

                {permissions.includes('proyectos') && (
                  <button
                    onClick={() => navigate('/docente/proyectos')}
                    className={`sidebar-item ${currentPath === 'proyectos' ? 'active' : ''}`}
                  >
                    <Medal className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && <span>Semana Juventud</span>}
                  </button>
                )}
              </div>
            </div>
          </nav>
        </div>

        {/* User Info Section */}
        <div className="p-3 border-t border-slate-100/80 shrink-0">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-900 truncate">{userProfile?.displayName || 'Docente'}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full mt-1 inline-block">
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
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 flex items-center justify-between shrink-0 z-20 gap-4">
          <div className="flex-1 max-w-lg relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar alumnos, grados, módulos..."
              className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-slate-100/70 focus:bg-white border border-transparent focus:border-primary/30 rounded-full focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-px h-5 bg-slate-200" />
            <ThemeSwitcher />
            <div className="w-px h-5 bg-slate-200 hidden sm:block" />
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full font-display">
              Docente
            </span>
          </div>
        </header>

        <div className="flex-1 flex min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-8 md:p-10 lg:p-12">
            {children || <Outlet />}
          </div>
          <QuickStatsSidebar />
        </div>
      </main>
    </div>
  );
}
