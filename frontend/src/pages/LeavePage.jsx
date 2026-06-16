import React, { useState, useEffect, useCallback } from 'react';
import { leaveAPI } from '../utils/api';
import LeaveApplyModal from '../components/leave/LeaveApplyModal';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import toast from 'react-hot-toast';

export default function LeavePage() {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [tab, setTab] = useState(0);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [balRes, reqRes] = await Promise.all([leaveAPI.balance(), leaveAPI.list({ status: filterStatus })]);
      setBalances(balRes.data.data);
      setRequests(reqRes.data.data);
    } catch {} finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this leave request?')) return;
    try {
      await leaveAPI.cancel(id, { reason: 'Cancelled by employee' });
      toast.success('Leave cancelled');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200/50">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">Leave Management</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Apply for leave and track your requests</p>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white rounded-xl shadow-md transition-all hover:shadow-lg" 
          onClick={() => setShowApply(true)}
        >
          ➕ Apply Leave
        </button>
      </div>

      {/* Balance cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {balances.map(b => {
          const pct = b.totalEntitled > 0 ? Math.round((b.taken / b.totalEntitled) * 100) : 0;
          return (
            <div key={b._id} className="bg-white border border-slate-200/60 p-5 rounded-2xl shadow-premium hover:shadow-premium-hover transition-all duration-200 hover:-translate-y-0.5 flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-extrabold text-sm text-slate-805 tracking-tight font-heading">{b.leaveType?.name}</div>
                  <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">{b.leaveType?.code}</div>
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-black font-heading ${b.balance > 0 ? 'text-emerald-600' : 'text-rose-650'}`}>{b.balance}</div>
                  <div className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">left</div>
                </div>
              </div>
              <div className="space-y-1">
                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div 
                    className="h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${pct}%`, background: b.leaveType?.color || '#8b5cf6' }} 
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-450 font-medium">
                  <span>{b.taken} used</span>
                  <span>{b.totalEntitled} total</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests panel */}
      <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-premium">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 flex-wrap gap-4">
          <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-xl">
            <div 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${tab === 0 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
              onClick={() => setTab(0)}
            >
              All Requests
            </div>
            <div 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${tab === 1 ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`} 
              onClick={() => setTab(1)}
            >
              Pending
            </div>
          </div>
          <select 
            className="px-4 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm w-40"
            value={filterStatus} 
            onChange={e => { setFilterStatus(e.target.value); setLoading(true); }}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Leave Type</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">From</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">To</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Days</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4.5 text-xs font-bold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center"><div className="spinner" /></div>
                  </td>
                </tr>
              ) : requests.filter(r => tab === 0 || r.status === 'pending').length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-450 font-medium">
                    No leave requests found
                  </td>
                </tr>
              ) : requests.filter(r => tab === 0 || r.status === 'pending').map(r => (
                <tr key={r._id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.leaveType?.color || '#6B7280' }} />
                      <span>{r.leaveType?.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(r.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(r.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <strong className="font-semibold">{r.days}</strong> {r.dayType === 'half_day' ? <span className="text-xs text-slate-400 font-medium">(Half)</span> : ''}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate" title={r.reason}>{r.reason}</td>
                  <td className="px-6 py-4 text-sm"><Badge status={r.status} /></td>
                  <td className="px-6 py-4 text-right">
                    {['pending', 'approved'].includes(r.status) && (
                      <button 
                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 rounded-xl shadow-sm transition-colors" 
                        onClick={() => handleCancel(r._id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Apply for Leave">
        <LeaveApplyModal onClose={() => setShowApply(false)} onSuccess={() => { setShowApply(false); load(); }} />
      </Modal>
    </div>
  );
}