/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      colors: {
        creepy: {
          50: '#fbeaea',
          100: '#f2c5c5',
          200: '#e79e9e',
          300: '#db7676',
          400: '#d14f4f',
          500: '#b83535',
          600: '#8e2727',
          700: '#641a1a',
          800: '#3b0d0d',
          900: '#150303',
        },
      },
      backgroundImage: {
        scanlines: 'linear-gradient(rgba(255,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,0,0.06) 1px, transparent 1px)',
      },
      animation: {
        flicker: 'flicker 2.5s linear infinite',
      },
      keyframes: {
        flicker: {
          '0%, 100%': { opacity: 1 },
          '10%': { opacity: 0.9 },
          '20%': { opacity: 0.4 },
          '30%': { opacity: 0.9 },
          '40%': { opacity: 0.3 },
          '50%': { opacity: 0.8 },
          '60%': { opacity: 0.95 },
          '70%': { opacity: 0.2 },
          '80%': { opacity: 0.7 },
          '90%': { opacity: 0.9 }
        }
      }
    }
  },
  plugins: [],
}
