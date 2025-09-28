"use client";

import { useMemo, useState, useEffect } from "react";
import CedarTaskScheduler from '../components/CedarTaskScheduler'
import { useCedarTasks } from '../hooks/useCedarTasks'
import UpcomingCedarTasks from '../components/UpcomingCedarTasks'

import {
  getCurrentCycleInfo,
} from "../lib/utils";

/* =========================
   Types
   ========================= */
type ColKey = "Menstrual" | "Follicular" | "Ovulatory" | "Early Luteal" | "Late Luteal";

/* Phase UI palette for Kanban */
const PHASE_UI: Record<ColKey, { base: string; light: string; chipBg: string; chipText: string; border: string }> = {
  // deep color
  Menstrual:   { base: "#be123c", light: "rgba(190,18,60,0.08)", chipBg: "bg-rose-50",    chipText: "text-rose-800",    border: "#fecdd3" },
  // "free & fun"
  Follicular:  { base: "#0ea5a4", light: "rgba(14,165,164,0.08)", chipBg: "bg-teal-50",    chipText: "text-teal-800",    border: "#99f6e4" },
  // "punch in the face"
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
  
const { cedarTasks, addCedarTask, toggleCedarTask, refreshTasks } = useCedarTasks()

  // Refresh trigger for Cedar tasks
  const [taskRefreshTrigger, setTaskRefreshTrigger] = useState(0)
  
  // Popup state for Cedar scheduler
  const [showSchedulerPopup, setShowSchedulerPopup] = useState(false)

// Refresh tasks from database when component mounts or refresh trigger changes
  useEffect(() => {
    refreshTasks()
  }, [taskRefreshTrigger])
  
  // Minimal cycle state (defaults)
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
  
  /* ---- Kanban grouping for Cedar tasks ---- */
  const columns: { key: ColKey; desc: string }[] = [
    { key: "Menstrual", desc: "Gentle planning, reflection" },
    { key: "Follicular", desc: "Ideas, learning, building momentum" },
    { key: "Ovulatory", desc: "Presenting, collaboration" },
    { key: "Early Luteal", desc: "Deep focus, production" },
    { key: "Late Luteal", desc: "Tidy up, admin, buffers" },
  ];

  function mapPhaseToColumn(phase: string): ColKey {
    const s = String(phase).trim().toLowerCase();
    
    if (["menstrual", "menses", "period", "bleeding"].includes(s)) return "Menstrual";
    if (["follicular", "pre-ovulatory", "preovulatory"].includes(s)) return "Follicular";
    if (["ovulatory", "ovulation", "mid-cycle", "midcycle"].includes(s)) return "Ovulatory";
    if (["luteal", "post-ovulatory", "postovulatory"].includes(s)) {
      // Could add logic here to differentiate Early vs Late Luteal based on cycle day
      // For now, default to Early Luteal
      return "Early Luteal";
    }
    
    // Default fallback
    return "Menstrual";
  }

  // Group Cedar tasks by phase for Kanban display
  const initCols: Record<ColKey, any[]> = {
    Menstrual: [], Follicular: [], Ovulatory: [], "Early Luteal": [], "Late Luteal": [],
  };
  
  const cedarTasksByCol = cedarTasks
    .filter(task => !task.completed)
    .reduce<Record<ColKey, any[]>>((acc, task) => {
      const key = mapPhaseToColumn(task.phase);
      (acc[key] ??= []).push(task);
      return acc;
    }, { ...initCols });

  // Sort tasks within each column by scheduled date
  Object.keys(cedarTasksByCol).forEach(colKey => {
    cedarTasksByCol[colKey as ColKey].sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateA.getTime() - dateB.getTime();
    });
  });

  // Cedar task handlers
  const handleTaskScheduled = (task: any) => {
    console.log('Task scheduled:', task)
    addCedarTask(task)
    // Trigger refresh of all Cedar task components
    setTaskRefreshTrigger(prev => prev + 1)
    // Close the popup after successful scheduling
    setShowSchedulerPopup(false)
  }

  const handleTasksRefresh = () => {
    // This function can be called to refresh all task lists
    setTaskRefreshTrigger(prev => prev + 1)
  }

 return (
    <div className="min-h-screen bg-[#FFF7F9]">
      <div className="w-full px-6 py-6 force-text-black">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* LEFT (1/3) — Hormone chart */}
          <div className="xl:col-span-1 space-y-8">
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9] u-grow-md u-lift">
              <div className="mb-3 flex items-center justify-between">
                <div className="text font-semibold text-[#1F2937]">Cycle overview</div>
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
                  This chart is an educational illustration of typical estrogen and progesterone
                  patterns across a menstrual cycle. Many people feel more creative and social as estrogen rises (during the
                  follicular/ovulatory phases), and more focused on finishing and details when progesterone is
                  higher (luteal phase). Still, everybody's body is unique, so please use this as a guide, not a rulebook.
                </p>
              </div>
            </section>
          </div>

          {/* RIGHT (2/3) — Wide stack: Tasks → Kanban → Long-term */}
          <aside className="xl:col-span-2 space-y-8">
            {/* Display upcoming Cedar tasks */}
            <UpcomingCedarTasks refreshTrigger={taskRefreshTrigger} />

            {/* Kanban — WIDE */}
            <section className="bg-white rounded-xl p-6 shadow-sm border border-[#F1F5F9] u-grow-md u-lift">
              <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Plan by Cycle Phase</h2>
                  <p className="text-xs text-black/70">Use AI to schedule tasks optimally by your cycle phase.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTaskRefreshTrigger(prev => prev + 1)}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    🔄 Refresh
                  </button>
                  <button
                    onClick={() => setShowSchedulerPopup(true)}
                    className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                    data-text-white
                  >
                    ✨ Smart Schedule
                  </button>
                </div>
              </div>

              {/* Color-coded columns */}
              <div className="grid grid-flow-col auto-cols-[minmax(220px,1fr)] gap-4 overflow-x-auto pb-2">
                {columns.map((col) => {
                  const ui = PHASE_UI[col.key];
                  const columnTasks = cedarTasksByCol[col.key] || [];
                  
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
                        <div className="text-xs text-black/50 mt-1">
                          {columnTasks.length} task{columnTasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      <div className="p-3 space-y-2">
                        {columnTasks.length === 0 && (
                          <div className="text-xs text-black/50 italic">No tasks scheduled yet</div>
                        )}
                        {columnTasks.map((task) => {
                          const taskDate = new Date(task.scheduledDate);
                          const today = new Date();
                          const isToday = taskDate.toDateString() === today.toDateString();
                          
                          return (
                            <div
                              key={task.id}
                              className={`p-3 rounded-md bg-white text-sm border ${ui.chipBg} ${ui.chipText} ${
                                task.completed ? 'opacity-60' : ''
                              }`}
                              style={{
                                borderLeft: `4px solid ${ui.base}`,
                                borderRight: `1px solid ${ui.border}`,
                                borderTop: `1px solid ${ui.border}`,
                                borderBottom: `1px solid ${ui.border}`,
                              }}
                            >
                              <div className="font-medium mb-1">{task.text}</div>
                              <div className="text-xs text-gray-600 mb-2">
                                {taskDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric' 
                                })} • Day {task.cycleDay}
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                  {Math.round(task.confidence * 100)}% match
                                </span>
                                {isToday && (
                                  <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded-full font-medium">
                                    Today!
                                  </span>
                                )}
                              </div>
                              
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
      </div>

      {/* Cedar Task Scheduler Popup */}
      {showSchedulerPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSchedulerPopup(false)}
          />
          {/* Popup Content */}
          <div className="relative z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl border border-gray-200">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
              <h2 className="text-xl font-semibold text-black">AI Smart Scheduler</h2>
              <button
                onClick={() => setShowSchedulerPopup(false)}
                className="text-black hover:text-black text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <CedarTaskScheduler
                currentCycle={currentCycle}
                onTaskScheduled={handleTaskScheduled}
                onTasksRefresh={handleTasksRefresh}
              />
            </div>
          </div>
        </div>
      )}
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
      <span className="text-sm md:text-base font-medium">{label}</span>
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
              Pick the first day of your most recent period. We'll recalc your cycle.
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
    const top = 64, bottom = H - 32;
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
          stroke="#000000" strokeDasharray="6,6" strokeWidth={2}
        />
          stroke="#000000" strokeDasharray="6,6" strokeWidth={2}
        <circle cx={x(cycleDay)} cy={y(estrogen(cycleDay))} r="5.5" fill="#000000" />

        {/* x labels */}
        <text x={x(1)} y={H - 8} fontSize="19" textAnchor="middle" fill="#6B7280">1</text>
        <text x={x(Math.ceil(cycleLength / 2))} y={H - 8} fontSize="19" textAnchor="middle" fill="#6B7280">
          {Math.ceil(cycleLength / 2)}
        </text>
        <text x={x(cycleLength)} y={H - 8} fontSize="19" textAnchor="middle" fill="#6B7280">
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
function formatISOtoHuman(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}