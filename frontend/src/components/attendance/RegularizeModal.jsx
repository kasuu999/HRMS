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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date *</label>
        <input 
          type="date" 
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" 
          value={form.date}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setForm(p => ({ ...p, date: e.target.value }))} 
          required 
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Punch In Time</label>
          <input 
            type="time" 
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" 
            value={form.requestedPunchIn}
            onChange={e => setForm(p => ({ ...p, requestedPunchIn: e.target.value }))} 
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Punch Out Time</label>
          <input 
            type="time" 
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" 
            value={form.requestedPunchOut}
            onChange={e => setForm(p => ({ ...p, requestedPunchOut: e.target.value }))} 
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason *</label>
        <textarea 
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm resize-none" 
          rows={3} 
          placeholder="Explain why regularization is needed..."
          value={form.reason} 
          onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} 
          required 
        />
      </div>
      <div className="flex gap-2.5 justify-end pt-3 border-t border-slate-100 mt-4">
        <button 
          type="button" 
          className="px-4 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-655 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors" 
          onClick={onClose}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-brand-605 bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow transition-colors disabled:opacity-50 disabled:pointer-events-none" 
          disabled={loading}
        >
          {loading ? <span className="spinner" /> : 'Submit Request'}
        </button>
      </div>
    </form>
  );
}