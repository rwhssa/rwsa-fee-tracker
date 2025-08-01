"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchModal from "./SearchModal";
import { navigationItems, searchButton } from "./shared/NavigationData";
import { useAuth } from "./AuthProvider";

const DesktopBottomNav = () => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, loading } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return null;
  }

  // Don't show navigation for unauthorized users or on login/unauthorized pages
  if (
    loading ||
    !user ||
    pathname === "/login" ||
    pathname === "/unauthorized"
  ) {
    return null;
  }

  // Check if user is authorized
  const authorizedEmails = (
    process.env.NEXT_PUBLIC_AUTHORIZED_EMAILS || ""
  ).split(",");
  if (!user.email || !authorizedEmails.includes(user.email)) {
    return null;
  }

  return (
    <>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <nav className="bottom-nav flex items-center justify-center space-x-1">
          {navigationItems.map((item) => {
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

export default DesktopBottomNav;
