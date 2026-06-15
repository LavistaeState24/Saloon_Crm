/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#090a0d",
        "ink-2": "#11151b",
        gold: "#c9a35d",
        "gold-2": "#f3d79b",
        ivory: "#f7f1e6",
        muted: "#b7aea0",
        green: "#1d4a3f",
        wine: "#5d2638",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        sans: ["Segoe UI", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 20px 60px rgba(0, 0, 0, 0.35)",
      },
      backgroundImage: {
        glow: "radial-gradient(circle at top, rgba(201, 163, 93, 0.18), transparent 40%)",
      },
    },
  },
  plugins: [],
};

