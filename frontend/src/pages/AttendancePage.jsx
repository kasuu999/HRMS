import React, { useState, useEffect, useCallback } from 'react';
import { attendanceAPI } from '../utils/api';
import AttendanceCalendar from '../components/attendance/AttendanceCalendar';
import RegularizeModal from '../components/attendance/RegularizeModal';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

export default function AttendancePage() {
  const [todayAtt, setTodayAtt] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [punchLoading, setPunchLoading] = useState(false);
  const [showRegularize, setShowRegularize] = useState(false);
  const [tab, setTab] = useState(0); // 0=Calendar, 1=History
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(viewYear, viewMonth, 1);
      const to = new Date(viewYear, viewMonth + 1, 0);
      const [todayRes, histRes] = await Promise.all([
        attendanceAPI.today(),
        attendanceAPI.list({ fromDate: from.toISOString(), toDate: to.toISOString(), limit: 31 }),
      ]);
      setTodayAtt(todayRes.data.data);
      setRecords(histRes.data.data);
    } catch {} finally { setLoading(false); }
  }, [viewMonth, viewYear]);

  useEffect(() => { loadRecords(); }, [loadRecords]);

  const handlePunch = async () => {
    setPunchLoading(true);
    try {
      const res = await attendanceAPI.punch({});
      setTodayAtt(res.data.data.record);
      toast.success(res.data.message);
      loadRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Punch failed');
    } finally { setPunchLoading(false); }
  };

  const isPunchedIn = todayAtt?.punchIn && !todayAtt?.punchOut;
  const isPunchedOut = todayAtt?.punchIn && todayAtt?.punchOut;
  const monthName = new Date(viewYear, viewMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">Attendance</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Track your daily attendance and view history</p>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm" 
          onClick={() => setShowRegularize(true)}
        >
          📝 Request Regularization
        </button>
      </div>

      {/* Today's Punch Card */}
      <div className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-premium">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Punch circle button */}
          <button 
            className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center gap-1 font-extrabold transition-all duration-300 transform active:scale-95 hover:scale-105 disabled:opacity-50 shrink-0 ${
              isPunchedIn 
                ? 'border-rose-100 bg-rose-50 text-rose-600 shadow-sm hover:shadow-rose-100' 
                : isPunchedOut 
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm' 
                  : 'border-brand-100 bg-white text-brand-600 shadow-sm hover:shadow-brand-100 hover:bg-brand-50/10'
            }`}
            onClick={handlePunch} 
            disabled={punchLoading || isPunchedOut}
          >
            {punchLoading ? <span className="spinner" /> : (
              <>
                <span className="text-2xl">{isPunchedIn ? '🔴' : isPunchedOut ? '✅' : '⏱'}</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold">{isPunchedIn ? 'Punch Out' : isPunchedOut ? 'Completed' : 'Punch In'}</span>
              </>
            )}
          </button>

          <div className="flex-1 text-center sm:text-left space-y-4">
            <div className="font-bold text-sm text-slate-800 font-heading">
              📅 Today — {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatPill label="Punch In" value={todayAtt?.punchIn ? new Date(todayAtt.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
              <StatPill label="Punch Out" value={todayAtt?.punchOut ? new Date(todayAtt.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
              <StatPill label="Hours Worked" value={todayAtt?.totalHours ? `${todayAtt.totalHours}h` : '—'} />
              <StatPill label="Status" value={todayAtt?.status ? <Badge status={todayAtt.status} /> : <span className="text-slate-400 font-medium">Not punched</span>} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        <div 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === 0 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
          onClick={() => setTab(0)}
        >
          📅 Calendar
        </div>
        <div 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${tab === 1 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
          onClick={() => setTab(1)}
        >
          📋 History
        </div>
      </div>

      {/* Month Navigator bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200/60 p-3 rounded-2xl shadow-sm">
        <button 
          className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors"
          onClick={() => {
            if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
            else setViewMonth(m => m - 1);
          }}
        >
          ← Prev
        </button>
        <span className="font-extrabold text-sm text-slate-800 font-heading tracking-tight min-w-[160px] text-center">{monthName}</span>
        <button 
          className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-650 hover:bg-slate-50 transition-colors"
          onClick={() => {
            if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
            else setViewMonth(m => m + 1);
          }}
        >
          Next →
        </button>
      </div>

      {/* Calendar View */}
      {tab === 0 && (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-premium p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="spinner" />
            </div>
          ) : (
            <AttendanceCalendar records={records} year={viewYear} month={viewMonth} />
          )}
        </div>
      )}

      {/* History View */}
      {tab === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Day</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Punch In</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Punch Out</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">OT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex justify-center"><div className="spinner" /></div>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-450 font-medium">
                      No records found
                    </td>
                  </tr>
                ) : records.map(r => (
                  <tr key={r._id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-800 font-semibold">{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{r.punchOut ? new Date(r.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td className="px-6 py-4 text-sm text-slate-650">{r.totalHours ? <strong className="font-semibold">{r.totalHours}h</strong> : '—'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge status={r.status} />
                        {r.isLate && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/15">
                            {r.lateMinutes}m late
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {r.overtimeHours > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-750/10">
                          +{r.overtimeHours}h
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Regularization Modal */}
      <Modal isOpen={showRegularize} onClose={() => setShowRegularize(false)} title="Request Regularization">
        <RegularizeModal
          onClose={() => setShowRegularize(false)}
          onSuccess={() => { setShowRegularize(false); loadRecords(); }}
        />
      </Modal>
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
      <div className="font-bold text-slate-800 text-sm">{value}</div>
    </div>
  );
}