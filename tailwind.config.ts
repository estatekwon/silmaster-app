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
        "map-bg": "#0D0F14",
        "surface-1": "#111318",
        "surface-2": "#181B22",
        "surface-3": "#1E2128",
        "surface-border": "#2A2D35",
        "text-primary": "#F0F2F5",
        "text-secondary": "#8A8F9E",
        "text-muted": "#4A4F5C",
        "accent-gold": "#C9A96E",
        "accent-gold-hover": "#E0C285",
        "marker-factory": "#60A5FA",
        "marker-warehouse": "#34D399",
        "marker-land": "#F59E0B",
        "marker-register": "#A78BFA",
        "status-up": "#34D399",
        "status-down": "#F87171",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
