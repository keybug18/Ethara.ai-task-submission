import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function AuthPage() {
  const { login, signup } = useAuth();
  const { theme, toggle } = useTheme();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") await login(form.email, form.password);
      else await signup(form.name, form.email, form.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        style={{
          position: "fixed", top: 20, right: 20,
          background: "var(--surface)", border: "1px solid var(--border2)",
          borderRadius: 9, padding: "7px 14px",
          color: "var(--text2)", cursor: "pointer", fontSize: 13, fontWeight: 600
        }}
      >
        {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
      </button>

      <div className="auth-box">
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 38, height: 38, background: "var(--accent)",
            borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, boxShadow: "0 0 0 6px var(--accent-glow)"
          }}>⚡</div>
          <div>
            <div className="auth-logo" style={{ marginBottom: 0 }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>Team Task Manager</div>
          </div>
        </div>

        <div className="auth-tagline">
          {mode === "login" ? "Welcome back — sign in to continue" : "Create your account and start collaborating"}
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handle}>
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="input" placeholder="Jane Smith" value={form.name} onChange={set("name")} required />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input className="input" type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="input" type="password" placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"} value={form.password} onChange={set("password")} required />
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "11px", fontSize: 14, marginTop: 4 }}
            type="submit"
            disabled={loading}
          >
            {loading ? "Please wait…" : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login"
            ? <>Don't have an account? <b onClick={() => { setMode("signup"); setError(""); }}>Sign up free</b></>
            : <>Already have an account? <b onClick={() => { setMode("login"); setError(""); }}>Sign in</b></>
          }
        </div>
      </div>
    </div>
  );
}
