/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './public/index.html',
  ],
  darkMode: 'class',
  plugins: [
    require('tailwindcss-dark-mode')(),
  ],
  theme: {
    extend: {
      darkSelector: '.dark-mode',
      backgroundColor: {
        dark: '#212521',
        'light-dark-mode': '#807D7D', 
      },
    },
  },
};