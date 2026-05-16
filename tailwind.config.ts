import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17130f",
        "ink-soft": "#2a241d",
        parchment: "#ead9bd",
        "parchment-light": "#f3e6cf",
        "parchment-dark": "#d6bd94",
        forest: "#38462d",
        "forest-dark": "#26311f",
        moss: "#6f7b45",
        gold: "#c49a5a",
        clay: "#8b5e35",
        ember: "#c56a33"
      },
      fontFamily: {
        display: ["Georgia", "Times New Roman", "serif"],
        body: ["Inter", "Manrope", "system-ui", "sans-serif"]
      },
      boxShadow: {
        parchment: "0 20px 60px rgba(24, 18, 12, 0.25)",
        marker: "0 10px 28px rgba(0, 0, 0, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;

