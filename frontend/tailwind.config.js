/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0B0F19',
          850: '#162235',
          800: '#111827',
          750: '#223147',
          700: '#1F2937',
          600: '#374151',
        },
        brand: {
          light: '#8B5CF6',
          DEFAULT: '#6D28D9',
          dark: '#4C1D95',
        }
      },
    },
  },
  plugins: [],
}
