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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Leave Type *</label>
        <select 
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" 
          value={form.leaveTypeId}
          onChange={e => setForm(p => ({ ...p, leaveTypeId: e.target.value }))} 
          required
        >
          <option value="">Select leave type</option>
          {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
        </select>
        {selectedBalance && (
          <div className="text-xs text-slate-500 mt-1 font-medium">
            Available: <strong className={selectedBalance.balance > 0 ? 'text-emerald-700' : 'text-rose-600'}>{selectedBalance.balance} days</strong>
            {' '} | Used: {selectedBalance.taken} days
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Day Type</label>
        <div className="flex gap-2">
          {['full_day', 'half_day'].map(t => (
            <button 
              type="button" 
              key={t}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                form.dayType === t 
                  ? 'bg-brand-600 text-white shadow-sm font-bold' 
                  : 'border border-slate-200 bg-white text-slate-605 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => setForm(p => ({ ...p, dayType: t }))}
            >
              {t === 'full_day' ? '☀️ Full Day' : '🌤 Half Day'}
            </button>
          ))}
        </div>
      </div>

      {form.dayType === 'half_day' && (
        <div className="space-y-1.5 animate-in slide-in-from-top-1 duration-150">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Half Day Period</label>
          <select 
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" 
            value={form.halfDayPeriod}
            onChange={e => setForm(p => ({ ...p, halfDayPeriod: e.target.value }))}
          >
            <option value="">Select</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">From Date *</label>
          <input 
            type="date" 
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" 
            value={form.fromDate}
            onChange={e => setForm(p => ({ ...p, fromDate: e.target.value, toDate: p.dayType === 'half_day' ? e.target.value : p.toDate }))} 
            required 
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">To Date *</label>
          <input 
            type="date" 
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" 
            value={form.toDate}
            min={form.fromDate} 
            disabled={form.dayType === 'half_day'}
            onChange={e => setForm(p => ({ ...p, toDate: e.target.value }))} 
            required 
          />
        </div>
      </div>

      {days > 0 && (
        <div className="p-3 bg-brand-50/50 text-brand-700 ring-1 ring-brand-700/10 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>📅 {days} working day{days !== 1 ? 's' : ''} requested</span>
          {selectedBalance && days > selectedBalance.balance && (
            <span className="text-rose-600 font-bold">⚠️ Insufficient balance</span>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Reason *</label>
        <textarea 
          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm resize-none" 
          rows={3} 
          placeholder="Briefly explain the reason..."
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