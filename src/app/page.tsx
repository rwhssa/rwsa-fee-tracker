"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeeStatusPieChart from "@/components/FeeStatusPieChart";
import AnnualPaymentChart from "@/components/AnnualPaymentChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChartLoadingSpinner from "@/components/ChartLoadingSpinner";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getCurrentAcademicYear } from "@/lib/utils";
import StudentStatsPanel from "@/components/StudentStatsPanel";

type ViewMode = "current" | "all";
type LineChartViewMode = "count" | "percentage";

export default function Home() {
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartViewMode, setChartViewMode] = useState<ViewMode>("all");
  const [lineChartViewMode, setLineChartViewMode] =
    useState<LineChartViewMode>("count");

  useEffect(() => {
    const fetchStudentStats = async () => {
      try {
        setLoading(true);
        const studentsCollection = collection(db, "students");
        const querySnapshot = await getDocs(studentsCollection);
        const students = querySnapshot.docs.map((doc) => doc.data());
        setStudentsData(students as any);
      } catch (error) {
        console.error("Error fetching student stats: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentStats();
  }, []);

  const currentAcademicYear = getCurrentAcademicYear();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-950 safe-area-top">
        {/* Header Section */}
        <div className="px-6 pt-8 pb-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              學生會會費追蹤系統
            </h1>
            <p className="text-gray-400 text-base font-medium">
              {currentAcademicYear} 學年度會費管理系統
            </p>
          </div>

          <StudentStatsPanel
            students={studentsData as any}
            loading={loading}
            metrics={["total", "paid"]}
            className="mb-8"
          />
        </div>

        {/* Fee Payment Overview Charts */}
        <div className="px-6 mb-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white tracking-tight">
              會費繳納情形概要
            </h2>
          </div>
          {loading ? (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-6">
                  繳納狀態分佈
                </h3>
                <ChartLoadingSpinner height="h-64" text="載入圓餅圖中" />
              </div>
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-2">
                  歷年繳納數量及比例折線圖
                </h3>
                <ChartLoadingSpinner height="h-64" text="載入折線圖中" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Year & Enrolled Students Fee Status Pie Chart */}
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">繳納狀態分佈</h3>

                  {/* Pie Chart View Mode Toggle */}
                  <div className="bg-gray-800/90 rounded-xl p-1 border border-gray-700/60 shadow-lg">
                    <button
                      onClick={() => setChartViewMode("all")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 min-h-[40px] ${
                        chartViewMode === "all"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-gray-700/60 active:bg-gray-700/80 active:scale-95"
                      }`}
                      style={{ transform: "translateZ(0)" }}
                    >
                      在學學生
                    </button>
                    <button
                      onClick={() => setChartViewMode("current")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 min-h-[40px] ${
                        chartViewMode === "current"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-gray-700/60 active:bg-gray-700/80 active:scale-95"
                      }`}
                      style={{ transform: "translateZ(0)" }}
                    >
                      高一
                    </button>
                  </div>
                </div>
                <FeeStatusPieChart viewMode={chartViewMode} />
              </div>

              {/* Annual Payment Trend Line Chart */}
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">
                    歷年繳納趨勢圖
                  </h3>

                  {/* Line Chart View Mode Toggle */}
                  <div className="bg-gray-800/90 rounded-xl p-1 border border-gray-700/60 shadow-lg">
                    <button
                      onClick={() => setLineChartViewMode("count")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 min-h-[40px] ${
                        lineChartViewMode === "count"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-gray-700/60 active:bg-gray-700/80 active:scale-95"
                      }`}
                      style={{ transform: "translateZ(0)" }}
                    >
                      數量
                    </button>
                    <button
                      onClick={() => setLineChartViewMode("percentage")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 min-h-[40px] ${
                        lineChartViewMode === "percentage"
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-gray-300 hover:text-white hover:bg-gray-700/60 active:bg-gray-700/80 active:scale-95"
                      }`}
                      style={{ transform: "translateZ(0)" }}
                    >
                      比例
                    </button>
                  </div>
                </div>
                <AnnualPaymentChart
                  viewMode={lineChartViewMode}
                  showToggle={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottom padding for navigation */}
        <div className="h-20 lg:h-6"></div>
      </main>
    </ProtectedRoute>
  );
}
