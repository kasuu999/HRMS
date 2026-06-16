import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ companyName: '', adminEmail: '', adminPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const slug = form.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.adminPassword !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.adminPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.register(form);
      const { accessToken, refreshToken } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      toast.success(`Organization "${form.companyName}" registered! Your slug: ${slug}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-black text-slate-900 tracking-tight">
            HR<span className="text-brand-500">MS</span> Pro
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">Register your organization</p>
        </div>

        <div className="bg-white rounded-2xl shadow-premium border border-slate-200/60 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Company Name</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm" 
                placeholder="Acme Corp" 
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })} 
                required 
              />
              {slug && (
                <span className="block text-[11px] text-slate-500 mt-1">
                  Slug: <strong className="text-brand-650">{slug}</strong> (use this to login)
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Admin Email</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm" 
                type="email" 
                placeholder="admin@company.com"
                value={form.adminEmail} 
                onChange={e => setForm({ ...form, adminEmail: e.target.value })} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm" 
                type="password" 
                placeholder="Min 8 characters"
                value={form.adminPassword} 
                onChange={e => setForm({ ...form, adminPassword: e.target.value })} 
                required 
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
              <input 
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none text-slate-800 transition-all placeholder:text-slate-400 text-sm" 
                type="password" 
                placeholder="Re-enter password"
                value={form.confirmPassword} 
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
                required 
              />
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg focus:ring-4 focus:ring-brand-500/20 transition-all flex items-center justify-center text-sm disabled:opacity-70 disabled:pointer-events-none mt-2" 
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Create Organization'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500 font-medium">
            Already registered? <Link to="/login" className="text-brand-650 hover:text-brand-800 font-semibold transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}