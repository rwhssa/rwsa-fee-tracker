"use client";

import { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ImportModal from "@/components/ImportModal";
import EditStudentModal from "@/components/EditStudentModal";
import LoadingSpinner from "@/components/LoadingSpinner";
import ChartLoadingSpinner from "@/components/ChartLoadingSpinner";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

interface Student {
  id: string;
  class: string;
  studentId: string;
  name: string;
  status: "已繳納" | "有會員資格（但未繳納）" | "未繳納" | null;
  schoolYear: number;
}

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

const getGradeStatus = (schoolYear: number, currentYear: number) => {
  const yearsElapsed = currentYear - schoolYear;
  if (yearsElapsed === 0) return "高一";
  if (yearsElapsed === 1) return "高二";
  if (yearsElapsed === 2) return "高三";
  return `已畢業 ${yearsElapsed - 2} 年`;
};

export default function DatabasePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Filters
  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Sort config
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // Filter dropdowns state
  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Refs for dropdown containers
  const classFilterRef = useRef<HTMLDivElement>(null);
  const statusFilterRef = useRef<HTMLDivElement>(null);

  const currentAcademicYear = getCurrentAcademicYear();

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const studentsCollection = collection(db, "students");
        const q = query(studentsCollection, orderBy("studentId"));

        const querySnapshot = await getDocs(q);
        const studentsData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Student[];
        setStudents(studentsData);
      } catch (error) {
        console.error("Error fetching students: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...students];

    // Year filter
    if (yearFilter !== "all") {
      filtered = filtered.filter(
        (student) => student.schoolYear === Number(yearFilter),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((student) => student.status === statusFilter);
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((student) => student.class === classFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.includes(searchTerm) ||
          student.class.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Student];
        const bValue = b[sortConfig.key as keyof Student];

        // Handle null values
        if (aValue === null && bValue === null) return 0;
        if (aValue === null) return sortConfig.direction === "asc" ? 1 : -1;
        if (bValue === null) return sortConfig.direction === "asc" ? -1 : 1;

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredStudents(filtered);
  }, [students, yearFilter, statusFilter, classFilter, searchTerm, sortConfig]);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        classFilterRef.current &&
        !classFilterRef.current.contains(event.target as Node)
      ) {
        setShowClassFilter(false);
      }
      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(event.target as Node)
      ) {
        setShowStatusFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        return {
          key,
          direction: current.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const updateStudent = async (
    studentId: string,
    updates: Partial<Student>,
  ) => {
    try {
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, updates);

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentId ? { ...student, ...updates } : student,
        ),
      );
    } catch (error) {
      console.error("Error updating student: ", error);
    }
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const getStatusStyle = (status: Student["status"]) => {
    switch (status) {
      case "已繳納":
        return "status-paid";
      case "未繳納":
        return "status-unpaid";
      case "有會員資格（但未繳納）":
        return "status-exempt";
      default:
        return "bg-gray-500/20 text-gray-400 border border-gray-500/30";
    }
  };

  const getShortStatus = (status: Student["status"]) => {
    switch (status) {
      case "已繳納":
        return "已繳納";
      case "未繳納":
        return "未繳納";
      case "有會員資格（但未繳納）":
        return "免繳費";
      default:
        return "未記錄";
    }
  };

  // Generate filter options
  const academicYearOptions = Array.from(
    new Set(students.map((s) => s.schoolYear)),
  ).sort((a, b) => b - a);

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class)),
  ).sort();

  const statusOptions = ["已繳納", "有會員資格（但未繳納）", "未繳納"] as const;

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-950 safe-area-top">
        {/* Header */}
        <div className="px-4 pt-8 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">資料庫</h1>
              <p className="text-gray-400 text-sm">學生資料管理系統</p>
            </div>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="btn-primary text-sm px-3 py-2"
            >
              匯入資料
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-400 mb-2">總學生數</div>
              <div className="text-2xl font-bold text-white">
                {students.length}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-400 mb-2">已繳費</div>
              <div className="text-2xl font-bold text-green-400">
                {students.filter((s) => s.status === "已繳納").length}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-400 mb-2">未繳費</div>
              <div className="text-2xl font-bold text-red-400">
                {students.filter((s) => s.status === "未繳納").length}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-400 mb-2">繳費率</div>
              <div className="text-2xl font-bold text-blue-400">
                {students.length > 0
                  ? Math.round(
                      (students.filter((s) => s.status === "已繳納").length /
                        students.length) *
                        100,
                    )
                  : 0}
                %
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3 mb-4">
            {/* Year Filter */}
            <select
              className="w-full text-sm bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
            >
              <option value="all">所有學年度</option>
              {academicYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year} ({getGradeStatus(year, currentAcademicYear)})
                </option>
              ))}
            </select>

            {/* Search */}
            <input
              type="text"
              className="w-full text-sm bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
              placeholder="搜尋學生姓名、學號或班級..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-xs text-gray-400 mb-4">
            顯示 {filteredStudents.length} / {students.length} 筆資料
            {(classFilter !== "all" || statusFilter !== "all") && (
              <span className="ml-2 text-blue-400">
                (已套用篩選: {classFilter !== "all" && `班級=${classFilter}`}{" "}
                {statusFilter !== "all" && `狀態=${statusFilter}`})
              </span>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="mx-4 mb-32">
          {loading ? (
            <div className="p-4">
              <LoadingSpinner
                size="lg"
                text="載入學生資料中"
                variant="skeleton"
              />
            </div>
          ) : (
            <>
              <table className="w-full text-sm bg-gray-900/40 rounded-t-2xl border border-gray-800/50">
                {/* Table Header */}
                <thead className="bg-gray-900/80 sticky top-0 z-10">
                  <tr>
                    <th className="table-cell text-center border-b border-gray-800 w-20">
                      <div className="relative" ref={classFilterRef}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleSort("class")}
                            className="text-gray-300 hover:text-white"
                          >
                            <span>班級</span>
                            {sortConfig?.key === "class" && (
                              <span className="text-xs ml-1">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowClassFilter(!showClassFilter);
                              setShowStatusFilter(false);
                            }}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                        {showClassFilter && (
                          <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-32 z-50">
                            <button
                              onClick={() => {
                                setClassFilter("all");
                                setShowClassFilter(false);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              所有班級
                            </button>
                            {uniqueClasses.map((className, index) => (
                              <button
                                key={className}
                                onClick={() => {
                                  setClassFilter(className);
                                  setShowClassFilter(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                {className}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                    <th className="table-cell text-center border-b border-gray-800 w-20">
                      <button
                        onClick={() => handleSort("studentId")}
                        className="flex items-center space-x-1 text-gray-300 hover:text-white"
                      >
                        <span>學號</span>
                        {sortConfig?.key === "studentId" && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="table-cell text-center border-b border-gray-800 w-20">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center space-x-1 text-gray-300 hover:text-white"
                      >
                        <span>姓名</span>
                        {sortConfig?.key === "name" && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th className="table-cell text-center border-b border-gray-800 w-28">
                      <div className="relative" ref={statusFilterRef}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleSort("status")}
                            className="text-gray-300 hover:text-white"
                          >
                            <span>狀態</span>
                            {sortConfig?.key === "status" && (
                              <span className="text-xs ml-1">
                                {sortConfig.direction === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowStatusFilter(!showStatusFilter);
                              setShowClassFilter(false);
                            }}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                        {showStatusFilter && (
                          <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 min-w-40 z-50">
                            <button
                              onClick={() => {
                                setStatusFilter("all");
                                setShowStatusFilter(false);
                              }}
                              className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                            >
                              所有狀態
                            </button>
                            {statusOptions.map((status, index) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setStatusFilter(status);
                                  setShowStatusFilter(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </th>
                    <th className="table-cell text-center border-b border-gray-800 w-14">
                      <span className="text-gray-300">操作</span>
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                      <tr
                        key={student.id}
                        className={`table-row border-b border-gray-800/50 ${
                          index % 2 === 0 ? "bg-gray-950/50" : "bg-gray-900/20"
                        }`}
                      >
                        <td className="table-cell text-white text-center truncate w-20">
                          {student.class}
                        </td>
                        <td className="table-cell text-gray-300 font-mono text-xs text-center truncate w-24">
                          {student.studentId}
                        </td>
                        <td className="table-cell text-white text-center truncate w-20">
                          {student.name}
                        </td>
                        <td className="table-cell text-center w-28">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(student.status)}`}
                          >
                            {getShortStatus(student.status)}
                          </span>
                        </td>
                        <td className="table-cell text-center w-14">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-800 transition-colors"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="table-cell py-12 text-center text-gray-400"
                      >
                        {searchTerm ||
                        yearFilter !== "all" ||
                        statusFilter !== "all" ||
                        classFilter !== "all"
                          ? "沒有符合條件的資料"
                          : "尚無學生資料"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />

        {/* Edit Modal */}
        <EditStudentModal
          isOpen={isEditModalOpen}
          student={selectedStudent}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null);
          }}
          onSave={updateStudent}
        />
      </main>
    </ProtectedRoute>
  );
}
