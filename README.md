# TaskFlow

A full-stack task and project management web application built with a React frontend and a Flask backend. TaskFlow helps teams organize projects, manage tasks, track priorities, and visualize progress through an interactive dashboard.

---

## Features

- **Authentication** — Secure sign-up and login with JWT-based session management
- **Project Management** — Create, update, and delete projects; manage team members with `admin` or `member` roles
- **Task Tracking** — Create tasks with status (`todo`, `in_progress`, `done`), priority (`low`, `medium`, `high`), assignees, and due dates
- **Dashboard** — Visual overview of task status, priority distribution, per-project progress, weekly activity, and team workload via interactive charts
- **My Tasks** — Personal view of tasks assigned to the logged-in user
- **Dark/Light Theme** — Client-side theme toggle persisted across sessions
- **Toast Notifications** — Real-time feedback for all actions

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Recharts            |
| Backend  | Python, Flask, SQLite               |
| Auth     | JWT (PyJWT), SHA-256 password hashing |

---

## Project Structure

```
taskflow/
├── app.py                  # Flask backend — all API routes and DB logic
├── requirements.txt        # Python dependencies
├── package.json            # Node dependencies
├── package-lock.json       # Locked dependency tree
├── vite.config.js          # Vite dev server config (port 5173)
├── index.html              # HTML entry point
├── .gitignore
├── taskmanager.db          # SQLite database (auto-created on first run)
└── src/
    ├── main.jsx            # React entry point
    ├── App.jsx             # Root component, routing, toast state
    ├── index.css           # Global styles and CSS variables
    ├── api/
    │   └── client.js       # Typed API client (auth, projects, members, tasks, dashboard)
    ├── context/
    │   ├── AuthContext.jsx  # Authentication state and provider
    │   └── ThemeContext.jsx # Theme (dark/light) state and provider
    ├── components/
    │   ├── UI/             # Reusable UI primitives (Button, Badge, Toast, etc.)
    │   ├── Charts/         # Recharts-based chart components
    │   └── Layout/
    │       ├── Sidebar.jsx  # Navigation sidebar
    │       └── TopBar.jsx   # Page top bar
    └── pages/
        ├── AuthPage.jsx          # Login / Sign-up page
        ├── DashboardPage.jsx     # Analytics dashboard
        ├── ProjectsPage.jsx      # Projects list
        ├── ProjectDetailPage.jsx # Project tasks and member management
        └── MyTasksPage.jsx       # Personal task view
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the Flask server (runs on port 5001)
python app.py
```

The backend will initialize a local SQLite database (`taskmanager.db`) automatically on first run.

### 2. Frontend Setup

```bash
# Install Node dependencies
npm install

# Start the Vite dev server (runs on port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The frontend expects the backend to be running at `http://localhost:5001`. To change this, set the `VITE_API_URL` environment variable before running `npm run dev`.

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require a `Bearer <token>` Authorization header.

### Auth

| Method | Endpoint          | Description              |
|--------|-------------------|--------------------------|
| POST   | `/auth/signup`    | Register a new user      |
| POST   | `/auth/login`     | Login and receive a JWT  |
| GET    | `/auth/me`        | Get current user info    |

### Projects

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/projects`           | List all projects for the user |
| POST   | `/projects`           | Create a new project           |
| GET    | `/projects/:id`       | Get a project by ID            |
| PUT    | `/projects/:id`       | Update a project               |
| DELETE | `/projects/:id`       | Delete a project               |

### Members

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/projects/:id/members`           | List project members     |
| POST   | `/projects/:id/members`           | Add a member             |
| PATCH  | `/projects/:id/members/:uid`      | Update member role       |
| DELETE | `/projects/:id/members/:uid`      | Remove a member          |

### Tasks

| Method | Endpoint                              | Description       |
|--------|---------------------------------------|-------------------|
| GET    | `/projects/:id/tasks`                 | List all tasks    |
| POST   | `/projects/:id/tasks`                 | Create a task     |
| PUT    | `/projects/:id/tasks/:tid`            | Update a task     |
| DELETE | `/projects/:id/tasks/:tid`            | Delete a task     |

### Dashboard

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/dashboard`   | Aggregated stats for the current user|

---

## Available Scripts

| Command         | Description                        |
|-----------------|------------------------------------|
| `npm run dev`   | Start frontend dev server          |
| `npm run build` | Build frontend for production      |
| `npm run preview` | Preview the production build     |

---

## Database

The app uses SQLite with the following tables:

- `users` — registered accounts
- `projects` — projects owned by users
- `project_members` — many-to-many join with roles (`admin`, `member`)
- `tasks` — tasks scoped to projects, with status, priority, assignee, and due date

The database file (`taskmanager.db`) is created automatically in the project root when the backend starts for the first time. It should be added to `.gitignore` to avoid committing it to version control.

---

## Configuration

| Variable       | Default                        | Description                    |
|----------------|--------------------------------|--------------------------------|
| `VITE_API_URL` | `http://localhost:5001/api`    | Backend base URL for frontend  |
| `SECRET_KEY`   | Hardcoded in `app.py`          | JWT signing secret (change in production) |
| `DB_PATH`      | `taskmanager.db`               | SQLite database file path      |

> ⚠️ **Security note:** The `SECRET_KEY` in `app.py` is hardcoded. Before deploying to production, move it to an environment variable.
