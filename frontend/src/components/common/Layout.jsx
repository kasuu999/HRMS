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
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          HR<span>MS</span> Pro
        </div>

        <nav className="sidebar-nav">
          {NAV.map(section => {
            const visibleItems = section.items.filter(item =>
              !item.roles || hasRole(...item.roles)
            );
            if (!visibleItems.length) return null;
            return (
              <div key={section.section}>
                <div className="nav-section-label">{section.section}</div>
                {visibleItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div
              className="avatar avatar-sm"
              style={{ background: roleColors[user?.role] || '#6B7280', color: '#fff' }}
            >
              {user?.email?.[0]?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#E5E7EB' }}>{user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: 11, color: '#6B7280', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</div>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: '#9CA3AF' }} onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="header">
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-secondary)' }}>
            {user?.tenantName || 'HRMS'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 20, fontWeight: 600, textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </header>
        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}