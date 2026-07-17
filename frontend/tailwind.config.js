/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        white: '#0f172a', // text-white becomes dark text
        black: '#ffffff', // bg-black becomes white
        slate: {
          950: '#f1f5f9', // Deepest background becomes light gray
          900: '#ffffff', // Cards become white
          800: '#e2e8f0', // Borders become light gray lines
          700: '#cbd5e1', 
          600: '#94a3b8',
          500: '#64748b',
          400: '#64748b', // Muted text becomes medium dark gray
          300: '#334155', // Normal text becomes dark gray
          200: '#1e293b', 
          100: '#0f172a',
          50: '#020617',
        },
        forest: {
          950: '#f2faf4',
          900: '#e2f3e7',
          800: '#c5e7d0',
          700: '#97d2ab',
          600: '#64b680',
          500: '#3e995f', // primary button color stays same
          400: '#2f7c4b',
          300: '#27633e',
          200: '#214f33',
          100: '#1b412b',
          50: '#0e2417',
        }
      }
    },
  },
  plugins: [],
}
