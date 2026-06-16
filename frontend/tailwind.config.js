// tailwind.config.js – ESM format
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Indigo-Violet
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        darkbg: '#0b0f19',
        darkcard: '#151b2c',
        darkborder: '#1f293d',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        premium: '0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'premium-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08), 0 1px 5px rgba(0, 0, 0, 0.03)',
        glow: '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-strong': '0 0 25px rgba(139, 92, 246, 0.3)',
      },
    },
  },
  plugins: [],
};
