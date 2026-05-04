import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRegister() {
  const { adminSignup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', adminSecret: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await adminSignup(form.name, form.email, form.password, form.adminSecret);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Admin registration failed. Check your secret key.');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🛡️</div>
          <h1><span>Admin</span> Setup</h1>
          <p>Register an Administrator Account</p>
        </div>
        <p className="auth-subtitle">Enter your details and the admin secret key provided by your system administrator.</p>
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input id="admin-name" className="form-input" type="text" placeholder="Your Name"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input id="admin-email" className="form-input" type="email" placeholder="admin@email.com"
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input id="admin-password" className="form-input" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required minLength={6} autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label">Admin Secret Key</label>
            <input id="admin-secret" className="form-input" type="password" placeholder="Enter the admin secret key"
              value={form.adminSecret} onChange={e => setForm(p => ({ ...p, adminSecret: e.target.value }))} required />
          </div>
          <button id="admin-submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <><div className="spinner" /> Registering…</> : '🛡️ Register as Admin'}
          </button>
        </form>
        <div className="auth-footer">
          Member? <Link to="/signup" className="auth-link">Sign up here</Link> · <Link to="/login" className="auth-link">Login</Link>
        </div>
      </div>
    </div>
  );
}
