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
  Shield,
  LogOut,
  ChevronRight,
  Menu,
  Users,
  Settings,
  Handshake,
  Calendar,
  FileText,
  BarChart3,
  Search
} from 'lucide-react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import InstitutionLogo from '../shared/InstitutionLogo';
import ThemeSwitcher from '../shared/ThemeSwitcher';
import NotificationCenter from '../shared/NotificationCenter';
import QuickStatsSidebar from '../shared/QuickStatsSidebar';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { userProfile, signOut, userRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname.split('/').pop() || 'dashboard';

  const fullMenuSections: MenuSection[] = [
    { title: '', items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { title: 'ACADÉMICA', items: [
      { id: 'grades', label: 'Grados', icon: BookOpen },
      { id: 'sections', label: 'Secciones', icon: Layers },
      { id: 'grade-section-assignment', label: 'Asignar Edificios', icon: GitBranch },
      { id: 'subjects', label: 'Materias', icon: BookMarked },
    ]},
    { title: 'CONVIVENCIA', items: [
      { id: 'convivencia', label: 'Panel Convivencia', icon: Handshake },
    ]},
    { title: 'INFRAESTRUCTURA', items: [
      { id: 'buildings', label: 'Edificios', icon: Building2 },
      { id: 'computer-labs', label: 'Laboratorios', icon: Monitor },
    ]},
    { title: 'PERSONAL', items: [
      { id: 'teachers', label: 'Docentes', icon: GraduationCap },
    ]},
    { title: 'ALUMNOS', items: [
      { id: 'students', label: 'Alumnos', icon: UserCheck },
    ]},
    { title: 'SEGURIDAD', items: [
      { id: 'users', label: 'Usuarios', icon: Users },
      { id: 'roles', label: 'Roles y Permisos', icon: Shield },
    ]},
    { title: 'SISTEMA', items: [
      { id: 'school-year', label: 'Iniciar Año', icon: Calendar },
      { id: 'baccalaureate-types', label: 'Tipos de Bachillerato', icon: Award },
      { id: 'coordinaciones-config', label: 'Config. Coordinaciones', icon: Settings },
      { id: 'attendance-reports', label: 'Historial de Reportes', icon: FileText },
      { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
    ]},
  ];

  const menuSections = userRole === 'admin'
    ? fullMenuSections
    : fullMenuSections
        .map(s => ({
          ...s,
          items: s.items.filter(item => item.id === 'dashboard' || item.id === 'roles')
        }))
        .filter(s => s.items.length > 0);

  const flatItems = menuSections.flatMap(s => s.items);

  return (
    <div className="flex h-screen bg-[#F3F5F6] overflow-y-auto">
      {/* Sidebar - Glass premium */}
      <aside className={`${sidebarCollapsed ? 'w-[72px]' : 'w-64'} bg-white/70 backdrop-blur-xl border-r border-slate-200/80 flex flex-col justify-between shrink-0 transition-all duration-300 z-30`}>
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100/80 shrink-0">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                  <InstitutionLogo className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-900 font-display">Campus</h1>
                  <p className="text-[10px] text-slate-500 font-medium">Salesiano San José</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-slate-100/80 transition-colors"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
          </div>

          <nav className="flex-1 min-h-0 p-3 overflow-y-auto">
            {menuSections.map((section, idx) => (
              <div key={idx} className="mb-6">
                {section.title && !sidebarCollapsed && (
                  <div className="sidebar-section-title">{section.title}</div>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive = currentPath === item.id || (currentPath === 'admin' && item.id === 'dashboard');
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(`/admin/${item.id === 'dashboard' ? '' : item.id}`)}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="p-3 border-t border-slate-100/80 shrink-0">
          {!sidebarCollapsed && (
            <div className="px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-slate-900 truncate">{userProfile?.displayName || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
              <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full mt-1 inline-block capitalize">
                {userRole}
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

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white/60 backdrop-blur-xl border-b border-slate-200/80 px-4 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1">
            {/* Global Search - Glass style */}
            <div className="relative max-w-md flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar módulos, alumnos, docentes..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white/60 backdrop-blur-sm border border-slate-200/80 rounded-xl focus:outline-none focus:border-primary focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <ThemeSwitcher />
            <div className="w-px h-5 bg-slate-200 hidden md:block" />
            <span className="text-xs text-slate-400 hidden md:inline">Colegio Salesiano San José</span>
            <div className="w-px h-5 bg-slate-200 hidden md:block" />
            <span className="text-xs font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full capitalize">{userRole}</span>
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
