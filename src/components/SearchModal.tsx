"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

import { type Student } from "@/lib/utils";

export default function SearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSearched(true);
    setStudent(null);

    try {
      const q = query(
        collection(db, "students"),
        where("studentId", "==", studentId),
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentData = querySnapshot.docs[0].data() as Student;
        studentData.id = querySnapshot.docs[0].id;
        setStudent(studentData);
      } else {
        setStudent(null);
      }
    } catch (error) {
      console.error("Error searching for student: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStudentId("");
    setStudent(null);
    setSearched(false);
    onClose();
  };

  const getStatusStyle = (status: string | null) => {
    switch (status) {
      case "已繳納":
        return "status-paid";
      case "有會員資格（但未繳納）":
        return "status-exempt";
      case "未繳納":
        return "status-unpaid";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "已繳納":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "有會員資格（但未繳納）":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case "未繳納":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      default:
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto">
      <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
        <div className="bg-gray-900 border border-gray-600 rounded-3xl w-full max-w-md shadow-2xl animate-scale-in">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">查詢學生</h2>
              <p className="text-gray-400 text-sm">輸入學號查詢繳費狀態</p>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    學號
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="input w-full"
                    placeholder="請輸入 7 位數學號"
                    required
                    pattern="\d{7}"
                    title="學號必須是 7 位數字"
                    maxLength={7}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || studentId.length !== 7}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="loading-spinner"></div>
                      <span>查詢中...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <span>查詢</span>
                    </div>
                  )}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searched && !loading && student && (
              <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 mb-6 animate-slide-up">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">找到學生</h3>
                    <p className="text-gray-400 text-sm">查詢結果</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-gray-600">
                    <span className="text-gray-300">班級</span>
                    <span className="text-white font-semibold">
                      {student.class}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-600">
                    <span className="text-gray-300">學號</span>
                    <span className="text-white font-semibold font-mono">
                      {student.studentId}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-600">
                    <span className="text-gray-300">姓名</span>
                    <span className="text-white font-semibold">
                      {student.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-gray-300">繳費狀態</span>
                    <div
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(student.status)}`}
                    >
                      {getStatusIcon(student.status)}
                      <span>{student.status || "未記錄"}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {searched && !loading && !student && (
              <div className="bg-gray-800 border border-gray-600 rounded-2xl p-6 mb-6 animate-slide-up">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/80 rounded-xl mx-auto mb-4 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    查無此學生
                  </h3>
                  <p className="text-gray-300 text-sm">
                    請確認學號是否正確，或聯絡系統管理員
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button className="btn-secondary flex-1" onClick={handleClose}>
                關閉
              </button>
              {student && (
                <button
                  className="btn-primary flex-1"
                  onClick={() => {
                    // Future: Navigate to student detail page
                    console.log("Navigate to student detail:", student.id);
                  }}
                >
                  查看詳情
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
