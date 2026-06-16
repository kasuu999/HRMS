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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Good {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {headcount && (
          <div className="bg-white p-5 rounded-2xl border border-slate-205/65 shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Employees</span>
            <span className="text-3xl font-extrabold mt-1 font-heading text-brand-600">{headcount.total}</span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-2 flex items-center gap-1">
              🟢 Active headcount
            </span>
          </div>
        )}
        {pendingCount > 0 && (
          <div className="bg-white p-5 rounded-2xl border border-slate-205/65 shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</span>
            <span className="text-3xl font-extrabold mt-1 font-heading text-rose-600">{pendingCount}</span>
            <Link to="/approvals" className="text-[11px] text-brand-600 hover:text-brand-800 font-semibold mt-2 transition-colors">
              Review requests now →
            </Link>
          </div>
        )}
        {leaveBalance.slice(0, 2).map((b, i) => (
          <div className="bg-white p-5 rounded-2xl border border-slate-205/65 shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col" key={b._id}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{b.leaveType?.name}</span>
            <span className="text-3xl font-extrabold mt-1 font-heading" style={{ color: COLORS[i + 1] }}>{b.balance}</span>
            <span className="text-[11px] text-slate-500 font-medium mt-2">Days available</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Punch Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3">
            Today's Attendance
          </h2>
          <div className="flex flex-col items-center gap-4 py-8">
            <button
              className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center gap-1.5 font-extrabold transition-all duration-300 transform active:scale-95 hover:scale-105 disabled:opacity-50 ${
                isPunchedIn 
                  ? 'border-rose-100 bg-rose-50 text-rose-600 shadow-md hover:shadow-rose-200/50' 
                  : isPunchedOut 
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-md' 
                    : 'border-brand-100 bg-white text-brand-600 shadow-md hover:shadow-brand-150/40 hover:bg-brand-50/10'
              }`}
              onClick={handlePunch}
              disabled={punchLoading || isPunchedOut}
            >
              {punchLoading ? <span className="spinner" /> : (
                <>
                  <span className="text-3xl">{isPunchedIn ? '🔴' : isPunchedOut ? '✅' : '⏱'}</span>
                  <span className="text-xs uppercase tracking-wider font-bold">{isPunchedIn ? 'Punch Out' : isPunchedOut ? 'Done' : 'Punch In'}</span>
                </>
              )}
            </button>
            
            {todayAtt?.punchIn && (
              <div className="text-center text-xs text-slate-500 space-y-1 mt-2">
                <div>Punch In: <strong className="text-slate-800 font-semibold">{new Date(todayAtt.punchIn).toLocaleTimeString()}</strong></div>
                {todayAtt.punchOut && (
                  <div>Punch Out: <strong className="text-slate-800 font-semibold">{new Date(todayAtt.punchOut).toLocaleTimeString()}</strong></div>
                )}
                {todayAtt.totalHours > 0 && (
                  <div className="pt-2">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      {todayAtt.totalHours}h worked
                    </span>
                  </div>
                )}
              </div>
            )}
            {!todayAtt?.punchIn && (
              <p className="text-xs text-slate-400 font-medium mt-2">Not punched in yet today</p>
            )}
          </div>
        </div>

        {/* Leave Balances Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3">
              Leave Balances
            </h2>
            {leaveBalance.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-slate-400 font-medium">No leave data found</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {leaveBalance.map(b => (
                  <div key={b._id} className="flex justify-between items-center py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: b.leaveType?.color || '#6B7280' }} />
                      <span className="text-sm font-semibold text-slate-700">{b.leaveType?.name}</span>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-xs text-slate-400 font-medium">{b.taken} used</span>
                      <span className="inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-700/10">
                        {b.balance} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link to="/leave" className="text-xs font-bold text-brand-600 hover:text-brand-800 transition-colors flex items-center gap-1">
              Apply for leave →
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-premium">
        <h2 className="text-sm font-bold text-slate-900 tracking-tight font-heading border-b border-slate-100 pb-3 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/leave" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all">
            📅 Apply Leave
          </Link>
          <Link to="/attendance" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all">
            ⏱ View Attendance
          </Link>
          {hasRole('manager', 'hr_admin') && (
            <Link to="/approvals" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all">
              ✅ Pending Approvals {pendingCount > 0 && `(${pendingCount})`}
            </Link>
          )}
          {hasRole('hr_admin') && (
            <Link to="/employees" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all">
              👥 Manage Employees
            </Link>
          )}
          {hasRole('hr_admin', 'manager') && (
            <Link to="/ai-search" className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 rounded-xl shadow-sm hover:bg-slate-100 hover:text-slate-900 transition-all">
              🤖 AI Search
            </Link>
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
