import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          900: "#2e1065",
        },
        gold: {
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        surface: {
          950: "#000009",
          900: "#0e0e16",
          800: "#161620",
          700: "#1f1f2e",
          600: "#2a2a3a",
        },
        xgray: {
          900: "#15202b",
          800: "#192734",
          700: "#253341",
          600: "#38444d",
          text: "#e7e9ea",
          muted: "#71767b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
