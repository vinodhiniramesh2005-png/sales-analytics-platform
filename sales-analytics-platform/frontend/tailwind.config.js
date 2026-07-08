/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F7F8FA",
          dark: "#0A0C10",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#12151C",
        },
        border: {
          DEFAULT: "#E5E7EB",
          dark: "#22262F",
        },
        accent: {
          DEFAULT: "#5B5FEF",
          light: "#7B7FF5",
          dark: "#4548C9",
        },
        success: "#1FBF87",
        warning: "#F0A83B",
        danger: "#EF5A63",
        ink: {
          DEFAULT: "#12151C",
          dark: "#E7E9EE",
        },
        muted: {
          DEFAULT: "#6B7280",
          dark: "#8A8F9C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        "card-dark": "0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)",
        glow: "0 0 60px rgba(91, 95, 239, 0.25)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
