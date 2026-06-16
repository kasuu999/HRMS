import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const STEPS = ['Personal', 'Employment', 'Bank & Statutory', 'Review'];

export default function EmployeeForm({ onSuccess, onClose, existing }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [depts, setDepts] = useState([]);
  const [desigs, setDesigs] = useState([]);
  const [locs, setLocs] = useState([]);

  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '', maritalStatus: '',
    personalEmail: '', officialEmail: '', phone: '',
    currentAddress: { street: '', city: '', state: '', country: 'India', pincode: '' },
    emergencyContact: { name: '', relation: '', phone: '' },
    dateOfJoining: '', employmentType: 'full_time',
    department: '', designation: '', grade: '', location: '',
    bankDetails: { bankName: '', accountNumber: '', ifscCode: '', accountType: 'savings' },
    pan: '', aadhaar: '',
    ...existing,
  });

  const f = (field, val) => setForm(p => ({ ...p, [field]: val }));
  const nested = (parent, field, val) => setForm(p => ({ ...p, [parent]: { ...p[parent], [field]: val } }));

  useEffect(() => {
    Promise.all([employeeAPI.departments(), employeeAPI.designations(), employeeAPI.locations()])
      .then(([d, des, l]) => {
        setDepts(d.data.data); setDesigs(des.data.data); setLocs(l.data.data);
      }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (existing?._id) {
        await employeeAPI.update(existing._id, form);
        toast.success('Employee updated');
      } else {
        await employeeAPI.create(form);
        toast.success('Employee created successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <div 
            key={s} 
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-brand-600' : 'bg-slate-200'}`} 
          />
        ))}
      </div>
      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
        Step {step + 1} of {STEPS.length}: <span className="text-slate-700">{STEPS[step]}</span>
      </div>

      {/* Step 0: Personal */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">First Name *</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.firstName} onChange={e => f('firstName', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Last Name *</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.lastName} onChange={e => f('lastName', e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth</label>
              <input type="date" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gender</label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" value={form.gender} onChange={e => f('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Personal Email</label>
              <input type="email" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.personalEmail} onChange={e => f('personalEmail', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Official Email *</label>
              <input type="email" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.officialEmail} onChange={e => f('officialEmail', e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone</label>
            <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.phone} onChange={e => f('phone', e.target.value)} />
          </div>
          <div className="space-y-1.5 border-t border-slate-100 pt-4 mt-4">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Contact Name</label>
            <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.emergencyContact.name} onChange={e => nested('emergencyContact', 'name', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Relation</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.emergencyContact.relation} onChange={e => nested('emergencyContact', 'relation', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Emergency Phone</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.emergencyContact.phone} onChange={e => nested('emergencyContact', 'phone', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Employment */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Date of Joining *</label>
              <input type="date" className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.dateOfJoining} onChange={e => f('dateOfJoining', e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employment Type</label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" value={form.employmentType} onChange={e => f('employmentType', e.target.value)}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="probation">Probation</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" value={form.department} onChange={e => f('department', e.target.value)}>
                <option value="">Select Department</option>
                {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Designation</label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" value={form.designation} onChange={e => f('designation', e.target.value)}>
                <option value="">Select Designation</option>
                {desigs.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" value={form.location} onChange={e => f('location', e.target.value)}>
                <option value="">Select Location</option>
                {locs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.city}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grade</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" placeholder="e.g. L3, Senior, Mid" value={form.grade} onChange={e => f('grade', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Bank & Statutory */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bank Name</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.bankDetails.bankName} onChange={e => nested('bankDetails', 'bankName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Type</label>
              <select className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 bg-white transition-all text-sm" value={form.bankDetails.accountType} onChange={e => nested('bankDetails', 'accountType', e.target.value)}>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Account Number</label>
            <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" value={form.bankDetails.accountNumber} onChange={e => nested('bankDetails', 'accountNumber', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">IFSC Code</label>
            <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" placeholder="e.g. SBIN0001234" value={form.bankDetails.ifscCode} onChange={e => nested('bankDetails', 'ifscCode', e.target.value.toUpperCase())} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">PAN</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" placeholder="ABCDE1234F" value={form.pan} onChange={e => f('pan', e.target.value.toUpperCase())} maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aadhaar</label>
              <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" placeholder="12-digit number" value={form.aadhaar} onChange={e => f('aadhaar', e.target.value)} maxLength={12} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">UAN (PF)</label>
            <input className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all text-sm" placeholder="Universal Account Number" value={form.uan} onChange={e => f('uan', e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="space-y-4 text-sm">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-3 shadow-inner">
            <ReviewRow label="Name" value={`${form.firstName} ${form.lastName}`} />
            <ReviewRow label="Official Email" value={form.officialEmail} />
            <ReviewRow label="Joining Date" value={form.dateOfJoining} />
            <ReviewRow label="Employment Type" value={form.employmentType?.replace('_', ' ')} />
            <ReviewRow label="Department" value={depts.find(d => d._id === form.department)?.name || '—'} />
            <ReviewRow label="Designation" value={desigs.find(d => d._id === form.designation)?.name || '—'} />
            <ReviewRow label="Location" value={locs.find(l => l._id === form.location)?.name || '—'} />
            <ReviewRow label="Bank" value={form.bankDetails.bankName || '—'} />
            <ReviewRow label="PAN" value={form.pan || '—'} />
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium bg-brand-50/50 text-brand-700 ring-1 ring-brand-700/10 p-3 rounded-xl">
            ℹ️ A user account will be auto-created for this employee. Temporary password will be: <strong className="font-bold">Hrms@[EmployeeID]</strong>
          </p>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-6">
        <button 
          className="px-4 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-650 rounded-xl hover:bg-slate-50 transition-colors" 
          onClick={step === 0 ? onClose : () => setStep(s => s - 1)}
        >
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button 
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow transition-colors" 
            onClick={() => setStep(s => s + 1)}
          >
            Next →
          </button>
        ) : (
          <button 
            className="px-4 py-2 bg-brand-605 bg-brand-600 hover:bg-brand-750 hover:bg-brand-700 text-xs font-bold text-white rounded-xl shadow-sm hover:shadow disabled:opacity-50 disabled:pointer-events-none transition-colors" 
            onClick={handleSubmit} 
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : (existing ? 'Update Employee' : 'Create Employee')}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/50 last:border-b-0 last:pb-0">
      <span className="text-slate-450 font-medium">{label}</span>
      <span className="font-semibold text-slate-800 capitalize">{value || '—'}</span>
    </div>
  );
}