"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from "recharts";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ChartLoadingSpinner from "./ChartLoadingSpinner";

interface AnnualChartRow {
  year: number;
  label: string;
  paid: number;
  total: number;
  paymentRate: number;
}

interface AnnualPaymentChartProps {
  className?: string;
}

interface TooltipPayloadRow {
  payload: AnnualChartRow;
  dataKey: string;
  value: number;
  name: string;
}

const PAID_GRADIENT = {
  area: { id: "gradPaid", from: "#34d399", to: "#059669" },
  line: { id: "gradPaidLine", from: "#34d399", to: "#059669" },
};
const TOTAL_GRADIENT = {
  area: { id: "gradTotal", from: "#60a5fa", to: "#1d4ed8" },
  line: { id: "gradTotalLine", from: "#60a5fa", to: "#3b82f6" },
};

function buildRows(raw: any[]): AnnualChartRow[] {
  const byYear: Record<number, { total: number; paid: number }> = {};
  for (const s of raw) {
    if (s.isWithdrawn) continue;
    const y = Number(s.schoolYear);
    if (!byYear[y]) byYear[y] = { total: 0, paid: 0 };
    byYear[y].total += 1;
    if (s.status === "已繳納") byYear[y].paid += 1;
  }
  return Object.entries(byYear)
    .map(([year, v]) => {
      const paymentRate = v.total > 0 ? (v.paid / v.total) * 100 : 0;
      return {
        year: Number(year),
        label: `${year} 學年度`,
        paid: v.paid,
        total: v.total,
        paymentRate,
      };
    })
    .sort((a, b) => a.year - b.year);
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) {
  if (!active || !payload?.length) return null;
  const rows = payload as TooltipPayloadRow[];
  const row = rows[0].payload;
  return (
    <div className="rounded-lg border border-gray-700/60 bg-gray-800/90 backdrop-blur px-3 py-2 shadow-lg">
      <div className="text-xs text-gray-400 mb-1">{row.label}</div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm" />
          <span className="text-[13px] text-gray-300">
            已繳納:{" "}
            <span className="text-white font-medium">{row.paid} 人</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 shadow-sm" />
          <span className="text-[13px] text-gray-300">
            總人數:{" "}
            <span className="text-white font-medium">{row.total} 人</span>
          </span>
        </div>
        <div className="pt-1 text-[12px] text-emerald-300/80">
          繳納率 {row.paymentRate.toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export default function AnnualPaymentChart({
  className = "",
}: AnnualPaymentChartProps) {
  const [data, setData] = useState<AnnualChartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 640 : true,
  );

  const load = useCallback(async () => {
    setLoading(true);
    const snap = await getDocs(collection(db, "students"));
    const rows = buildRows(snap.docs.map((d) => d.data()));
    setData(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  const latest = useMemo(
    () => (data.length ? data[data.length - 1] : null),
    [data],
  );

  const yDomain = useMemo(() => {
    if (!data.length) return [0, 100];
    const maxVal = Math.max(...data.map((d) => d.total));
    const pad = Math.ceil(maxVal * 0.06) || 1;
    return [0, maxVal + pad];
  }, [data]);

  if (loading) return <ChartLoadingSpinner height="h-64" text="載入折線圖中" />;

  if (!data.length)
    return (
      <div className="w-full h-[320px] sm:h-[340px] rounded-2xl border border-gray-700/30 bg-gradient-to-br from-gray-800/40 to-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center px-6 sm:px-8">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gray-700/50 flex items-center justify-center mb-3 sm:mb-4">
          <svg
            className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h18M4 4h16v12a1 1 0 01-1-1H5a1 1 0 01-1-1V4zM8 21l4-4 4 4"
            />
          </svg>
        </div>
        <p className="text-gray-300 text-base sm:text-lg font-medium mb-1.5 sm:mb-2">
          目前沒有學生資料可供分析
        </p>
        <p className="text-gray-400 text-xs sm:text-sm leading-relaxed text-center px-2">
          請先透過資料庫頁面匯入學生資料
        </p>
      </div>
    );

  const renderDot = (ctx: any, color: string) => {
    const isHighlighted =
      ctx.index === hoverIndex ||
      hoverIndex === null ||
      ctx.index === data.length - 1;
    const outer = isMobile ? (isHighlighted ? 8 : 6) : isHighlighted ? 6 : 4;
    const inner = isMobile
      ? isHighlighted
        ? 5
        : 3.5
      : isHighlighted
        ? 4
        : 2.5;
    return (
      <g
        key={ctx.payload?.year ?? ctx.index}
        onMouseEnter={() => !isMobile && setHoverIndex(ctx.index)}
        onMouseLeave={() => !isMobile && setHoverIndex(null)}
        onTouchStart={() => setHoverIndex(ctx.index)}
        onTouchEnd={() => setHoverIndex(null)}
        cursor="pointer"
      >
        <circle
          cx={ctx.cx}
          cy={ctx.cy}
          r={outer}
          fill="rgba(255,255,255,0.15)"
          stroke={color}
          strokeWidth={1.5}
        />
        <circle cx={ctx.cx} cy={ctx.cy} r={inner} fill={color} />
        {isMobile && (
          <circle
            cx={ctx.cx}
            cy={ctx.cy}
            r={outer + 10}
            fill="transparent"
            pointerEvents="stroke"
          />
        )}
      </g>
    );
  };

  return (
    <div className={className}>
      <div className="relative w-full h-[300px] sm:h-[340px] group">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            onMouseLeave={() => !isMobile && setHoverIndex(null)}
            margin={
              isMobile
                ? { top: 12, right: 12, left: 4, bottom: 6 }
                : { top: 18, right: 28, left: 8, bottom: 12 }
            }
          >
            <defs>
              <linearGradient
                id={PAID_GRADIENT.area.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={PAID_GRADIENT.area.from}
                  stopOpacity={0.85}
                />
                <stop
                  offset="100%"
                  stopColor={PAID_GRADIENT.area.to}
                  stopOpacity={0.2}
                />
              </linearGradient>
              <linearGradient
                id={PAID_GRADIENT.line.id}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={PAID_GRADIENT.line.from} />
                <stop offset="100%" stopColor={PAID_GRADIENT.line.to} />
              </linearGradient>
              <linearGradient
                id={TOTAL_GRADIENT.area.id}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={TOTAL_GRADIENT.area.from}
                  stopOpacity={0.7}
                />
                <stop
                  offset="100%"
                  stopColor={TOTAL_GRADIENT.area.to}
                  stopOpacity={0.15}
                />
              </linearGradient>
              <linearGradient
                id={TOTAL_GRADIENT.line.id}
                x1="0"
                y1="0"
                x2="1"
                y2="0"
              >
                <stop offset="0%" stopColor={TOTAL_GRADIENT.line.from} />
                <stop offset="100%" stopColor={TOTAL_GRADIENT.line.to} />
              </linearGradient>
            </defs>
            {!isMobile && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#475569"
                className="transition-opacity duration-300 group-hover:opacity-60"
              />
            )}
            <XAxis
              dataKey="label"
              stroke="#9ca3af"
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: "#64748b" }}
              tickLine={{ stroke: "#64748b" }}
              minTickGap={isMobile ? 8 : 16}
            />
            <YAxis
              stroke="#9ca3af"
              domain={yDomain as any}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              axisLine={{ stroke: "#64748b" }}
              tickLine={{ stroke: "#64748b" }}
              tickFormatter={(v: number) => v.toString()}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 30 }}
              cursor={{
                stroke: "rgba(255,255,255,0.15)",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="none"
              fill={`url(#${TOTAL_GRADIENT.area.id})`}
              fillOpacity={0.5}
              activeDot={false}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="總人數"
              stroke={`url(#${TOTAL_GRADIENT.line.id})`}
              strokeWidth={isMobile ? 2 : 2.2}
              dot={(c) => renderDot(c, "#60a5fa")}
              activeDot={false}
              strokeLinecap="round"
            />
            <Line
              type="monotone"
              dataKey="paid"
              name="已繳納"
              stroke={`url(#${PAID_GRADIENT.line.id})`}
              strokeWidth={isMobile ? 2.2 : 2.4}
              dot={(c) => renderDot(c, "#34d399")}
              activeDot={false}
              strokeLinecap="round"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex flex-col items-end gap-1 pointer-events-none">
          <div className="flex items-center gap-1 rounded-md bg-gray-800/70 border border-gray-700/50 px-1.5 py-0.5 sm:px-2 sm:py-1 backdrop-blur">
            <span
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm shadow"
              style={{
                background: "linear-gradient(to right,#34d399,#059669)",
              }}
            />
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-200">
              已繳納
            </span>
            <span
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm shadow ml-1"
              style={{
                background: "linear-gradient(to right,#60a5fa,#3b82f6)",
              }}
            />
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-200">
              總人數
            </span>
          </div>
          {latest && (
            <div className="rounded-md bg-emerald-500/15 border border-emerald-400/30 px-2 py-1 backdrop-blur text-[10px] sm:text-xs font-medium text-emerald-300">
              最新繳納率 {latest.paymentRate.toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
