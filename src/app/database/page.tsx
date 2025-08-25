"use client";

import { useState, useEffect, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import ImportModal from "@/components/ImportModal";
import EditStudentModal from "@/components/EditStudentModal";
import BatchOperationBar from "@/components/BatchOperationBar";
import LoadingSpinner from "@/components/LoadingSpinner";
import ClassReplacementModal from "@/components/ClassReplacementModal";
import StudentStatsPanel from "@/components/StudentStatsPanel";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import {
  getCurrentAcademicYear,
  getGradeStatus,
  getStatusStyle,
  getShortStatus,
  formatAcademicYearLabel,
  type Student,
} from "@/lib/utils";

// Filtering / sorting helpers (kept in same file to minimize surface change)
const STATUS_OPTIONS = ["已繳納", "有會員資格（但未繳納）", "未繳納"] as const;

interface FilterParams {
  yearFilter: string;
  statusFilter: string;
  classFilter: string;
  searchTerm: string;
  showWithdrawn: boolean;
}

type StudentSortKey = keyof Student | "status" | "class" | "name" | "studentId";
type StudentSortConfig = { key: StudentSortKey; direction: "asc" | "desc" };

function applyFilters(students: Student[], params: FilterParams): Student[] {
  const term = params.searchTerm.toLowerCase();
  return students.filter((s) => {
    if (
      params.yearFilter !== "all" &&
      s.schoolYear !== Number(params.yearFilter)
    )
      return false;
    if (params.statusFilter !== "all" && s.status !== params.statusFilter)
      return false;
    if (params.classFilter !== "all" && s.class !== params.classFilter)
      return false;
    if (!params.showWithdrawn && s.isWithdrawn) return false;
    if (term) {
      if (
        !s.name.toLowerCase().includes(term) &&
        !s.studentId.includes(term) &&
        !s.class.toLowerCase().includes(term)
      ) {
        return false;
      }
    }
    return true;
  });
}

function sortStudents(
  list: Student[],
  sortConfig: StudentSortConfig | null,
): Student[] {
  if (!sortConfig) return list;
  return [...list].sort((a, b) => {
    const aRaw = (a as any)[sortConfig.key];
    const bRaw = (b as any)[sortConfig.key];
    const aVal = aRaw == null ? "" : String(aRaw);
    const bVal = bRaw == null ? "" : String(bRaw);
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
}

export default function DatabasePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Batch operation states
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [yearFilter, setYearFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const [sortConfig, setSortConfig] = useState<StudentSortConfig | null>({
    key: "class",
    direction: "asc",
  });

  const [showClassFilter, setShowClassFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [isClassReplaceOpen, setIsClassReplaceOpen] = useState(false);

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

  useEffect(() => {
    const filtered = applyFilters(students, {
      yearFilter,
      statusFilter,
      classFilter,
      searchTerm,
      showWithdrawn,
    });
    const sorted = sortStudents(filtered, sortConfig);
    setFilteredStudents(sorted);
  }, [
    students,
    yearFilter,
    statusFilter,
    classFilter,
    searchTerm,
    sortConfig,
    showWithdrawn,
  ]);

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

  const handleSort = (key: StudentSortKey) => {
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

  // Batch operation handlers
  const enterBatchMode = () => {
    setIsBatchMode(true);
    setSelectedStudents([]);
  };

  const exitBatchMode = () => {
    setIsBatchMode(false);
    setSelectedStudents([]);
  };

  const handleStudentSelect = (student: Student, isSelected: boolean) => {
    if (isSelected) {
      setSelectedStudents((prev) => [...prev, student]);
    } else {
      setSelectedStudents((prev) => prev.filter((s) => s.id !== student.id));
    }
  };

  const handleSelectAll = () => {
    setSelectedStudents([...filteredStudents]);
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleBatchUpdateStatus = async (status: string) => {
    setBatchLoading(true);
    setErrorMessage("");
    try {
      const batch = writeBatch(db);

      selectedStudents.forEach((student) => {
        const studentRef = doc(db, "students", student.id);
        batch.update(studentRef, { status });
      });

      await batch.commit();

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          selectedStudents.some((s) => s.id === student.id)
            ? { ...student, status: status as Student["status"] }
            : student,
        ),
      );

      setSuccessMessage(`已成功更新 ${selectedStudents.length} 名學生的狀態`);
      setSelectedStudents([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error updating students: ", error);
      setErrorMessage("更新學生狀態時發生錯誤，請稍後再試");
    } finally {
      setBatchLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    setBatchLoading(true);
    setErrorMessage("");
    try {
      const batch = writeBatch(db);

      selectedStudents.forEach((student) => {
        const studentRef = doc(db, "students", student.id);
        batch.delete(studentRef);
      });

      await batch.commit();

      // Update local state
      setStudents((prevStudents) =>
        prevStudents.filter(
          (student) => !selectedStudents.some((s) => s.id === student.id),
        ),
      );

      setSuccessMessage(`已成功刪除 ${selectedStudents.length} 名學生`);
      setSelectedStudents([]);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting students: ", error);
      setErrorMessage("刪除學生時發生錯誤，請稍後再試");
    } finally {
      setBatchLoading(false);
    }
  };

  const academicYearOptions = Array.from(
    new Set(students.map((s) => s.schoolYear)),
  ).sort((a, b) => b - a);

  const uniqueClasses = Array.from(
    new Set(students.map((s) => s.class)),
  ).sort();

  const statusOptions = STATUS_OPTIONS;
  const [splitOpen, setSplitOpen] = useState(false);
  const activeAcademicYearOptions = academicYearOptions.filter(
    (y) => currentAcademicYear - y <= 2,
  );

  const handleClassReplaceConfirm = async ({
    updates,
    withdrawals,
    summary,
  }: {
    targetYear: number;
    unlistedStrategy: string;
    updates: {
      studentId: string;
      afterClass: string | null;
      action: "update" | "withdraw" | "none";
    }[];
    withdrawals: {
      studentId: string;
      afterClass: string | null;
      action: "update" | "withdraw" | "none";
    }[];
    ignored: any[];
    summary: { updateCount: number; withdrawalCount: number };
  }) => {
    try {
      const batch = writeBatch(db);
      updates.forEach((op) => {
        if (op.studentId && op.afterClass) {
          batch.update(doc(db, "students", op.studentId), {
            class: op.afterClass,
            isWithdrawn: false,
          });
        }
      });
      withdrawals.forEach((op) => {
        if (op.studentId) {
          batch.update(doc(db, "students", op.studentId), {
            isWithdrawn: true,
          });
        }
      });
      await batch.commit();
      setStudents((prev) =>
        prev.map((s) => {
          const u = updates.find((o) => o.studentId === s.id);
          if (u && u.afterClass) {
            return { ...s, class: u.afterClass, isWithdrawn: false };
          }
          const w = withdrawals.find((o) => o.studentId === s.id);
          if (w) {
            return { ...s, isWithdrawn: true };
          }
          return s;
        }),
      );
      setSuccessMessage(
        `編班替換完成：更新 ${summary.updateCount} 筆，標記已離校 ${summary.withdrawalCount} 筆`,
      );
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (e) {
      console.error("Class replacement failed", e);
      setErrorMessage("編班替換失敗，請稍後重試");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

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
            <div className="flex space-x-2 mr-2 relative">
              <button
                onClick={enterBatchMode}
                className="btn-secondary text-sm px-3 py-2"
              >
                批次操作
              </button>

              {/* Split Button */}
              <div className="relative">
                <div className="flex">
                  <button
                    onClick={() => setIsImportModalOpen(true)}
                    className="btn-primary text-sm px-3 py-2 rounded-r-none"
                  >
                    匯入資料
                  </button>
                  <button
                    onClick={() => setSplitOpen((v: boolean) => !v)}
                    className="btn-primary rounded-l-none border-l border-blue-400/40 flex items-center justify-center flex-none w-8 min-w-8 h-full px-0"
                    aria-label="更多操作"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 9l6 6 6-6"
                      />
                    </svg>
                  </button>
                </div>

                {splitOpen && (
                  <>
                    <div className="absolute right-0 mt-1 w-28 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-40 overflow-hidden backdrop-blur-sm">
                      <button
                        onClick={() => {
                          setIsClassReplaceOpen(true);
                          setSplitOpen(false);
                        }}
                        className="w-full text-left px-3 py-3 text-xs font-medium text-gray-200 hover:bg-gray-800 transition"
                      >
                        編班替換
                      </button>
                    </div>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setSplitOpen(false)}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <StudentStatsPanel
            students={students as any}
            loading={loading}
            metrics={["total", "paid", "unpaid", "rate"]}
            className="mb-4"
          />

          {/* Filters */}
          <div className="space-y-3 mb-4">
            {/* Year Filter + Withdrawn Toggle */}
            <div className="flex items-center space-x-2">
              <select
                className="flex-1 text-sm bg-gray-800 text-white rounded-lg px-3 py-2 border border-gray-700"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="all">所有學年度</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {formatAcademicYearLabel(year, currentAcademicYear)}
                  </option>
                ))}
              </select>
              <label className="flex items-center space-x-1 text-xs bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showWithdrawn}
                  onChange={(e) => setShowWithdrawn(e.target.checked)}
                  className="w-3 h-3 accent-blue-500"
                />
                <span className="text-gray-300">顯示已離校</span>
              </label>
            </div>

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
            {(classFilter !== "all" ||
              statusFilter !== "all" ||
              !showWithdrawn) && (
              <span className="ml-2 text-blue-400">
                (已套用篩選: {classFilter !== "all" && `班級=${classFilter}`}{" "}
                {statusFilter !== "all" && `狀態=${statusFilter}`}{" "}
                {!showWithdrawn && "未顯示已離校"})
              </span>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {(successMessage || errorMessage) && (
          <div className="mx-4 mb-4">
            {successMessage && (
              <div className="message-success flex items-center space-x-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm">{successMessage}</span>
              </div>
            )}
            {errorMessage && (
              <div className="message-error flex items-center space-x-2">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage("")}
                  className="ml-auto text-red-400 hover:text-red-300"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table Container */}
        <div className="mx-4 mb-32">
          {/* Batch Operation Bar */}
          {isBatchMode && (
            <div className="batch-toolbar rounded-t-2xl relative z-30">
              <BatchOperationBar
                selectedStudents={selectedStudents}
                totalStudents={filteredStudents.length}
                isLoading={batchLoading}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onBatchUpdateStatus={handleBatchUpdateStatus}
                onBatchDelete={handleBatchDelete}
                onExitBatchMode={exitBatchMode}
              />
            </div>
          )}

          {loading || batchLoading ? (
            <div className="p-4">
              <LoadingSpinner
                size="lg"
                text={batchLoading ? "處理批次操作中..." : "載入學生資料中"}
                variant="skeleton"
              />
            </div>
          ) : (
            <div className={`${isBatchMode ? "batch-mode" : ""}`}>
              <table
                className={`w-full text-sm bg-gray-900/40 border border-gray-800/50 ${isBatchMode ? "rounded-b-2xl" : "rounded-2xl"}`}
                style={{ minWidth: isBatchMode ? "320px" : "250px" }}
              >
                {/* Table Header */}
                <thead className="bg-gray-900/80 sticky top-0 z-20">
                  <tr>
                    {isBatchMode && (
                      <th
                        className="table-cell text-center border-b border-gray-800"
                        style={{ width: "8%" }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedStudents.length ===
                              filteredStudents.length &&
                            filteredStudents.length > 0
                          }
                          ref={(el) => {
                            if (el) {
                              el.indeterminate =
                                selectedStudents.length > 0 &&
                                selectedStudents.length <
                                  filteredStudents.length;
                            }
                          }}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleSelectAll();
                            } else {
                              handleDeselectAll();
                            }
                          }}
                          className="w-4 h-4 text-gray-400 bg-gray-700 border-gray-600 rounded focus:ring-gray-500 focus:ring-2 checked:bg-gray-600 checked:border-gray-500"
                        />
                      </th>
                    )}
                    <th
                      className="table-cell text-center border-b border-gray-800"
                      style={{
                        width: isBatchMode ? "10%" : "12%",
                        paddingLeft: "1rem",
                      }}
                    >
                      <div className="relative" ref={classFilterRef}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleSort("class")}
                            className="text-gray-300 hover:text-white flex items-center justify-center whitespace-nowrap"
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
                    <th
                      className="table-cell text-center border-b border-gray-800"
                      style={{ width: isBatchMode ? "33%" : "44%" }}
                    >
                      <button
                        onClick={() => handleSort("studentId")}
                        className="flex items-center justify-center space-x-1 text-gray-300 hover:text-white w-full"
                      >
                        <span>學號</span>
                        {sortConfig?.key === "studentId" && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th
                      className="table-cell text-center border-b border-gray-800"
                      style={{ width: isBatchMode ? "32%" : "29%" }}
                    >
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center justify-center space-x-1 text-gray-300 hover:text-white w-full"
                      >
                        <span>姓名</span>
                        {sortConfig?.key === "name" && (
                          <span className="text-xs">
                            {sortConfig.direction === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </button>
                    </th>
                    <th
                      className="table-cell text-center border-b border-gray-800"
                      style={{ width: isBatchMode ? "25%" : "25%" }}
                    >
                      <div className="relative" ref={statusFilterRef}>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() => handleSort("status")}
                            className="text-gray-300 hover:text-white flex items-center justify-center"
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
                    {!isBatchMode && (
                      <th
                        className="table-cell text-center border-b border-gray-800"
                        style={{ width: "10%" }}
                      ></th>
                    )}
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => {
                      const isSelected = selectedStudents.some(
                        (s) => s.id === student.id,
                      );
                      return (
                        <tr
                          key={student.id}
                          className={`table-row border-b border-gray-800/50 ${
                            index % 2 === 0
                              ? "bg-gray-950/50"
                              : "bg-gray-900/20"
                          } ${isSelected ? "selected" : ""}`}
                        >
                          {isBatchMode && (
                            <td className="table-cell text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) =>
                                  handleStudentSelect(student, e.target.checked)
                                }
                                className="w-4 h-4 text-gray-400 bg-gray-700 border-gray-600 rounded focus:ring-gray-500 focus:ring-2 checked:bg-gray-600 checked:border-gray-500"
                              />
                            </td>
                          )}
                          <td className="table-cell text-white text-center truncate">
                            {student.class}
                          </td>
                          <td className="table-cell text-gray-300 font-mono text-xs text-center truncate">
                            {student.studentId}
                          </td>
                          <td className="table-cell text-white text-center truncate">
                            {student.name}
                          </td>
                          <td className="table-cell text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusStyle(student.status)}`}
                            >
                              {getShortStatus(student.status)}
                            </span>
                          </td>
                          {!isBatchMode && (
                            <td className="table-cell text-center">
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
                          )}
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={isBatchMode ? 5 : 5}
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
            </div>
          )}
        </div>

        {/* Import Modal */}
        <ImportModal
          isOpen={isImportModalOpen}
          closeAction={() => setIsImportModalOpen(false)}
        />

        {/* Edit Modal */}
        <EditStudentModal
          isOpen={isEditModalOpen}
          student={selectedStudent}
          closeAction={() => {
            setIsEditModalOpen(false);
            setSelectedStudent(null);
          }}
          onSave={updateStudent}
        />
        <ClassReplacementModal
          isOpen={isClassReplaceOpen}
          closeAction={() => setIsClassReplaceOpen(false)}
          academicYears={activeAcademicYearOptions}
          currentYear={currentAcademicYear}
          students={students}
          onConfirm={handleClassReplaceConfirm}
        />
      </main>
    </ProtectedRoute>
  );
}
