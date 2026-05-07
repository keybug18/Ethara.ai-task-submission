import { useEffect, useRef } from "react";

// ── BUTTON ────────────────────────────────────────────────────────────────
export function Button({ variant = "primary", size, className = "", children, ...props }) {
  const cls = `btn btn-${variant}${size ? ` btn-${size}` : ""} ${className}`;
  return <button className={cls} {...props}>{children}</button>;
}

// ── INPUT ─────────────────────────────────────────────────────────────────
export function Input({ label, className = "", ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <input className={`input ${className}`} {...props} />
    </div>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <select className={`input ${className}`} {...props}>{children}</select>
    </div>
  );
}

export function Textarea({ label, className = "", ...props }) {
  return (
    <div className="form-group">
      {label && <label className="form-label">{label}</label>}
      <textarea className={`input ${className}`} {...props} />
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 500 }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width }}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────
export function Badge({ type, children }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}

// ── AVATAR ────────────────────────────────────────────────────────────────
export function Avatar({ name = "", size = "" }) {
  const initials = name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return <div className={`avatar ${size}`}>{initials}</div>;
}

// ── TOAST CONTAINER ───────────────────────────────────────────────────────
export function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
          {t.text}
        </div>
      ))}
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────
export function EmptyState({ icon, title, sub, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub" style={{ marginBottom: action ? 18 : 0 }}>{sub}</div>}
      {action}
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────────────
export function Spinner() {
  return <div className="spinner" />;
}

export function PageLoader({ text = "Loading…" }) {
  return (
    <div className="page-loader">
      <Spinner />
      <span>{text}</span>
    </div>
  );
}
