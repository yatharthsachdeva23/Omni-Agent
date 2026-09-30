/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#090d16',
          card: '#111827',
          border: '#1f293d',
          accent: '#10b981',
          cyan: '#06b6d4',
          indigo: '#6366f1'
        }
      }
    },
  },
  plugins: [],
}
