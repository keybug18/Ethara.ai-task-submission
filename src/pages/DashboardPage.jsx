import { useEffect, useMemo, useState } from "react";
import { dashboardAPI } from "../api/client";
import TopBar from "../components/Layout/TopBar";
import { StatusDonutChart, PriorityDonutChart, ProjectsBarChart, ActivityAreaChart, WorkloadChart } from "../components/Charts";
import { PageLoader, EmptyState, Button, Badge } from "../components/UI";

// ── HELPERS ───────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function dueClass(due) {
  if (!due) return "";
  const d = new Date(due), now = new Date(); now.setHours(0, 0, 0, 0);
  if (d < now) return "due-overdue";
  return (d - now) / 86400000 <= 3 ? "due-soon" : "due-ok";
}

// Generate mock weekly activity from tasks (real apps would have an audit log)
function buildActivityData(tasks) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Use task created_at to bucket into day-of-week
  const created = new Array(7).fill(0);
  const done = new Array(7).fill(0);
  tasks.forEach(t => {
    const dow = (new Date(t.created_at).getDay() + 6) % 7; // Mon=0
    created[dow]++;
    if (t.status === "done") done[dow]++;
  });
  return days.map((day, i) => ({ day, created: created[i], done: done[i] }));
}

function buildPriorityCounts(tasks) {
  return tasks.reduce((acc, t) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, { high: 0, medium: 0, low: 0 });
}

// ── STAT CARD ─────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-accent" style={{ background: color }} />
      <div className="stat-icon" style={{ background: bg }}>
        <span>{icon}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  );
}

// ── TASK ROW (dashboard mini version) ────────────────────────────────────
function MiniTask({ task, onClick }) {
  const dc = dueClass(task.due_date);
  return (
    <div className="task-row" onClick={() => onClick && onClick(task)}>
      <div className={`task-check ${task.status}`}>
        {task.status === "done" && "✓"}
        {task.status === "in_progress" && "●"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`task-title-text ${task.status === "done" ? "done" : ""}`}>{task.title}</div>
        <div className="task-meta-row">
          <Badge type={task.priority}>{task.priority}</Badge>
          {task.project_name && <span style={{ fontSize: 11, color: "var(--text2)" }}>📁 {task.project_name}</span>}
          {task.due_date && <span className={`${dc}`} style={{ fontSize: 11 }}>📅 {fmtDate(task.due_date)}</span>}
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────

export default function DashboardPage({ onNavigate }) {
  const [data, setData] = useState({
    total_projects: 0,
    total_tasks: 0,
    in_progress: 0,
    todo: 0,
    done: 0,
    overdue: 0,
    recent_tasks: [],
    my_tasks: [],
    projects_summary: []
  });
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get()
      .then(d => {
        setData(d);
        setAllTasks(d.recent_tasks || []);
      })
      .catch(err => {
        console.error("Dashboard API Error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const activityData = useMemo(() => buildActivityData(allTasks), [allTasks]);
  const priorityCounts = useMemo(() => buildPriorityCounts(allTasks), [allTasks]);

  if (loading) return <PageLoader text="Loading dashboard…" />;

  const doneRate = data.total_tasks > 0 ? Math.round((data.done / data.total_tasks) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar title="Dashboard" subtitle="Your workspace at a glance" />
      <div className="page-body">

        {/* ── STAT CARDS ── */}
        <div className="stats-grid">
          <StatCard icon="📁" label="Total Projects" value={data.total_projects} color="var(--accent)" bg="rgba(91,106,240,0.12)" trend={`${data.total_projects} active`} />
          <StatCard icon="📋" label="Total Tasks" value={data.total_tasks} color="var(--accent5)" bg="rgba(91,200,240,0.12)" trend={`${doneRate}% complete`} />
          <StatCard icon="🔵" label="In Progress" value={data.in_progress} color="var(--accent5)" bg="rgba(91,200,240,0.10)" />
          <StatCard icon="⏳" label="To Do" value={data.todo} color="var(--accent4)" bg="rgba(245,166,35,0.10)" />
          <StatCard icon="✅" label="Done" value={data.done} color="var(--accent3)" bg="rgba(50,217,136,0.10)" />
          <StatCard icon="🔴" label="Overdue" value={data.overdue} color="var(--accent2)" bg="rgba(240,91,123,0.10)" trend={data.overdue > 0 ? "Needs attention" : "All on track ✓"} />
        </div>

        {/* ── CHARTS ROW 1: Donuts + Area ── */}
        <div className="charts-grid-3 mb-24">
          {/* Left: two donuts */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="chart-card">
              <div className="chart-title">Task Status</div>
              <div className="chart-sub">Distribution across all projects</div>
              <StatusDonutChart todo={data.todo} in_progress={data.in_progress} done={data.done} />
            </div>
            <div className="chart-card">
              <div className="chart-title">Priority Breakdown</div>
              <div className="chart-sub">Open tasks by priority level</div>
              <PriorityDonutChart high={priorityCounts.high} medium={priorityCounts.medium} low={priorityCounts.low} />
            </div>
          </div>

          {/* Right: area + workload stacked */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="chart-card">
              <div className="chart-title">Weekly Activity</div>
              <div className="chart-sub">Tasks created vs completed this week</div>
              <ActivityAreaChart data={activityData} />
            </div>

            <div className="chart-card">
              <div className="chart-title">Projects Overview</div>
              <div className="chart-sub">Task count by project</div>
              <ProjectsBarChart data={data.projects_summary} />
            </div>
          </div>
        </div>

        {/* ── BOTTOM ROW: My Tasks + Recent Activity ── */}
        <div className="grid-2" style={{ gap: 16 }}>

          {/* My tasks */}
          <div className="card card-pad">
            <div className="section-hd">
              <div className="section-title">My Open Tasks</div>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate("mytasks")}>View all →</button>
            </div>
            {data.my_tasks.length === 0
              ? <EmptyState icon="🎉" title="All caught up!" sub="No tasks assigned to you right now." />
              : <div className="task-list">
                {data.my_tasks.slice(0, 6).map(t => <MiniTask key={t.id} task={t} />)}
              </div>
            }
          </div>

          {/* Recent tasks */}
          <div className="card card-pad">
            <div className="section-hd">
              <div className="section-title">Recent Activity</div>
            </div>
            {data.recent_tasks.length === 0
              ? <EmptyState icon="📝" title="No tasks yet" sub="Create your first task to see activity here." />
              : <div className="task-list">
                {data.recent_tasks.slice(0, 6).map(t => (
                  <div className="activity-item" key={t.id}>
                    <div className="activity-dot" style={{
                      background: t.status === "done" ? "var(--accent3)" : t.status === "in_progress" ? "var(--accent5)" : "var(--text3)"
                    }} />
                    <div className="activity-text">
                      <span style={{ fontWeight: 600 }}>{t.title}</span>
                      <span style={{ color: "var(--text2)" }}> in </span>
                      <span style={{ color: "var(--accent)", fontWeight: 600, cursor: "pointer" }}
                        onClick={() => onNavigate("project", t.project_id)}>
                        {t.project_name}
                      </span>
                      <div className="activity-time flex-row gap-8" style={{ marginTop: 4 }}>
                        <Badge type={t.status}>{t.status.replace("_", " ")}</Badge>
                        <Badge type={t.priority}>{t.priority}</Badge>
                        {t.assignee_name && <span>👤 {t.assignee_name}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  );
}
