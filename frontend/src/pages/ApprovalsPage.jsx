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
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">Approvals</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">{data.totalPending} pending action{data.totalPending !== 1 ? 's' : ''}</p>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm" 
          onClick={load}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
        <div 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center ${tab === 0 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
          onClick={() => setTab(0)}
        >
          Leave Requests 
          {data.leaveRequests.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-rose-55 bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-700/10">
              {data.leaveRequests.length}
            </span>
          )}
        </div>
        <div 
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center ${tab === 1 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
          onClick={() => setTab(1)}
        >
          Regularizations 
          {data.regularizations.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/15">
              {data.regularizations.length}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="spinner" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Leave Approvals Tab */}
          {tab === 0 && (
            <div className="space-y-4">
              {data.leaveRequests.length === 0 ? (
                <div className="text-center py-16 border border-slate-200/60 rounded-2xl bg-white shadow-premium">
                  <p className="text-slate-500 font-medium text-base">✅ No pending leave requests</p>
                </div>
              ) : data.leaveRequests.map(r => (
                <div key={r._id} className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-premium">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <Avatar name={`${r.employeeId?.firstName} ${r.employeeId?.lastName}`} photo={r.employeeId?.photo} size="md" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="font-extrabold text-sm text-slate-800 tracking-tight font-heading">{r.employeeId?.firstName} {r.employeeId?.lastName}</div>
                      <div className="text-xs text-slate-400 font-semibold">{r.employeeId?.employeeId}</div>
                      <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-650">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.leaveType?.color }} />
                          {r.leaveType?.name}
                        </span>
                        <span>📅 {new Date(r.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} → {new Date(r.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span>⏱ {r.days} day{r.days !== 1 ? 's' : ''}</span>
                        {r.isLOP && <Badge status="lop" label="LOP" color="red" />}
                      </div>
                      <div className="text-xs text-slate-500 font-medium italic pt-1">"{r.reason}"</div>
                      <div className="text-[10px] text-slate-400 font-medium pt-1">
                        Applied {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="w-full md:w-60 flex flex-col gap-2 shrink-0">
                      <textarea
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-850 transition-all placeholder:text-slate-400 text-xs resize-none"
                        rows={2} 
                        placeholder="Comment (optional)..."
                        value={comment[r._id] || ''}
                        onChange={e => setComment(p => ({ ...p, [r._id]: e.target.value }))}
                      />
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 justify-center py-2 px-3 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          disabled={actionLoading === r._id + 'approve'}
                          onClick={() => handleLeave(r._id, 'approve')}
                        >
                          {actionLoading === r._id + 'approve' ? <span className="spinner" /> : 'Approve'}
                        </button>
                        <button 
                          className="flex-1 justify-center py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          disabled={actionLoading === r._id + 'reject'}
                          onClick={() => handleLeave(r._id, 'reject')}
                        >
                          {actionLoading === r._id + 'reject' ? <span className="spinner" /> : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regularization Approvals Tab */}
          {tab === 1 && (
            <div className="space-y-4">
              {data.regularizations.length === 0 ? (
                <div className="text-center py-16 border border-slate-200/60 rounded-2xl bg-white shadow-premium">
                  <p className="text-slate-500 font-medium text-base">✅ No pending regularizations</p>
                </div>
              ) : data.regularizations.map(r => (
                <div key={r._id} className="bg-white border border-slate-200/60 p-6 rounded-2xl shadow-premium">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    <Avatar name={`${r.employeeId?.firstName} ${r.employeeId?.lastName}`} size="md" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="font-extrabold text-sm text-slate-800 tracking-tight font-heading">{r.employeeId?.firstName} {r.employeeId?.lastName}</div>
                      <div className="text-xs text-slate-400 font-semibold">{r.employeeId?.employeeId}</div>
                      <div className="pt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-650">
                        <span>📅 {new Date(r.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {r.requestedPunchIn && <span>⏵ In: <strong>{new Date(r.requestedPunchIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>}
                        {r.requestedPunchOut && <span>⏹ Out: <strong>{new Date(r.requestedPunchOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>}
                      </div>
                      <div className="text-xs text-slate-500 font-medium italic pt-1">"{r.reason}"</div>
                    </div>
                    <div className="w-full md:w-60 flex flex-col gap-2 shrink-0">
                      <textarea 
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-850 transition-all placeholder:text-slate-400 text-xs resize-none" 
                        rows={2} 
                        placeholder="Comment (optional)..."
                        value={comment[r._id] || ''}
                        onChange={e => setComment(p => ({ ...p, [r._id]: e.target.value }))} 
                      />
                      <div className="flex gap-2">
                        <button 
                          className="flex-1 justify-center py-2 px-3 bg-emerald-600 hover:bg-emerald-750 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          disabled={actionLoading === r._id + 'approve'}
                          onClick={() => handleRegularize(r._id, 'approve')}
                        >
                          {actionLoading === r._id + 'approve' ? <span className="spinner" /> : 'Approve'}
                        </button>
                        <button 
                          className="flex-1 justify-center py-2 px-3 bg-rose-600 hover:bg-rose-750 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                          disabled={actionLoading === r._id + 'reject'}
                          onClick={() => handleRegularize(r._id, 'reject')}
                        >
                          {actionLoading === r._id + 'reject' ? <span className="spinner" /> : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}