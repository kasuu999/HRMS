import React, { useState } from 'react';
import { attendanceAPI } from '../../utils/api';
import toast from 'react-hot-toast';

export default function RegularizeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ date: '', requestedPunchIn: '', requestedPunchOut: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.reason) return toast.error('Date and reason are required');
    setLoading(true);
    try {
      const payload = {
        date: form.date,
        reason: form.reason,
        requestedPunchIn: form.date && form.requestedPunchIn ? `${form.date}T${form.requestedPunchIn}:00` : undefined,
        requestedPunchOut: form.date && form.requestedPunchOut ? `${form.date}T${form.requestedPunchOut}:00` : undefined,
      };
      await attendanceAPI.regularize(payload);
      toast.success('Regularization request submitted');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Date *</label>
        <input type="date" className="form-input" value={form.date}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Punch In Time</label>
          <input type="time" className="form-input" value={form.requestedPunchIn}
            onChange={e => setForm(p => ({ ...p, requestedPunchIn: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Punch Out Time</label>
          <input type="time" className="form-input" value={form.requestedPunchOut}
            onChange={e => setForm(p => ({ ...p, requestedPunchOut: e.target.value }))} />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Reason *</label>
        <textarea className="form-input" rows={3} placeholder="Explain why regularization is needed..."
          value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} required />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}