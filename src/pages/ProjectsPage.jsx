import { useEffect, useState } from "react";
import { projectsAPI } from "../api/client";
import TopBar from "../components/Layout/TopBar";
import { Button, Modal, EmptyState, PageLoader, Badge } from "../components/UI";

export default function ProjectsPage({ onNavigate, onToast }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    projectsAPI.list().then(setProjects).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setError(""); setSaving(true);
    try {
      const p = await projectsAPI.create(form);
      setProjects([p, ...projects]);
      setShowForm(false); setForm({ name: "", description: "" });
      onToast("Project created!", "success");
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <PageLoader text="Loading projects…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TopBar
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        actions={<Button onClick={() => setShowForm(true)}>+ New Project</Button>}
      />
      <div className="page-body">
        {projects.length === 0
          ? <EmptyState icon="📁" title="No projects yet" sub="Create your first project to get started"
              action={<Button onClick={() => setShowForm(true)}>+ New Project</Button>} />
          : <div className="project-grid">
              {projects.map(p => <ProjectCard key={p.id} project={p} onClick={() => onNavigate("project", p.id)} />)}
            </div>
        }
      </div>

      {showForm && (
        <Modal title="New Project" onClose={() => { setShowForm(false); setError(""); }}>
          {error && <div className="error-banner">{error}</div>}
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input className="input" placeholder="e.g. Website Redesign" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="input" placeholder="What is this project about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <div className="modal-footer">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Creating…" : "Create Project"}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function ProjectCard({ project: p, onClick }) {
  return (
    <div className="project-card" onClick={onClick}>
      <div>
        <div className="project-name">{p.name}</div>
        <div className="project-desc">{p.description || "No description provided."}</div>
      </div>
      <div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `0%` }} />
        </div>
        <div className="progress-pct" style={{ marginTop: 6 }}>Open project to view progress</div>
      </div>
      <div className="project-footer">
        <Badge type={p.my_role}>{p.my_role}</Badge>
        <span>👥 {p.member_count}</span>
        <span>✓ {p.task_count} tasks</span>
      </div>
    </div>
  );
}
