/** @type {import('tailwindcss').Config} */
module.exports = {
  // v4 doesn't require `content`, but it's fine to keep these:
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {} },
  plugins: [],
};