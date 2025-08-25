"use client";

import React from "react";

type ViewMode = "all" | "current";

interface ChartViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  className?: string;
  labels?: {
    all?: string;
    current?: string;
  };
}

const BASE_OPTIONS: { key: ViewMode; label: string }[] = [
  { key: "all", label: "在學學生" },
  { key: "current", label: "高一" },
];

export default function ChartViewToggle({
  value,
  onChange,
  className = "",
  labels,
}: ChartViewToggleProps) {
  const options = BASE_OPTIONS.map((o) => ({
    ...o,
    label: (o.key === "all" ? labels?.all : labels?.current) ?? o.label,
  }));

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = options.findIndex((o) => o.key === value);
    const dir = e.key === "ArrowRight" ? 1 : -1;
    const next = options[(idx + dir + options.length) % options.length];
    onChange(next.key);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Fee status scope"
      onKeyDown={handleKey}
      className={`inline-flex ${className}`}
    >
      <div className="flex rounded-lg border border-gray-700/60 bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-gray-800/60 p-0.5">
        {options.map((opt) => {
          const active = opt.key === value;
          return (
            <button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => !active && onChange(opt.key)}
              className={[
                "relative min-w-[84px] select-none px-3 h-10 text-xs font-medium rounded-md transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                active
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-300 hover:text-white hover:bg-gray-700/60 active:bg-gray-700/70",
              ].join(" ")}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
