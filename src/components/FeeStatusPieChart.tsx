"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChartLoadingSpinner from "./ChartLoadingSpinner";
import { getCurrentAcademicYear } from "@/lib/utils";

/* ----------------------------- Types & Interfaces ---------------------------- */

type ViewMode = "current" | "all";

interface ChartData {
  key: string;
  label: string;
  count: number;
  percentage: number;
}

interface FeeStatusPieChartProps {
  viewMode?: ViewMode;
}

/* --------------------------------- Constants -------------------------------- */

const STATUS_ORDER = ["已繳納", "有會員資格（但未繳納）", "未繳納"] as const;

const GRADIENTS: Record<string, { from: string; to: string }> = {
  已繳納: { from: "#059669", to: "#34d399" },
  未繳納: { from: "#475569", to: "#94a3b8" },
  "有會員資格（但未繳納）": { from: "#d97706", to: "#fbbf24" },
};

/* ------------------------------ Helper Functions ----------------------------- */

function buildChartData(students: any[], viewMode: ViewMode): ChartData[] {
  const currentYear = getCurrentAcademicYear();

  const filtered =
    viewMode === "current"
      ? students.filter((s) => !s.isWithdrawn && s.schoolYear === currentYear)
      : students.filter((s) => {
          const yearsElapsed = currentYear - s.schoolYear;
          return !s.isWithdrawn && yearsElapsed >= 0 && yearsElapsed < 3;
        });

  const total = filtered.length;
  const counts: Record<string, number> = {};

  for (const s of filtered) {
    const status = s.status || "未繳納";
    counts[status] = (counts[status] || 0) + 1;
  }

  return STATUS_ORDER.map((status) => {
    const count = counts[status] || 0;
    return {
      key: status,
      label: status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  }).filter((d) => d.count > 0);
}

const EmptyState = ({ viewMode }: { viewMode: ViewMode }) => (
  <div className="w-full h-[270px] lg:h-[310px] bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-xl border border-gray-700/30 backdrop-blur-sm flex flex-col justify-center items-center p-5 lg:p-6">
    <div className="text-center space-y-3">
      <div className="w-12 h-12 lg:w-14 lg:h-14 mx-auto mb-2 lg:mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
        <svg
          className="w-6 h-6 lg:w-7 lg:h-7 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <div>
        <p className="text-gray-300 text-base lg:text-lg font-medium mb-1 lg:mb-2">
          目前沒有學生資料可供分析
        </p>
        <p className="text-gray-400 text-xs lg:text-sm leading-relaxed">
          {viewMode === "current"
            ? "請嘗試切換到「所有在學學生」檢視，或匯入當屆學生資料"
            : "請先透過資料庫頁面匯入學生資料"}
        </p>
      </div>
    </div>
  </div>
);

const TooltipContent = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload as ChartData;
  return (
    <div className="rounded-lg border border-gray-700/60 bg-gray-800/90 backdrop-blur px-3 py-2 shadow-lg">
      <div className="text-xs font-medium text-gray-300 mb-1">{item.label}</div>
      <div className="text-sm text-white font-semibold">
        {item.count} 人{" "}
        <span className="text-gray-400 font-normal ml-1">
          ({item.percentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
};

/* --------------------------------- Component -------------------------------- */

export default function FeeStatusPieChart({
  viewMode = "all",
}: FeeStatusPieChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "students"));
    const students = snap.docs.map((d) => d.data());
    setData(buildChartData(students, viewMode));
    setLoading(false);
  }, [viewMode]);

  useEffect(() => {
    load();
  }, [load]);

  const totalCount = useMemo(
    () => data.reduce((sum, d) => sum + d.count, 0),
    [data],
  );
  const paidCount = useMemo(
    () => data.find((d) => d.key === "已繳納")?.count || 0,
    [data],
  );
  const paidRate = useMemo(
    () => (totalCount > 0 ? (paidCount / totalCount) * 100 : 0),
    [paidCount, totalCount],
  );

  if (loading) return <ChartLoadingSpinner height="h-64" text="載入圓餅圖中" />;

  if (data.length === 0) return <EmptyState viewMode={viewMode} />;

  return (
    <div className="w-full relative">
      <div className="relative h-[270px] sm:h-[285px] lg:h-[310px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((d) => {
                const g = GRADIENTS[d.key] || {
                  from: "#6366f1",
                  to: "#818cf8",
                };
                return (
                  <linearGradient
                    id={`grad-${d.key}`}
                    key={d.key}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={g.from} />
                    <stop offset="100%" stopColor={g.to} />
                  </linearGradient>
                );
              })}
            </defs>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              innerRadius={62}
              outerRadius={108}
              paddingAngle={1.5}
              cornerRadius={5}
              startAngle={88}
              endAngle={448}
            >
              {data.map((d, idx) => (
                <Cell
                  key={d.key}
                  fill={`url(#grad-${d.key})`}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth={activeIndex === idx ? 3 : 1.5}
                  opacity={
                    activeIndex === null || activeIndex === idx ? 1 : 0.4
                  }
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent />} />
          </PieChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[-1]">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {paidCount}
              <span className="text-sm sm:text-base ml-2 text-gray-400">
                / {totalCount}
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-400">
              {paidRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Collapsible legend */}
      <div className="mt-2">
        <button
          type="button"
          aria-expanded={legendOpen}
          onClick={() => setLegendOpen((o) => !o)}
          className="w-full flex items-center justify-between rounded-md border border-gray-700/50 bg-gray-800/60 px-3 py-2 text-left text-xs sm:text-sm text-gray-200 font-medium transition-colors active:scale-[0.98]"
        >
          <span>繳納狀態分類</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              legendOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        <div
          className={`transition-all ${
            legendOpen
              ? "mt-2 opacity-100 max-h-[1200px]"
              : "opacity-0 max-h-0 overflow-hidden"
          }`}
        >
          <div className="flex flex-col gap-2">
            {data.map((item, idx) => {
              const g = GRADIENTS[item.key] || {
                from: "#6366f1",
                to: "#818cf8",
              };
              const isActive = idx === activeIndex;
              return (
                <button
                  key={item.key}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onFocus={() => setActiveIndex(idx)}
                  onBlur={() => setActiveIndex(null)}
                  className={`group w-full rounded-md border flex flex-col items-start px-3 py-2 text-left transition ${
                    isActive
                      ? "border-gray-600/80 bg-gray-800/80 shadow shadow-black/20"
                      : "border-gray-700/40 bg-gray-800/40 hover:bg-gray-800/70"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-sm shadow-inner"
                      style={{
                        background: `linear-gradient(to bottom, ${g.from}, ${g.to})`,
                      }}
                    />
                    <span className="text-[12px] font-medium text-gray-100">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-sm font-semibold text-white leading-none">
                      {item.count}
                    </span>
                    <span className="text-[10px] text-gray-400 mb-[2px]">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 rounded bg-gray-700/40 overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${item.percentage}%`,
                        background: `linear-gradient(to right, ${g.from}, ${g.to})`,
                        boxShadow: isActive
                          ? `0 0 0 1px ${g.from} inset`
                          : "none",
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-[10px] sm:text-[11px] text-gray-500 leading-relaxed">
            {viewMode === "current"
              ? "高一新生繳納概況"
              : "在學學生（高一至高三）繳納概況，不計入畢業或已離校學生。"}
          </div>
        </div>
      </div>
    </div>
  );
}
