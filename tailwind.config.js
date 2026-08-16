/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "rgb(var(--color-ink-950) / <alpha-value>)",
          900: "rgb(var(--color-ink-900) / <alpha-value>)",
          800: "rgb(var(--color-ink-800) / <alpha-value>)",
          700: "rgb(var(--color-ink-700) / <alpha-value>)",
          600: "rgb(var(--color-ink-600) / <alpha-value>)",
          500: "rgb(var(--color-ink-500) / <alpha-value>)",
        },
        canvas: {
          50: "rgb(var(--color-canvas-50) / <alpha-value>)",
          100: "rgb(var(--color-canvas-100) / <alpha-value>)",
          200: "rgb(var(--color-canvas-200) / <alpha-value>)",
        },
        paprika: {
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)",
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
        },
        saffron: {
          400: "#E3A008",
          500: "#C98A05",
        },
        basil: {
          500: "#4C7A51",
          600: "#3D6440",
          700: "#2F4E32",
        },
        slateblue: {
          500: "#4C5B7A",
          600: "#3D4A64",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(21,23,27,0.04), 0 4px 12px rgba(21,23,27,0.06)",
        card: "0 1px 3px rgba(21,23,27,0.06), 0 8px 24px rgba(21,23,27,0.06)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
