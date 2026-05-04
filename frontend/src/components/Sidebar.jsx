import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/projects', icon: '📁', label: 'Projects' },
];
const adminLinks = [
  { to: '/admin/users', icon: '👥', label: 'Users' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { setShowMenu(false); logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-inner">
          <div className="sidebar-logo-icon">⚡</div>
          <div>
            <div className="sidebar-logo-text"><span>Project</span> Manager</div>
            <div className="sidebar-logo-badge">Workspace</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">Navigation</div>
        {links.map(link => (
          <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
            <span className="sidebar-link-icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
        {isAdmin && (
          <>
            <div className="sidebar-section-label" style={{ marginTop: 12 }}>Admin</div>
            {adminLinks.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
                <span className="sidebar-link-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      <div className="sidebar-user" ref={menuRef}>
        {showMenu && (
          <div className="profile-popup">
            <div className="profile-popup-header">
              <div className="profile-popup-avatar">{initials}</div>
              <div>
                <div className="profile-popup-name">{user?.name}</div>
                <div className="profile-popup-email">{user?.email}</div>
              </div>
            </div>
            <div className="profile-popup-divider" />
            <div className="profile-popup-role">
              <span className="profile-popup-role-label">Role</span>
              <span className={`badge badge-${user?.role}`}>{user?.role}</span>
            </div>
            <div className="profile-popup-divider" />
            <button className="profile-popup-logout" onClick={handleLogout}>
              <span>🚪</span> Sign Out
            </button>
          </div>
        )}
        <button
          className={`sidebar-user-card${showMenu ? ' active' : ''}`}
          onClick={() => setShowMenu(v => !v)}
          title="Click to open profile menu"
        >
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', transition: 'transform 0.2s', transform: showMenu ? 'rotate(180deg)' : 'rotate(0deg)' }}>▲</span>
        </button>
      </div>
    </aside>
  );
}
