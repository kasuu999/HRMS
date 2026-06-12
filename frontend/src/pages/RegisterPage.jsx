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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8F9FC', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ fontFamily: 'Manrope', fontSize: 26, fontWeight: 800 }}>HR<span style={{ color: '#818CF8' }}>MS</span> Pro</h1>
          <p style={{ color: '#6B7280', marginTop: 6, fontSize: 14 }}>Register your organization</p>
        </div>

        <div className="card" style={{ padding: '28px 32px' }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" placeholder="Acme Corp" value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })} required />
              {slug && <span style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>Slug: <strong>{slug}</strong> (use this to login)</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input className="form-input" type="email" placeholder="admin@company.com"
                value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 8 characters"
                value={form.adminPassword} onChange={e => setForm({ ...form, adminPassword: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input className="form-input" type="password" placeholder="Re-enter password"
                value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Organization'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            Already registered? <Link to="/login" style={{ color: '#3B5BDB', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}