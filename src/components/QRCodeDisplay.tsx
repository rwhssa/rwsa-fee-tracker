"use client";

import { useState, useEffect } from "react";
import QRCode from "react-qr-code";

interface QRCodeDisplayProps {
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  className?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  size = 96,
  level = "M",
  className = "",
}) => {
  const [url, setUrl] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setUrl(window.location.origin);
    } else {
      setUrl("https://rwsa-fee-tracker.firebaseapp.com");
    }
  }, []);

  // Prevent hydration mismatch by only rendering after mount
  if (!mounted) {
    return (
      <div
        className={`bg-gray-200 rounded flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <div className="text-gray-600 text-xs">載入中...</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <QRCode
        value={url}
        size={size}
        level={level}
        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
      />
    </div>
  );
};

export default QRCodeDisplay;
