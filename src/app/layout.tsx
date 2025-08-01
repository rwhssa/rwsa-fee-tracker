import type { Metadata, Viewport } from "next";
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
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "會費追蹤系統",
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827",
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
          WebkitTapHighlightColor: "rgba(59, 130, 246, 0.1)",
          WebkitTouchCallout: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
          touchAction: "manipulation",
        }}
      >
        <AuthProvider>
          {/* Mobile/Tablet Layout */}
          <div className="lg:hidden">
            {/* Main Content Area */}
            <div
              className="min-h-screen pb-24 safe-area-top"
              style={{ transform: "translateZ(0)" }}
            >
              {children}
            </div>
            {/* Bottom Navigation */}
            <BottomNav />
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:block">
            <DesktopLayout>{children}</DesktopLayout>
          </div>
        </AuthProvider>

        {/* Simple Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';

                // Skip service worker in development to avoid errors
                if (isDev) {
                  console.log('[App] Development mode - skipping service worker registration');
                  return;
                }

                window.addEventListener('load', async function() {
                  try {
                    const registration = await navigator.serviceWorker.register('/sw.js');
                    console.log('[App] Service Worker registered successfully');

                    // Simple update check
                    registration.addEventListener('updatefound', function() {
                      console.log('[App] Service Worker update found');
                    });

                  } catch (error) {
                    console.error('[App] Service Worker registration failed:', error);
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
