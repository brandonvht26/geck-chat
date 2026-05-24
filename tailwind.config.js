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
          DEFAULT: '#2A72D4', // Azul Zafiro Real (Equilibrado y Premium)
          dark: '#8261D4',    // Amatista Elegante para modo oscuro
        },
        secondary: {
          DEFAULT: '#D9821E', // Ámbar Meloso (Cálido, vivo pero suave)
          dark: '#EAA945',    // Dorado Pastel para modo oscuro
        },
        textMain: {
          DEFAULT: '#141E30', // Azul Medianoche profundo para máxima legibilidad
          dark: '#EBF1FA',    // Blanco Gélido limpio
        },
        glass: {
          DEFAULT: '#ffffffb8',
          dark: '#ffffff0f',    
        },
        authStart: {
          DEFAULT: '#EBF4FC',
          dark: '#0B131F',
        },
        authEnd: {
          DEFAULT: '#FFFBF5',
          dark: '#161121',
        }
      },
      fontFamily: {
        // Regulares
        elms: ['ElmsSans-Regular', 'sans-serif'],
        nunito: ['Nunito-Regular', 'sans-serif'],
        snpro: ['SNPro-Regular', 'sans-serif'],
        // Bolds
        'elms-bold': ['ElmsSans-Bold', 'sans-serif'],
        'nunito-bold': ['Nunito-Bold', 'sans-serif'],
        'snpro-bold': ['SNPro-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}