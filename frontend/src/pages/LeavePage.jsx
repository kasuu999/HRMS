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
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">Apply for leave and track your requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApply(true)}>+ Apply Leave</button>
      </div>

      {/* Balance cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {balances.map(b => {
          const pct = b.totalEntitled > 0 ? Math.round((b.taken / b.totalEntitled) * 100) : 0;
          return (
            <div key={b._id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{b.leaveType?.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.leaveType?.code}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: b.balance > 0 ? 'var(--secondary)' : 'var(--danger)' }}>{b.balance}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>available</div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ background: 'var(--border)', borderRadius: 4, height: 5 }}>
                <div style={{ width: `${pct}%`, background: b.leaveType?.color || 'var(--primary)', height: 5, borderRadius: 4, transition: 'width 0.5s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-secondary)', marginTop: 5 }}>
                <span>{b.taken} used</span>
                <span>{b.totalEntitled} total</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Requests */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="tabs">
            <div className={`tab ${tab === 0 ? 'active' : ''}`} onClick={() => setTab(0)}>All Requests</div>
            <div className={`tab ${tab === 1 ? 'active' : ''}`} onClick={() => setTab(1)}>Pending</div>
          </div>
          <select className="form-input form-select" style={{ width: 150 }}
            value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setLoading(true); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
              ) : requests.filter(r => tab === 0 || r.status === 'pending').length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No leave requests found</td></tr>
              ) : requests.filter(r => tab === 0 || r.status === 'pending').map(r => (
                <tr key={r._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.leaveType?.color || '#6B7280' }} />
                      <span style={{ fontWeight: 600 }}>{r.leaveType?.name}</span>
                    </div>
                  </td>
                  <td>{new Date(r.fromDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td>{new Date(r.toDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  <td><strong>{r.days}</strong> {r.dayType === 'half_day' ? '(Half)' : ''}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>{r.reason}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    {['pending', 'approved'].includes(r.status) && (
                      <button className="btn btn-secondary btn-sm" onClick={() => handleCancel(r._id)}>Cancel</button>
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