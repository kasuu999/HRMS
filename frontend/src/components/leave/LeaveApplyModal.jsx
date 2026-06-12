import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function LeaveApplyModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '', dayType: 'full_day', halfDayPeriod: '' });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([leaveAPI.types(), leaveAPI.balance()])
      .then(([t, b]) => { setLeaveTypes(t.data.data); setBalances(b.data.data); })
      .catch(() => {});
  }, []);

  const selectedBalance = balances.find(b => b.leaveType?._id === form.leaveTypeId || b.leaveType === form.leaveTypeId);
  const calcDays = () => {
    if (!form.fromDate || !form.toDate) return 0;
    if (form.dayType === 'half_day') return 0.5;
    let days = 0, cur = new Date(form.fromDate);
    while (cur <= new Date(form.toDate)) { if (cur.getDay() !== 0 && cur.getDay() !== 6) days++; cur.setDate(cur.getDate() + 1); }
    return days;
  };

  const days = calcDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.leaveTypeId) return toast.error('Select leave type');
    if (days === 0) return toast.error('Select valid date range');
    setLoading(true);
    try {
      await leaveAPI.apply({ ...form, days });
      toast.success('Leave request submitted!');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Leave Type *</label>
        <select className="form-input form-select" value={form.leaveTypeId}
          onChange={e => setForm(p => ({ ...p, leaveTypeId: e.target.value }))} required>
          <option value="">Select leave type</option>
          {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
        </select>
        {selectedBalance && (
          <div style={{ marginTop: 6, fontSize: 12 }}>
            Available: <strong style={{ color: selectedBalance.balance > 0 ? '#15803D' : '#DC2626' }}>{selectedBalance.balance} days</strong>
            {' '} | Used: {selectedBalance.taken} days
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Day Type</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['full_day', 'half_day'].map(t => (
            <button type="button" key={t}
              className={`btn ${form.dayType === t ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setForm(p => ({ ...p, dayType: t }))}>
              {t === 'full_day' ? '☀️ Full Day' : '🌤 Half Day'}
            </button>
          ))}
        </div>
      </div>

      {form.dayType === 'half_day' && (
        <div className="form-group">
          <label className="form-label">Half Day Period</label>
          <select className="form-input form-select" value={form.halfDayPeriod}
            onChange={e => setForm(p => ({ ...p, halfDayPeriod: e.target.value }))}>
            <option value="">Select</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </div>
      )}

      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">From Date *</label>
          <input type="date" className="form-input" value={form.fromDate}
            onChange={e => setForm(p => ({ ...p, fromDate: e.target.value, toDate: p.dayType === 'half_day' ? e.target.value : p.toDate }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">To Date *</label>
          <input type="date" className="form-input" value={form.toDate}
            min={form.fromDate} disabled={form.dayType === 'half_day'}
            onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))} required />
        </div>
      </div>

      {days > 0 && (
        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          📅 {days} working day{days !== 1 ? 's' : ''} requested
          {selectedBalance && days > selectedBalance.balance && (
            <span style={{ color: '#DC2626', marginLeft: 8 }}>⚠️ Insufficient balance</span>
          )}
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Reason *</label>
        <textarea className="form-input" rows={3} placeholder="Briefly explain the reason..."
          value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} required />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}