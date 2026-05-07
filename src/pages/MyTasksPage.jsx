import { useEffect, useState } from "react";
import { dashboardAPI } from "../api/client";
import TopBar from "../components/Layout/TopBar";
import { Badge, PageLoader, EmptyState } from "../components/UI";

function fmtDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function dueClass(due) {
  if (!due) return "";
  const d = new Date(due), now = new Date(); now.setHours(0,0,0,0);
  if (d < now) return "due-overdue";
  return (d - now) / 86400000 <= 3 ? "due-soon" : "due-ok";
}

export default function MyTasksPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader text="Loading tasks…" />;

  const today = new Date(); today.setHours(0,0,0,0);
  const tasks = data.my_tasks || [];
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < today);
  const inProgress = tasks.filter(t => t.status === "in_progress");
  const filtered =
    filter === "overdue"     ? overdue :
    filter === "in_progress" ? inProgress : tasks;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="My Tasks" subtitle="Tasks assigned to you across all projects" />
      <div className="page-body">

        {/* Summary mini-stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {[
            { label: "Assigned to me", value: tasks.length, color: "var(--accent)" },
            { label: "In Progress",    value: inProgress.length, color: "var(--accent5)" },
            { label: "Overdue",        value: overdue.length,    color: "var(--accent2)" },
          ].map(s => (
            <div key={s.label} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "14px 20px", minWidth: 130,
            }}>
              <div style={{ fontSize: 24, fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, color: s.color, letterSpacing: -1 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="tabs">
          <button className={`tab ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>All ({tasks.length})</button>
          <button className={`tab ${filter === "in_progress" ? "active" : ""}`} onClick={() => setFilter("in_progress")}>In Progress ({inProgress.length})</button>
          <button className={`tab ${filter === "overdue" ? "active" : ""}`} onClick={() => setFilter("overdue")}>
            Overdue {overdue.length > 0 && <span style={{ marginLeft: 4, background: "var(--accent2)", color: "white", borderRadius: 20, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>{overdue.length}</span>}
          </button>
        </div>

        {filtered.length === 0
          ? <EmptyState icon={filter === "overdue" ? "🎉" : "✅"} title={filter === "overdue" ? "No overdue tasks!" : "No tasks here"} sub={filter === "overdue" ? "You're all caught up" : "Nothing to show for this filter"} />
          : <div className="task-list">
              {filtered.map(t => (
                <div className="task-row" key={t.id}>
                  <div className={`task-check ${t.status}`}>
                    {t.status === "done" && "✓"}
                    {t.status === "in_progress" && "●"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className={`task-title-text ${t.status === "done" ? "done" : ""}`}>{t.title}</div>
                    <div className="task-meta-row">
                      <Badge type={t.status}>{t.status.replace("_", " ")}</Badge>
                      <Badge type={t.priority}>{t.priority}</Badge>
                      {t.due_date && <span className={dueClass(t.due_date)} style={{ fontSize: 11 }}>📅 {fmtDate(t.due_date)}</span>}
                      <span
                        style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", fontWeight: 600 }}
                        onClick={() => onNavigate("project", t.project_id)}
                      >
                        📁 {t.project_name}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}
