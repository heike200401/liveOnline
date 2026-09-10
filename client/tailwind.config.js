/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0071e3',
        ink: '#1d1d1f',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          '"SF Pro Text"',
          '"PingFang SC"',
          '"Segoe UI"',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
