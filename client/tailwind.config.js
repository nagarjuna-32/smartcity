/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#061325',
          800: '#0A192F',
          700: '#0F2744',
          600: '#163861',
        },
        brand: {
          teal: '#087E8B',
          cyan: '#00ADB5',
          emerald: '#10B981',
          amber: '#F59E0B',
          coral: '#EF4444'
        }
      }
    },
  },
  plugins: [],
}
