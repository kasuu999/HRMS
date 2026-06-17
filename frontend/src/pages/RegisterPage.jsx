import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'hr', label: '🏢 HR Admin', desc: 'Create a new organization' },
  { key: 'employee', label: '👤 Employee', desc: 'Join existing organization' },
];

export default function RegisterPage() {
  const [tab, setTab] = useState('hr');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // HR Admin form
  const [hrForm, setHrForm] = useState({ companyName: '', adminEmail: '', adminPassword: '', confirmPassword: '', adminName: '' });
  // Employee form
  const [empForm, setEmpForm] = useState({ tenantSlug: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '', phone: '' });

  const slug = hrForm.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleHrSubmit = async (e) => {
    e.preventDefault();
    if (hrForm.adminPassword !== hrForm.confirmPassword) return toast.error('Passwords do not match');
    if (hrForm.adminPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.register(hrForm);
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      toast.success(`Organization "${hrForm.companyName}" registered! Slug: ${slug}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    if (empForm.password !== empForm.confirmPassword) return toast.error('Passwords do not match');
    if (empForm.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.registerEmployee(empForm);
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      toast.success('Welcome! You have joined the organization 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm";
  const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight">
            HR<span className="text-brand-500">MS</span> Pro
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Create your account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/60 p-8">
          {/* Tab Toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-all duration-200 ${
                  tab === t.key
                    ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 text-center mb-5 font-medium">
            {TABS.find(t => t.key === tab)?.desc}
          </p>

          {/* ─── HR Admin Registration ─── */}
          {tab === 'hr' && (
            <form onSubmit={handleHrSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Company Name</label>
                <input className={inputClass} placeholder="Acme Corp" value={hrForm.companyName}
                  onChange={e => setHrForm({ ...hrForm, companyName: e.target.value })} required />
                {slug && (
                  <span className="block text-[11px] text-slate-500 mt-1">
                    Slug: <strong className="text-brand-650">{slug}</strong> (employees will use this to join)
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Your Name</label>
                <input className={inputClass} placeholder="John Doe" value={hrForm.adminName}
                  onChange={e => setHrForm({ ...hrForm, adminName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Admin Email</label>
                <input className={inputClass} type="email" placeholder="admin@company.com" value={hrForm.adminEmail}
                  onChange={e => setHrForm({ ...hrForm, adminEmail: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Password</label>
                  <input className={inputClass} type="password" placeholder="Min 8 chars" value={hrForm.adminPassword}
                    onChange={e => setHrForm({ ...hrForm, adminPassword: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Confirm</label>
                  <input className={inputClass} type="password" placeholder="Re-enter" value={hrForm.confirmPassword}
                    onChange={e => setHrForm({ ...hrForm, confirmPassword: e.target.value })} required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg focus:ring-4 focus:ring-brand-500/20 transition-all flex items-center justify-center text-sm disabled:opacity-70 disabled:pointer-events-none mt-2">
                {loading ? <span className="spinner" /> : '🏢 Create Organization'}
              </button>
            </form>
          )}

          {/* ─── Employee Registration ─── */}
          {tab === 'employee' && (
            <form onSubmit={handleEmpSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Organization Slug</label>
                <input className={inputClass} placeholder="acme-corp (ask your HR)" value={empForm.tenantSlug}
                  onChange={e => setEmpForm({ ...empForm, tenantSlug: e.target.value })} required />
                <span className="block text-[11px] text-slate-400 mt-0.5">Ask your HR admin for the organization slug</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>First Name</label>
                  <input className={inputClass} placeholder="Rahul" value={empForm.firstName}
                    onChange={e => setEmpForm({ ...empForm, firstName: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Last Name</label>
                  <input className={inputClass} placeholder="Sharma" value={empForm.lastName}
                    onChange={e => setEmpForm({ ...empForm, lastName: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Email</label>
                <input className={inputClass} type="email" placeholder="rahul@company.com" value={empForm.email}
                  onChange={e => setEmpForm({ ...empForm, email: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Phone (Optional)</label>
                <input className={inputClass} type="tel" placeholder="+91 98765 43210" value={empForm.phone}
                  onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Password</label>
                  <input className={inputClass} type="password" placeholder="Min 8 chars" value={empForm.password}
                    onChange={e => setEmpForm({ ...empForm, password: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Confirm</label>
                  <input className={inputClass} type="password" placeholder="Re-enter" value={empForm.confirmPassword}
                    onChange={e => setEmpForm({ ...empForm, confirmPassword: e.target.value })} required />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg focus:ring-4 focus:ring-emerald-500/20 transition-all flex items-center justify-center text-sm disabled:opacity-70 disabled:pointer-events-none mt-2">
                {loading ? <span className="spinner" /> : '👤 Join Organization'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-slate-500 font-medium">
            Already registered? <Link to="/login" className="text-brand-650 hover:text-brand-800 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}