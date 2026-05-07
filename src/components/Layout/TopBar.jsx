import { useTheme } from "../../context/ThemeContext";

export default function TopBar({ title, subtitle, actions }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="topbar">
      <div style={{ flex: 1 }}>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="flex-row">
        {actions}
      </div>
    </div>
  );
}
