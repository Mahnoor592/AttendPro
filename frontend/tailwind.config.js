/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      // Forest theme: remap the "teal" accent scale to green so every
      // teal-* accent (links, focus rings, badges, icon tints) matches the sidebar.
      colors: {
        teal: {
          50:  '#F1F6EF',
          100: '#E1EBDC',
          200: '#C4D8BC',
          300: '#9DBE93',
          400: '#7AA36E',
          500: '#5B8C5A',
          600: '#4E7A45',
          700: '#3F6238',
          800: '#33502F',
          900: '#2A4128',
        },
      },
    },
  },
  plugins: [],
}

