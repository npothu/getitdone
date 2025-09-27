"use client";

import { useMemo, useState } from "react";
import {
  getCurrentCycleInfo,
  getTaskOptimalPhase,
  getOptimalPhaseInfo,
  isOptimalTiming,
} from "../lib/utils";

type LogEntry = {
  id: number;
  day: number;
  phase: string;
  energy: number;
  mood: string;
  note: string;
  when: string;
};

export default function Dashboard() {
  // --- Cycle settings (user-controlled) ---
  const [lastStart, setLastStart] = useState<string>(
    new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // default: 12 days ago
  );
  const [cycleLen, setCycleLen] = useState<number>(28);

  const lastPeriodDate = useMemo(() => new Date(lastStart), [lastStart]);
  const currentCycle = useMemo(
    () => getCurrentCycleInfo(lastPeriodDate, cycleLen),
    [lastPeriodDate, cycleLen]
  );

  // late-cycle handling
  const today = new Date();
  const expectedNextStart = new Date(lastPeriodDate);
  expectedNextStart.setDate(expectedNextStart.getDate() + cycleLen);
  const daysLate = Math.floor((+today - +expectedNextStart) / (1000 * 60 * 60 * 24));
  const isLate = daysLate > 0;
  const effectiveLen = Math.max(cycleLen, currentCycle.cycleDay);
  const todayISO = new Date().toISOString().slice(0, 10);

  // ----- Tasks -----
  const [tasks, setTasks] = useState([
    { id: 1, text: "Task A (label)", completed: false },
    { id: 2, text: "Task B (label)", completed: false },
    { id: 3, text: "Complete 3rd quarterly report", completed: false },
    { id: 4, text: "Prepare presentation slides", completed: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const toggleTask = (id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    const optimalPhase = getTaskOptimalPhase(newTask);
    const okNow = isOptimalTiming(newTask, currentCycle.phase);
    setTasks((prev) => [...prev, { id: Date.now(), text: newTask.trim(), completed: false }]);
    setNewTask("");
    if (!okNow) {
      const phaseInfo = getOptimalPhaseInfo(optimalPhase);
      console.log(`Tip: "${newTask}" would be optimal during ${phaseInfo.name} phase`);
    }
  };

  // ----- Logs -----
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logEnergy, setLogEnergy] = useState<number>(4);
  const [logMood, setLogMood] = useState<string>("😊");
  const [logNote, setLogNote] = useState<string>("");

  function addLog() {
    const energy = Math.max(1, Math.min(Number(logEnergy) || 1, 5));
    const entry: LogEntry = {
      id: Date.now(),
      day: currentCycle.cycleDay,
      phase: currentCycle.phaseName,
      energy,
      mood: logMood,
      note: logNote.trim(),
      when: "Today",
    };
    setLogs((prev) => [entry, ...prev]);
    setLogNote("");
  }
  const energyStars = (n: number) => "⭐".repeat(Math.max(1, Math.min(n, 5)));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Get it done.</h1>

        {/* Cycle settings */}
        <div className="bg-white rounded-lg p-4 shadow-sm border mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <label className="text-sm sm:col-span-2">
              <div className="text-gray-700 font-medium mb-1">Last period start (Day 1)</div>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={lastStart}
                onChange={(e) => setLastStart(e.target.value)}
              />
            </label>
            <label className="text-sm">
              <div className="text-gray-700 font-medium mb-1">Average cycle length</div>
              <input
                type="number"
                min={21}
                max={45}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={cycleLen}
                onChange={(e) =>
                  setCycleLen(Math.max(21, Math.min(45, Number(e.target.value) || 28)))
                }
              />
            </label>
            <div className="text-sm">
              <div className="text-gray-700 font-medium mb-1">Quick actions</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLastStart(todayISO)}
                  className="px-3 py-2 border rounded-md hover:bg-gray-50"
                >
                  Period started today
                </button>
                <button
                  onClick={() => setCycleLen(currentCycle.cycleDay)}
                  className="px-3 py-2 border rounded-md hover:bg-gray-50"
                  title="Extend this cycle to include today"
                >
                  Extend cycle
                </button>
              </div>
            </div>
          </div>

          {isLate && (
            <div className="mt-3 p-3 rounded-md border border-amber-200 bg-amber-50 text-sm text-amber-900">
              Your expected Day 1 was {daysLate} day{daysLate === 1 ? "" : "s"} ago.
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  onClick={() => setLastStart(todayISO)}
                  className="px-3 py-1.5 rounded-md bg-amber-600 text-white hover:bg-amber-700"
                >
                  Start Day 1 today
                </button>
                <button
                  onClick={() => setCycleLen(currentCycle.cycleDay)}
                  className="px-3 py-1.5 rounded-md border border-amber-300 bg-white hover:bg-amber-100"
                >
                  Keep this cycle (extend)
                </button>
              </div>
              <div className="mt-1 text-xs text-amber-800">
                You can also pick a different Day 1 date above at any time.
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT — Graph + Phase info */}
          <div className="space-y-6">
            {/* Hormone Graph */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Cycle overview</div>
                <div className="flex items-center gap-3 text-xs">
                  <Legend swatch="#2563eb" label="Estrogen (E2)" />
                  <Legend swatch="#9333ea" label="Progesterone (P4)" />
                  <Legend swatch="#0ea5e9" label="Today" line />
                </div>
              </div>
              <HormoneGraph cycleLength={effectiveLen} cycleDay={currentCycle.cycleDay} />
            </div>

            {/* Phase info */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  {currentCycle.phaseName}
                </div>
                <div className="text-sm text-gray-600 mb-4">{currentCycle.description}</div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 inline-block">
                  <div className="text-sm font-medium text-orange-800">Optimal for today:</div>
                  <div className="text-sm text-orange-700">
                    {currentCycle.optimalTasks.join(", ")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Today's Focus -> Tasks -> Daily Logs */}
          <div className="space-y-6">
            {/* Today's Focus */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Focus</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="font-medium" style={{ color: currentCycle.phaseColor }}>
                  Day {currentCycle.cycleDay} - {currentCycle.phaseName}
                </div>
                <div className="text-sm mt-1" style={{ color: currentCycle.phaseColor }}>
                  {currentCycle.description}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Predicted Energy Level:</span>
                  <span className="font-medium">Rising</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Best For:</span>
                  <span className="font-medium">Creative work</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Phase:</span>
                  <span className="font-medium">
                    Ovulatory (≈ {Math.max(0, 14 - currentCycle.cycleDay)} days)
                  </span>
                </div>
              </div>
            </div>

            {/* Tasks (MOVED HERE) */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tasks</h2>

              {/* List */}
              <div className="space-y-3 mb-4">
                {tasks.map((task) => {
                  const optimalPhase = getTaskOptimalPhase(task.text);
                  const phaseInfo = getOptimalPhaseInfo(optimalPhase);
                  const okNow = isOptimalTiming(task.text, currentCycle.phase);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-2 ${
                        okNow ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span
                          className={`flex-1 ${
                            task.completed ? "line-through text-gray-500" : "text-gray-900"
                          }`}
                        >
                          {task.text}
                        </span>
                        <div className="flex items-center space-x-2">
                          {okNow ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                              ✨ Optimal Now
                            </span>
                          ) : (
                            <span
                              className="px-2 py-1 text-xs rounded-full font-medium"
                              style={{
                                backgroundColor: getOptimalPhaseInfo(optimalPhase).color + "20",
                                color: getOptimalPhaseInfo(optimalPhase).color,
                              }}
                            >
                              {phaseInfo.emoji} Best in {phaseInfo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick suggestions */}
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm font-medium text-blue-800 mb-2">
                  Quick task ideas for your current phase:
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCycle.optimalTasks.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setNewTask(t)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Task */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Task
                </button>
              </div>
            </div>

            {/* Daily Logs */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Logs</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 w-24">Energy (1–5)</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(Number(e.target.value))}
                    className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600 w-16">Mood</span>
                  <select
                    value={logMood}
                    onChange={(e) => setLogMood(e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option>😊</option>
                    <option>😐</option>
                    <option>😔</option>
                    <option>😤</option>
                    <option>🤩</option>
                  </select>
                </label>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    value={logNote}
                    onChange={(e) => setLogNote(e.target.value)}
                    placeholder="What should we remember about today? (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === "Enter" && addLog()}
                  />
                </div>
              </div>
              <button
                onClick={addLog}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                + Log Today
              </button>

              <div className="space-y-3">
                {logs.length === 0 && (
                  <div className="text-sm text-gray-500">No logs yet. Add your first one above.</div>
                )}
                {logs.map((log) => (
                  <div key={log.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Day {log.day} - {log.phase}
                      </span>
                      <span className="text-xs text-gray-500">{log.when}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Energy: {energyStars(log.energy)} | Mood: {log.mood}
                    </div>
                    {log.note && <div className="text-xs text-gray-500 mt-1">{log.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* END RIGHT */}
        </div>
      </div>
    </div>
  );
}

/** ---------- Small legend pill ---------- */
function Legend({ swatch, label, line = false }: { swatch: string; label: string; line?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      {line ? (
        <span className="inline-block w-4 h-[2px]" style={{ background: swatch }} />
      ) : (
        <span className="inline-block w-3 h-3 rounded-sm" style={{ background: swatch }} />
      )}
      <span>{label}</span>
    </span>
  );
}

/** ---------- Pure-SVG Hormone Graph ---------- */
function HormoneGraph({ cycleLength, cycleDay }: { cycleLength: number; cycleDay: number }) {
  const W = 600, H = 220, PAD = 28;
  const x = (day: number) => PAD + ((Math.max(1, Math.min(cycleLength, day)) - 1) / (cycleLength - 1)) * (W - PAD * 2);
  const y = (val: number) => {
    const top = 16, bottom = H - 32;
    return bottom - Math.max(0, Math.min(1, val)) * (bottom - top);
  };

  const ovu = Math.max(12, Math.min(20, cycleLength - 14));
  const estrogen = (d: number) => {
    const a = sigmoid((d - 6) / 3) * (1 - sigmoid((d - ovu + 1) / 1.8));
    const peak = Math.exp(-Math.pow((d - ovu) / 2.2, 2));
    const luteal = 0.3 * Math.exp(-Math.pow((d - (ovu + 6)) / 4.0, 2));
    return clamp01(0.15 + 0.6 * a + 0.9 * peak + luteal);
  };
  const progesterone = (d: number) => {
    const rise = sigmoid((d - (ovu + 1)) / 2.2);
    const fall = 1 - sigmoid((d - (ovu + 10)) / 2.5);
    return clamp01(0.08 + 0.75 * rise * fall);
  };

  const days = Array.from({ length: cycleLength }, (_, i) => i + 1);
  const e2Path = pathFrom(days, (d) => ({ x: x(d), y: y(estrogen(d)) }));
  const p4Path = pathFrom(days, (d) => ({ x: x(d), y: y(progesterone(d)) }));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[220px]">
        <line x1={PAD} y1={H - 28} x2={W - PAD} y2={H - 28} stroke="#e5e7eb" />
        <line x1={PAD} y1={16} x2={PAD} y2={H - 28} stroke="#e5e7eb" />

        <path d={e2Path} fill="none" stroke="#2563eb" strokeWidth="2.5" />
        <path d={p4Path} fill="none" stroke="#9333ea" strokeWidth="2.5" />

        <line x1={x(cycleDay)} y1={16} x2={x(cycleDay)} y2={H - 28} stroke="#0ea5e9" strokeDasharray="6,6" />
        <circle cx={x(cycleDay)} cy={y(estrogen(cycleDay))} r="5" fill="#0ea5e9" />

        <text x={x(1)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6b7280">1</text>
        <text x={x(Math.ceil(cycleLength / 2))} y={H - 8} fontSize="10" textAnchor="middle" fill="#6b7280">
          {Math.ceil(cycleLength / 2)}
        </text>
        <text x={x(cycleLength)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6b7280">
          {cycleLength}
        </text>
      </svg>
      <div className="mt-1 text-xs text-gray-500">X-axis starts at Day 1 (your last period start).</div>
    </div>
  );
}

/* helpers */
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }
function pathFrom<T>(arr: T[], map: (t: T, i: number) => { x: number; y: number }) {
  return arr.map((t, i) => {
    const { x, y } = map(t, i);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}
