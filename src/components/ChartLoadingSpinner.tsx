"use client";

interface ChartLoadingSpinnerProps {
  height?: string;
  text?: string;
}

export default function ChartLoadingSpinner({
  height = "h-64",
  text = "載入圖表中",
}: ChartLoadingSpinnerProps) {
  return (
    <div
      className={`w-full ${height} flex flex-col items-center justify-center space-y-4`}
    >
      {/* Chart skeleton animation */}
      <div className="w-full max-w-sm space-y-3">
        {/* Chart area skeleton */}
        <div className="relative bg-gray-800/30 rounded-lg p-4 overflow-hidden">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-700/20 to-transparent animate-pulse"></div>

          {/* Y-axis lines */}
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-6 h-2 bg-gray-700/40 rounded animate-pulse"></div>
                <div className="flex-1 h-px bg-gray-700/30"></div>
              </div>
            ))}
          </div>

          {/* Chart bars/lines simulation */}
          <div className="absolute bottom-4 left-8 right-4 flex items-end justify-between space-x-1">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-blue-500/30 rounded-t animate-pulse"
                style={{
                  height: `${Math.random() * 60 + 20}px`,
                  width: "12px",
                  animationDelay: `${i * 0.1}s`,
                }}
              ></div>
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex justify-center space-x-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full animate-pulse"
                style={{
                  backgroundColor: ["#10b981", "#64748b", "#f59e0b"][i] + "40",
                  animationDelay: `${i * 0.2}s`,
                }}
              ></div>
              <div className="w-12 h-3 bg-gray-700/40 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading text with modern dots */}
      <div className="flex items-center space-x-3">
        <span className="text-gray-400 text-sm">{text}</span>
        <div className="flex space-x-1">
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
