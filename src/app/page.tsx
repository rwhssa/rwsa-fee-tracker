"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeeStatusPieChart from "@/components/FeeStatusPieChart";
import AnnualPaymentChart from "@/components/AnnualPaymentChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChartLoadingSpinner from "@/components/ChartLoadingSpinner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getCurrentAcademicYear } from "@/lib/utils";

type ViewMode = "current" | "all";
type LineChartViewMode = "count" | "percentage";

export default function Home() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [paidStudents, setPaidStudents] = useState(0);
  const [exemptStudents, setExemptStudents] = useState(0);
  const [unpaidStudents, setUnpaidStudents] = useState(0);
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

        setTotalStudents(students.length);
        setPaidStudents(
          students.filter((student) => student.status === "已繳納").length,
        );
        setExemptStudents(
          students.filter(
            (student) => student.status === "有會員資格（但未繳納）",
          ).length,
        );
        setUnpaidStudents(
          students.filter((student) => student.status === "未繳納").length,
        );
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

          {/* Key Statistics */}
          <div className="grid grid-cols-2 gap-5 mb-8">
            <div className="card">
              <div className="text-sm text-gray-400 mb-3 font-medium">
                在學學生人數
              </div>
              <div className="text-2xl font-bold text-white flex items-center min-h-[2.5rem]">
                {loading ? (
                  <LoadingSpinner size="sm" variant="dots" />
                ) : (
                  `${totalStudents} 人`
                )}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-3 font-medium">
                已繳納人數
              </div>
              <div className="text-2xl font-bold text-green-400 flex items-center min-h-[2.5rem]">
                {loading ? (
                  <LoadingSpinner size="sm" variant="dots" />
                ) : (
                  `${paidStudents} 人`
                )}
              </div>
            </div>
          </div>
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
