/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        navy: {
          50:  '#e6eaf2',
          100: '#b3bcce',
          500: '#1a3a7a',
          700: '#0d1f4e',
          800: '#0a1840',
          900: '#070f27',
        }
      }
    }
  },
  plugins: [],
}