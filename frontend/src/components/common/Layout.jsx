import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const NAV = [
  {
    section: 'Main',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
      { to: '/attendance', label: 'Attendance', icon: '⏱' },
      { to: '/leave', label: 'Leave', icon: '📅' },
    ]
  },
  {
    section: 'Management',
    roles: ['hr_admin', 'manager'],
    items: [
      { to: '/employees', label: 'Employees', icon: '👥', roles: ['hr_admin', 'manager', 'leadership'] },
      { to: '/approvals', label: 'Approvals', icon: '✅', roles: ['manager', 'hr_admin'] },
    ]
  },
  {
    section: 'Analytics',
    roles: ['hr_admin', 'leadership'],
    items: [
      { to: '/reports', label: 'Reports', icon: '📊', roles: ['hr_admin', 'leadership'] },
      { to: '/ai-search', label: 'AI Search', icon: '🤖', roles: ['hr_admin', 'manager', 'leadership'] },
    ]
  }
];

const roleColors = {
  employee: '#10B981',
  manager: '#3B82F6',
  hr_admin: '#8B5CF6',
  leadership: '#F59E0B',
};

export default function Layout() {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col fixed inset-y-0 left-0 border-r border-slate-800 z-50 shadow-lg">
        {/* Sidebar Header/Logo */}
        <div className="px-6 py-5.5 text-xl font-extrabold font-heading tracking-tight flex items-center gap-2 border-b border-slate-850">
          <span className="text-white">HR</span>
          <span className="text-brand-400">MS</span>
          <span className="text-slate-400 font-medium text-sm ml-1 px-1.5 py-0.5 rounded bg-slate-800/80">Pro</span>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {NAV.map(section => {
            const visibleItems = section.items.filter(item =>
              !item.roles || hasRole(...item.roles)
            );
            if (!visibleItems.length) return null;
            return (
              <div key={section.section} className="space-y-1">
                <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  {section.section}
                </div>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'bg-brand-500/10 text-brand-400 font-semibold' 
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                    }`}
                  >
                    <span className="text-base leading-none opacity-80">{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User profile & Logout footer */}
        <div className="p-4 border-t border-slate-850 bg-slate-950/30">
          <div className="flex items-center gap-3 mb-3.5">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm ring-1 ring-white/10"
              style={{ background: roleColors[user?.role] || '#6B7280' }}
            >
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-slate-200 truncate">{user?.email?.split('@')[0]}</div>
              <div className="text-[10px] text-slate-400 capitalize tracking-wide">{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button 
            className="w-full py-2 px-3 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50 border border-slate-700/50 rounded-xl text-xs font-semibold text-slate-300 transition-all duration-250 flex items-center justify-center gap-1.5" 
            onClick={handleLogout}
          >
            🚪 Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="pl-64 flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 px-8 flex justify-between items-center shadow-sm">
          <div className="font-extrabold text-sm text-slate-700 tracking-tight flex items-center gap-1.5">
            🏢 {user?.tenantName || 'HRMS'}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] bg-brand-50 text-brand-700 ring-1 ring-brand-700/10 px-2.5 py-0.5 rounded-full font-semibold capitalize tracking-wide">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="px-8 py-8 flex-1 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}