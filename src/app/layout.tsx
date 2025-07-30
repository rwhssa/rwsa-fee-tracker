import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import BottomNav from "@/components/BottomNav";
import DesktopLayout from "@/components/DesktopLayout";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "學生會會費追蹤系統",
  description: "現代化的學生會會費管理與追蹤系統",
  manifest: "/manifest.json",
  themeColor: "#111827",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "會費追蹤系統",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="dark bg-gray-950">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${inter.className} bg-gray-950 text-white min-h-screen antialiased`}
        style={{
          WebkitTapHighlightColor: "transparent",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
      >
        <AuthProvider>
          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden">
            {/* Main Content Area */}
            <div className="min-h-screen pb-24 safe-area-top">{children}</div>
            {/* Bottom Navigation */}
            <BottomNav />
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <DesktopLayout>{children}</DesktopLayout>
          </div>
        </AuthProvider>

        {/* Service Worker Registration with Development Mode Support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

                // Development mode cache cleanup
                if (isDev) {
                  console.log('[App] Development mode detected - clearing caches on load');
                  window.addEventListener('load', async function() {
                    try {
                      // Clear all caches
                      const cacheNames = await caches.keys();
                      await Promise.all(cacheNames.map(name => caches.delete(name)));

                      // Unregister existing service workers
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(registrations.map(reg => reg.unregister()));

                      console.log('[App] Development caches cleared');
                    } catch (error) {
                      console.error('[App] Failed to clear development caches:', error);
                    }
                  });
                }

                window.addEventListener('load', async function() {
                  try {
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                      updateViaCache: 'none'
                    });

                    console.log('[App] Service Worker registered:', registration);

                    // Handle updates
                    registration.addEventListener('updatefound', function() {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (isDev) {
                              console.log('[App] Auto-refreshing in development mode');
                              window.location.reload();
                            } else {
                              if (confirm('有新版本可用，是否要重新載入頁面？')) {
                                window.location.reload();
                              }
                            }
                          }
                        });
                      }
                    });

                    // Check for updates periodically
                    const updateInterval = isDev ? 10000 : 300000; // 10s in dev, 5min in prod
                    setInterval(() => {
                      registration.update();
                    }, updateInterval);

                    // Handle controller change
                    navigator.serviceWorker.addEventListener('controllerchange', function() {
                      console.log('[App] Service Worker controller changed, reloading...');
                      window.location.reload();
                    });

                  } catch (error) {
                    console.error('[App] Service Worker registration failed:', error);
                  }
                });

                // Development mode helpers
                if (isDev) {
                  window.clearAppCache = async function() {
                    try {
                      const cacheNames = await caches.keys();
                      await Promise.all(cacheNames.map(name => caches.delete(name)));
                      const registrations = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(registrations.map(reg => reg.unregister()));
                      console.log('[App] Cache cleared manually');
                    } catch (error) {
                      console.error('[App] Failed to clear cache:', error);
                    }
                  };

                  window.forceAppRefresh = function() {
                    window.clearAppCache().then(() => {
                      console.log('[App] Force refreshing...');
                      window.location.reload();
                    });
                  };

                  // Keyboard shortcut: Ctrl/Cmd + Shift + Delete to clear cache
                  document.addEventListener('keydown', function(e) {
                    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Delete') {
                      e.preventDefault();
                      console.log('[App] Keyboard shortcut triggered - clearing cache');
                      window.forceAppRefresh();
                    }
                  });

                  console.log('[App] Development helpers loaded. Use clearAppCache() or forceAppRefresh() in console, or Ctrl/Cmd+Shift+Delete');
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
