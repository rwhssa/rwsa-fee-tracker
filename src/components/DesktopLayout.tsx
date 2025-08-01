"use client";

import { useState } from "react";
import DesktopBottomNav from "./DesktopBottomNav";
import QRCodeDisplay from "./QRCodeDisplay";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

interface DesktopLayoutProps {
  children: React.ReactNode;
}

const DesktopLayout: React.FC<DesktopLayoutProps> = ({ children }) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Don't show PWA notification for unauthorized users or on login/unauthorized pages
  const shouldShowPWANotification =
    !loading &&
    user &&
    pathname !== "/login" &&
    pathname !== "/unauthorized" &&
    (process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || "")
      .split(",")
      .includes(user.email || "");

  return (
    <div className="hidden lg:flex fixed inset-0 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-950 overflow-hidden z-0">
      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md h-[90vh] relative">
          <div className="h-full bg-gray-950/95 backdrop-blur-2xl rounded-3xl border border-gray-600/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="h-full overflow-y-auto pb-16 custom-scrollbar">
              {children}
            </div>
            <DesktopBottomNav />
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-3xl -z-10"></div>
        </div>
      </div>

      {/* PWA Notification */}
      {shouldShowPWANotification && (
        <div className="absolute top-6 right-6">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 max-w-xs shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-medium text-sm">會費追蹤系統</h3>
              <button className="text-gray-400 hover:text-white transition-colors">
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
            <p className="text-gray-300 text-xs mb-3">
              在手機上安裝以獲得更好體驗
            </p>
            <button
              onClick={() => setShowQRCode(!showQRCode)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded transition-colors"
            >
              安裝應用程式
            </button>

            {showQRCode && (
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-gray-400 text-xs mb-2 text-center">
                  掃描 QR Code
                </p>
                <div className="bg-white rounded p-2 w-fit mx-auto">
                  <QRCodeDisplay size={80} level="M" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DesktopLayout;
