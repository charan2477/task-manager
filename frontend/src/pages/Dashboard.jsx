import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const StatCard = ({ icon, value, label, accent }) => (
  <div className={`stat-card stat-accent-${accent}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value ?? '—'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' };

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const isOverdue = (task) => task.dueDate && task.dueDate < today && task.status !== 'done';

  if (loading) return (
    <AppLayout title="Dashboard">
      <div className="loading-page"><div className="spinner loading-large" /></div>
    </AppLayout>
  );

  const { stats, recentTasks = [], recentProjects = [] } = data || {};

  return (
    <AppLayout
      title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
      subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
    >
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="📋" value={stats?.total} label="Total Tasks" accent="purple" />
        <StatCard icon="⏳" value={stats?.todo} label="To Do" accent="blue" />
        <StatCard icon="🔄" value={stats?.inProgress} label="In Progress" accent="cyan" />
        <StatCard icon="✅" value={stats?.done} label="Completed" accent="green" />
        <StatCard icon="🚨" value={stats?.overdue} label="Overdue" accent="red" />
        <StatCard icon="📁" value={stats?.totalProjects} label="Projects" accent="orange" />
        {isAdmin && <StatCard icon="👥" value={stats?.totalUsers} label="Total Users" accent="purple" />}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Recent Tasks */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Recent Tasks</div>
              <div className="section-subtitle">Latest activity across projects</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-title">No tasks yet</div>
                <div className="empty-state-text">Tasks will appear here once created</div>
              </div>
            ) : recentTasks.map(task => (
              <div key={task.id} className={`task-card${isOverdue(task) ? ' overdue' : ''}`}>
                <div className="task-card-header">
                  <div className="task-card-title">{task.title}</div>
                  <span className={`badge badge-${task.status}`}>
                    {task.status === 'in_progress' ? 'In Progress' : task.status === 'todo' ? 'To Do' : 'Done'}
                  </span>
                </div>
                <div className="task-card-meta">
                  <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  {task.Project && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      📁 {task.Project.name}
                    </span>
                  )}
                  {task.assignee && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 {task.assignee.name}</span>}
                  {task.dueDate && (
                    <span className={`task-due${isOverdue(task) ? ' overdue' : ''}`}>
                      📅 {new Date(task.dueDate).toLocaleDateString('en-IN')}
                      {isOverdue(task) && ' ⚠️ Overdue'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="section-header">
            <div>
              <div className="section-title">Active Projects</div>
              <div className="section-subtitle">Projects you're involved in</div>
            </div>
            <Link to="/projects" className="btn btn-secondary btn-sm">View All</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📂</div>
                <div className="empty-state-title">No projects yet</div>
              </div>
            ) : recentProjects.map(proj => {
              const tasks = proj.Tasks || [];
              const done = tasks.filter(t => t.status === 'done').length;
              const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
              return (
                <Link key={proj.id} to={`/projects/${proj.id}`} className="project-card"
                  style={{ '--card-color': proj.color }}>
                  <div className="project-card-header">
                    <div className="project-card-name">{proj.name}</div>
                    <span className={`badge badge-${proj.status}`}>{proj.status}</span>
                  </div>
                  <div className="project-card-progress">
                    <div className="progress-label">
                      <span>Progress</span><span>{pct}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} · {done} done
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
