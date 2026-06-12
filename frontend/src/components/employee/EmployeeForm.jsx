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
    <div>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, fontWeight: 600 }}>
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </div>

      {/* Step 0: Personal */}
      {step === 0 && (
        <div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className="form-input" value={form.firstName} onChange={e => f('firstName', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className="form-input" value={form.lastName} onChange={e => f('lastName', e.target.value)} required />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-input" value={form.dateOfBirth} onChange={e => f('dateOfBirth', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input form-select" value={form.gender} onChange={e => f('gender', e.target.value)}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Personal Email</label>
              <input type="email" className="form-input" value={form.personalEmail} onChange={e => f('personalEmail', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Official Email *</label>
              <input type="email" className="form-input" value={form.officialEmail} onChange={e => f('officialEmail', e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => f('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Emergency Contact Name</label>
            <input className="form-input" value={form.emergencyContact.name} onChange={e => nested('emergencyContact', 'name', e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Relation</label>
              <input className="form-input" value={form.emergencyContact.relation} onChange={e => nested('emergencyContact', 'relation', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Emergency Phone</label>
              <input className="form-input" value={form.emergencyContact.phone} onChange={e => nested('emergencyContact', 'phone', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Employment */}
      {step === 1 && (
        <div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Date of Joining *</label>
              <input type="date" className="form-input" value={form.dateOfJoining} onChange={e => f('dateOfJoining', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select className="form-input form-select" value={form.employmentType} onChange={e => f('employmentType', e.target.value)}>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
                <option value="probation">Probation</option>
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department</label>
              <select className="form-input form-select" value={form.department} onChange={e => f('department', e.target.value)}>
                <option value="">Select Department</option>
                {depts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Designation</label>
              <select className="form-input form-select" value={form.designation} onChange={e => f('designation', e.target.value)}>
                <option value="">Select Designation</option>
                {desigs.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Location</label>
              <select className="form-input form-select" value={form.location} onChange={e => f('location', e.target.value)}>
                <option value="">Select Location</option>
                {locs.map(l => <option key={l._id} value={l._id}>{l.name} — {l.city}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Grade</label>
              <input className="form-input" placeholder="e.g. L3, Senior, Mid" value={form.grade} onChange={e => f('grade', e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Bank & Statutory */}
      {step === 2 && (
        <div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Bank Name</label>
              <input className="form-input" value={form.bankDetails.bankName} onChange={e => nested('bankDetails', 'bankName', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Account Type</label>
              <select className="form-input form-select" value={form.bankDetails.accountType} onChange={e => nested('bankDetails', 'accountType', e.target.value)}>
                <option value="savings">Savings</option>
                <option value="current">Current</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" value={form.bankDetails.accountNumber} onChange={e => nested('bankDetails', 'accountNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">IFSC Code</label>
            <input className="form-input" placeholder="e.g. SBIN0001234" value={form.bankDetails.ifscCode} onChange={e => nested('bankDetails', 'ifscCode', e.target.value.toUpperCase())} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">PAN</label>
              <input className="form-input" placeholder="ABCDE1234F" value={form.pan} onChange={e => f('pan', e.target.value.toUpperCase())} maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">Aadhaar</label>
              <input className="form-input" placeholder="12-digit number" value={form.aadhaar} onChange={e => f('aadhaar', e.target.value)} maxLength={12} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">UAN (PF)</label>
            <input className="form-input" placeholder="Universal Account Number" value={form.uan} onChange={e => f('uan', e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div style={{ fontSize: 13 }}>
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 16, display: 'grid', gap: 10 }}>
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
          <p style={{ marginTop: 12, color: 'var(--text-secondary)', fontSize: 12 }}>
            ✅ A user account will be auto-created. Temporary password: <strong>Hrms@[EmployeeID]</strong>
          </p>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        <button className="btn btn-secondary" onClick={step === 0 ? onClose : () => setStep(s => s - 1)}>
          {step === 0 ? 'Cancel' : '← Back'}
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
        ) : (
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : (existing ? 'Update Employee' : 'Create Employee')}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value || '—'}</span>
    </div>
  );
}