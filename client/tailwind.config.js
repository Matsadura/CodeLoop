/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{html,js,jsx}"],
  theme: {
    extend: {
      colors: {
        crimson: {
          100: '#b90fa0',
          200: '#ff00d3',
          300: '#951484',
          400: '#6a0459',
        },
        gray: {
          100: '#ffffff',
          200: '#f1f3f4',
          300: '#d9d1da',
          400: '#a3a3a7',
          500: '#75797e',
          600: '#0d0f12',
          700: '#0c0c12'
        },
        blue: {
          100: '#4da6ff',
          200: '#4285f4',
          300: '#0094ff',
          400: '#0083ff',
          500: '#007fd4',
          600: '#404851',
          700: '#373d47',
          800: '#1c2735',
          900: '#001f35'
        },
        violet: {
          100: '#494965',
          200: '#2f2f47',
          300: '#282840',
          400: '#232334',
          500: '#161624'
        },
        cyan: {
          100: '#006668'
        },
        olive: {
          100: '#87ff00',
          200: '#5acc00'
        },
        vermilion: {
          100: '#e25100',
          200: '#190900'
        },
        bluish: {
          cyan: '#00b3ff',
          green: '#00ff57',
          greenDark: '#0d2610',
          purple: '#514355',
          red: '#f44250'
        },
      },
    },
  },
  plugins: [],
}