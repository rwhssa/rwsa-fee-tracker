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

export default function FeeStatusPieChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("current");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "students"));
      const students = querySnapshot.docs.map((doc) => doc.data());

      // Get current academic year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentAcademicYear =
        currentMonth >= 8 ? currentYear - 1911 : currentYear - 1912;

      // Filter students based on view mode
      const filteredStudents =
        viewMode === "current"
          ? students.filter(
              (student) => student.schoolYear === currentAcademicYear,
            )
          : students.filter((student) => {
              // Include all currently enrolled students (not graduated)
              const studentYear = student.schoolYear;
              const yearsElapsed = currentAcademicYear - studentYear;
              return yearsElapsed >= 0 && yearsElapsed < 3; // High school is 3 years
            });

      const statusCounts: { [key: string]: number } = filteredStudents.reduce(
        (acc, student) => {
          const status = student.status || "未繳納";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {},
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

  if (data.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-700 rounded flex justify-center items-center">
        <p className="text-gray-400">目前沒有學生資料可供分析。</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* View Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-800/60 rounded-xl p-1 border border-gray-700/50">
          <button
            onClick={() => setViewMode("current")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "current"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            當屆（高一）
          </button>
          <button
            onClick={() => setViewMode("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "all"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            所有在學學生
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
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
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
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
                  fontSize="12"
                >
                  {displayValue}
                </text>
              );
            }}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.name] || "#ccc"} />
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
    </div>
  );
}
