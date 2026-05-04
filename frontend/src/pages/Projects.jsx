import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api, { BASE_URL } from '../api/axios';

const COLORS = ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1', memberIds: [] });
  const [logoFile, setLogoFile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(console.error);
  }, []);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('color', form.color);
      form.memberIds.forEach(id => formData.append('memberIds[]', id));
      if (logoFile) formData.append('logo', logoFile);

      const { data } = await api.post('/projects', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onCreated(data); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">✨ New Project</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input className="form-input" placeholder="e.g. Website Redesign"
              value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="What is this project about?"
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Project Logo (Optional)</label>
            <input className="form-input" type="file" accept="image/*" onChange={e => setLogoFile(e.target.files[0])} />
          </div>
          <div className="form-group">
            <label className="form-label">Initial Team Members</label>
            <div className="assignee-checklist" style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
              {users.map(u => {
                const checked = form.memberIds.includes(u.id);
                return (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', cursor: 'pointer', borderRadius: 6, background: checked ? 'var(--bg-hover)' : 'transparent' }}>
                    <input type="checkbox" checked={checked} onChange={e => {
                      const ids = e.target.checked ? [...form.memberIds, u.id] : form.memberIds.filter(id => id !== u.id);
                      setForm(p => ({ ...p, memberIds: ids }));
                    }} />
                    <span>{u.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Color Tag</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(p => ({ ...p, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: form.color === c ? '3px solid white' : '2px solid transparent',
                    transform: form.color === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /> Creating…</> : '✨ Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Projects() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/projects').then(r => setProjects(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  return (
    <AppLayout
      title="Projects"
      subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} total`}
      actions={
        <>
          <select className="form-select" style={{ width: 'auto', padding: '8px 12px' }}
            value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
          {isAdmin && (
            <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + New Project
            </button>
          )}
        </>
      }
    >
      {loading ? (
        <div className="loading-page"><div className="spinner loading-large" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <div className="empty-state-title">No projects found</div>
          <div className="empty-state-text">
            {isAdmin ? 'Create your first project to get started.' : 'Ask an admin to add you to a project.'}
          </div>
          {isAdmin && (
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>
              + Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="cards-grid">
          {filtered.map(proj => {
            const tasks = proj.Tasks || [];
            const done = tasks.filter(t => t.status === 'done').length;
            const inProg = tasks.filter(t => t.status === 'in_progress').length;
            const todoCount = tasks.filter(t => t.status === 'todo').length;
            const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
            const members = proj.members || [];

            return (
              <Link key={proj.id} to={`/projects/${proj.id}`} className="project-card"
                style={{ '--card-color': proj.color }}>
                {/* Header */}
                <div className="project-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {proj.logo && <img src={`${BASE_URL}/${proj.logo}`} alt="logo" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover' }} />}
                    <div className="project-card-name">{proj.name}</div>
                  </div>
                  <span className={`badge badge-${proj.status}`}>{proj.status}</span>
                </div>

                {proj.description && (
                  <div className="project-card-desc">{proj.description}</div>
                )}

                {/* Task summary pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                    background: 'rgba(100,116,139,0.15)', color: 'var(--text-secondary)',
                    padding: '3px 8px', borderRadius: 20 }}>
                    📋 {todoCount} To Do
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                    background: 'rgba(59,130,246,0.12)', color: 'var(--blue-400)',
                    padding: '3px 8px', borderRadius: 20 }}>
                    🔄 {inProg} In Progress
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600,
                    background: 'rgba(16,185,129,0.12)', color: 'var(--success)',
                    padding: '3px 8px', borderRadius: 20 }}>
                    ✅ {done} Done
                  </span>
                </div>

                {/* Progress bar */}
                <div className="project-card-progress">
                  <div className="progress-label">
                    <span>{pct}% complete</span>
                    <span>{done}/{tasks.length} tasks</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="project-card-footer">
                  <div className="members-stack">
                    {members.slice(0, 4).map(m => (
                      <div key={m.id} className="member-avatar" title={m.name}>
                        {m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    ))}
                    {members.length > 4 && <div className="member-avatar">+{members.length - 4}</div>}
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {members.length} member{members.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={p => setProjects(prev => [p, ...prev])}
        />
      )}
    </AppLayout>
  );
}
