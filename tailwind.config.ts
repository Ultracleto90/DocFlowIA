import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        docuflow: {
          bg: 'rgb(var(--df-bg) / <alpha-value>)',
          surface: 'rgb(var(--df-surface) / <alpha-value>)',
          elevated: 'rgb(var(--df-elevated) / <alpha-value>)',
          input: 'rgb(var(--df-input) / <alpha-value>)',
          border: 'rgb(var(--df-border) / <alpha-value>)',
          primary: 'rgb(var(--df-primary) / <alpha-value>)',
          action: 'rgb(var(--df-action) / <alpha-value>)',
          navy: 'rgb(var(--df-navy) / <alpha-value>)',
          slate: 'rgb(var(--df-slate) / <alpha-value>)',
          cyan: 'rgb(var(--df-cyan) / <alpha-value>)',
          violet: 'rgb(var(--df-violet) / <alpha-value>)',
          orange: 'rgb(var(--df-orange) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
