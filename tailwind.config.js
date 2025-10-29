/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        heading: ["Days One", "sans-serif"],
      },
      colors: {
        primary: "#B3261E",
        secondary: "rgb(179 38 30 / 0.20)",
        ink: "#111111",
      },
      maxWidth: {
        container: "1200px",
      },
      letterSpacing: {
        tighter: "-0.02em",
        normal: "0",
        wide: "0.02em",
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
    },
  },
  plugins: [],
  // Optional: if you see double-resets or element defaults feel "off",
  // you can disable Tailwind's preflight. Try WITHOUT first.
  // corePlugins: { preflight: false },
};
