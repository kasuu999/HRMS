import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { notificationAPI } from '../../utils/api';
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

// ── Notification type icon + colors ──
const notifStyle = {
  info:    { icon: 'ℹ️', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700' },
  success: { icon: '✅', bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700' },
  warning: { icon: '⚠️', bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700' },
  error:   { icon: '❌', bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700' },
};

// ── Time-ago helper ──
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Layout() {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();

  // Responsive state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);


  // ── Notification state ──
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.list({ limit: 20 });
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Silently fail – don't block UI
    }
  }, []);

  // Poll every 30s + initial load
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {}
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay /* Responsive Change */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-slate-100 flex flex-col fixed inset-y-0 left-0 border-r border-slate-800 z-50 shadow-lg transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Sidebar Header/Logo */}
        <div className="px-6 py-5.5 text-xl font-extrabold font-heading tracking-tight flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-2">
            <span className="text-white">HR</span>
            <span className="text-brand-400">MS</span>
            <span className="text-slate-400 font-medium text-sm ml-1 px-1.5 py-0.5 rounded bg-slate-800/80">Pro</span>
          </div>
          {/* Close Sidebar Button for Mobile /* Responsive Change */}
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            ✕
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {NAV.map(section => {
            // Section-level role check
            if (section.roles && !hasRole(...section.roles)) return null;
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
                    onClick={() => setIsSidebarOpen(false)} /* Responsive Change: Close sidebar on mobile nav click */
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
      {/* Responsive Change: pl-0 on mobile, lg:pl-64 on desktop */}
      <div className="pl-0 lg:pl-64 flex-1 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Header */}
        <header className="h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-4 lg:px-8 flex justify-between items-center shadow-sm w-full">
          <div className="flex items-center gap-3 lg:gap-1.5">
            {/* Hamburger Menu for Mobile /* Responsive Change */}
            <button 
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="font-extrabold text-sm text-slate-700 tracking-tight hidden sm:flex items-center gap-1.5">
              🏢 {user?.tenantName || 'HRMS'}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* ── Notification Bell ── */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="notification-bell"
                onClick={() => { setShowNotif(prev => !prev); if (!showNotif) fetchNotifications(); }}
                className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors group"
                title="Notifications"
              >
                <svg className="w-5 h-5 text-slate-500 group-hover:text-slate-700 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 ring-2 ring-white animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* ── Dropdown ── */}
              {showNotif && (
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden z-[100] origin-top-right transform transition-all"
                     style={{ maxHeight: '480px', right: '-1rem', '@media (min-width: 640px)': { right: 0 } }}>
                  {/* Header */}
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                      {unreadCount > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{unreadCount} unread</p>}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto" style={{ maxHeight: '380px' }}>
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center">
                        <div className="text-3xl mb-2">🔔</div>
                        <p className="text-sm text-slate-400">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const style = notifStyle[n.type] || notifStyle.info;
                        return (
                          <div
                            key={n._id}
                            onClick={() => !n.isRead && handleMarkRead(n._id)}
                            className={`px-5 py-3.5 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50/80 ${
                              !n.isRead ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${style.bg} ${style.border} border flex items-center justify-center text-sm`}>
                                {style.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className={`text-xs font-semibold ${!n.isRead ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {n.title}
                                  </p>
                                  {!n.isRead && (
                                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1" />
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  {timeAgo(n.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className="text-[11px] bg-brand-50 text-brand-700 ring-1 ring-brand-700/10 px-2.5 py-0.5 rounded-full font-semibold capitalize tracking-wide">
              {user?.role?.replace('_', ' ')}
            </span>
          </div>
        </header>

        {/* Page Body */}
        {/* Responsive Change: reduce padding on mobile */}
        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8 flex-1 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}