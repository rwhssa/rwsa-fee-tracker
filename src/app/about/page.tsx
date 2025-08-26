"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AboutPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [clearMessage, setClearMessage] = useState("");

  const clearAppCache = async () => {
    setIsClearing(true);
    setClearMessage("");

    try {
      // Clear all caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((reg) => reg.unregister()));
      }

      setClearMessage("快取已清除！頁面將重新載入...");

      // Reload after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error("Failed to clear cache:", error);
      setClearMessage("清除快取時發生錯誤");
    } finally {
      setIsClearing(false);
    }
  };
  const [appVersion, setAppVersion] = useState("1.0.0");
  const [gitCommit, setGitCommit] = useState("N/A");

  useEffect(() => {
    setAppVersion(process.env.npm_package_version || "1.0.0");
    setGitCommit(process.env.NEXT_PUBLIC_GIT_COMMIT || "N/A");
  }, []);

  const contactInfo = {
    developer: process.env.NEXT_PUBLIC_DEVELOPER_NAME || "系統開發者",
    email: process.env.NEXT_PUBLIC_DEVELOPER_EMAIL || "developer@example.com",
    phone: process.env.NEXT_PUBLIC_DEVELOPER_PHONE || "+886-XXX-XXX-XXX",
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-950 safe-area-top">
        <div className="px-6 pt-8 pb-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">關於</h1>
          </div>

          {/* App Information */}
          <div className="space-y-6 mb-8">
            {/* Basic App Info */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">
                應用程式資訊
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                  <span className="text-gray-400">版本號</span>
                  <span className="text-white font-medium font-mono">
                    v{appVersion}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Git Commit</span>
                  <span className="text-white font-medium font-mono text-sm">
                    {gitCommit.substring(0, 8)}
                  </span>
                </div>
              </div>
            </div>

            {/* Developer Contact Information */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">
                開發人員聯絡資訊
              </h2>
              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4 mb-4">
                <p className="text-yellow-400 text-sm">
                  💡 需要協助匯入學生資料？請聯絡開發人員
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                  <span className="text-gray-400">開發人員</span>
                  <span className="text-white font-medium">
                    {contactInfo.developer}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
                  <span className="text-gray-400">電子郵件</span>
                  <a
                    href={`mailto:${contactInfo.email}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {contactInfo.email}
                  </a>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">聯絡電話</span>
                  <a
                    href={`tel:${contactInfo.phone}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {contactInfo.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Cache Management */}
            <div className="card">
              <h2 className="text-xl font-bold text-white mb-4">系統維護</h2>
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                  <p className="text-blue-400 text-sm mb-3">
                    🔄 如果遇到頁面顯示問題或功能異常，可以嘗試清除快取
                  </p>
                  <button
                    onClick={clearAppCache}
                    disabled={isClearing}
                    className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isClearing ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
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
                        <span>清除中...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="h-4 w-4"
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
                        <span>清除應用程式快取</span>
                      </>
                    )}
                  </button>
                  {clearMessage && (
                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm ${clearMessage.includes("錯誤") ? "text-red-400" : "text-green-400"}`}
                      >
                        {clearMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Developer Tools (Only in Development) */}
                {typeof window !== "undefined" &&
                  (window.location.hostname === "localhost" ||
                    window.location.hostname === "127.0.0.1") && (
                    <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-4 mt-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-2">
                        開發者工具
                      </h3>
                      <div className="text-xs text-gray-400 space-y-1">
                        <p>
                          • 控制台指令：
                          <code className="bg-gray-700 px-1 rounded">
                            clearAppCache()
                          </code>
                        </p>
                        <p>
                          • 控制台指令：
                          <code className="bg-gray-700 px-1 rounded">
                            forceAppRefresh()
                          </code>
                        </p>
                        <p>
                          • 快捷鍵：
                          <code className="bg-gray-700 px-1 rounded">
                            Ctrl/Cmd + Shift + Delete
                          </code>
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Copyright */}
            <div className="card text-center">
              <div className="text-gray-400 text-sm space-y-2">
                <p>© 2025 仁武高中學生代表聯合會 版權所有</p>
                <div className="pt-4 border-t border-gray-700/50">
                  <p className="text-xs text-gray-500">
                    本系統僅供學生會內部使用
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom padding for navigation */}
        <div className="h-24"></div>
      </main>
    </ProtectedRoute>
  );
}
