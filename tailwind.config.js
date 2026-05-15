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
          DEFAULT: '#2D7DD2', 
          dark: '#7C5CBF',    
        },
        secondary: {
          DEFAULT: '#C07A1A', 
          dark: '#E8A83E',    
        },
        textMain: {
          DEFAULT: '#1a2840', 
          dark: '#e8edf5',    
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.72)',
          dark: 'rgba(255, 255, 255, 0.06)',    
        },
        authStart: {
          DEFAULT: '#e0f0ff',
          dark: '#0f1824',
        },
        authEnd: {
          DEFAULT: '#fff8ef',
          dark: '#1a1428',
        }
      },
      fontFamily: {
        primary: ['ElmsSans', 'sans-serif'],
        secondary: ['SNPro', 'sans-serif'],
        tertiary: ['Nunito', 'sans-serif'],
      }
    },
  },
  plugins: [],
}