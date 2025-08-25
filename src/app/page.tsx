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

import ChartViewToggle from "@/components/ChartViewToggle";

type ViewMode = "current" | "all";

export default function Home() {
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartViewMode, setChartViewMode] = useState<ViewMode>("all");

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

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-950 safe-area-top">
        {/* Header Section */}
        <div className="px-6 pt-5 pb-2">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
              RWSA 會費追蹤系統
            </h1>
          </div>
        </div>

        {/* Fee Payment Overview Charts */}
        <div className="px-6 mb-6">
          {loading ? (
            <div className="space-y-3">
              <div className="card p-4 sm:p-5">
                <h3 className="text-lg font-bold text-white mb-3">
                  繳納狀態分佈
                </h3>
                <ChartLoadingSpinner height="h-64" text="載入圓餅圖中" />
              </div>
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-1.5">
                  歷年繳納數量及比例折線圖
                </h3>
                <ChartLoadingSpinner height="h-64" text="載入折線圖中" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Year & Enrolled Students Fee Status Pie Chart */}
              <div className="card p-4 sm:p-5">
                <div className="flex flex-col mb-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-bold text-white">
                      繳納狀態分佈
                    </h3>
                    <ChartViewToggle
                      value={chartViewMode}
                      onChange={setChartViewMode}
                    />
                  </div>
                </div>
                <FeeStatusPieChart viewMode={chartViewMode} />
              </div>

              {/* Annual Payment Trend Line Chart */}
              <div className="card p-4 sm:p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-bold text-white">
                    歷年繳納趨勢圖
                  </h3>
                </div>
                <AnnualPaymentChart />
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
