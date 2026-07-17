/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2faf4',
          100: '#e2f3e7',
          200: '#c5e7d0',
          300: '#97d2ab',
          400: '#64b680',
          500: '#3e995f',
          600: '#2f7c4b',
          700: '#27633e',
          800: '#214f33',
          900: '#1b412b',
          950: '#0e2417',
        }
      }
    },
  },
  plugins: [],
}
