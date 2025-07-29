import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-card":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)",
        "gradient-blue": "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        "gradient-dark":
          "linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(31, 41, 55, 0.6) 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      colors: {
        gray: {
          850: "#1f2937",
          925: "#111827",
          975: "#0f1419",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "scale-in": "scaleIn 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "pulse-smooth": "pulseSmooth 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-smooth": "spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateZ(0)" },
          "100%": { opacity: "1", transform: "translateZ(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px) translateZ(0)", opacity: "0" },
          "100%": { transform: "translateY(0) translateZ(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95) translateZ(0)", opacity: "0" },
          "100%": { transform: "scale(1) translateZ(0)", opacity: "1" },
        },
        pulseSmooth: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  darkMode: "class",
  plugins: [],
};
export default config;
