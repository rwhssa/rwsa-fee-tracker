"use client";

import { calculateStudentStats, type Student } from "@/lib/utils";
import LoadingSpinner from "./LoadingSpinner";

type StatKey = "total" | "paid" | "unpaid" | "exempt" | "rate";

interface StudentStatsPanelProps {
  students: Student[];
  loading?: boolean;
  metrics?: StatKey[];
  className?: string;
}

interface MetricConfig {
  key: StatKey;
  label: string;
  value: (s: ReturnType<typeof calculateStudentStats>) => string | number;
  accent: string;
}

const METRIC_CONFIGS: MetricConfig[] = [
  {
    key: "total",
    label: "在學學生",
    value: (s) => s.total,
    accent: "text-white",
  },
  {
    key: "paid",
    label: "已繳納",
    value: (s) => s.paid,
    accent: "text-green-400",
  },
  {
    key: "unpaid",
    label: "未繳費",
    value: (s) => s.unpaid,
    accent: "text-red-400",
  },
  {
    key: "exempt",
    label: "免繳費",
    value: (s) => s.exempt,
    accent: "text-amber-400",
  },
  {
    key: "rate",
    label: "繳費率",
    value: (s) => Math.round(s.paymentRate),
    accent: "text-blue-400",
  },
];

export default function StudentStatsPanel({
  students,
  loading = false,
  metrics = ["total", "paid"],
  className = "",
}: StudentStatsPanelProps) {
  const stats = calculateStudentStats(students as any);

  const items = METRIC_CONFIGS.filter((c) => metrics.includes(c.key));
  const isCompact = items.length >= 4;
  return (
    <div
      className={`grid grid-cols-2 ${
        isCompact ? "sm:grid-cols-4 gap-2" : "gap-3"
      } ${items.length === 5 ? "xl:grid-cols-5" : ""} ${className}`}
    >
      {items.map((cfg) => (
        <div
          key={cfg.key}
          className={`bg-gray-900/50 rounded-lg text-center border border-gray-800/40 ${
            isCompact ? "p-3" : "p-4"
          }`}
        >
          <div
            className={`${
              isCompact ? "text-sm mb-1" : "text-base mb-2"
            } text-gray-400 whitespace-nowrap truncate`}
            title={cfg.label}
          >
            {cfg.label}
          </div>
          <div
            className={`${
              isCompact ? "text-xl" : "text-2xl"
            } font-bold flex items-center justify-center min-h-[2.2rem] ${cfg.accent}`}
          >
            {loading ? (
              <LoadingSpinner size="sm" variant="dots" />
            ) : (
              <span className="flex items-baseline leading-none">
                <span className={isCompact ? "leading-none" : "leading-tight"}>
                  {cfg.value(stats)}
                </span>
                <span
                  className={`ml-1 font-medium text-gray-400 ${
                    isCompact ? "text-[10px]" : "text-xs"
                  }`}
                >
                  {cfg.key === "rate" ? "%" : "人"}
                </span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
