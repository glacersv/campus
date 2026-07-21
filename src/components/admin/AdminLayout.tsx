import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  UserCheck,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import InstitutionLogo from '../InstitutionLogo';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'teachers', label: 'Docentes', icon: GraduationCap },
  { id: 'grades', label: 'Grados', icon: Users },
  { id: 'students', label: 'Alumnos', icon: UserCheck },
];

export default function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  const { userProfile, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 flex flex-col justify-between shrink-0 text-white transition-all duration-300`}>
        <div className="flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <InstitutionLogo className="w-10 h-10" />
                <div>
                  <h2 className="text-sm font-bold text-white">Campus</h2>
                  <p className="text-[10px] text-slate-400">Panel de Administración</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeSection === item.id
                    ? 'bg-salesiano-green text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-700">
          {!sidebarCollapsed && (
            <div className="mb-3 px-3">
              <p className="text-xs font-bold text-salesiano-yellow">{userProfile?.displayName || 'Super Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{userProfile?.email}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <h1 className="text-lg font-bold text-slate-800 capitalize">
            {menuItems.find(m => m.id === activeSection)?.label || 'Dashboard'}
          </h1>
          <div className="text-xs text-slate-500">
            Colegio Salesiano San José
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}