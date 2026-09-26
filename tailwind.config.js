/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#151027", // page background — deep indigo-plum, not pure black
          900: "#1B1730",
          800: "#262040",
          700: "#332B54",
          600: "#453A6E",
        },
        parchment: {
          100: "#F5F1E8", // primary text on dark
          300: "#D8D2E8",
          500: "#B8AFD6", // muted / secondary text
        },
        marigold: {
          400: "#F6B94E",
          500: "#F2A93B", // primary accent — cartridge-sticker amber
          600: "#D88F22",
        },
        teal: {
          400: "#5FCFC9",
          500: "#3FA79E", // secondary accent — for genre/tag chips
          600: "#2C8880",
        },
        clay: {
          500: "#E0654F", // reserved for error / remove states
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        card: "6px", // small, consistent radius — not the generic rounded-2xl everywhere
      },
    },
  },
  plugins: [],
};
