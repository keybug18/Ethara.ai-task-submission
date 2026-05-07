import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, Legend,
} from "recharts";
import { useTheme } from "../../context/ThemeContext";

// ── SHARED TOOLTIP STYLE ──────────────────────────────────────────────────
function TooltipBox({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border2)",
      borderRadius: 9, padding: "10px 14px", fontSize: 12,
      boxShadow: "var(--shadow)", color: "var(--text)"
    }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 6, color: "var(--text2)" }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "var(--text2)" }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── DONUT CHART — Task Status ─────────────────────────────────────────────
export function StatusDonutChart({ todo, in_progress, done }) {
  const data = [
    { name: "To Do",       value: todo,        color: "var(--text3)" },
    { name: "In Progress", value: in_progress, color: "var(--accent5)" },
    { name: "Done",        value: done,         color: "var(--accent3)" },
  ].filter(d => d.value > 0);

  const total = todo + in_progress + done;

  if (total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "var(--text3)", fontSize: 13 }}>
        No tasks yet
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={55} outerRadius={78}
            paddingAngle={3}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center", pointerEvents: "none"
      }}>
        <div style={{ fontSize: 26, fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, letterSpacing: -1, color: "var(--text)" }}>{total}</div>
        <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Total</div>
      </div>
      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
            <span style={{ color: "var(--text2)" }}>{d.name}</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DONUT CHART — Priority ────────────────────────────────────────────────
export function PriorityDonutChart({ high = 0, medium = 0, low = 0 }) {
  const data = [
    { name: "High",   value: high,   color: "var(--accent2)" },
    { name: "Medium", value: medium, color: "var(--accent4)" },
    { name: "Low",    value: low,    color: "var(--accent3)" },
  ].filter(d => d.value > 0);

  const total = high + medium + low;

  if (total === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 180, color: "var(--text3)", fontSize: 13 }}>
        No tasks yet
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={78} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          </Pie>
          <Tooltip content={<TooltipBox />} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
        <div style={{ fontSize: 26, fontFamily: "'Cabinet Grotesk', sans-serif", fontWeight: 900, letterSpacing: -1, color: "var(--text)" }}>{total}</div>
        <div style={{ fontSize: 10, color: "var(--text2)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Tasks</div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: d.color, display: "inline-block" }} />
            <span style={{ color: "var(--text2)" }}>{d.name}</span>
            <span style={{ fontWeight: 700, color: "var(--text)" }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BAR CHART — Tasks per Project ────────────────────────────────────────
export function ProjectsBarChart({ data }) {
  if (!data?.length) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--text3)", fontSize: 13 }}>No project data</div>;
  }

  const chartData = data.map(p => ({
    name: p.name.length > 12 ? p.name.slice(0, 12) + "…" : p.name,
    "To Do": p.todo_count || 0,
    "In Progress": p.in_progress_count || 0,
    "Done": p.done_count || 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text2)", fontFamily: "Instrument Sans" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text2)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox />} cursor={{ fill: "var(--surface2)" }} />
        <Bar dataKey="To Do"       stackId="a" fill="var(--text3)"   radius={[0,0,0,0]} />
        <Bar dataKey="In Progress" stackId="a" fill="var(--accent5)" radius={[0,0,0,0]} />
        <Bar dataKey="Done"        stackId="a" fill="var(--accent3)" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── AREA CHART — Weekly Activity ─────────────────────────────────────────
export function ActivityAreaChart({ data }) {
  if (!data?.length) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 160, color: "var(--text3)", fontSize: 13 }}>No activity data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
        <defs>
          <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--accent)"  stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent)"  stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradDone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="var(--accent3)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--accent3)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--text2)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "var(--text2)" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox />} />
        <Area type="monotone" dataKey="created" name="Created" stroke="var(--accent)"  fill="url(#gradCreated)" strokeWidth={2} dot={false} />
        <Area type="monotone" dataKey="done"    name="Completed" stroke="var(--accent3)" fill="url(#gradDone)"    strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── HORIZONTAL BAR — Team Workload ────────────────────────────────────────
export function WorkloadChart({ members, tasks }) {
  if (!members?.length || !tasks?.length) {
    return <div style={{ fontSize: 13, color: "var(--text3)", padding: "20px 0", textAlign: "center" }}>No data</div>;
  }

  const counts = {};
  tasks.forEach(t => {
    if (t.assignee_id && t.status !== "done") {
      counts[t.assignee_id] = (counts[t.assignee_id] || 0) + 1;
    }
  });

  const data = members
    .map(m => ({ name: m.name.split(" ")[0], tasks: counts[m.id] || 0 }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 6);

  const max = Math.max(...data.map(d => d.tasks), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 70, fontSize: 12, fontWeight: 600, color: "var(--text2)", flexShrink: 0, textAlign: "right" }}>{d.name}</div>
          <div style={{ flex: 1, height: 8, background: "var(--surface3)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${(d.tasks / max) * 100}%`,
              background: `linear-gradient(90deg, var(--accent), var(--accent5))`,
              borderRadius: 4,
              transition: "width 0.6s ease",
              minWidth: d.tasks > 0 ? 4 : 0
            }} />
          </div>
          <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>{d.tasks}</div>
        </div>
      ))}
      {data.every(d => d.tasks === 0) && (
        <div style={{ fontSize: 12, color: "var(--text3)", textAlign: "center" }}>All tasks completed 🎉</div>
      )}
    </div>
  );
}
