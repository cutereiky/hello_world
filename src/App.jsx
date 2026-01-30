import { useState } from "react";

const kids = [
  { id: "kid-1", name: "Mia", balance: 18.5 },
  { id: "kid-2", name: "Leo", balance: 12.0 },
];

const tasks = [
  {
    id: "task-1",
    title: "Morning routine",
    checkpoint: "Once a day",
    status: "In progress",
    due: "Today, 8:00 AM",
  },
  {
    id: "task-2",
    title: "Math practice",
    checkpoint: "Twice a week",
    status: "Next checkpoint",
    due: "Tomorrow, 4:00 PM",
  },
];

const ledger = [
  {
    id: "entry-1",
    label: "Weekly allowance",
    amount: 5,
    time: "Sat, 9:00 AM",
  },
  {
    id: "entry-2",
    label: "Snack spending",
    amount: -2.5,
    time: "Fri, 4:30 PM",
  },
];

export default function App() {
  const [mode, setMode] = useState("parent");
  const [activeKid, setActiveKid] = useState(kids[0].id);

  const selectedKid = kids.find((kid) => kid.id === activeKid);

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <p className="eyebrow">Kid Rewards</p>
          <h1>Offline-first family tracker</h1>
        </div>
        <button
          type="button"
          className="switch"
          onClick={() =>
            setMode((current) => (current === "parent" ? "kid" : "parent"))
          }
        >
          Switch to {mode === "parent" ? "Kid" : "Parent"} View
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>{mode === "parent" ? "Parent overview" : "Kid view"}</h2>
          <div className="pill">{mode === "parent" ? "Parent" : "Kid"}</div>
        </div>
        <div className="panel-body">
          <label className="field">
            <span>Active kid</span>
            <select
              value={activeKid}
              onChange={(event) => setActiveKid(event.target.value)}
            >
              {kids.map((kid) => (
                <option key={kid.id} value={kid.id}>
                  {kid.name}
                </option>
              ))}
            </select>
          </label>
          <div className="balance-card">
            <div>
              <p className="eyebrow">Balance</p>
              <h3>${selectedKid.balance.toFixed(2)}</h3>
            </div>
            <button type="button" className="ghost">
              Log spending
            </button>
          </div>
        </div>
      </section>

      <section className="grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Task checkpoints</h2>
            <button type="button" className="ghost">
              Add task
            </button>
          </div>
          <ul className="list">
            {tasks.map((task) => (
              <li key={task.id} className="list-item">
                <div>
                  <p className="item-title">{task.title}</p>
                  <p className="item-subtitle">
                    {task.checkpoint} · {task.due}
                  </p>
                </div>
                <span className="tag">{task.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>AI progress check-in</h2>
            <span className="tag accent">Daily</span>
          </div>
          <div className="ai-card">
            <p className="item-title">Tonight at 7:30 PM</p>
            <p className="item-subtitle">
              Review checkpoints and confirm completed tasks. You can work
              offline — updates sync later.
            </p>
            <div className="button-row">
              <button type="button">Start check-in</button>
              <button type="button" className="ghost">
                Snooze
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Ledger</h2>
          <button type="button" className="ghost">
            Add entry
          </button>
        </div>
        <ul className="list">
          {ledger.map((entry) => (
            <li key={entry.id} className="list-item">
              <div>
                <p className="item-title">{entry.label}</p>
                <p className="item-subtitle">{entry.time}</p>
              </div>
              <span className={entry.amount < 0 ? "amount down" : "amount up"}>
                {entry.amount < 0 ? "-" : "+"}${Math.abs(entry.amount).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
