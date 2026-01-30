import { useEffect, useMemo, useState } from "react";

const initialKids = [
  {
    id: "kid-1",
    name: "Mia",
    balance: 18.5,
    allowance: {
      amount: 5,
      cadence: "Weekly",
      day: "Saturday",
      time: "9:00 AM",
    },
  },
  {
    id: "kid-2",
    name: "Leo",
    balance: 12.0,
    allowance: {
      amount: 4,
      cadence: "Weekly",
      day: "Sunday",
      time: "10:00 AM",
    },
  },
];

const initialTasks = [
  {
    id: "task-1",
    title: "Morning routine",
    checkpoint: "Once a day",
    start: "7:00 AM",
    end: "8:00 AM",
    status: "In progress",
  },
  {
    id: "task-2",
    title: "Math practice",
    checkpoint: "Twice a week",
    start: "4:00 PM",
    end: "5:00 PM",
    status: "Next checkpoint",
  },
];

const initialLedger = [
  {
    id: "entry-1",
    kidId: "kid-1",
    label: "Weekly allowance",
    amount: 5,
    time: "Sat, 9:00 AM",
    type: "allowance",
  },
  {
    id: "entry-2",
    kidId: "kid-1",
    label: "Snack spending",
    amount: -2.5,
    time: "Fri, 4:30 PM",
    type: "spend",
  },
  {
    id: "entry-3",
    kidId: "kid-2",
    label: "Homework reward",
    amount: 3,
    time: "Thu, 6:10 PM",
    type: "reward",
  },
];

const initialAssistant = {
  checkInTime: "7:30 PM",
  reminderOffsets: {
    beforeStart: "15 min",
    afterEnd: "30 min",
  },
};

const storageKey = "kidRewardsData";

const formatCurrency = (value) => `$${value.toFixed(2)}`;

const buildReminder = (task, assistant) => {
  return [
    `Reminder: ${assistant.reminderOffsets.beforeStart} before ${task.start}`,
    `Follow-up: ${assistant.reminderOffsets.afterEnd} after ${task.end}`,
  ];
};

export default function App() {
  const [mode, setMode] = useState("parent");
  const [activeKid, setActiveKid] = useState(initialKids[0].id);
  const [kids, setKids] = useState(initialKids);
  const [tasks, setTasks] = useState(initialTasks);
  const [ledger, setLedger] = useState(initialLedger);
  const [assistant, setAssistant] = useState(initialAssistant);
  const [activeTab, setActiveTab] = useState("overview");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLedgerForm, setShowLedgerForm] = useState(false);
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    checkpoint: "Once a day",
    start: "",
    end: "",
  });
  const [entryForm, setEntryForm] = useState({
    label: "",
    amount: "",
    type: "spend",
  });

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.kids) {
        setKids(parsed.kids);
      }
      if (parsed.tasks) {
        setTasks(parsed.tasks);
      }
      if (parsed.ledger) {
        setLedger(parsed.ledger);
      }
      if (parsed.assistant) {
        setAssistant(parsed.assistant);
      }
      if (parsed.activeKid) {
        setActiveKid(parsed.activeKid);
      }
      if (parsed.activeTab) {
        setActiveTab(parsed.activeTab);
      }
    } catch (error) {
      console.error("Failed to parse local data", error);
    }
  }, []);

  useEffect(() => {
    const payload = {
      kids,
      tasks,
      ledger,
      assistant,
      activeKid,
      activeTab,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [kids, tasks, ledger, assistant, activeKid, activeTab]);

  const selectedKid = kids.find((kid) => kid.id === activeKid);

  const kidLedger = useMemo(() => {
    return ledger.filter((entry) => entry.kidId === activeKid);
  }, [ledger, activeKid]);

  const reminders = useMemo(() => {
    return tasks.flatMap((task) => buildReminder(task, assistant));
  }, [tasks, assistant]);

  const checkInItems = useMemo(() => {
    return tasks.map((task) => ({
      id: task.id,
      label: task.title,
      schedule: `${task.checkpoint} · ${task.start} - ${task.end}`,
      status: task.status,
    }));
  }, [tasks]);

  const applyLedgerEntry = (entry) => {
    setLedger((prev) => [entry, ...prev]);
    setKids((prev) =>
      prev.map((kid) =>
        kid.id === entry.kidId
          ? { ...kid, balance: kid.balance + entry.amount }
          : kid,
      ),
    );
  };

  const handleAddTask = (event) => {
    event.preventDefault();
    const trimmed = taskForm.title.trim();
    if (!trimmed) {
      return;
    }
    const newTask = {
      id: `task-${Date.now()}`,
      title: trimmed,
      checkpoint: taskForm.checkpoint,
      start: taskForm.start || "8:00 AM",
      end: taskForm.end || "9:00 AM",
      status: "Scheduled",
    };
    setTasks((prev) => [newTask, ...prev]);
    setTaskForm({ title: "", checkpoint: "Once a day", start: "", end: "" });
    setShowTaskForm(false);
  };

  const handleAddEntry = (event) => {
    event.preventDefault();
    const amountValue = Number(entryForm.amount);
    if (!entryForm.label.trim() || Number.isNaN(amountValue)) {
      return;
    }
    const normalizedAmount =
      entryForm.type === "spend" ? -Math.abs(amountValue) : amountValue;
    applyLedgerEntry({
      id: `entry-${Date.now()}`,
      kidId: activeKid,
      label: entryForm.label.trim(),
      amount: normalizedAmount,
      type: entryForm.type,
      time: "Just now",
    });
    setEntryForm({ label: "", amount: "", type: "spend" });
    setShowLedgerForm(false);
  };

  const handleAllowanceUpdate = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const amount = Number(formData.get("amount"));
    if (Number.isNaN(amount)) {
      return;
    }
    setKids((prev) =>
      prev.map((kid) =>
        kid.id === activeKid
          ? {
              ...kid,
              allowance: {
                amount,
                cadence: formData.get("cadence"),
                day: formData.get("day"),
                time: formData.get("time"),
              },
            }
          : kid,
      ),
    );
    setShowAllowanceForm(false);
  };

  const runAllowance = () => {
    if (!selectedKid) {
      return;
    }
    applyLedgerEntry({
      id: `entry-${Date.now()}`,
      kidId: selectedKid.id,
      label: `${selectedKid.allowance.cadence} allowance`,
      amount: selectedKid.allowance.amount,
      type: "allowance",
      time: "Just now",
    });
  };

  const updateCheckInStatus = (taskId, status) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, status } : task,
      ),
    );
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

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

      <nav className="tabs">
        {[
          { id: "overview", label: "Overview" },
          { id: "tasks", label: "Tasks" },
          { id: "checkin", label: "Check-in" },
          { id: "allowance", label: "Allowance" },
          { id: "ledger", label: "Ledger" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section
        className={`panel tab-panel ${activeTab === "overview" ? "active" : ""}`}
      >
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
              <h3>{formatCurrency(selectedKid.balance)}</h3>
              <p className="item-subtitle">
                {selectedKid.allowance.cadence} allowance:{" "}
                {formatCurrency(selectedKid.allowance.amount)} · Next{" "}
                {selectedKid.allowance.day} {selectedKid.allowance.time}
              </p>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setEntryForm((prev) => ({ ...prev, type: "spend" }));
                setShowLedgerForm(true);
              }}
            >
              Log spending
            </button>
          </div>
        </div>
      </section>

      <section className="grid">
        <div
          className={`panel tab-panel ${
            activeTab === "tasks" ? "active" : ""
          }`}
        >
          <div className="panel-header">
            <h2>Task checkpoints</h2>
            {mode === "parent" && (
              <button
                type="button"
                className="ghost"
                onClick={() => setShowTaskForm((prev) => !prev)}
              >
                {showTaskForm ? "Close" : "Add task"}
              </button>
            )}
          </div>
          {showTaskForm ? (
            <form className="form" onSubmit={handleAddTask}>
              <label className="field">
                <span>Task title</span>
                <input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Morning routine"
                />
              </label>
              <div className="form-row">
                <label className="field">
                  <span>Checkpoint</span>
                  <select
                    value={taskForm.checkpoint}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        checkpoint: event.target.value,
                      }))
                    }
                  >
                    <option>Once a day</option>
                    <option>Twice a day</option>
                    <option>Once a week</option>
                    <option>Mon/Wed/Fri</option>
                  </select>
                </label>
                <label className="field">
                  <span>Start</span>
                  <input
                    value={taskForm.start}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        start: event.target.value,
                      }))
                    }
                    placeholder="7:00 AM"
                  />
                </label>
                <label className="field">
                  <span>End</span>
                  <input
                    value={taskForm.end}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        end: event.target.value,
                      }))
                    }
                    placeholder="8:00 AM"
                  />
                </label>
              </div>
              <div className="button-row">
                <button type="submit">Save task</button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowTaskForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            mode === "parent" && (
              <button
                type="button"
                className="link"
                onClick={() => setShowTaskForm(true)}
              >
                + Create a new task
              </button>
            )
          )}
          <ul className="list">
            {tasks.map((task) => (
              <li key={task.id} className="list-item">
                <div>
                  <p className="item-title">{task.title}</p>
                  <p className="item-subtitle">
                    {task.checkpoint} · {task.start} - {task.end}
                  </p>
                </div>
                <span className="tag">{task.status}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`panel tab-panel ${
            activeTab === "checkin" ? "active" : ""
          }`}
        >
          <div className="panel-header">
            <h2>AI progress check-in</h2>
            <span className="tag accent">Daily</span>
          </div>
          <div className="ai-card">
            <p className="item-title">Tonight at {assistant.checkInTime}</p>
            <p className="item-subtitle">
              Review checkpoints and confirm completed tasks. The assistant
              sends reminders {assistant.reminderOffsets.beforeStart} before
              start times and follows up {assistant.reminderOffsets.afterEnd}{" "}
              after end times.
            </p>
            <div className="button-row">
              <button type="button">Start check-in</button>
              <button type="button" className="ghost">
                Snooze
              </button>
            </div>
            <ul className="mini-list">
              {reminders.slice(0, 4).map((reminder) => (
                <li key={reminder}>{reminder}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid">
        <div
          className={`panel tab-panel ${
            activeTab === "checkin" ? "active" : ""
          }`}
        >
          <div className="panel-header">
            <h2>Daily check-in</h2>
            <span className="tag">Today</span>
          </div>
          <ul className="list">
            {checkInItems.map((item) => (
              <li key={item.id} className="list-item">
                <div>
                  <p className="item-title">{item.label}</p>
                  <p className="item-subtitle">{item.schedule}</p>
                </div>
                <div className="checkin-actions">
                  <span className="tag">{item.status}</span>
                  {mode === "parent" && (
                    <>
                      <button
                        type="button"
                        className="ghost small"
                        onClick={() => updateCheckInStatus(item.id, "Done")}
                      >
                        Mark done
                      </button>
                      <button
                        type="button"
                        className="ghost small"
                        onClick={() => updateCheckInStatus(item.id, "Needs follow-up")}
                      >
                        Follow up
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className={`panel tab-panel ${
            activeTab === "allowance" ? "active" : ""
          }`}
        >
          <div className="panel-header">
            <h2>Allowance settings</h2>
            <button
              type="button"
              className="ghost"
              onClick={() => setShowAllowanceForm((prev) => !prev)}
            >
              {showAllowanceForm ? "Close" : "Edit"}
            </button>
          </div>
          {showAllowanceForm ? (
            <form className="form" onSubmit={handleAllowanceUpdate}>
              <div className="form-row">
                <label className="field">
                  <span>Amount</span>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    defaultValue={selectedKid.allowance.amount}
                  />
                </label>
                <label className="field">
                  <span>Cadence</span>
                  <select name="cadence" defaultValue={selectedKid.allowance.cadence}>
                    <option>Weekly</option>
                    <option>Bi-weekly</option>
                    <option>Monthly</option>
                  </select>
                </label>
                <label className="field">
                  <span>Day</span>
                  <select name="day" defaultValue={selectedKid.allowance.day}>
                    <option>Monday</option>
                    <option>Tuesday</option>
                    <option>Wednesday</option>
                    <option>Thursday</option>
                    <option>Friday</option>
                    <option>Saturday</option>
                    <option>Sunday</option>
                  </select>
                </label>
                <label className="field">
                  <span>Time</span>
                  <input name="time" defaultValue={selectedKid.allowance.time} />
                </label>
              </div>
              <div className="button-row">
                <button type="submit">Save allowance</button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setShowAllowanceForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="allowance-summary">
              <p className="item-title">
                {selectedKid.allowance.cadence} allowance ·{" "}
                {formatCurrency(selectedKid.allowance.amount)}
              </p>
              <p className="item-subtitle">
                Next run: {selectedKid.allowance.day} {selectedKid.allowance.time}
              </p>
              <button type="button" onClick={runAllowance}>
                Run allowance now
              </button>
            </div>
          )}
        </div>
      </section>

      <section
        className={`panel tab-panel ${activeTab === "ledger" ? "active" : ""}`}
      >
        <div className="panel-header">
          <h2>Ledger</h2>
          <button
            type="button"
            className="ghost"
            onClick={() => setShowLedgerForm((prev) => !prev)}
          >
            {showLedgerForm ? "Close" : "Add entry"}
          </button>
        </div>
        {showLedgerForm && (
          <form className="form" onSubmit={handleAddEntry}>
            <div className="form-row">
              <label className="field">
                <span>Label</span>
                <input
                  value={entryForm.label}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      label: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  step="0.01"
                  value={entryForm.amount}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  value={entryForm.type}
                  onChange={(event) =>
                    setEntryForm((prev) => ({
                      ...prev,
                      type: event.target.value,
                    }))
                  }
                >
                  <option value="spend">Spending</option>
                  <option value="reward">Reward</option>
                  <option value="allowance">Allowance</option>
                </select>
              </label>
            </div>
            <div className="button-row">
              <button type="submit">Save entry</button>
              <button
                type="button"
                className="ghost"
                onClick={() => setShowLedgerForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <ul className="list">
          {kidLedger.map((entry) => (
            <li key={entry.id} className="list-item">
              <div>
                <p className="item-title">{entry.label}</p>
                <p className="item-subtitle">
                  {entry.type} · {entry.time}
                </p>
              </div>
              <span className={entry.amount < 0 ? "amount down" : "amount up"}>
                {entry.amount < 0 ? "-" : "+"}
                {formatCurrency(Math.abs(entry.amount))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
