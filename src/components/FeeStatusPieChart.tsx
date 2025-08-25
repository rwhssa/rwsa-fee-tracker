"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import ChartLoadingSpinner from "./ChartLoadingSpinner";
import { getCurrentAcademicYear } from "@/lib/utils";

const COLORS: { [key: string]: string } = {
  已繳納: "#10b981", // emerald-500
  未繳納: "#64748b", // slate-500
  "有會員資格（但未繳納）": "#f59e0b", // amber-500
};

interface ChartData {
  name: string;
  value: number;
  count: number;
  percentage: number;
}

type ViewMode = "current" | "all";

interface FeeStatusPieChartProps {
  viewMode?: ViewMode;
}

export default function FeeStatusPieChart({
  viewMode = "all",
}: FeeStatusPieChartProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "students"));
      const students = querySnapshot.docs.map((doc) => doc.data());

      // Get current academic year
      const currentAcademicYear = getCurrentAcademicYear();

      // Filter students based on view mode
      const filteredStudents =
        viewMode === "current"
          ? students.filter(
              (student) =>
                !student.isWithdrawn &&
                student.schoolYear === currentAcademicYear,
            )
          : students.filter((student) => {
              // Include all currently enrolled students (not graduated) and not withdrawn
              const studentYear = student.schoolYear;
              const yearsElapsed = currentAcademicYear - studentYear;
              return (
                !student.isWithdrawn && yearsElapsed >= 0 && yearsElapsed < 3
              ); // High school is 3 years
            });

      const statusCounts: { [key: string]: number } = filteredStudents.reduce(
        (acc, student) => {
          const status = student.status || "未繳納";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as { [key: string]: number },
      );

      const totalStudents = filteredStudents.length;
      const chartData: ChartData[] = Object.keys(statusCounts).map((status) => {
        const count = statusCounts[status];
        const percentage =
          totalStudents > 0 ? (count / totalStudents) * 100 : 0;
        return {
          name: status,
          value: count,
          count: count,
          percentage: percentage,
        };
      });

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, [viewMode]);

  if (loading) {
    return <ChartLoadingSpinner height="h-64" text="載入圓餅圖中" />;
  }

  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="w-full h-[350px] bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-2xl border border-gray-700/30 backdrop-blur-sm flex flex-col justify-center items-center p-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700/50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
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
              <p className="text-gray-300 text-lg font-medium mb-2">
                目前沒有學生資料可供分析
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">
                {viewMode === "current"
                  ? "請嘗試切換到「所有在學學生」檢視，或匯入當屆學生資料"
                  : "請先透過資料庫頁面匯入學生資料"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              nameKey="name"
              label={({
                cx,
                cy,
                midAngle,
                innerRadius,
                outerRadius,
                value,
                name,
              }) => {
                if (midAngle === undefined || value === undefined) return null;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));

                const entry = data.find((d) => d.name === name);
                const displayValue = `${entry?.count || 0}人`;

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor={x > cx ? "start" : "end"}
                    dominantBaseline="central"
                    fontSize="13"
                    fontWeight="500"
                  >
                    {displayValue}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name] || "#ccc"}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#334155",
                border: "none",
                borderRadius: "0.5rem",
              }}
              itemStyle={{ color: "#e2e8f0" }}
              formatter={(value, name) => {
                const entry = data.find((d) => d.name === name);
                return [
                  `${entry?.count || 0} 人 (${(entry?.percentage || 0).toFixed(1)}%)`,
                  name,
                ];
              }}
            />
            <Legend wrapperStyle={{ color: "#e2e8f0" }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
