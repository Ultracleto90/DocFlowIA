import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        docuflow: {
          bg: '#DCEAF7',
          surface: '#FFFFFF',
          input: '#E8EEF5',
          primary: '#23478D',
          action: '#1E60B8',
          navy: '#0D253F',
          slate: '#5A6B7C',
          cyan: '#00C2E0',
          violet: '#9D4EDD',
          orange: '#EB8934',
        },
      },
    },
  },
  plugins: [],
};

export default config;
