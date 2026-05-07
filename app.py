from flask import Flask, request, jsonify, g
import sqlite3
import jwt
import hashlib
import os
import re
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)
SECRET_KEY = "taskmanager_secret_2026_xyz"
DB_PATH = "taskmanager.db"

# ─── CORS ────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        from flask import Response
        r = Response()
        r.headers["Access-Control-Allow-Origin"] = "*"
        r.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        r.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        return r, 200

# ─── DB SETUP ─────────────────────────────────────────────────────────────────
def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db

@app.teardown_appcontext
def close_db(e=None):
    db = g.pop("db", None)
    if db: db.close()

def init_db():
    db = sqlite3.connect(DB_PATH)
    db.row_factory = sqlite3.Row
    db.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            owner_id INTEGER NOT NULL REFERENCES users(id),
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS project_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role TEXT NOT NULL CHECK(role IN ('admin','member')) DEFAULT 'member',
            UNIQUE(project_id, user_id)
        );

        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL CHECK(status IN ('todo','in_progress','done')) DEFAULT 'todo',
            priority TEXT NOT NULL CHECK(priority IN ('low','medium','high')) DEFAULT 'medium',
            assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_by INTEGER NOT NULL REFERENCES users(id),
            due_date TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );
    """)
    db.commit()
    db.close()

# ─── HELPERS ──────────────────────────────────────────────────────────────────
def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def make_token(user_id, email):
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")
def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "Unauthorized"}), 401
        try:
            payload = jwt.decode(auth[7:], SECRET_KEY, algorithms=["HS256"])
            g.user_id = int(payload["sub"])
            g.email = payload["email"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except Exception:
            return jsonify({"error": "Invalid token"}), 401
        return f(*args, **kwargs)
    return decorated

def row_to_dict(row):
    return dict(row) if row else None

def rows_to_list(rows):
    return [dict(r) for r in rows]

def get_project_role(db, project_id, user_id):
    row = db.execute(
        "SELECT role FROM project_members WHERE project_id=? AND user_id=?",
        (project_id, user_id)
    ).fetchone()
    return row["role"] if row else None

# ─── AUTH ─────────────────────────────────────────────────────────────────────
@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.json or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "All fields required"}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    db = get_db()
    if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        return jsonify({"error": "Email already registered"}), 409

    cur = db.execute("INSERT INTO users (name, email, password_hash) VALUES (?,?,?)",
                     (name, email, hash_pw(password)))
    db.commit()
    user_id = cur.lastrowid
    user = row_to_dict(db.execute("SELECT id, name, email, created_at FROM users WHERE id=?", (user_id,)).fetchone())
    return jsonify({"token": make_token(user_id, email), "user": user}), 201

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    db = get_db()
    row = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
    if not row or row["password_hash"] != hash_pw(password):
        return jsonify({"error": "Invalid credentials"}), 401

    user = {"id": row["id"], "name": row["name"], "email": row["email"], "created_at": row["created_at"]}
    return jsonify({"token": make_token(row["id"], email), "user": user})

@app.route("/api/auth/me", methods=["GET"])
@require_auth
def me():
    db = get_db()
    user = row_to_dict(db.execute("SELECT id, name, email, created_at FROM users WHERE id=?", (g.user_id,)).fetchone())
    return jsonify(user)

# ─── USERS ────────────────────────────────────────────────────────────────────
@app.route("/api/users", methods=["GET"])
@require_auth
def list_users():
    db = get_db()
    users = rows_to_list(db.execute("SELECT id, name, email FROM users ORDER BY name").fetchall())
    return jsonify(users)

# ─── PROJECTS ─────────────────────────────────────────────────────────────────
@app.route("/api/projects", methods=["GET"])
@require_auth
def list_projects():
    db = get_db()
    projects = rows_to_list(db.execute("""
        SELECT p.*, u.name as owner_name, pm.role as my_role,
               (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
               (SELECT COUNT(*) FROM project_members m WHERE m.project_id = p.id) as member_count
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        ORDER BY p.created_at DESC
    """, (g.user_id,)).fetchall())
    return jsonify(projects)

@app.route("/api/projects", methods=["POST"])
@require_auth
def create_project():
    data = request.json or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    if not name:
        return jsonify({"error": "Project name required"}), 400

    db = get_db()
    cur = db.execute("INSERT INTO projects (name, description, owner_id) VALUES (?,?,?)",
                     (name, description, g.user_id))
    project_id = cur.lastrowid
    # creator is admin
    db.execute("INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)",
               (project_id, g.user_id, "admin"))
    db.commit()
    project = row_to_dict(db.execute("""
        SELECT p.*, u.name as owner_name, 'admin' as my_role, 0 as task_count, 1 as member_count
        FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id=?
    """, (project_id,)).fetchone())
    return jsonify(project), 201

@app.route("/api/projects/<int:pid>", methods=["GET"])
@require_auth
def get_project(pid):
    db = get_db()
    role = get_project_role(db, pid, g.user_id)
    if not role:
        return jsonify({"error": "Not found or access denied"}), 404
    project = row_to_dict(db.execute("""
        SELECT p.*, u.name as owner_name, ? as my_role,
               (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count
        FROM projects p JOIN users u ON u.id = p.owner_id WHERE p.id=?
    """, (role, pid)).fetchone())
    return jsonify(project)

@app.route("/api/projects/<int:pid>", methods=["PUT"])
@require_auth
def update_project(pid):
    db = get_db()
    role = get_project_role(db, pid, g.user_id)
    if role != "admin":
        return jsonify({"error": "Admin only"}), 403
    data = request.json or {}
    name = (data.get("name") or "").strip()
    description = (data.get("description") or "").strip()
    if not name:
        return jsonify({"error": "Name required"}), 400
    db.execute("UPDATE projects SET name=?, description=? WHERE id=?", (name, description, pid))
    db.commit()
    return get_project(pid)

@app.route("/api/projects/<int:pid>", methods=["DELETE"])
@require_auth
def delete_project(pid):
    db = get_db()
    proj = db.execute("SELECT * FROM projects WHERE id=?", (pid,)).fetchone()
    if not proj or proj["owner_id"] != g.user_id:
        return jsonify({"error": "Owner only"}), 403
    db.execute("DELETE FROM projects WHERE id=?", (pid,))
    db.commit()
    return jsonify({"success": True})

# ─── MEMBERS ──────────────────────────────────────────────────────────────────
@app.route("/api/projects/<int:pid>/members", methods=["GET"])
@require_auth
def list_members(pid):
    db = get_db()
    if not get_project_role(db, pid, g.user_id):
        return jsonify({"error": "Access denied"}), 403
    members = rows_to_list(db.execute("""
        SELECT u.id, u.name, u.email, pm.role
        FROM project_members pm JOIN users u ON u.id = pm.user_id
        WHERE pm.project_id=? ORDER BY pm.role DESC, u.name
    """, (pid,)).fetchall())
    return jsonify(members)

@app.route("/api/projects/<int:pid>/members", methods=["POST"])
@require_auth
def add_member(pid):
    db = get_db()
    if get_project_role(db, pid, g.user_id) != "admin":
        return jsonify({"error": "Admin only"}), 403
    data = request.json or {}
    email = (data.get("email") or "").strip().lower()
    role = data.get("role", "member")
    if role not in ("admin", "member"):
        return jsonify({"error": "Invalid role"}), 400
    user = db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone()
    if not user:
        return jsonify({"error": "User not found"}), 404
    try:
        db.execute("INSERT INTO project_members (project_id, user_id, role) VALUES (?,?,?)",
                   (pid, user["id"], role))
        db.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Already a member"}), 409
    return jsonify({"success": True}), 201

@app.route("/api/projects/<int:pid>/members/<int:uid>", methods=["PATCH"])
@require_auth
def update_member_role(pid, uid):
    db = get_db()
    if get_project_role(db, pid, g.user_id) != "admin":
        return jsonify({"error": "Admin only"}), 403
    data = request.json or {}
    role = data.get("role")
    if role not in ("admin", "member"):
        return jsonify({"error": "Invalid role"}), 400
    db.execute("UPDATE project_members SET role=? WHERE project_id=? AND user_id=?", (role, pid, uid))
    db.commit()
    return jsonify({"success": True})

@app.route("/api/projects/<int:pid>/members/<int:uid>", methods=["DELETE"])
@require_auth
def remove_member(pid, uid):
    db = get_db()
    if get_project_role(db, pid, g.user_id) != "admin" and uid != g.user_id:
        return jsonify({"error": "Forbidden"}), 403
    # prevent removing last admin
    admins = db.execute("SELECT COUNT(*) as c FROM project_members WHERE project_id=? AND role='admin'", (pid,)).fetchone()["c"]
    my_role = db.execute("SELECT role FROM project_members WHERE project_id=? AND user_id=?", (pid, uid)).fetchone()
    if my_role and my_role["role"] == "admin" and admins <= 1:
        return jsonify({"error": "Cannot remove last admin"}), 400
    db.execute("DELETE FROM project_members WHERE project_id=? AND user_id=?", (pid, uid))
    db.commit()
    return jsonify({"success": True})

# ─── TASKS ────────────────────────────────────────────────────────────────────
@app.route("/api/projects/<int:pid>/tasks", methods=["GET"])
@require_auth
def list_tasks(pid):
    db = get_db()
    if not get_project_role(db, pid, g.user_id):
        return jsonify({"error": "Access denied"}), 403
    tasks = rows_to_list(db.execute("""
        SELECT t.*, u.name as assignee_name, c.name as creator_name
        FROM tasks t
        LEFT JOIN users u ON u.id = t.assignee_id
        JOIN users c ON c.id = t.created_by
        WHERE t.project_id=? ORDER BY t.created_at DESC
    """, (pid,)).fetchall())
    return jsonify(tasks)

@app.route("/api/projects/<int:pid>/tasks", methods=["POST"])
@require_auth
def create_task(pid):
    db = get_db()
    if not get_project_role(db, pid, g.user_id):
        return jsonify({"error": "Access denied"}), 403
    data = request.json or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title required"}), 400
    description = (data.get("description") or "").strip()
    status = data.get("status", "todo")
    priority = data.get("priority", "medium")
    assignee_id = data.get("assignee_id")
    due_date = data.get("due_date")

    if status not in ("todo", "in_progress", "done"):
        return jsonify({"error": "Invalid status"}), 400
    if priority not in ("low", "medium", "high"):
        return jsonify({"error": "Invalid priority"}), 400

    # validate assignee is a project member
    if assignee_id:
        if not get_project_role(db, pid, assignee_id):
            return jsonify({"error": "Assignee not in project"}), 400

    cur = db.execute("""
        INSERT INTO tasks (project_id, title, description, status, priority, assignee_id, created_by, due_date)
        VALUES (?,?,?,?,?,?,?,?)
    """, (pid, title, description, status, priority, assignee_id, g.user_id, due_date))
    db.commit()
    task = row_to_dict(db.execute("""
        SELECT t.*, u.name as assignee_name, c.name as creator_name
        FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
        JOIN users c ON c.id = t.created_by WHERE t.id=?
    """, (cur.lastrowid,)).fetchone())
    return jsonify(task), 201

@app.route("/api/projects/<int:pid>/tasks/<int:tid>", methods=["PUT"])
@require_auth
def update_task(pid, tid):
    db = get_db()
    role = get_project_role(db, pid, g.user_id)
    if not role:
        return jsonify({"error": "Access denied"}), 403
    task = db.execute("SELECT * FROM tasks WHERE id=? AND project_id=?", (tid, pid)).fetchone()
    if not task:
        return jsonify({"error": "Task not found"}), 404

    # members can only update tasks assigned to them or created by them
    if role == "member" and task["assignee_id"] != g.user_id and task["created_by"] != g.user_id:
        return jsonify({"error": "Not allowed"}), 403

    data = request.json or {}
    title = (data.get("title") or task["title"]).strip()
    description = data.get("description", task["description"])
    status = data.get("status", task["status"])
    priority = data.get("priority", task["priority"])
    assignee_id = data.get("assignee_id", task["assignee_id"])
    due_date = data.get("due_date", task["due_date"])

    db.execute("""
        UPDATE tasks SET title=?, description=?, status=?, priority=?, assignee_id=?, due_date=?,
        updated_at=datetime('now') WHERE id=?
    """, (title, description, status, priority, assignee_id, due_date, tid))
    db.commit()
    task = row_to_dict(db.execute("""
        SELECT t.*, u.name as assignee_name, c.name as creator_name
        FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id
        JOIN users c ON c.id = t.created_by WHERE t.id=?
    """, (tid,)).fetchone())
    return jsonify(task)

@app.route("/api/projects/<int:pid>/tasks/<int:tid>", methods=["DELETE"])
@require_auth
def delete_task(pid, tid):
    db = get_db()
    role = get_project_role(db, pid, g.user_id)
    if not role:
        return jsonify({"error": "Access denied"}), 403
    task = db.execute("SELECT * FROM tasks WHERE id=? AND project_id=?", (tid, pid)).fetchone()
    if not task:
        return jsonify({"error": "Task not found"}), 404
    if role == "member" and task["created_by"] != g.user_id:
        return jsonify({"error": "Not allowed"}), 403
    db.execute("DELETE FROM tasks WHERE id=?", (tid,))
    db.commit()
    return jsonify({"success": True})

# ─── DASHBOARD ────────────────────────────────────────────────────────────────
@app.route("/api/dashboard", methods=["GET"])
@require_auth
def dashboard():
    db = get_db()
    uid = g.user_id
    today = datetime.utcnow().date().isoformat()

    project_ids = [r["project_id"] for r in db.execute(
        "SELECT project_id FROM project_members WHERE user_id=?", (uid,)).fetchall()]

    if not project_ids:
        return jsonify({
            "total_projects": 0, "total_tasks": 0,
            "todo": 0, "in_progress": 0, "done": 0, "overdue": 0,
            "my_tasks": [], "recent_tasks": [], "projects_summary": []
        })

    ph = ",".join("?" * len(project_ids))

    total_tasks = db.execute(f"SELECT COUNT(*) as c FROM tasks WHERE project_id IN ({ph})", project_ids).fetchone()["c"]
    todo = db.execute(f"SELECT COUNT(*) as c FROM tasks WHERE project_id IN ({ph}) AND status='todo'", project_ids).fetchone()["c"]
    in_progress = db.execute(f"SELECT COUNT(*) as c FROM tasks WHERE project_id IN ({ph}) AND status='in_progress'", project_ids).fetchone()["c"]
    done = db.execute(f"SELECT COUNT(*) as c FROM tasks WHERE project_id IN ({ph}) AND status='done'", project_ids).fetchone()["c"]
    overdue = db.execute(f"SELECT COUNT(*) as c FROM tasks WHERE project_id IN ({ph}) AND due_date < ? AND status != 'done'",
                         project_ids + [today]).fetchone()["c"]

    my_tasks = rows_to_list(db.execute(f"""
        SELECT t.*, p.name as project_name, u.name as assignee_name
        FROM tasks t JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assignee_id
        WHERE t.project_id IN ({ph}) AND t.assignee_id=? AND t.status != 'done'
        ORDER BY t.due_date ASC NULLS LAST, t.priority DESC LIMIT 10
    """, project_ids + [uid]).fetchall())

    recent_tasks = rows_to_list(db.execute(f"""
        SELECT t.*, p.name as project_name, u.name as assignee_name
        FROM tasks t JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assignee_id
        WHERE t.project_id IN ({ph})
        ORDER BY t.updated_at DESC LIMIT 10
    """, project_ids).fetchall())

    projects_summary = rows_to_list(db.execute(f"""
        SELECT p.id, p.name, pm.role,
               COUNT(t.id) as total,
               SUM(CASE WHEN t.status='done' THEN 1 ELSE 0 END) as done_count,
               SUM(CASE WHEN t.status='in_progress' THEN 1 ELSE 0 END) as in_progress_count,
               SUM(CASE WHEN t.status='todo' THEN 1 ELSE 0 END) as todo_count
        FROM projects p
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        LEFT JOIN tasks t ON t.project_id = p.id
        WHERE p.id IN ({ph})
        GROUP BY p.id ORDER BY p.created_at DESC
    """, [uid] + project_ids).fetchall())

    return jsonify({
        "total_projects": len(project_ids),
        "total_tasks": total_tasks,
        "todo": todo,
        "in_progress": in_progress,
        "done": done,
        "overdue": overdue,
        "my_tasks": my_tasks,
        "recent_tasks": recent_tasks,
        "projects_summary": projects_summary
    })

# ─── MAIN ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    print("✅ Database initialized")
    app.run(host="0.0.0.0", port=5001, debug=False)
