/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '60%': { opacity: '1', transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        }
      },
      animation: {
         'fade-up': 'fade-up 0.6s ease-out both',
         'pop-in': 'pop-in 0.5s ease-out both',
      },
      colors: {
        navy: {
          50:  '#e6eaf2',
          100: '#b3bcce',
          500: '#1a3a7a',
          600: '#04B4FD',
          700: '#0d1f4e',
          800: '#0a1840',
          900: '#070f27',
        }
      }
    }
  },
  plugins: [],
}