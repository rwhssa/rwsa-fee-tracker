"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeeStatusPieChart from "@/components/FeeStatusPieChart";
import AnnualPaymentChart from "@/components/AnnualPaymentChart";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChartLoadingSpinner from "@/components/ChartLoadingSpinner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function Home() {
  const [totalStudents, setTotalStudents] = useState(0);
  const [paidStudents, setPaidStudents] = useState(0);
  const [exemptStudents, setExemptStudents] = useState(0);
  const [unpaidStudents, setUnpaidStudents] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const getCurrentAcademicYear = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Academic year starts from August (month 8)
    if (currentMonth >= 8) {
      return currentYear - 1911; // Convert to ROC year
    } else {
      return currentYear - 1912; // Previous academic year
    }
  };

  const currentAcademicYear = getCurrentAcademicYear();

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-950 safe-area-top">
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              學生會會費追蹤系統
            </h1>
            <p className="text-gray-400 text-sm">
              {currentAcademicYear} 學年度會費管理系統
            </p>
          </div>

          {/* Key Statistics */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="card">
              <div className="text-sm text-gray-400 mb-2">在學學生人數</div>
              <div className="text-2xl font-bold text-white flex items-center min-h-[2.5rem]">
                {loading ? (
                  <LoadingSpinner size="sm" variant="dots" />
                ) : (
                  `${totalStudents} 人`
                )}
              </div>
            </div>
            <div className="card">
              <div className="text-sm text-gray-400 mb-2">已繳納人數</div>
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
        <div className="px-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">
            會費繳納情形概要
          </h2>
          {loading ? (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-6">
                  繳納狀態分佈
                </h3>
                <ChartLoadingSpinner height="h-64" text="載入圓餅圖中" />
              </div>
              <div className="card">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-2">
                    歷年繳納數量及比例折線圖
                  </h3>
                  <p className="text-gray-400 text-sm">
                    可切換檢視各學年度的繳費數量或繳納率變化趨勢
                  </p>
                </div>
                <ChartLoadingSpinner height="h-64" text="載入折線圖中" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Year & Enrolled Students Fee Status Pie Chart */}
              <div className="card">
                <h3 className="text-lg font-bold text-white mb-4">
                  繳納狀態分佈
                </h3>
                <FeeStatusPieChart />
              </div>

              {/* Annual Payment Trend Line Chart */}
              <div className="card">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-white mb-1">
                    歷年繳納數量及比例折線圖
                  </h3>
                  <p className="text-gray-400 text-sm">
                    可切換檢視各學年度的繳費數量或繳納率變化趨勢
                  </p>
                </div>
                <AnnualPaymentChart />
              </div>
            </div>
          )}
        </div>

        {/* Bottom padding for navigation */}
        <div className="h-16"></div>
      </main>
    </ProtectedRoute>
  );
}
