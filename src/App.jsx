import { useState, useCallback, useRef } from "react";
import { useAuth } from "./context/AuthContext";
import { useTheme } from "./context/ThemeContext";
import Sidebar from "./components/Layout/Sidebar";
import { ToastContainer, PageLoader } from "./components/UI";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import MyTasksPage from "./pages/MyTasksPage";

let toastId = 0;

export default function App() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [projectId, setProjectId] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((text, type = "success") => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const navigate = useCallback((p, id = null) => {
    setPage(p);
    if (id !== null) setProjectId(id);
  }, []);

  // Count overdue tasks for sidebar badge (just show a dot if >0)
  // This is a lightweight approach without fetching on every render

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
        <PageLoader text="Starting TaskFlow…" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={navigate} overdueCt={0} />
      <div className="main-area">
        {page === "dashboard" && <DashboardPage onNavigate={navigate} onToast={showToast} />}
        {page === "projects"  && <ProjectsPage  onNavigate={navigate} onToast={showToast} />}
        {page === "project"   && <ProjectDetailPage projectId={projectId} onNavigate={navigate} onToast={showToast} />}
        {page === "mytasks"   && <MyTasksPage   onNavigate={navigate} onToast={showToast} />}
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}
