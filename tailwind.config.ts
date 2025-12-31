import type { Config } from "tailwindcss";

const config: Config = {
  // Force light UI by default. Dark styles only apply if you add a `dark` class.
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
