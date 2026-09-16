/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0b0a10",
        panel: "#15131c",
        panel2: "#1c1926",
        purple: {
          DEFAULT: "#7c3aed",
          dark: "#4c1d95",
        },
      },
    },
  },
  plugins: [],
};
