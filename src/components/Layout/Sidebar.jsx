import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Avatar } from "../UI";

const NAV = [
  { id: "dashboard", icon: "⊞", label: "Dashboard" },
  { id: "projects",  icon: "📁", label: "Projects" },
  { id: "mytasks",   icon: "✓",  label: "My Tasks" },
];

export default function Sidebar({ page, onNavigate, overdueCt }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        <div className="logo-text">Task<span>Flow</span></div>
      </div>

      {/* Nav */}
      <div className="sidebar-section" style={{ flex: 1 }}>
        <div className="sidebar-section-label">Menu</div>
        {NAV.map(n => (
          <button
            key={n.id}
            className={`nav-link ${page === n.id || (page === "project" && n.id === "projects") ? "active" : ""}`}
            onClick={() => onNavigate(n.id)}
          >
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.id === "mytasks" && overdueCt > 0 && (
              <span className="nav-badge">{overdueCt}</span>
            )}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Theme toggle */}
        <button
          className="theme-toggle"
          onClick={toggle}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          style={{ width: "100%", borderRadius: 8, marginBottom: 8, height: 34, fontSize: 13, fontWeight: 600, gap: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface2)", border: "1px solid var(--border2)", color: "var(--text2)", cursor: "pointer" }}
        >
          {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
        </button>

        <div className="user-card">
          <Avatar name={user?.name} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name">{user?.name}</div>
            <div className="user-email">{user?.email}</div>
          </div>
          <button
            className="btn-ghost btn btn-xs"
            onClick={logout}
            title="Sign out"
            style={{ flexShrink: 0, padding: "4px 8px" }}
          >
            Exit
          </button>
        </div>
      </div>
    </aside>
  );
}
