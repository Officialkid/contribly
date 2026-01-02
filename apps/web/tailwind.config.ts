import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A4D8C",
          dark: "#083B6B",
          light: "#3B82F6",
          50: "#E8F2FA",
          100: "#D1E5F5",
          200: "#A3CBEB",
          300: "#75B1E1",
          400: "#4797D7",
          500: "#0A4D8C",
          600: "#083B6B",
          700: "#062D51",
          800: "#041F37",
          900: "#02101D",
        },
        accent: {
          DEFAULT: "#3FAE7A",
          light: "#6ED0A4",
          50: "#EAFAF3",
          100: "#D4F5E7",
          200: "#A9EBCF",
          300: "#7EE1B7",
          400: "#53D79F",
          500: "#3FAE7A",
          600: "#32925F",
          700: "#267647",
          800: "#195A2F",
          900: "#0D3E17",
        },
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          primary: "#0F172A",
          muted: "#64748B",
        },
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)",
        medium: "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
        large: "0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.08)",
        card: "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
