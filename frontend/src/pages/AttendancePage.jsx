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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">Track your daily attendance and view history</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowRegularize(true)}>📝 Request Regularization</button>
      </div>

      {/* Today's card */}
      <div className="card" style={{ marginBottom: 20, padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {/* Punch button */}
          <button className={`punch-btn ${isPunchedIn ? 'punched-in' : ''}`}
            onClick={handlePunch} disabled={punchLoading || isPunchedOut}
            style={{ width: 110, height: 110 }}>
            {punchLoading ? <span className="spinner" /> : (
              <>
                <span style={{ fontSize: 24 }}>{isPunchedIn ? '🔴' : isPunchedOut ? '✅' : '⏱'}</span>
                <span style={{ fontSize: 12 }}>{isPunchedIn ? 'Punch Out' : isPunchedOut ? 'Completed' : 'Punch In'}</span>
              </>
            )}
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
              Today — {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
              <StatPill label="Punch In" value={todayAtt?.punchIn ? new Date(todayAtt.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
              <StatPill label="Punch Out" value={todayAtt?.punchOut ? new Date(todayAtt.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'} />
              <StatPill label="Hours Worked" value={todayAtt?.totalHours ? `${todayAtt.totalHours}h` : '—'} />
              <StatPill label="Status" value={todayAtt?.status ? <Badge status={todayAtt.status} /> : <span style={{ color: 'var(--text-muted)' }}>Not punched</span>} />
              {todayAtt?.isLate && <StatPill label="Late By" value={<span style={{ color: '#A16207' }}>{todayAtt.lateMinutes}m</span>} />}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 20 }}>
        <div className={`tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>📅 Calendar</div>
        <div className={`tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>📋 History</div>
      </div>

      {/* Month Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
          else setViewMonth(m => m - 1);
        }}>← Prev</button>
        <span style={{ fontWeight: 700, fontSize: 15, minWidth: 160, textAlign: 'center' }}>{monthName}</span>
        <button className="btn btn-secondary btn-sm" onClick={() => {
          if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
          else setViewMonth(m => m + 1);
        }}>Next →</button>
      </div>

      {/* Calendar Tab */}
      {tab === 0 && (
        <div className="card">
          {loading ? <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></div> :
            <AttendanceCalendar records={records} year={viewYear} month={viewMonth} />}
        </div>
      )}

      {/* History Tab */}
      {tab === 1 && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Day</th><th>Punch In</th><th>Punch Out</th><th>Hours</th><th>Status</th><th>OT</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
                ) : records.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>No records found</td></tr>
                ) : records.map(r => (
                  <tr key={r._id}>
                    <td style={{ fontWeight: 600 }}>{new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                    <td>{r.punchIn ? new Date(r.punchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{r.punchOut ? new Date(r.punchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                    <td>{r.totalHours ? <strong>{r.totalHours}h</strong> : '—'}</td>
                    <td>
                      <Badge status={r.status} />
                      {r.isLate && <span className="badge badge-yellow" style={{ marginLeft: 4 }}>{r.lateMinutes}m</span>}
                    </td>
                    <td>{r.overtimeHours > 0 ? <span className="badge badge-blue">+{r.overtimeHours}h</span> : '—'}</td>
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
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{value}</div>
    </div>
  );
}