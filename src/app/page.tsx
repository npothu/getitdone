"use client";

import { useMemo, useState } from "react";
import CedarTaskScheduler from '../components/CedarTaskScheduler'
import CedarTaskDisplay from '../components/CedarTaskDisplay'
import { useCedarTasks } from '../hooks/useCedarTasks'
import UpcomingCedarTasks from '../components/UpcomingCedarTasks'

import {
  getCurrentCycleInfo,
  getTaskOptimalPhase,
  getOptimalPhaseInfo,
  isOptimalTiming,
} from "../lib/utils";

// ---------------- Types ----------------
type LogEntry = {
  id: number;
  day: number;
  phase: string;
  energy: number;
  mood: string;
  note: string;
  when: string;
};

// ---------------- Page ----------------
export default function Dashboard() {
  const { cedarTasks, addCedarTask, toggleCedarTask } = useCedarTasks()

  // Refresh trigger for Cedar tasks
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)

  // Minimal cycle state (defaults)
  const [lastStart, setLastStart] = useState<string>(
    new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [cycleLen, setCycleLen] = useState<number>(28);

  const lastPeriodDate = useMemo(() => new Date(lastStart), [lastStart]);
  const currentCycle = useMemo(
    () => getCurrentCycleInfo(lastPeriodDate, cycleLen),
    [lastPeriodDate, cycleLen]
  );

  // Always include today on the x-axis (handles late cycles visually)
  const effectiveLen = Math.max(cycleLen, currentCycle.cycleDay);

  // ---------------- Tasks ----------------
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

  // Cedar task handlers
  const handleTaskScheduled = (task: any) => {
    console.log('Task scheduled:', task)
    addCedarTask(task)
    // Trigger refresh of all Cedar task components
    setTaskRefreshTrigger(prev => prev + 1)
  }

  const handleTasksRefresh = () => {
    // This function can be called to refresh all task lists
    setTaskRefreshTrigger(prev => prev + 1)
  }

  // ---------------- Logs (optional quick log; UI sits under Tasks) ----------------
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logEnergy, setLogEnergy] = useState<number>(4);
  const [logMood, setLogMood] = useState<string>("😊");
  const [logNote, setLogNote] = useState<string>("");
  const energyStars = (n: number) => "⭐".repeat(Math.max(1, Math.min(n, 5)));
  function addLog() {
    const entry: LogEntry = {
      id: Date.now(),
      day: currentCycle.cycleDay,
      phase: currentCycle.phaseName,
      energy: Math.max(1, Math.min(Number(logEnergy) || 1, 5)),
      mood: logMood,
      note: logNote.trim(),
      when: "Today",
    };
    setLogs((prev) => [entry, ...prev]);
    setLogNote("");
  }

  return (
    <div className="min-h-screen bg-[#FFF7F9]">
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* -------- Row 0: Last Period Tracker bar -------- */}
        <TopTracker
          lastStart={lastStart}
          cycleDay={currentCycle.cycleDay}
          onPickDate={(iso) => setLastStart(iso)}
        />

        {/* -------- Row 1: Two-column grid (Graph left, Focus+Tasks right) -------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
          {/* LEFT: Hormone Graph */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-[#F1F5F9]">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-[#1F2937]">Cycle overview</div>
              <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                <Legend swatch="#F43F5E" label="Estrogen (E2)" />
                <Legend swatch="#FB7185" label="Progesterone (P4)" />
                <Legend swatch="#22D3EE" label="Today" line />
              </div>
            </div>
            <HormoneGraph
              cycleLength={effectiveLen}
              cycleDay={currentCycle.cycleDay}
              heightDesktop={380}
              heightMobile={280}
            />
          </div>

          {/* RIGHT: Today's Focus (top) + Tasks (bottom) */}
          <div className="space-y-6">
            {/* Today's Focus */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
              <h2 className="text-xl font-semibold text-[#1F2937] mb-4">Today's Focus</h2>
              <div className="bg-[#FFF1F2] border border-[#FFE4E7] rounded-lg p-4 mb-4">
                <div className="font-medium" style={{ color: currentCycle.phaseColor }}>
                  Day {currentCycle.cycleDay} — {currentCycle.phaseName}
                </div>
                <div className="text-sm mt-1" style={{ color: currentCycle.phaseColor }}>
                  {currentCycle.description}
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Predicted Energy Level:</span>
                  <span className="font-medium">Rising</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Best For:</span>
                  <span className="font-medium">Creative work</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Next Phase:</span>
                  <span className="font-medium">
                    Ovulatory (≈ {Math.max(0, 14 - currentCycle.cycleDay)} days)
                  </span>
                </div>
              </div>
            </div>
            {/* Cedar Task Scheduler */}
            <CedarTaskScheduler
              currentCycle={currentCycle}
              onTaskScheduled={handleTaskScheduled}
              onTasksRefresh={handleTasksRefresh}
            />
            <UpcomingCedarTasks refreshTrigger={taskRefreshTrigger} />

            {/* Tasks */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
              <h2 className="text-xl font-semibold text-[#1F2937] mb-4">Tasks</h2>

              <div className="space-y-3 mb-4">
                {tasks.map((task) => {
                  const optimalPhase = getTaskOptimalPhase(task.text);
                  const phaseInfo = getOptimalPhaseInfo(optimalPhase);
                  const okNow = isOptimalTiming(task.text, currentCycle.phase);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-2 ${okNow ? "bg-green-50 border-green-200" : "bg-[#FFF7F9] border-[#F1F5F9]"
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-5 h-5 text-rose-500 rounded border-gray-300 focus:ring-rose-400"
                        />
                        <span
                          className={`flex-1 ${task.completed ? "line-through text-gray-500" : "text-[#1F2937]"
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
              <div className="mb-3 p-3 bg-rose-50 border border-[#FFE4E7] rounded-lg">
                <div className="text-sm font-medium text-rose-700 mb-2">
                  Quick task ideas for your current phase:
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentCycle.optimalTasks.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => setNewTask(t)}
                      className="px-3 py-1 bg-rose-100 text-rose-800 text-sm rounded-full hover:bg-rose-200 transition-colors"
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  + Task
                </button>
              </div>

              {/* Optional quick log */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold mb-2">Daily Log</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 w-24">Energy (1–5)</span>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={logEnergy}
                      onChange={(e) => setLogEnergy(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 w-16">Mood</span>
                    <select
                      value={logMood}
                      onChange={(e) => setLogMood(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      onKeyDown={(e) => e.key === "Enter" && addLog()}
                    />
                  </div>
                </div>
                <button
                  onClick={addLog}
                  className="w-full px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                >
                  + Log Today
                </button>
                {logs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="p-2 bg-gray-50 rounded border text-sm">
                        <div className="flex justify-between">
                          <span>
                            Day {log.day} — {log.phase}
                          </span>
                          <span className="text-xs text-gray-500">{log.when}</span>
                        </div>
                        <div className="text-gray-600">
                          Energy: {energyStars(log.energy)} | Mood: {log.mood}
                        </div>
                        {log.note && <div className="text-xs text-gray-500">{log.note}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* -------- Row 2: Hormone explainer -------- */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-[#F1F5F9] mt-8">
          <div className="text-sm text-[#1F2937] font-semibold mb-2">What do these hormones do?</div>
          <ul className="list-disc pl-5 space-y-1 text-sm text-[#374151]">
            <li>
              <span className="font-medium">Estrogen (E2):</span> often linked with rising energy, mood,
              and social drive as it climbs; low levels can feel flatter or lower-energy for some.
            </li>
            <li>
              <span className="font-medium">Progesterone (P4):</span> tends to support focus, calm, and
              stability mid-luteal; when it drops late luteal, some notice irritability or lower patience.
            </li>
            <li>
              <span className="font-medium">Together:</span> mid-cycle higher estrogen can make
              collaboration/presentations feel easier; mid-luteal higher progesterone can steady detail
              work and finishing. These visuals are educational approximations, not medical measurements.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------------- Slim top tracker ----------------
function TopTracker({
  lastStart,
  cycleDay,
  onPickDate,
}: {
  lastStart: string;
  cycleDay: number;
  onPickDate: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(lastStart);

  return (
    <div className="w-full bg-white border border-[#F1F5F9] shadow-sm rounded-xl px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-[#FFE4E7]">
          Day 1: <strong className="font-medium">{formatISOtoHuman(lastStart)}</strong>
        </span>
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FFF7F9] text-[#1F2937] border border-[#F1F5F9]">
          Cycle day: <strong className="font-medium">{cycleDay}</strong>
        </span>
      </div>

      <div className="relative">
        <button
          aria-label="Set Day 1 (period start)"
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 rounded-full border border-[#F1F5F9] bg-white hover:bg-rose-50 text-rose-500 shadow-sm text-xl leading-none"
          title="Set Day 1"
        >
          +
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-[#F1F5F9] rounded-lg shadow-lg p-3 text-sm z-10">
            <div className="font-medium mb-2">Set Day 1 (period start)</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent"
            />
            <div className="mt-2 flex gap-2 justify-end">
              <button onClick={() => setOpen(false)} className="px-3 py-1 border rounded-md hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => {
                  onPickDate(date);
                  setOpen(false);
                }}
                className="px-3 py-1 rounded-md bg-rose-500 text-white hover:bg-rose-600"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- Legend chip ----------------
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

// ---------------- Hormone Graph with bands, fills, tooltips ----------------
function HormoneGraph({
  cycleLength,
  cycleDay,
  heightDesktop = 380,
  heightMobile = 280,
}: {
  cycleLength: number;
  cycleDay: number;
  heightDesktop?: number;
  heightMobile?: number;
}) {
  // Responsive height
  const H = typeof window !== "undefined" && window.innerWidth < 640 ? heightMobile : heightDesktop;
  const W = 600; // viewBox width (scales to container)
  const PAD = 28;

  const x = (day: number) =>
    PAD + ((Math.max(1, Math.min(cycleLength, day)) - 1) / Math.max(1, cycleLength - 1)) * (W - PAD * 2);
  const y = (val: number) => {
    const top = 16,
      bottom = H - 32;
    return bottom - clamp01(val) * (bottom - top);
  };

  // Ovulation estimate and phase boundaries (adaptive)
  const ovu = clamp(Math.round(cycleLength - 14), 12, 20);
  const menstrualEnd = 5;
  const follicularStart = 6;
  const follicularEnd = Math.max(follicularStart, ovu - 1);
  const ovulatoryStart = Math.max(follicularEnd, ovu - 1);
  const ovulatoryEnd = Math.min(cycleLength, ovu + 1);
  const lutealStart = Math.min(cycleLength, ovulatoryEnd + 1);
  const lutealEnd = cycleLength;

  // Curves (educational shapes 0..1)
  const estrogen = (d: number) => {
    const a = sigmoid((d - 6) / 3) * (1 - sigmoid((d - ovu + 1) / 1.8)); // rise to peak vicinity
    const peak = Math.exp(-Math.pow((d - ovu) / 2.2, 2)); // ovulatory peak
    const luteal = 0.3 * Math.exp(-Math.pow((d - (ovu + 6)) / 4.0, 2)); // small luteal bump
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

  // Areas (under the lines)
  const e2Area = areaFrom(days, (d) => ({ x: x(d), y: y(estrogen(d)) }), H - 28);
  const p4Area = areaFrom(days, (d) => ({ x: x(d), y: y(progesterone(d)) }), H - 28);

  // Tooltip state
  const [tip, setTip] = useState<{ show: boolean; left: number; top: number; day: number } | null>(null);

  // Qualitative state helper
  const qualitative = (curve: (d: number) => number, d: number) => {
    const v = curve(d);
    const vPrev = curve(Math.max(1, d - 1));
    const vNext = curve(Math.min(cycleLength, d + 1));
    const slope = vNext - vPrev;
    const dir = slope > 0.01 ? "rising" : slope < -0.01 ? "falling" : "steady";
    let level: "low" | "moderate" | "high" = "moderate";
    if (v < 0.3) level = "low";
    else if (v > 0.65) level = "high";
    return `${capitalize(level)}, ${dir}`;
  };

  // Phase bands rectangles (x positions by day)
  const bandRects = [
    { start: 1, end: menstrualEnd, fill: "rgba(244,63,94,0.06)", label: "Menstrual" },
    { start: follicularStart, end: follicularEnd, fill: "rgba(251,146,60,0.06)", label: "Follicular" },
    { start: ovulatoryStart, end: ovulatoryEnd, fill: "rgba(250,204,21,0.10)", label: "Ovulatory" },
    { start: lutealStart, end: lutealEnd, fill: "rgba(251,113,133,0.06)", label: "Luteal" },
  ].filter((b) => b.end >= b.start);

  // Handlers
  function onMove(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    const { left, top, width } = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const relX = e.clientX - left;
    const plotW = width;
    const inner = plotW - (PAD * 2 * plotW) / W;
    const px0 = (PAD * plotW) / W;
    const ratio = clamp((relX - px0) / inner, 0, 1);
    const day = Math.max(1, Math.min(cycleLength, Math.round(1 + ratio * (cycleLength - 1))));
    setTip({
      show: true,
      left: e.clientX - left + 12,
      top: e.clientY - top + 12,
      day,
    });
  }
  function onLeave() {
    setTip(null);
  }
  function onClick() {
    // Mobile tap: if no tip, show centered for today
    if (!tip) {
      setTip({
        show: true,
        left: (x(cycleDay) / W) * (W - 0) + 16,
        top: 40,
        day: cycleDay,
      });
    }
  }

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: H }}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onClick}
      >
        {/* grid */}
        <line x1={PAD} y1={H - 28} x2={W - PAD} y2={H - 28} stroke="#F1F5F9" />
        <line x1={PAD} y1={16} x2={PAD} y2={H - 28} stroke="#F1F5F9" />
        {[0.2, 0.4, 0.6, 0.8].map((p, i) => {
          const yTick = 16 + p * (H - 48);
          return <line key={i} x1={PAD} y1={yTick} x2={W - PAD} y2={yTick} stroke="#F1F5F9" />;
        })}

        {/* phase bands (behind) */}
        {bandRects.map((b, i) => {
          const x1 = x(b.start);
          const x2 = x(b.end);
          return (
            <g key={i}>
              <rect
                x={x1}
                y={16}
                width={Math.max(0, x2 - x1)}
                height={H - 44}
                fill={b.fill}
                rx={3}
              />
              <text
                x={x1 + 6}
                y={28}
                fontSize="10"
                fill="#6B7280"
              >
                {b.label}
              </text>
            </g>
          );
        })}

        {/* areas */}
        <path d={e2Area} fill="rgba(244, 63, 94, 0.15)" />
        <path d={p4Area} fill="rgba(251, 113, 133, 0.15)" />

        {/* lines */}
        <path d={e2Path} fill="none" stroke="#F43F5E" strokeWidth="2.5" />
        <path d={p4Path} fill="none" stroke="#FB7185" strokeWidth="2.5" />

        {/* today marker */}
        <line
          x1={x(cycleDay)}
          y1={16}
          x2={x(cycleDay)}
          y2={H - 28}
          stroke="#22D3EE"
          strokeDasharray="6,6"
          strokeWidth={2}
        />
        <circle cx={x(cycleDay)} cy={y(estrogen(cycleDay))} r="5.5" fill="#22D3EE" />

        {/* x labels */}
        <text x={x(1)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">
          1
        </text>
        <text
          x={x(Math.ceil(cycleLength / 2))}
          y={H - 8}
          fontSize="10"
          textAnchor="middle"
          fill="#6B7280"
        >
          {Math.ceil(cycleLength / 2)}
        </text>
        <text x={x(cycleLength)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">
          {cycleLength}
        </text>
      </svg>

      {/* tooltip */}
      {tip?.show && (
        <div
          className="absolute pointer-events-none"
          style={{ left: tip.left, top: tip.top }}
        >
          <div className="bg-white border border-[#F1F5F9] shadow-sm rounded-md px-3 py-2 text-xs text-[#111827]">
            <div className="font-medium mb-1">Day {tip.day}</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#F43F5E" }} />
              <span className="text-[#6B7280]">E2:</span>{" "}
              <span className="font-medium">{qualitative(estrogen, tip.day)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#FB7185" }} />
              <span className="text-[#6B7280]">P4:</span>{" "}
              <span className="font-medium">{qualitative(progesterone, tip.day)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------- Helpers ----------------
function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}
function pathFrom<T>(arr: T[], map: (t: T, i: number) => { x: number; y: number }) {
  return arr
    .map((t, i) => {
      const { x, y } = map(t, i);
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
function areaFrom<T>(
  arr: T[],
  map: (t: T, i: number) => { x: number; y: number },
  baselineY: number
) {
  const pts = arr.map(map);
  if (pts.length === 0) return "";
  const start = `M ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)}`;
  const lines = pts.map((p, i) => `${i === 0 ? "L" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const end = `L ${pts[pts.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
  return `${start} ${lines} ${end}`;
}
function formatISOtoHuman(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}