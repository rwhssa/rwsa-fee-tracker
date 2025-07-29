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

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
