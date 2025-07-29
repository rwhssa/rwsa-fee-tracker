"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  variant?: "dots" | "pulse" | "skeleton";
}

export default function LoadingSpinner({
  size = "md",
  className = "",
  text,
  variant = "dots",
}: LoadingSpinnerProps) {
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  if (variant === "skeleton") {
    return (
      <div className={`w-full space-y-3 ${className}`}>
        {/* Table skeleton */}
        <div className="space-y-2">
          {/* Header skeleton */}
          <div className="flex space-x-3">
            <div className="h-4 bg-gray-700/50 rounded animate-pulse flex-1"></div>
            <div className="h-4 bg-gray-700/50 rounded animate-pulse flex-1"></div>
            <div className="h-4 bg-gray-700/50 rounded animate-pulse flex-1"></div>
            <div className="h-4 bg-gray-700/50 rounded animate-pulse w-20"></div>
          </div>

          {/* Row skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-3">
              <div className="h-3 bg-gray-800/50 rounded animate-pulse flex-1"></div>
              <div className="h-3 bg-gray-800/50 rounded animate-pulse flex-1"></div>
              <div className="h-3 bg-gray-800/50 rounded animate-pulse flex-1"></div>
              <div className="h-3 bg-gray-800/50 rounded animate-pulse w-20"></div>
            </div>
          ))}
        </div>

        {text && (
          <p
            className={`text-gray-400 text-center ${textSizeClasses[size]} animate-pulse`}
          >
            {text}
          </p>
        )}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div
        className={`flex flex-col items-center justify-center space-y-3 ${className}`}
      >
        {/* Modern pulse animation */}
        <div className="relative">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full animate-ping absolute"></div>
          <div
            className="w-6 h-6 bg-blue-500/40 rounded-full animate-ping absolute top-1 left-1"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse top-2 left-2 absolute"></div>
        </div>

        {text && (
          <p className={`text-gray-400 ${textSizeClasses[size]}`}>{text}</p>
        )}
      </div>
    );
  }

  // Default dots variant
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 py-4 ${className}`}
    >
      {/* Modern three dots animation */}
      <div className="flex space-x-1.5">
        <div
          className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
          style={{
            animation: "bounce 1.4s ease-in-out infinite both",
            animationDelay: "0ms",
          }}
        ></div>
        <div
          className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
          style={{
            animation: "bounce 1.4s ease-in-out infinite both",
            animationDelay: "0.16s",
          }}
        ></div>
        <div
          className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
          style={{
            animation: "bounce 1.4s ease-in-out infinite both",
            animationDelay: "0.32s",
          }}
        ></div>
      </div>

      {text && (
        <p
          className={`text-gray-400 ${textSizeClasses[size]} transition-opacity duration-300`}
        >
          {text}
        </p>
      )}
    </div>
  );
}
