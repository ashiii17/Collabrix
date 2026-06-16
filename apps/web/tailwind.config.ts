import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202A",
        steel: "#3B5368",
        mint: "#2FBF9B",
        amber: "#F2A541",
        rose: "#D95D6A"
      }
    }
  },
  plugins: []
};

export default config;
