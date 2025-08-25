"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { type Student } from "@/lib/utils";

interface EditStudentModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (studentId: string, updates: Partial<Student>) => Promise<void>;
}

export default function EditStudentModal({
  isOpen,
  student,
  onClose,
  onSave,
}: EditStudentModalProps) {
  const [editValues, setEditValues] = useState({
    class: "",
    studentId: "",
    name: "",
    status: "",
    isWithdrawn: false,
  });
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const statusOptions = ["已繳納", "有會員資格（但未繳納）", "未繳納"] as const;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (student) {
      setEditValues({
        class: student.class,
        studentId: student.studentId,
        name: student.name,
        status: student.status || "",
        isWithdrawn: student.isWithdrawn ?? false,
      });
    }
  }, [student]);

  const handleSave = async () => {
    if (!student) return;

    setSaving(true);
    try {
      const updates: Partial<Student> = {
        class: editValues.class,
        studentId: editValues.studentId,
        name: editValues.name,
        status: (editValues.status as Student["status"]) || null,
        isWithdrawn: editValues.isWithdrawn,
      };

      await onSave(student.id, updates);
      onClose();
    } catch (error) {
      console.error("Error saving student:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!isOpen || !student || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingBottom: "100px",
      }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-4 sm:p-6 max-h-[75vh] overflow-y-auto mx-auto"
        style={{
          minWidth: "280px",
          maxHeight: "80vh",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            編輯學生資料
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
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
          </button>
        </div>

        {/* Form */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              班級
            </label>
            <input
              type="text"
              className="input w-full text-sm sm:text-base"
              value={editValues.class}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  class: e.target.value,
                }))
              }
              disabled={saving}
              placeholder="例：401"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              學號
            </label>
            <input
              type="text"
              className="input w-full font-mono text-base"
              value={editValues.studentId}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  studentId: e.target.value,
                }))
              }
              disabled={saving}
              placeholder="例：1130001"
              maxLength={7}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              姓名
            </label>
            <input
              type="text"
              className="input w-full text-sm sm:text-base"
              value={editValues.name}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              disabled={saving}
              placeholder="學生姓名"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              繳費狀態
            </label>
            <select
              className="input w-full text-sm sm:text-base"
              value={editValues.status}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
              disabled={saving}
            >
              <option value="">未記錄</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              是否已離校
            </label>
            <select
              className="input w-full text-sm sm:text-base"
              value={editValues.isWithdrawn ? "yes" : "no"}
              onChange={(e) =>
                setEditValues((prev) => ({
                  ...prev,
                  isWithdrawn: e.target.value === "yes",
                }))
              }
              disabled={saving}
            >
              <option value="no">否</option>
              <option value="yes">是</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2 sm:space-x-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-800">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 btn-ghost disabled:opacity-50 py-2 sm:py-3 text-sm sm:text-base"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary disabled:opacity-50 py-2 sm:py-3 text-sm sm:text-base"
          >
            {saving ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>儲存中</span>
              </div>
            ) : (
              "儲存變更"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
