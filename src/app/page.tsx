"use client";

import { useMemo, useState } from "react";
import {
  getCurrentCycleInfo,
  getTaskOptimalPhase,
  getOptimalPhaseInfo,
  isOptimalTiming,
} from "../lib/utils";

/* =========================
   Types
   ========================= */
type Task = { id: number; text: string; completed: boolean };
type ColKey = "Menstrual" | "Follicular" | "Ovulatory" | "Early Luteal" | "Late Luteal";

/* Phase UI palette for Kanban */
const PHASE_UI: Record<ColKey, { base: string; light: string; chipBg: string; chipText: string; border: string }> = {
  // deep color
  Menstrual:   { base: "#be123c", light: "rgba(190,18,60,0.08)", chipBg: "bg-rose-50",    chipText: "text-rose-800",    border: "#fecdd3" },
  // “free & fun”
  Follicular:  { base: "#0ea5a4", light: "rgba(14,165,164,0.08)", chipBg: "bg-teal-50",    chipText: "text-teal-800",    border: "#99f6e4" },
  // “punch in the face”
  Ovulatory:   { base: "#f97316", light: "rgba(249,115,22,0.10)", chipBg: "bg-orange-50",  chipText: "text-orange-800",  border: "#fed7aa" },
  // soft
  "Early Luteal": { base: "#a78bfa", light: "rgba(167,139,250,0.10)", chipBg: "bg-violet-50", chipText: "text-violet-800", border: "#ddd6fe" },
  // deeper again
  "Late Luteal":  { base: "#6b21a8", light: "rgba(107,33,168,0.08)", chipBg: "bg-purple-50", chipText: "text-purple-800", border: "#e9d5ff" },
};

/* =========================
   Page
   ========================= */
export default function Dashboard() {
  // --- Cycle state ---
  const [lastStart, setLastStart] = useState<string>(
    new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [cycleLen] = useState<number>(28);

  const lastPeriodDate = useMemo(() => new Date(lastStart), [lastStart]);
  const currentCycle = useMemo(
    () => getCurrentCycleInfo(lastPeriodDate, cycleLen),
    [lastPeriodDate, cycleLen]
  );
  const effectiveLen = Math.max(cycleLen, currentCycle.cycleDay);

  // --- Tasks ---
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Task A (label)", completed: false },
    { id: 2, text: "Task B (label)", completed: false },
    { id: 3, text: "Complete 3rd quarterly report", completed: false },
    { id: 4, text: "Prepare presentation slides", completed: false },
  ]);
  const toggleTask = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));

  /* ---- Kanban grouping ---- */
  const columns: { key: ColKey; desc: string }[] = [
    { key: "Menstrual", desc: "Gentle planning, reflection" },
    { key: "Follicular", desc: "Ideas, learning, building momentum" },
    { key: "Ovulatory", desc: "Presenting, collaboration" },
    { key: "Early Luteal", desc: "Deep focus, production" },
    { key: "Late Luteal", desc: "Tidy up, admin, buffers" },
  ];

  function normalizePhase(raw: string | undefined | null): ColKey | "Luteal" {
    if (!raw) return "Menstrual";
    const s = String(raw).trim().toLowerCase();
    if (["menstrual", "menses", "period", "bleeding"].includes(s)) return "Menstrual";
    if (["follicular", "pre-ovulatory", "preovulatory"].includes(s)) return "Follicular";
    if (["ovulatory", "ovulation", "mid-cycle", "midcycle"].includes(s)) return "Ovulatory";
    if (["luteal", "post-ovulatory", "postovulatory"].includes(s)) return "Luteal";
    return "Menstrual";
  }
  function bucketForTask(text: string): ColKey {
    const phase = normalizePhase(getTaskOptimalPhase(text));
    if (phase === "Luteal") {
      const t = text.toLowerCase();
      if (/(finish|review|admin|invoice|cleanup|polish|wrap|tidy|proof|bug|reconcile|file)/.test(t)) {
        return "Late Luteal";
      }
      return "Early Luteal";
    }
    return phase as ColKey;
  }

  const initCols: Record<ColKey, Task[]> = {
    Menstrual: [], Follicular: [], Ovulatory: [], "Early Luteal": [], "Late Luteal": [],
  };
  const tasksByCol = tasks.reduce<Record<ColKey, Task[]>>((acc, t) => {
    const key = bucketForTask(t.text);
    (acc[key] ??= []).push(t);
    return acc;
  }, { ...initCols });

  // Add Task (Kanban header)
  const [newKanbanTask, setNewKanbanTask] = useState("");
  const addTaskFromKanban = () => {
    const text = newKanbanTask.trim();
    if (!text) return;
    const optimalPhase = getTaskOptimalPhase(text);
    const okNow = isOptimalTiming(text, currentCycle.phase);
    setTasks((prev) => [...prev, { id: Date.now(), text, completed: false }]);
    setNewKanbanTask("");
    if (!okNow) {
      const phaseInfo = getOptimalPhaseInfo(optimalPhase);
      console.log(`Tip: "${text}" would be optimal during ${phaseInfo.name} phase`);
    }
  };

  /* ============ Layout ============ 
     XL and up:
       LEFT  (span 1): Hormone Graph
       RIGHT (span 2): Today’s Tasks (wide) → Kanban (wide) → Long-term tasks (wide)
  */
  return (
    <div className="min-h-screen bg-[#FFF7F9]">
      <div className="w-full px-6 py-6 force-text-black">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT (1/3) — Hormone chart */}
          <div className="xl:col-span-1 space-y-8">
            <section className="bg-white rounded-xl p-5 shadow-sm border border-[#F1F5F9]">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-[#1F2937]">Cycle overview</div>
                <div className="flex items-center gap-3 text-xs text-[#6B7280]">
                  <Legend swatch="#e11d48" label="Estrogen (E2)" />
                  <Legend swatch="#6366F1" label="Progesterone (P4)" />
                  <Legend swatch="#000000" label="Today" line />
                </div>
              </div>

              {/* Distinct colors: E2 = rose-600, P4 = indigo-500 */}
              <HormoneGraph
                cycleLength={effectiveLen}
                cycleDay={currentCycle.cycleDay}
                heightDesktop={380}
                heightMobile={280}
              />

              <div className="mt-4 flex justify-center">
                <LogPeriodButton defaultDate={lastStart} onSave={(iso) => setLastStart(iso)} />
              </div>

              <div className="mt-6">
                <h3 className="text-base font-semibold mb-2">What am I looking at?</h3>
                <p className="text-sm text-[#1F2937]">
                  This chart is an educational illustration of typical estrogen (E2) and progesterone (P4)
                  patterns across a cycle. Many people feel more creative and social as estrogen rises
                  (follicular/ovulatory), and more focused on finishing and details when progesterone is
                  higher (luteal). Everyone’s body is different—use this as a guide, not a rulebook.
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT (2/3) — Wide stack: Tasks → Kanban → Long-term */}
          <aside className="xl:col-span-2 space-y-8">
            {/* Today’s Tasks — WIDE */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
              <h2 className="text-2xl font-bold mb-4">Today’s Tasks</h2>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const optimalPhase = getTaskOptimalPhase(task.text);
                  const phaseInfo = getOptimalPhaseInfo(optimalPhase);
                  const okNow = isOptimalTiming(task.text, currentCycle.phase);
                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border-2 ${
                        okNow ? "bg-green-50 border-green-200" : "bg-[#FFF7F9] border-[#F1F5F9]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-5 h-5 text-rose-500 rounded border-gray-300 focus:ring-rose-400"
                        />
                        <span className={`flex-1 ${task.completed ? "line-through" : ""}`}>{task.text}</span>
                        <div className="flex items-center gap-2">
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
            </section>

            {/* Kanban — WIDE */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9]">
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Plan by Cycle Phase</h2>
                  <p className="text-xs text-black/70">Add a task here and we’ll slot it by phase.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newKanbanTask}
                    onChange={(e) => setNewKanbanTask(e.target.value)}
                    placeholder="Add task…"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-400 focus:border-transparent placeholder:text-black/60"
                    onKeyDown={(e) => e.key === "Enter" && addTaskFromKanban()}
                  />
                  <button
                    onClick={addTaskFromKanban}
                    className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    data-text-white
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Color-coded columns */}
              <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-4 overflow-x-auto pb-2">
                {columns.map((col) => {
                  const ui = PHASE_UI[col.key];
                  return (
                    <div
                      key={col.key}
                      className="rounded-lg border"
                      style={{
                        backgroundColor: ui.light,
                        borderColor: ui.border,
                      }}
                    >
                      <div
                        className="px-3 py-2 border-b"
                        style={{ borderColor: ui.border }}
                      >
                        <div className="font-semibold" style={{ color: ui.base }}>
                          {col.key}
                        </div>
                        <div className="text-xs text-black/70">{col.desc}</div>
                      </div>

                      <div className="p-3 space-y-2">
                        {tasksByCol[col.key].length === 0 && (
                          <div className="text-xs text-black/50 italic">No tasks here yet</div>
                        )}
                        {tasksByCol[col.key].map((t) => (
                          <div
                            key={t.id}
                            className={`p-2 rounded-md bg-white text-sm ${ui.chipBg} ${ui.chipText}`}
                            style={{
                              borderLeft: `4px solid ${ui.base}`,
                              borderRight: `1px solid ${ui.border}`,
                              borderTop: `1px solid ${ui.border}`,
                              borderBottom: `1px solid ${ui.border}`,
                            }}
                          >
                            {t.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Small UI bits
   ========================= */
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

function LogPeriodButton({
  defaultDate,
  onSave,
}: {
  defaultDate: string;
  onSave: (isoDate: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(defaultDate);
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (loading) return;
    setLoading(true);
    // Play the loading animation, then save & close.
    setTimeout(() => {
      onSave(date);
      setLoading(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-sm disabled:opacity-60"
        data-text-white
        disabled={loading}
      >
        + Log period
      </button>

      {/* Dialog */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => !loading && setOpen(false)}
          />
          {/* Card */}
          <div className="relative z-50 w-full max-w-sm bg-white rounded-xl border border-[#F1F5F9] shadow-lg p-4">
            <div className="text-base font-semibold mb-2">Log period start (Day 1)</div>
            <p className="text-sm text-black/80 mb-3">
              Pick the first day of your most recent period. We’ll recalc your cycle.
            </p>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-rose-400 focus:border-transparent disabled:opacity-60"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 rounded-md border hover:bg-gray-50 disabled:opacity-60"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-md bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-60"
                data-text-white
                disabled={loading}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen loading overlay with 3 bouncing dots */}
      {loading && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/10 backdrop-blur-[1px]">
          <div className="flex items-end gap-2">
            {/* Dot 1 */}
            <span
              className="w-4.5 h-4.5 rounded-full bg-rose-500 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            {/* Dot 2 */}
            <span
              className="w-4.5 h-4.5 rounded-full bg-rose-500 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            {/* Dot 3 */}
            <span
              className="w-4.5 h-4.5 rounded-full bg-rose-500 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      )}
    </>
  );
}

/* =========================
   Hormone Graph
   ========================= */
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
  const H = typeof window !== "undefined" && window.innerWidth < 640 ? heightMobile : heightDesktop;
  const W = 600;
  const PAD = 28;

  const x = (day: number) =>
    PAD + ((Math.max(1, Math.min(cycleLength, day)) - 1) / Math.max(1, cycleLength - 1)) * (W - PAD * 2);
  const y = (val: number) => {
    const top = 16, bottom = H - 32;
    return bottom - Math.max(0, Math.min(1, val)) * (bottom - top);
  };

  // Phase boundaries
  const ovu = clamp(Math.round(cycleLength - 14), 12, 20);
  const menstrualEnd = 5;
  const follicularStart = 6;
  const follicularEnd = Math.max(follicularStart, ovu - 1);
  const ovulatoryStart = Math.max(follicularEnd, ovu - 1);
  const ovulatoryEnd = Math.min(cycleLength, ovu + 1);
  const lutealStart = Math.min(cycleLength, ovulatoryEnd + 1);
  const lutealEnd = cycleLength;

  // Curves (educational 0..1)
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

  // Distinct fills
  const e2Area = areaFrom(days, (d) => ({ x: x(d), y: y(estrogen(d)) }), H - 28);  // rose
  const p4Area = areaFrom(days, (d) => ({ x: x(d), y: y(progesterone(d)) }), H - 28); // indigo

  const [tip, setTip] = useState<{ show: boolean; left: number; top: number; day: number } | null>(null);

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

  const bandRects = [
    { start: 1, end: menstrualEnd, fill: "rgba(244,63,94,0.06)", label: "Menstrual" },
    { start: follicularStart, end: follicularEnd, fill: "rgba(20,184,166,0.06)", label: "Follicular" },
    { start: ovulatoryStart, end: ovulatoryEnd, fill: "rgba(249,115,22,0.10)", label: "Ovulatory" },
    { start: lutealStart, end: lutealEnd, fill: "rgba(167,139,250,0.06)", label: "Luteal" },
  ].filter((b) => b.end >= b.start);

  function onMove(e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
    const { left, top, width } = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const relX = e.clientX - left;
    const inner = width - (PAD * 2 * width) / W;
    const px0 = (PAD * width) / W;
    const ratio = clamp((relX - px0) / inner, 0, 1);
    const day = Math.max(1, Math.min(cycleLength, Math.round(1 + ratio * (cycleLength - 1))));
    setTip({ show: true, left: e.clientX - left + 12, top: e.clientY - top + 12, day });
  }
  function onLeave() { setTip(null); }
  function onClick() { if (!tip) setTip({ show: true, left: 240, top: 40, day: cycleDay }); }

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

        {/* phase bands */}
        {bandRects.map((b, i) => {
          const x1 = x(b.start);
          const x2 = x(b.end);
          return (
            <g key={i}>
              <rect x={x1} y={16} width={Math.max(0, x2 - x1)} height={H - 44} fill={b.fill} rx={3} />
              <text x={x1 + 6} y={28} fontSize="10" fill="#6B7280">
                {b.label}
              </text>
            </g>
          );
        })}

        {/* filled areas (distinct) */}
        <path d={e2Area} fill="rgba(225, 29, 72, 0.15)" />
        <path d={p4Area} fill="rgba(99, 102, 241, 0.15)" />

        {/* lines (distinct) */}
        <path d={e2Path} fill="none" stroke="#e11d48" strokeWidth="2.5" />
        <path d={p4Path} fill="none" stroke="#6366F1" strokeWidth="2.5" />

        {/* today marker */}
        <line
          x1={x(cycleDay)} y1={16} x2={x(cycleDay)} y2={H - 28}
          stroke="#A020F0" strokeDasharray="6,6" strokeWidth={2}
        />
        <circle cx={x(cycleDay)} cy={y(estrogen(cycleDay))} r="5.5" fill="#A020F0" />

        {/* x labels */}
        <text x={x(1)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">1</text>
        <text x={x(Math.ceil(cycleLength / 2))} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">
          {Math.ceil(cycleLength / 2)}
        </text>
        <text x={x(cycleLength)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">
          {cycleLength}
        </text>
      </svg>

      {/* tooltip */}
      {tip?.show && (
        <div className="absolute pointer-events-none" style={{ left: tip.left, top: tip.top }}>
          <div className="bg-white border border-[#F1F5F9] shadow-sm rounded-md px-3 py-2 text-xs text-[#111827]">
            <div className="font-medium mb-1">Day {tip.day}</div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#e11d48" }} />
              <span className="text-[#6B7280]">E2:</span>{" "}
              <span className="font-medium">{qualitative((d) => estrogen(d), tip.day)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "#6366F1" }} />
              <span className="text-[#6B7280]">P4:</span>{" "}
              <span className="font-medium">{qualitative((d) => progesterone(d), tip.day)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Helpers
   ========================= */
function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function sigmoid(z: number) { return 1 / (1 + Math.exp(-z)); }
function pathFrom<T>(arr: T[], map: (t: T, i: number) => { x: number; y: number }) {
  return arr.map((t, i) => {
    const { x, y } = map(t, i);
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}
function areaFrom<T>(arr: T[], map: (t: T, i: number) => { x: number; y: number }, baselineY: number) {
  const pts = arr.map(map);
  if (!pts.length) return "";
  const start = `M ${pts[0].x.toFixed(2)} ${baselineY.toFixed(2)}`;
  const lines = pts.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const end = `L ${pts[pts.length - 1].x.toFixed(2)} ${baselineY.toFixed(2)} Z`;
  return `${start} ${lines} ${end}`;
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
