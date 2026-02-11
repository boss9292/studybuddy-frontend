/** @type {import('tailwindcss').Config} */
module.exports = {
  // v4 doesn't require `content`, but it's fine to keep these:
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: { extend: {
    typography: ({ theme }) => ({
      DEFAULT: {
        css: {
          "--tw-prose-body": theme("colors.slate.800"),
          "--tw-prose-headings": theme("colors.slate.900"),
          "--tw-prose-bullets": theme("colors.slate.400"),
        },
      },
    }),
  }},
  plugins: [require("@tailwindcss/typography")],
};
