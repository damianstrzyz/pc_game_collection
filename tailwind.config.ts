import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta zainspirowana ciemnogranatowym tłem PokeBox.
        bg: '#0a1128',
        surface: '#101a36',
        raised: '#16224a',
        line: '#1f2d57',
        ink: '#e8ecf8',
        muted: '#8b97ba',
        accent: '#f5c518',
        // Skala stanu 1–11 (kolory używane przez ConditionBadge).
        cond: {
          poor: '#ef4444',
          below: '#f97316',
          good: '#eab308',
          great: '#84cc16',
          excellent: '#22c55e',
          mint: '#38bdf8',
        },
      },
      borderRadius: { card: '1rem' },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
