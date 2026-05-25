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
          DEFAULT: '#2A72D4', // Azul Zafiro Real
          dark: '#8261D4',    // Amatista Elegante
        },
        secondary: {
          DEFAULT: '#D9821E', // Ámbar Meloso
          dark: '#EAA945',    // Dorado Pastel
        },
        tertiary: {
          DEFAULT: '#93BE38', // Verde Lima Equilibrado y natural
          dark: '#BBE068',    // Verde Lima Pastel suave
        },
        warning: {
          DEFAULT: '#E14B4B', // Rojo Alerta Suavizado
          dark: '#ED7474',    // Rojo Desaturado para modo oscuro
        },
        textMain: {
          DEFAULT: '#141E30', 
          dark: '#EBF1FA',    
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
        elms: ['ElmsSans-Regular', 'sans-serif'],
        nunito: ['Nunito-Regular', 'sans-serif'],
        snpro: ['SNPro-Regular', 'sans-serif'],
        'elms-bold': ['ElmsSans-Bold', 'sans-serif'],
        'nunito-bold': ['Nunito-Bold', 'sans-serif'],
        'snpro-bold': ['SNPro-Bold', 'sans-serif'],
      },
    },
  },
  plugins: [],
}