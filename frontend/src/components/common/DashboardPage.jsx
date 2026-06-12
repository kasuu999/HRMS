import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { attendanceAPI, leaveAPI, workflowAPI, reportAPI } from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#3B5BDB', '#0CA678', '#F59F00', '#F03E3E'];

export default function DashboardPage() {
  const { user, hasRole } = useAuthStore();
  const [todayAtt, setTodayAtt] = useState(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [headcount, setHeadcount] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [attRes, leaveRes] = await Promise.all([
          attendanceAPI.today(),
          leaveAPI.balance(),
        ]);
        setTodayAtt(attRes.data.data);
        setLeaveBalance(leaveRes.data.data);
      } catch {}

      if (hasRole('manager', 'hr_admin')) {
        try {
          const wfRes = await workflowAPI.pending();
          setPendingCount(wfRes.data.data.totalPending);
        } catch {}
      }
      if (hasRole('hr_admin', 'leadership')) {
        try {
          const hcRes = await reportAPI.headcount();
          setHeadcount(hcRes.data.data);
        } catch {}
      }
    };
    load();
  }, []);

  const handlePunch = async () => {
    setPunchLoading(true);
    try {
      const res = await attendanceAPI.punch({});
      setTodayAtt(res.data.data.record);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Punch failed');
    } finally {
      setPunchLoading(false);
    }
  };

  const isPunchedIn = todayAtt?.punchIn && !todayAtt?.punchOut;
  const isPunchedOut = todayAtt?.punchIn && todayAtt?.punchOut;

  const firstName = user?.email?.split('@')[0] || 'there';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {firstName} 👋</h1>
          <p className="page-subtitle">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Top stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {headcount && (
          <div className="stat-card">
            <div className="label">Total Employees</div>
            <div className="value" style={{ color: COLORS[0] }}>{headcount.total}</div>
            <div className="change" style={{ color: '#0CA678' }}>Active headcount</div>
          </div>
        )}
        {pendingCount > 0 && (
          <div className="stat-card">
            <div className="label">Pending Approvals</div>
            <div className="value" style={{ color: COLORS[3] }}>{pendingCount}</div>
            <Link to="/approvals" style={{ fontSize: 12, color: '#3B5BDB' }}>Review now →</Link>
          </div>
        )}
        {leaveBalance.slice(0, 2).map((b, i) => (
          <div className="stat-card" key={b._id}>
            <div className="label">{b.leaveType?.name}</div>
            <div className="value" style={{ color: COLORS[i + 1] }}>{b.balance}</div>
            <div className="change" style={{ color: '#9CA3AF' }}>Days available</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Attendance punch */}
        <div className="card">
          <div className="card-title">Today's Attendance</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '12px 0' }}>
            <button
              className={`punch-btn ${isPunchedIn ? 'punched-in' : ''}`}
              onClick={handlePunch}
              disabled={punchLoading || isPunchedOut}
            >
              {punchLoading ? <span className="spinner" /> : (
                <>
                  <span style={{ fontSize: 28 }}>{isPunchedIn ? '🔴' : isPunchedOut ? '✅' : '⏱'}</span>
                  <span>{isPunchedIn ? 'Punch Out' : isPunchedOut ? 'Done' : 'Punch In'}</span>
                </>
              )}
            </button>
            {todayAtt?.punchIn && (
              <div style={{ textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
                <div>In: <strong style={{ color: '#1A1D2E' }}>{new Date(todayAtt.punchIn).toLocaleTimeString()}</strong></div>
                {todayAtt.punchOut && (
                  <div>Out: <strong style={{ color: '#1A1D2E' }}>{new Date(todayAtt.punchOut).toLocaleTimeString()}</strong></div>
                )}
                {todayAtt.totalHours > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <span className="badge badge-blue">{todayAtt.totalHours}h worked</span>
                  </div>
                )}
              </div>
            )}
            {!todayAtt?.punchIn && (
              <p style={{ fontSize: 13, color: '#9CA3AF' }}>Not punched in yet</p>
            )}
          </div>
        </div>

        {/* Leave balance */}
        <div className="card">
          <div className="card-title">Leave Balances</div>
          {leaveBalance.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <p>No leave data found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {leaveBalance.map(b => (
                <div key={b._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: b.leaveType?.color || '#6B7280' }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{b.leaveType?.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#9CA3AF' }}>{b.taken} used</span>
                    <span className="badge badge-blue">{b.balance} left</span>
                  </div>
                </div>
              ))}
              <Link to="/leave" style={{ marginTop: 8, fontSize: 13, color: '#3B5BDB', fontWeight: 600 }}>
                Apply for leave →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">Quick Actions</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/leave" className="btn btn-secondary">📅 Apply Leave</Link>
          <Link to="/attendance" className="btn btn-secondary">⏱ View Attendance</Link>
          {hasRole('manager', 'hr_admin') && (
            <Link to="/approvals" className="btn btn-secondary">✅ Pending Approvals {pendingCount > 0 && `(${pendingCount})`}</Link>
          )}
          {hasRole('hr_admin') && (
            <Link to="/employees" className="btn btn-secondary">👥 Manage Employees</Link>
          )}
          {hasRole('hr_admin', 'manager') && (
            <Link to="/ai-search" className="btn btn-secondary">🤖 AI Search</Link>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}