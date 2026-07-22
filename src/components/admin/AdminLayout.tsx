import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  BookMarked,
  Monitor,
  GraduationCap,
  UserCheck,
  Award,
  Building2,
  GitBranch,
  LogOut,
  ChevronDown,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import InstitutionLogo from '../InstitutionLogo';
import ThemeSwitcher from '../ThemeSwitcher';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  children?: { id: string; label: string }[];
}

const menuSections = [
  {
    title: '',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'GESTIÓN ACADÉMICA',
    items: [
      { id: 'grades', label: 'Grados', icon: BookOpen },
      { id: 'sections', label: 'Secciones', icon: Layers },
      { id: 'grade-section-assignment', label: 'Asignar Edificios', icon: GitBranch },
      { id: 'subjects', label: 'Materias', icon: BookMarked },
      { id: 'buildings', label: 'Edificios', icon: Building2 },
      { id: 'computer-labs', label: 'Laboratorios', icon: Monitor }
    ]
  },
  {
    title: 'BACHILLERATO',
    items: [
      { id: 'baccalaureate-types', label: 'Tipos de Bachillerato', icon: Award }
    ]
  },
  {
    title: 'PERSONAL',
    items: [
      { id: 'teachers', label: 'Docentes', icon: GraduationCap }
    ]
  },
  {
    title: 'ALUMNOS',
    items: [
      { id: 'students', label: 'Alumnos', icon: UserCheck }
    ]
  }
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  return (
    <div className="flex h-screen bg-[#F9FAFB] overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 transition-all duration-300`}>
        <div className="flex flex-col">
          {/* Logo */}
          <div className={`h-16 px-4 flex items-center justify-between ${sidebarCollapsed ? 'border-b border-gray-100' : 'bg-gradient-to-r from-primary to-primary-dark'}`}>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <InstitutionLogo className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">Campus</h1>
                  <p className="text-[10px] text-white/70 font-medium">Salesiano San José</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg transition-colors ${sidebarCollapsed ? 'hover:bg-gray-100' : 'hover:bg-white/20'}`}
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-white/80" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 space-y-6 overflow-y-auto">
            {menuSections.map((section, idx) => (
              <div key={idx}>
                {section.title && !sidebarCollapsed && (
                  <p className="sidebar-section-title">
                    {section.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/admin/${item.id === 'dashboard' ? '' : item.id}`)}
                      className={`sidebar-item w-full ${currentPath === item.id || (currentPath === 'admin' && item.id === 'dashboard') ? 'active' : ''}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User */}
        <div className="p-3 border-t border-gray-100">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-gray-900 truncate">{userProfile?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{userProfile?.email}</p>
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

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 bg-white border-b border-gray-200 px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-gray-900">
              {menuSections.flatMap(s => s.items).find(i => i.id === currentPath || (currentPath === 'admin' && i.id === 'dashboard'))?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <div className="w-px h-5 bg-gray-200" />
            <span className="text-xs text-gray-400">Colegio Salesiano San José</span>
            <div className="w-px h-5 bg-gray-200" />
            <span className="text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-md">Admin</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}
