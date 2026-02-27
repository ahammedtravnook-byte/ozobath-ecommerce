/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#dfeeff',
          200: '#b8ddff',
          300: '#79c4ff',
          400: '#32a5ff',
          500: '#0084f0',
          600: '#0068cc',
          700: '#0053a6',
        },
        sidebar: {
          bg: '#0f1117',
          hover: '#1a1d27',
          active: '#252837',
          border: '#2a2d3a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
