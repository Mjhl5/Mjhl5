/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        shake: { '0%,100%': { transform: 'translateX(0)' }, '20%,60%': { transform: 'translateX(-8px)' }, '40%,80%': { transform: 'translateX(8px)' } },
        pop: { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)' } },
        fadein: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: { shake: 'shake .45s ease-in-out', pop: 'pop .35s ease-out', fadein: 'fadein .25s ease-out' },
    },
  },
  plugins: [],
};
