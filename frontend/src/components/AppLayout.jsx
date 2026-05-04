import Sidebar from './Sidebar';

export default function AppLayout({ title, subtitle, actions, children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{title}</div>
            {subtitle && <div className="topbar-subtitle">{subtitle}</div>}
          </div>
          {actions && <div className="topbar-actions">{actions}</div>}
        </header>
        <main className="page">{children}</main>
      </div>
    </div>
  );
}
