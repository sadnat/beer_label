/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beer: {
          light: '#F5DEB3',
          amber: '#FFBF00',
          dark: '#8B4513',
          foam: '#FFFEF0',
        }
      }
    },
  },
  plugins: [],
}
