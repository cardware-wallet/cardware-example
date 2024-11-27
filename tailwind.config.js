/** @type {import('tailwindcss').Config} */
module.exports = {
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  content: [],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#ffedbf',
          light: '#ffedbf',
          dark: '#e5e5b3',
        },
        copper: {
          DEFAULT: '#fd5d00',
          light: '#fd5d00',
          dark: '#fd5d00',
        },
        yellow: {
          DEFAULT: '#eab308',
          light: '#eab308',
          dark: '#fd5d00',
        },
      },
    },
  },
  plugins: [],
}

