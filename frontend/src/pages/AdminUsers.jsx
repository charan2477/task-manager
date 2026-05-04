import { useState, useEffect } from 'react';
import AppLayout from '../components/AppLayout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => setError('Failed to load users')).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const changeRole = async (u, role) => {
    try {
      const { data } = await api.put(`/users/${u.id}/role`, { role });
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: data.role } : x));
      setSuccess(`${u.name}'s role updated to ${role}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update role');
      setTimeout(() => setError(''), 3000);
    }
  };

  const deleteUser = async (u) => {
    if (!confirm(`Delete user "${u.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      setSuccess(`${u.name} deleted`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <AppLayout
      title="User Management"
      subtitle={`${users.length} registered user${users.length !== 1 ? 's' : ''}`}
    >
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {loading ? (
        <div className="loading-page"><div className="spinner loading-large" /></div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Task Stats</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="sidebar-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        {u.id === me?.id && <div style={{ fontSize: 11, color: 'var(--purple-400)' }}>You</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td>
                    {u.id === me?.id ? (
                      <span className={`badge badge-${u.role}`}>{u.role}</span>
                    ) : (
                      <select className="form-select" style={{ padding: '5px 10px', width: 'auto' }}
                        value={u.role} onChange={e => changeRole(u, e.target.value)}>
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                      </select>
                    )}
                  </td>
                  <td>
                    {(() => {
                      const tasks = u.assignedTasks || [];
                      const done = tasks.filter(t => t.status === 'done').length;
                      const pending = tasks.length - done;
                      return (
                        <div style={{ fontSize: 12 }}>
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{done} Done</span>
                          <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>|</span>
                          <span style={{ color: 'var(--blue-400)', fontWeight: 600 }}>{pending} Pending</span>
                        </div>
                      );
                    })()}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    {u.id !== me?.id && (
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>🗑 Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
}
