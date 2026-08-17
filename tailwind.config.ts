import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          50: "#f3f4f6",
          100: "#e4e6ea",
          200: "#c7cbd3",
          300: "#9ba1ad",
          950: "#0f0e0d",
          900: "#181715",
          800: "#21201d",
          700: "#2a2926",
          600: "#34322e",
          500: "#3e3c37",
          400: "#4a4843",
        },
        gold: {
          300: "#f2d07a",
          400: "#e8b84e",
          500: "#daa33b",
          600: "#be8a28",
          700: "#9e7018",
        },
        cream: {
          50: "#fefdfb",
          100: "#faf8f4",
          200: "#f5f0e8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(15,14,13,0.07), 0 1px 2px -1px rgba(15,14,13,0.06)",
        "card-hover": "0 6px 16px -4px rgba(15,14,13,0.14), 0 2px 6px -2px rgba(15,14,13,0.08)",
        sidebar: "1px 0 0 0 rgba(15,14,13,0.06)",
      },
      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 150ms ease-out",
        "slide-up": "slide-up 180ms ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
