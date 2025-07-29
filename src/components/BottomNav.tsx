"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchModal from "./SearchModal";

const BottomNav = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    {
      href: "/",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-7-4h4m-4 4h4"
          />
        </svg>
      ),
      label: "首頁",
      id: "home",
    },
    {
      href: "/database",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h3l2 2h3c2.21 0 4 1.79 4 4v1M4 7h16"
          />
        </svg>
      ),
      label: "資料庫",
      id: "database",
    },
    {
      href: "/about",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "關於",
      id: "about",
    },
  ];

  const searchButton = {
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
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
    ),
    label: "查詢",
    id: "search",
  };

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 px-4">
        <nav className="bottom-nav flex items-center justify-center space-x-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-item group ${isActive ? "active" : ""}`}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className={`transition-all duration-300 ease-out ${
                      isActive ? "scale-110" : "group-hover:scale-105"
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-out ${
                      isActive
                        ? "opacity-100 translate-x-0 max-w-20"
                        : "opacity-0 translate-x-2 max-w-0 overflow-hidden"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Search Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="nav-item group relative"
            aria-label="搜尋學生"
          >
            <div className="flex items-center space-x-2">
              <div className="transition-transform duration-300 ease-out group-hover:scale-105">
                {searchButton.icon}
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {searchButton.label}
              </span>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out -z-10"></div>
          </button>
        </nav>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </>
  );
};

export default BottomNav;
