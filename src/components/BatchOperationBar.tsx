"use client";

import { useState } from "react";
import { Student } from "@/lib/utils";

interface BatchOperationBarProps {
  selectedStudents: Student[];
  totalStudents: number;
  isLoading?: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchUpdateStatus: (status: string) => void;
  onBatchDelete: () => void;
  onExitBatchMode: () => void;
}

export default function BatchOperationBar({
  selectedStudents,
  totalStudents,
  isLoading = false,
  onSelectAll,
  onDeselectAll,
  onBatchUpdateStatus,
  onBatchDelete,
  onExitBatchMode,
}: BatchOperationBarProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");

  const selectedCount = selectedStudents.length;
  const isAllSelected = selectedCount === totalStudents && totalStudents > 0;
  const isPartialSelected = selectedCount > 0 && selectedCount < totalStudents;

  const statusOptions = [
    { value: "已繳納", label: "已繳納", color: "text-green-400" },
    {
      value: "有會員資格（但未繳納）",
      label: "有會員資格（但未繳納）",
      color: "text-yellow-400",
    },
    { value: "未繳納", label: "未繳納", color: "text-red-400" },
  ];

  const handleBatchUpdateStatus = (status: string) => {
    setSelectedStatus(status);
    setShowUpdateConfirm(true);
    setShowStatusDropdown(false);
  };

  const confirmUpdateStatus = () => {
    onBatchUpdateStatus(selectedStatus);
    setShowUpdateConfirm(false);
    setSelectedStatus("");
  };

  const handleDeleteConfirm = () => {
    onBatchDelete();
    setShowDeleteConfirm(false);
  };

  return (
    <>
      {/* Batch Operation Bar */}
      <div className="sticky top-0 z-20 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Selection Info */}
          <div className="flex items-center space-x-3">
            <span className="text-white font-medium">
              {selectedCount > 0 ? (
                <>
                  已選擇{" "}
                  <span className="font-semibold text-blue-400">
                    {selectedCount}
                  </span>{" "}
                  項
                </>
              ) : (
                "請選擇學生"
              )}
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            {selectedCount > 0 && (
              <>
                {/* Batch Status Update */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    disabled={isLoading}
                    className="batch-button primary"
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span className="hidden sm:inline">更新狀態</span>
                  </button>

                  {showStatusDropdown && (
                    <div className="absolute top-full right-0 mt-2 bg-gray-800/95 border border-gray-700 rounded-lg shadow-xl py-1 min-w-48 z-[9999] backdrop-blur-sm">
                      {statusOptions.map((status) => (
                        <button
                          key={status.value}
                          onClick={() => handleBatchUpdateStatus(status.value)}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700/50 hover:text-white transition-colors"
                        >
                          <span className={status.color}>{status.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Batch Delete */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isLoading}
                  className="batch-button danger"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span className="hidden sm:inline">刪除</span>
                </button>
              </>
            )}

            {/* Exit Batch Mode */}
            <button
              onClick={onExitBatchMode}
              disabled={isLoading}
              className="batch-button secondary"
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
              <span className="hidden sm:inline">取消</span>
            </button>
          </div>
        </div>

        {/* Click outside handler for dropdown */}
        {showStatusDropdown && (
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setShowStatusDropdown(false)}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full border border-gray-800/50">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-600/20 mb-4">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">確認刪除</h3>
              <p className="text-sm text-gray-300 mb-6">
                確定要刪除選擇的{" "}
                <span className="font-semibold text-red-400">
                  {selectedCount}
                </span>{" "}
                名學生嗎？
                <br />
                <span className="text-red-400">此操作無法復原。</span>
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  確認刪除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Confirmation Modal */}
      {showUpdateConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-sm w-full border border-gray-800/50">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-600/20 mb-4">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                確認更新狀態
              </h3>
              <p className="text-sm text-gray-300 mb-6">
                確定要將選擇的{" "}
                <span className="font-semibold text-blue-400">
                  {selectedStudents.length}
                </span>{" "}
                名學生的狀態更新為
                <br />
                <span className="font-semibold text-blue-400">
                  「{selectedStatus}」
                </span>
                嗎？
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUpdateConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmUpdateStatus}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isLoading && (
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  確認更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
