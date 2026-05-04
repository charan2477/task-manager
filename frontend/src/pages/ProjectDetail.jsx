import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api, { BASE_URL } from '../api/axios';

const STATUS_COLS = [
  { key: 'todo', label: 'To Do', icon: '📋', color: 'var(--text-secondary)' },
  { key: 'in_progress', label: 'In Progress', icon: '🔄', color: 'var(--blue-400)' },
  { key: 'done', label: 'Done', icon: '✅', color: 'var(--success)' },
];
// One-way: todo → in_progress → done (no loop back from done)
const NEXT_STATUS = { todo: 'in_progress', in_progress: 'done' };
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

// Countdown component
function DaysLeft({ dueDate, status }) {
  if (!dueDate) return null;
  if (status === 'done') return <span className="days-badge days-done">✅ Done</span>;
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dueDate + 'T00:00:00');
  const diff = Math.ceil((due - today) / 86400000);
  if (diff < 0) return <span className="days-badge days-overdue">⚠️ {Math.abs(diff)}d overdue</span>;
  if (diff === 0) return <span className="days-badge days-today">🔥 Due today</span>;
  if (diff <= 3) return <span className="days-badge days-urgent">⏰ {diff}d left</span>;
  return <span className="days-badge days-normal">📅 {diff}d left</span>;
}

// Multi-assignee checkbox list
function AssigneeChecklist({ allUsers, selected, onChange }) {
  return (
    <div className="assignee-checklist">
      {allUsers.length === 0 && <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No members in project yet</p>}
      {allUsers.map(u => {
        const checked = selected.includes(u.id);
        return (
          <label key={u.id} className={`assignee-check-item${checked ? ' checked' : ''}`}>
            <input type="checkbox" checked={checked} onChange={e => {
              onChange(e.target.checked ? [...selected, u.id] : selected.filter(id => id !== u.id));
            }} />
            <div className="mini-avatar">{u.name[0].toUpperCase()}</div>
            <span>{u.name}</span>
            {u.ProjectMember?.isLead && <span className="badge badge-lead" style={{ fontSize: 10, marginLeft: 'auto' }}>Lead</span>}
          </label>
        );
      })}
    </div>
  );
}

// Assignee avatar stack
function AssigneeStack({ assignees }) {
  if (!assignees?.length) return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unassigned</span>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {assignees.map(a => (
        <div key={a.id} className="assignee-chip" title={a.name}>
          <div className="mini-avatar">{a.name[0].toUpperCase()}</div>
          <span>{a.name}</span>
        </div>
      ))}
    </div>
  );
}

// Task modal — admin/lead can edit all; assignee can edit their task (no reassign)
function TaskModal({ project, task, allUsers, onClose, onSaved, isAdmin, isLead }) {
  const canFullEdit = isAdmin || isLead;
  const assigneeIds = (task?.assignees || []).map(a => a.id);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '',
    assigneeIds: assigneeIds,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      let res;
      if (task) {
        res = await api.put(`/projects/${project.id}/tasks/${task.id}`, form);
      } else {
        res = await api.post(`/projects/${project.id}/tasks`, form);
      }
      onSaved(res.data, !!task); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{task ? '✏️ Edit Task' : '+ New Task'}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input className="form-input" placeholder="Task title" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" placeholder="Task description…" value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                <option value="todo">📋 To Do</option>
                <option value="in_progress">🔄 In Progress</option>
                {(task?.status === 'in_progress' || task?.status === 'done') && (
                  <option value="done">✅ Done</option>
                )}
                {!task && <option value="done">✅ Done</option>}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input className="form-input" type="date" value={form.dueDate}
              onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
          </div>
          {canFullEdit && (
            <div className="form-group">
              <label className="form-label">Assign Members</label>
              <AssigneeChecklist
                allUsers={allUsers}
                selected={form.assigneeIds}
                onChange={ids => setForm(p => ({ ...p, assigneeIds: ids }))}
              />
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><div className="spinner" /> Saving…</> : task ? '💾 Save Changes' : '+ Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Member Modal with Team Lead option
function AddMemberModal({ project, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [userId, setUserId] = useState('');
  const [isLead, setIsLead] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => {
      const memberIds = new Set((project.members || []).map(m => m.id));
      setUsers(r.data.filter(u => !memberIds.has(u.id)));
    });
  }, []);

  const submit = async (e) => {
    e.preventDefault(); if (!userId) return;
    setLoading(true); setError('');
    try {
      await api.post(`/projects/${project.id}/members`, { userId: parseInt(userId), isLead });
      onAdded(); onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">👥 Add Member</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-select" value={userId} onChange={e => setUserId(e.target.value)} required>
              <option value="">Choose a user…</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
            </select>
          </div>
          <label className="lead-toggle">
            <input type="checkbox" checked={isLead} onChange={e => setIsLead(e.target.checked)} />
            <span>👑 Assign as Team Lead</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>(can edit all tasks)</span>
          </label>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !userId}>
              {loading ? <><div className="spinner" /> Adding…</> : '+ Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline status advance button (one-way only, no loop from Done)
function StatusAdvanceBtn({ task, projectId, onUpdated }) {
  const [loading, setLoading] = useState(false);
  const next = NEXT_STATUS[task.status];

  if (task.status === 'done') {
    return <div className="status-final-done">✅ Completed</div>;
  }

  const advance = async () => {
    setLoading(true);
    try {
      const { data } = await api.put(`/projects/${projectId}/tasks/${task.id}`, { status: next });
      onUpdated(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <button className={`status-cycle-btn status-cycle-${task.status}`} onClick={advance} disabled={loading}>
      {loading ? <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> : STATUS_LABELS[task.status]}
      <span className="status-cycle-arrow">→ {STATUS_LABELS[next]}</span>
    </button>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [toast, setToast] = useState('');
  const [assets, setAssets] = useState([]);
  const [uploadingAsset, setUploadingAsset] = useState(false);

  const load = () => {
    api.get(`/projects/${id}`)
      .then(r => {
        setProject(r.data);
        setAssets(r.data.assets ? JSON.parse(r.data.assets) : []);
      })
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleTaskSaved = (task, isEdit) => {
    setProject(p => ({
      ...p,
      Tasks: isEdit ? p.Tasks.map(t => t.id === task.id ? task : t) : [task, ...p.Tasks],
    }));
    showToast(isEdit ? '✅ Task updated!' : '✅ Task created!');
  };

  const handleStatusUpdated = (updatedTask) => {
    setProject(p => ({ ...p, Tasks: p.Tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
    showToast(`✅ Moved to: ${STATUS_LABELS[updatedTask.status]}`);
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    await api.delete(`/projects/${id}/tasks/${taskId}`);
    setProject(p => ({ ...p, Tasks: p.Tasks.filter(t => t.id !== taskId) }));
    showToast('🗑 Task deleted');
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  const handleAssetUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    setUploadingAsset(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append('assets', files[i]);
    try {
      const { data } = await api.post(`/projects/${id}/assets`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAssets(data);
      showToast('📎 Assets uploaded');
    } catch (err) {
      showToast('❌ Failed to upload assets');
    } finally {
      setUploadingAsset(false);
      e.target.value = null; // reset
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    load(); showToast('Member removed');
  };

  const handleToggleLead = async (memberId, currentLead) => {
    await api.put(`/projects/${id}/members/${memberId}/role`, { isLead: !currentLead });
    load(); showToast(!currentLead ? '👑 Team Lead assigned' : 'Lead removed');
  };

  if (loading) return <AppLayout title="Loading…"><div className="loading-page"><div className="spinner loading-large" /></div></AppLayout>;
  if (!project) return null;

  const tasks = project.Tasks || [];
  const members = project.members || [];
  const done = tasks.filter(t => t.status === 'done').length;
  const inProg = tasks.filter(t => t.status === 'in_progress').length;
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  const today = new Date(); today.setHours(0,0,0,0);
  const isOverdue = (t) => t.dueDate && new Date(t.dueDate + 'T00:00:00') < today && t.status !== 'done';

  // Check if current user is a lead in this project
  const myMembership = members.find(m => m.id === user?.id);
  const isLead = myMembership?.ProjectMember?.isLead || false;

  // Can edit task: admin, lead, or is one of the assignees
  const canEditTask = (task) => {
    if (isAdmin || isLead) return true;
    return (task.assignees || []).some(a => a.id === user?.id);
  };

  return (
    <AppLayout
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {project.logo && <img src={`${BASE_URL}/${project.logo}`} alt="logo" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />}
          <span>{project.name}</span>
        </div>
      }
      subtitle={project.description || 'No description'}
      actions={
        <div style={{ display: 'flex', gap: 10 }}>
          {isAdmin && <button className="btn btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>+ Add Member</button>}
          {(isAdmin || isLead) && <button className="btn btn-primary btn-sm" onClick={() => { setEditTask(null); setShowTaskModal(true); }}>+ New Task</button>}
          {isAdmin && <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>🗑 Delete</button>}
        </div>
      }
    >
      {/* Toast */}
      {toast && (
        <div className="toast-notification">{toast}</div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Tasks', val: tasks.length, color: 'var(--purple-400)', icon: '📋' },
          { label: 'To Do', val: todoCount, color: 'var(--text-secondary)', icon: '⏳' },
          { label: 'In Progress', val: inProg, color: 'var(--blue-400)', icon: '🔄' },
          { label: 'Done', val: done, color: 'var(--success)', icon: '✅' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 26 }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Project Progress</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 12 }}>
              {done} of {tasks.length} tasks completed · {todoCount} remaining
            </span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 800, color: pct === 100 ? 'var(--success)' : pct >= 50 ? 'var(--blue-400)' : 'var(--purple-400)' }}>
            {pct}%
          </span>
        </div>
        <div className="progress-bar" style={{ height: 12, borderRadius: 6 }}>
          <div className="progress-fill" style={{ width: `${pct}%`, borderRadius: 6 }} />
        </div>
        <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
          {[
            { label: 'To Do', count: todoCount, color: 'var(--text-muted)' },
            { label: 'In Progress', count: inProg, color: 'var(--blue-400)' },
            { label: 'Done', count: done, color: 'var(--success)' },
          ].map(s => (
            <div key={s.label} style={{ fontSize: 12, color: s.color, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
              {s.label}: <strong>{s.count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 290px', gap: 24 }}>
        {/* Kanban Board */}
        <div>
          <div className="section-header">
            <div className="section-title">Task Board</div>
            {!isAdmin && !isLead && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Advance status on your assigned tasks</div>}
          </div>
          <div className="kanban-grid">
            {STATUS_COLS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.key);
              return (
                <div key={col.key} className="kanban-col">
                  <div className="kanban-col-header">
                    <span className="kanban-col-title" style={{ color: col.color }}>{col.icon} {col.label}</span>
                    <span className="kanban-count">{colTasks.length}</span>
                  </div>
                  <div className="kanban-tasks">
                    {colTasks.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                        <div style={{ fontSize: 26, marginBottom: 6 }}>📭</div>Empty
                      </div>
                    )}
                    {colTasks.map(task => (
                      <div key={task.id} className={`task-card${isOverdue(task) ? ' overdue' : ''}`}>
                        {isOverdue(task) && (
                          <div style={{ fontSize: 10, color: 'var(--danger)', fontWeight: 700, marginBottom: 6 }}>⚠️ OVERDUE</div>
                        )}
                        <div className="task-card-header">
                          <div className="task-card-title" style={{ fontSize: 13 }}>{task.title}</div>
                          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                            {canEditTask(task) && (
                              <button className="btn btn-icon btn-secondary btn-sm" title="Edit"
                                onClick={() => { setEditTask(task); setShowTaskModal(true); }}>✏️</button>
                            )}
                            {(isAdmin || isLead) && (
                              <button className="btn btn-icon btn-danger btn-sm" title="Delete"
                                onClick={() => handleDeleteTask(task.id)}>🗑</button>
                            )}
                          </div>
                        </div>

                        {task.description && (
                          <div className="task-card-desc" style={{ fontSize: 12 }}>{task.description}</div>
                        )}

                        {/* Assignees */}
                        <div style={{ marginBottom: 8 }}>
                          <AssigneeStack assignees={task.assignees} />
                        </div>

                        <div className="task-card-meta" style={{ marginBottom: 10 }}>
                          <span className={`badge badge-${task.priority}`} style={{ fontSize: 10 }}>{task.priority}</span>
                          <DaysLeft dueDate={task.dueDate} status={task.status} />
                        </div>

                        {/* Status advance — visible to admin, lead, and assignees */}
                        {canEditTask(task) && (
                          <StatusAdvanceBtn task={task} projectId={id} onUpdated={handleStatusUpdated} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Members Panel */}
        <div>
          <div className="section-header"><div className="section-title">Team Members</div></div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            {members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>👥</div>No members yet
              </div>
            ) : members.map(m => {
              const pm = m.ProjectMember || {};
              const memberTasks = tasks.filter(t => (t.assignees || []).some(a => a.id === m.id));
              const memberDone = memberTasks.filter(t => t.status === 'done').length;
              const memberPct = memberTasks.length > 0 ? Math.round((memberDone / memberTasks.length) * 100) : 0;
              return (
                <div key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: memberTasks.length > 0 ? 8 : 0 }}>
                    <div className="sidebar-avatar" style={{ width: 34, height: 34, fontSize: 13, position: 'relative' }}>
                      {m.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                      {pm.isLead && <span className="lead-crown">👑</span>}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {m.name}
                        {pm.isLead && <span className="badge badge-lead" style={{ fontSize: 10 }}>Lead</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{memberTasks.length} task{memberTasks.length !== 1 ? 's' : ''} assigned</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {isAdmin && m.id !== user?.id && (
                        <>
                          <button
                            className={`btn btn-sm ${pm.isLead ? 'btn-secondary' : 'btn-secondary'}`}
                            style={{ padding: '4px 8px', fontSize: 11 }}
                            onClick={() => handleToggleLead(m.id, pm.isLead)}
                            title={pm.isLead ? 'Remove Lead' : 'Make Lead'}
                          >
                            {pm.isLead ? '👑 Lead' : '+ Lead'}
                          </button>
                          <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleRemoveMember(m.id)}>×</button>
                        </>
                      )}
                    </div>
                  </div>
                  {memberTasks.length > 0 && (
                    <div style={{ paddingLeft: 44 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>{memberDone}/{memberTasks.length} done</span>
                        <span style={{ color: memberPct === 100 ? 'var(--success)' : 'var(--text-muted)', fontWeight: 600 }}>{memberPct}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: 4 }}>
                        <div className="progress-fill" style={{ width: `${memberPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="section-header" style={{ marginTop: 30 }}><div className="section-title">Project Assets</div></div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
            {(isAdmin || isLead) && (
              <div style={{ marginBottom: 16 }}>
                <label className="btn btn-secondary btn-sm" style={{ display: 'inline-block', cursor: 'pointer' }}>
                  {uploadingAsset ? 'Uploading...' : '📎 Upload Files'}
                  <input type="file" multiple onChange={handleAssetUpload} style={{ display: 'none' }} disabled={uploadingAsset} />
                </label>
              </div>
            )}
            {assets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 10, color: 'var(--text-muted)', fontSize: 13 }}>
                No assets uploaded
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {assets.map((a, i) => (
                  <a key={i} href={`${BASE_URL}/${a.path}`} target="_blank" rel="noreferrer" 
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--blue-400)', textDecoration: 'none', padding: '8px 12px', background: 'var(--bg-hover)', borderRadius: 6 }}>
                    📎 {a.name}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          project={project}
          task={editTask}
          allUsers={members}
          onClose={() => { setShowTaskModal(false); setEditTask(null); }}
          onSaved={handleTaskSaved}
          isAdmin={isAdmin}
          isLead={isLead}
        />
      )}
      {showMemberModal && (
        <AddMemberModal project={project} onClose={() => setShowMemberModal(false)} onAdded={load} />
      )}
    </AppLayout>
  );
}
