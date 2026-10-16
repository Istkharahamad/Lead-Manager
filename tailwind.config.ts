import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#EEF1EE",
        ink: "#1B2A26",
        muted: "#5E6F69",
        line: "#D3DAD5",
        teal: { DEFAULT: "#0F6B63", dark: "#0A4F49", soft: "#D9ECE9" },
        amber: { DEFAULT: "#B7791F", soft: "#F6E7C8" },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
