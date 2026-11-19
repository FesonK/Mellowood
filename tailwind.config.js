/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        cream: token('cream'),
        surface: token('surface'),
        ink: token('ink'),
        'ink-soft': token('ink-soft'),
        peach: token('peach'),
        blush: token('blush'),
        lavender: token('lavender'),
        sky: token('sky'),
        mint: token('mint'),
        butter: token('butter'),
        tangerine: token('tangerine'),
        berry: token('berry'),
      },
      fontFamily: {
        display: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      borderRadius: { blob: '2rem', squish: '1.25rem' },
      boxShadow: {
        soft: '0 10px 30px -12px rgb(var(--shadow) / 0.35)',
        pop: '0 6px 0 0 rgb(var(--shadow) / 0.25)',
        glow: '0 0 0 6px rgb(var(--lavender) / 0.35)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        breathe: { '0%,100%': { transform: 'scale(1)', opacity: '1' }, '50%': { transform: 'scale(1.08)', opacity: '.85' } },
        wiggle: { '0%,100%': { transform: 'rotate(0)' }, '25%': { transform: 'rotate(-4deg)' }, '75%': { transform: 'rotate(4deg)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        blink: { '0%,92%,100%': { transform: 'scaleY(1)' }, '96%': { transform: 'scaleY(0.1)' } },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        breathe: 'breathe 2.4s ease-in-out infinite',
        wiggle: 'wiggle .6s ease-in-out',
        shimmer: 'shimmer 1.6s linear infinite',
        blink: 'blink 5s infinite',
      },
    },
  },
  plugins: [],
};
