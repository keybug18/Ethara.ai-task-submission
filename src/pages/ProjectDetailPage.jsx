import { useEffect, useState, useMemo } from "react";
import { projectsAPI, tasksAPI, membersAPI } from "../api/client";
import { useAuth } from "../context/AuthContext";
import TopBar from "../components/Layout/TopBar";
import { Button, Modal, Badge, Avatar, PageLoader, EmptyState } from "../components/UI";
import { StatusDonutChart, PriorityDonutChart, WorkloadChart } from "../components/Charts";

// ── HELPERS ───────────────────────────────────────────────────────────────
function fmtDate(s) {
  if (!s) return "";
  return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function dueClass(due) {
  if (!due) return "";
  const d = new Date(due), now = new Date(); now.setHours(0,0,0,0);
  if (d < now) return "due-overdue";
  return (d - now) / 86400000 <= 3 ? "due-soon" : "due-ok";
}

// ── TASK FORM ─────────────────────────────────────────────────────────────
function TaskForm({ task, projectId, members, onSave, onClose }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    assignee_id: task?.assignee_id || "",
    due_date: task?.due_date || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handle = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const body = { ...form, assignee_id: form.assignee_id ? Number(form.assignee_id) : null };
      const result = task
        ? await tasksAPI.update(projectId, task.id, body)
        : await tasksAPI.create(projectId, body);
      onSave(result);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handle}>
      {error && <div className="error-banner">{error}</div>}
      <div className="form-group">
        <label className="form-label">Title *</label>
        <input className="input" placeholder="Task title" value={form.title} onChange={e => set("title")(e.target.value)} required />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="input" placeholder="Optional details…" value={form.description} onChange={e => set("description")(e.target.value)} />
      </div>
      <div className="grid-2">
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="input" value={form.status} onChange={e => set("status")(e.target.value)}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="input" value={form.priority} onChange={e => set("priority")(e.target.value)}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Assignee</label>
          <select className="input" value={form.assignee_id} onChange={e => set("assignee_id")(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input className="input" type="date" value={form.due_date} onChange={e => set("due_date")(e.target.value)} />
        </div>
      </div>
      <div className="modal-footer">
        <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
        <Button type="submit" disabled={saving}>{saving ? "Saving…" : task ? "Update Task" : "Create Task"}</Button>
      </div>
    </form>
  );
}

// ── TASK ROW ──────────────────────────────────────────────────────────────
function TaskRow({ task, onEdit, onDelete, onStatusCycle }) {
  const dc = dueClass(task.due_date);
  return (
    <div className="task-row" onClick={() => onEdit(task)}>
      <div
        className={`task-check ${task.status}`}
        onClick={e => { e.stopPropagation(); onStatusCycle(task); }}
      >
        {task.status === "done" && "✓"}
        {task.status === "in_progress" && "●"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={`task-title-text ${task.status === "done" ? "done" : ""}`}>{task.title}</div>
        <div className="task-meta-row">
          <Badge type={task.status}>{task.status.replace("_", " ")}</Badge>
          <Badge type={task.priority}>{task.priority}</Badge>
          {task.assignee_name && <span style={{ fontSize: 11, color: "var(--text2)" }}>👤 {task.assignee_name}</span>}
          {task.due_date && <span className={dc} style={{ fontSize: 11 }}>📅 {fmtDate(task.due_date)}{dc === "due-overdue" ? " · Overdue" : ""}</span>}
        </div>
      </div>
      <div className="task-actions" onClick={e => e.stopPropagation()}>
        <button className="icon-btn del" onClick={() => onDelete(task)}>🗑</button>
      </div>
    </div>
  );
}

// ── KANBAN BOARD ──────────────────────────────────────────────────────────
function KanbanBoard({ tasks, onEdit, onDelete, onStatusCycle }) {
  const cols = [
    { key: "todo",        label: "To Do",       color: "var(--text2)" },
    { key: "in_progress", label: "In Progress", color: "var(--accent5)" },
    { key: "done",        label: "Done",        color: "var(--accent3)" },
  ];

  return (
    <div className="kanban-board">
      {cols.map(col => {
        const colTasks = tasks.filter(t => t.status === col.key);
        return (
          <div className="kanban-col" key={col.key}>
            <div className="kanban-col-header">
              <span className="kanban-col-title" style={{ color: col.color }}>{col.label}</span>
              <span className="kanban-count">{colTasks.length}</span>
            </div>
            <div className="kanban-cards">
              {colTasks.map(t => (
                <div className="kanban-card" key={t.id} onClick={() => onEdit(t)}>
                  <div className="kanban-card-title">{t.title}</div>
                  <div className="task-meta-row">
                    <Badge type={t.priority}>{t.priority}</Badge>
                    {t.assignee_name && <span style={{ fontSize: 11, color: "var(--text2)" }}>👤 {t.assignee_name}</span>}
                    {t.due_date && (
                      <span className={dueClass(t.due_date)} style={{ fontSize: 11 }}>📅 {fmtDate(t.due_date)}</span>
                    )}
                  </div>
                </div>
              ))}
              {colTasks.length === 0 && <div className="kanban-empty">No tasks</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── MEMBERS PANEL ─────────────────────────────────────────────────────────
function MembersModal({ projectId, members, setMembers, isAdmin, onClose, onToast, tasks }) {
  const { user } = useAuth();
  const [newMember, setNewMember] = useState({ email: "", role: "member" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      await membersAPI.add(projectId, newMember);
      const updated = await membersAPI.list(projectId);
      setMembers(updated);
      setNewMember({ email: "", role: "member" });
      onToast("Member added!", "success");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleRemove = async (uid) => {
    if (!confirm("Remove this member?")) return;
    try {
      await membersAPI.remove(projectId, uid);
      setMembers(members.filter(m => m.id !== uid));
      onToast("Member removed");
    } catch (err) { onToast(err.message, "error"); }
  };

  const handleRoleChange = async (uid, role) => {
    try {
      await membersAPI.updateRole(projectId, uid, role);
      setMembers(members.map(m => m.id === uid ? { ...m, role } : m));
      onToast("Role updated");
    } catch (err) { onToast(err.message, "error"); }
  };

  return (
    <Modal title={`Team Members (${members.length})`} onClose={onClose} width={520}>
      {/* Workload chart */}
      <div style={{ marginBottom: 16, padding: "14px 0 0" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Open Task Workload</div>
        <WorkloadChart members={members} tasks={tasks} />
      </div>
      <div className="divider" />

      {/* Members list */}
      <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 16 }}>
        {members.map(m => (
          <div className="member-row" key={m.id}>
            <Avatar name={m.name} size="sm" />
            <div className="member-info">
              <div className="member-name">{m.name} {m.id === user.id && <span style={{ color: "var(--text3)", fontWeight: 400, fontSize: 11 }}>(you)</span>}</div>
              <div className="member-email">{m.email}</div>
            </div>
            {isAdmin && m.id !== user.id ? (
              <div className="flex-row gap-8">
                <select className="input" style={{ width: 95, padding: "4px 8px", fontSize: 12 }}
                  value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <Button variant="danger" size="xs" onClick={() => handleRemove(m.id)}>Remove</Button>
              </div>
            ) : <Badge type={m.role}>{m.role}</Badge>}
          </div>
        ))}
      </div>

      {/* Add member */}
      {isAdmin && (
        <>
          <div className="divider" />
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Add Member</div>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email</label>
                <input className="input" type="email" placeholder="user@email.com" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} required />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Role</label>
                <select className="input" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})}>
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add Member"}</Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  );
}

// ── PROJECT DETAIL PAGE ───────────────────────────────────────────────────
export default function ProjectDetailPage({ projectId, onNavigate, onToast }) {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("kanban");
  const [editTask, setEditTask] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      projectsAPI.get(projectId),
      tasksAPI.list(projectId),
      membersAPI.list(projectId),
    ]).then(([p, t, m]) => { setProject(p); setTasks(t); setMembers(m); })
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleSaveTask = (saved) => {
    setTasks(prev => editTask ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
    setShowTaskForm(false); setEditTask(null);
    onToast(editTask ? "Task updated!" : "Task created!", "success");
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Delete "${task.title}"?`)) return;
    try {
      await tasksAPI.delete(projectId, task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
      onToast("Task deleted");
    } catch (err) { onToast(err.message, "error"); }
  };

  const handleStatusCycle = async (task) => {
    const next = { todo: "in_progress", in_progress: "done", done: "todo" };
    try {
      const updated = await tasksAPI.update(projectId, task.id, { ...task, status: next[task.status] });
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    } catch (err) { onToast(err.message, "error"); }
  };

  if (loading) return <PageLoader text="Loading project…" />;
  if (!project) return <EmptyState icon="❌" title="Project not found" />;

  const isAdmin = project.my_role === "admin";
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Priority counts for chart
  const pCounts = tasks.reduce((a, t) => ({ ...a, [t.priority]: (a[t.priority]||0)+1 }), { high:0, medium:0, low:0 });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar
        title={project.name}
        subtitle={
          <span>
            <button style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontSize: 12, fontWeight: 600, padding: 0 }}
              onClick={() => onNavigate("projects")}>← Projects</button>
            {project.description && <span style={{ color: "var(--text3)" }}> · {project.description}</span>}
          </span>
        }
        actions={
          <div className="flex-row">
            <Button variant="ghost" onClick={() => setShowMembers(true)}>👥 {members.length} Members</Button>
            <Button onClick={() => { setEditTask(null); setShowTaskForm(true); }}>+ Add Task</Button>
          </div>
        }
      />

      <div className="page-body">
        {/* ── Project stats row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 14, marginBottom: 20, alignItems: "stretch" }}>
          {/* Progress */}
          <div className="card card-pad" style={{ gridColumn: "1 / 3" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Project Progress</div>
                <div style={{ fontSize: 12, color: "var(--text2)" }}>{done} of {total} tasks complete</div>
              </div>
              <div style={{ fontSize: 30, fontFamily: "'Cabinet Grotesk',sans-serif", fontWeight: 900, letterSpacing: -1, color: "var(--accent)" }}>{pct}%</div>
            </div>
            <div className="progress-bar-wrap" style={{ height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              {[["todo","To Do","var(--text3)"],["in_progress","In Progress","var(--accent5)"],["done","Done","var(--accent3)"]].map(([s,l,c]) => (
                <div key={s} style={{ fontSize: 12 }}>
                  <span style={{ color: c, fontWeight: 700 }}>{tasks.filter(t=>t.status===s).length}</span>
                  <span style={{ color: "var(--text2)", marginLeft: 4 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status donut */}
          <div className="chart-card">
            <div className="chart-title" style={{ fontSize: 12 }}>Status</div>
            <StatusDonutChart todo={tasks.filter(t=>t.status==="todo").length} in_progress={tasks.filter(t=>t.status==="in_progress").length} done={done} />
          </div>

          {/* Priority donut */}
          <div className="chart-card">
            <div className="chart-title" style={{ fontSize: 12 }}>Priority</div>
            <PriorityDonutChart high={pCounts.high} medium={pCounts.medium} low={pCounts.low} />
          </div>
        </div>

        {/* ── Task views ── */}
        <div className="tabs">
          <button className={`tab ${tab === "kanban" ? "active" : ""}`} onClick={() => setTab("kanban")}>Kanban</button>
          <button className={`tab ${tab === "list" ? "active" : ""}`} onClick={() => setTab("list")}>List</button>
        </div>

        {tab === "kanban" && (
          tasks.length === 0
            ? <EmptyState icon="📋" title="No tasks yet" sub="Click '+ Add Task' to create your first task"
                action={<Button onClick={() => setShowTaskForm(true)}>+ Add Task</Button>} />
            : <KanbanBoard tasks={tasks} onEdit={t => { setEditTask(t); setShowTaskForm(true); }} onDelete={handleDeleteTask} onStatusCycle={handleStatusCycle} />
        )}

        {tab === "list" && (
          tasks.length === 0
            ? <EmptyState icon="📋" title="No tasks yet" sub="Click '+ Add Task' to create your first task"
                action={<Button onClick={() => setShowTaskForm(true)}>+ Add Task</Button>} />
            : <div className="task-list">
                {tasks.map(t => (
                  <TaskRow key={t.id} task={t}
                    onEdit={task => { setEditTask(task); setShowTaskForm(true); }}
                    onDelete={handleDeleteTask}
                    onStatusCycle={handleStatusCycle}
                  />
                ))}
              </div>
        )}
      </div>

      {showTaskForm && (
        <Modal title={editTask ? "Edit Task" : "New Task"} onClose={() => { setShowTaskForm(false); setEditTask(null); }}>
          <TaskForm task={editTask} projectId={projectId} members={members} onSave={handleSaveTask} onClose={() => { setShowTaskForm(false); setEditTask(null); }} />
        </Modal>
      )}

      {showMembers && (
        <MembersModal
          projectId={projectId} members={members} setMembers={setMembers}
          isAdmin={isAdmin} onClose={() => setShowMembers(false)} onToast={onToast} tasks={tasks}
        />
      )}
    </div>
  );
}
