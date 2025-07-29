"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import ChartLoadingSpinner from "./ChartLoadingSpinner";

interface AnnualChartData {
  year: string;
  paid: number;
  total: number;
  paymentRate: number;
}

type ViewMode = "count" | "percentage";

export default function AnnualPaymentChart() {
  const [data, setData] = useState<AnnualChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("count");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "students"));
      const students = querySnapshot.docs.map((doc) => doc.data());

      const yearlyData: {
        [key: string]: {
          year: string;
          paid: number;
          total: number;
          paymentRate: number;
        };
      } = students.reduce((acc, student) => {
        const year = student.schoolYear;
        if (!acc[year]) {
          acc[year] = {
            year: `${year} 學年度`,
            paid: 0,
            total: 0,
            paymentRate: 0,
          };
        }
        acc[year].total++;
        if (student.status === "已繳納") {
          acc[year].paid++;
        }
        return acc;
      }, {});

      // Calculate payment rates
      Object.values(yearlyData).forEach((data) => {
        data.paymentRate = data.total > 0 ? (data.paid / data.total) * 100 : 0;
      });

      const chartData: AnnualChartData[] = Object.values(yearlyData).sort(
        (a, b) => a.year.localeCompare(b.year),
      );

      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return <ChartLoadingSpinner height="h-64" text="載入折線圖中" />;
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
            onClick={() => setViewMode("count")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "count"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            數量
          </button>
          <button
            onClick={() => setViewMode("percentage")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              viewMode === "percentage"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            比例
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
          <XAxis dataKey="year" stroke="#9ca3af" />
          <YAxis
            stroke="#9ca3af"
            domain={
              viewMode === "percentage"
                ? [0, 100]
                : [
                    (dataMin: number) =>
                      Math.max(0, dataMin - Math.max(1, dataMin * 0.1)),
                    (dataMax: number) => dataMax + Math.max(1, dataMax * 0.1),
                  ]
            }
            tickFormatter={
              viewMode === "percentage"
                ? (value) => `${value}%`
                : (value) => Math.round(value).toString()
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#334155",
              border: "none",
              borderRadius: "0.5rem",
            }}
            itemStyle={{ color: "#e2e8f0" }}
            formatter={(value, name) => {
              if (viewMode === "percentage") {
                return [`${Number(value).toFixed(1)}%`, name];
              } else {
                return [`${value} 人`, name];
              }
            }}
          />
          <Legend wrapperStyle={{ color: "#e2e8f0" }} />
          {viewMode === "count" ? (
            <>
              <Line
                type="monotone"
                dataKey="paid"
                name="已繳納"
                stroke="#4ade80"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="總人數"
                stroke="#60a5fa"
                strokeWidth={2}
              />
            </>
          ) : (
            <Line
              type="monotone"
              dataKey="paymentRate"
              name="繳納率"
              stroke="#4ade80"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
