const BASE = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

function getToken() {
  return localStorage.getItem("tf_token");
}

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// Auth
export const authAPI = {
  signup: (body) => apiFetch("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => apiFetch("/auth/me"),
};

// Projects
export const projectsAPI = {
  list: () => apiFetch("/projects"),
  get: (id) => apiFetch(`/projects/${id}`),
  create: (body) => apiFetch("/projects", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/projects/${id}`, { method: "DELETE" }),
};

// Members
export const membersAPI = {
  list: (pid) => apiFetch(`/projects/${pid}/members`),
  add: (pid, body) => apiFetch(`/projects/${pid}/members`, { method: "POST", body: JSON.stringify(body) }),
  updateRole: (pid, uid, role) => apiFetch(`/projects/${pid}/members/${uid}`, { method: "PATCH", body: JSON.stringify({ role }) }),
  remove: (pid, uid) => apiFetch(`/projects/${pid}/members/${uid}`, { method: "DELETE" }),
};

// Tasks
export const tasksAPI = {
  list: (pid) => apiFetch(`/projects/${pid}/tasks`),
  create: (pid, body) => apiFetch(`/projects/${pid}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  update: (pid, tid, body) => apiFetch(`/projects/${pid}/tasks/${tid}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (pid, tid) => apiFetch(`/projects/${pid}/tasks/${tid}`, { method: "DELETE" }),
};

// Dashboard
export const dashboardAPI = {
  get: () => apiFetch("/dashboard"),
};
