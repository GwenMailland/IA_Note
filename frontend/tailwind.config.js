import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#1a1a2e',
          100: '#16213e',
          200: '#0f3460',
        }
      }
    },
  },
  plugins: [typography],
}
