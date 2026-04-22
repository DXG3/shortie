import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0608",
        noir: "#14090e",
        rose: {
          DEFAULT: "#b8143c",
          soft: "#d65a7a",
          deep: "#6b0a24",
        },
        blush: "#f3c7d1",
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
        body: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(214,90,122,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
