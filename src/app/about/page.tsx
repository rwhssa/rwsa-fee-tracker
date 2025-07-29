"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function AboutPage() {
  const [appVersion, setAppVersion] = useState("0.1.0");
  const [gitCommit, setGitCommit] = useState("N/A");

  useEffect(() => {
    setAppVersion(process.env.npm_package_version || "0.1.0");
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
