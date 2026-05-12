/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          default: '#2D7DD2', // Claro
          dark: '#7C5CBF',    // Oscuro
        },
        secondary: {
          default: '#C07A1A', // Claro
          dark: '#E8A83E',    // Oscuro
        },
        textMain: {
          default: '#1a2840', // Claro
          dark: '#e8edf5',    // Oscuro
        },
        glass: {
          default: 'rgba(255, 255, 255, 0.72)', // Claro
          dark: 'rgba(255, 255, 255, 0.06)',    // Oscuro
        },
        authStart: {
          default: '#e0f0ff',
          dark: '#0f1824',
        },
        authEnd: {
          default: '#fff8ef',
          dark: '#1a1428',
        }
      }
    },
  },
  plugins: [],
}
