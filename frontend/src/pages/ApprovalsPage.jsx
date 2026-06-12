import React, { useState, useEffect, useCallback } from 'react';
import { workflowAPI, leaveAPI, attendanceAPI } from '../utils/api';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

export default function ApprovalsPage() {
  const [data, setData] = useState({ leaveRequests: [], regularizations: [], totalPending: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [comment, setComment] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await workflowAPI.pending();
      setData(res.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLeave = async (id, action) => {
    setActionLoading(id + action);
    try {
      await leaveAPI.approve(id, { action, comment: comment[id] || '' });
      toast.success(`Leave ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(null); }
  };

  const handleRegularize = async (id, action) => {
    setActionLoading(id + action);
    try {
      await attendanceAPI.approveRegularize(id, { action, comment: comment[id] || '' });
      toast.success(`Regularization ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
          <p className="page-subtitle">{data.totalPending} pending action{data.totalPending !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="tabs" style={{ marginBottom: 20 }}>
        <div className={`tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>
          Leave Requests {data.leaveRequests.length > 0 && <span className="badge badge-red" style={{ marginLeft: 6 }}>{data.leaveRequests.length}</span>}
        </div>
        <div className={`tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>
          Regularizations {data.regularizations.length > 0 && <span className="badge badge-yellow" style={{ marginLeft: 6 }}>{data.regularizations.length}</span>}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      ) : (
        <>
          {/* Leave Approvals */}
          {tab === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.leaveRequests.length === 0 ? (
                <div className="card">
                  <div className="empty-state"><p>✅ No pending leave requests</p></div>
                </div>
              ) : data.leaveRequests.map(r => (
                <div key={r._id} className="card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Avatar name={`${r.employeeId?.firstName} ${r.employeeId?.lastName}`} photo={r.employeeId?.photo} size="md" />
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{r.employeeId?.firstName} {r.employeeId?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.employeeId?.employeeId}</div>
                      <div style={{ marginTop: 8, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
                        <span>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: r.leaveType?.color, marginRight: 5 }} />
                          <strong>{r.leaveType?.name}</strong>
                        </span>
                        <span>📅 {new Date(r.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {new Date(r.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span><strong>{r.days} day{r.days !== 1 ? 's' : ''}</strong></span>
                        {r.isLOP && <Badge status="lop" label="LOP" color="red" />}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{r.reason}"</div>
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        Applied {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                      <textarea
                        className="form-input" rows={2} placeholder="Comment (optional)..."
                        style={{ fontSize: 12 }}
                        value={comment[r._id] || ''}
                        onChange={e => setComment(p => ({ ...p, [r._id]: e.target.value }))}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}
                          disabled={actionLoading === r._id + 'approve'}
                          onClick={() => handleLeave(r._id, 'approve')}>
                          {actionLoading === r._id + 'approve' ? <span className="spinner" /> : '✅ Approve'}
                        </button>
                        <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                          disabled={actionLoading === r._id + 'reject'}
                          onClick={() => handleLeave(r._id, 'reject')}>
                          {actionLoading === r._id + 'reject' ? <span className="spinner" /> : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regularization Approvals */}
          {tab === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.regularizations.length === 0 ? (
                <div className="card">
                  <div className="empty-state"><p>✅ No pending regularizations</p></div>
                </div>
              ) : data.regularizations.map(r => (
                <div key={r._id} className="card">
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    <Avatar name={`${r.employeeId?.firstName} ${r.employeeId?.lastName}`} size="md" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{r.employeeId?.firstName} {r.employeeId?.lastName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{r.employeeId?.employeeId}</div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, flexWrap: 'wrap' }}>
                        <span>📅 {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {r.requestedPunchIn && <span>⏵ In: <strong>{new Date(r.requestedPunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>}
                        {r.requestedPunchOut && <span>⏹ Out: <strong>{new Date(r.requestedPunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{r.reason}"</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                      <textarea className="form-input" rows={2} placeholder="Comment (optional)..."
                        style={{ fontSize: 12 }}
                        value={comment[r._id] || ''}
                        onChange={e => setComment(p => ({ ...p, [r._id]: e.target.value }))} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}
                          disabled={actionLoading === r._id + 'approve'}
                          onClick={() => handleRegularize(r._id, 'approve')}>
                          {actionLoading === r._id + 'approve' ? <span className="spinner" /> : '✅ Approve'}
                        </button>
                        <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                          disabled={actionLoading === r._id + 'reject'}
                          onClick={() => handleRegularize(r._id, 'reject')}>
                          {actionLoading === r._id + 'reject' ? <span className="spinner" /> : '❌ Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}