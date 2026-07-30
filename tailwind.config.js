/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#15171B",
          900: "#1B1E23",
          800: "#22262D",
          700: "#2C3138",
          600: "#3A414B",
          500: "#4E5661",
        },
        canvas: {
          50: "#F5F6F7",
          100: "#EEF0F2",
          200: "#E4E7EA",
        },
        paprika: {
          50: "#FDF1EA",
          100: "#FAE0D0",
          300: "#E79A67",
          500: "#C1440E",
          600: "#A63A0B",
          700: "#8A3009",
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
