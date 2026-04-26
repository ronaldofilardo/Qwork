import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        xxs: '320px',
        xs: '475px',
      },
      colors: {
        primary: {
          DEFAULT: '#2D2D2D',
          hover: '#1a1a1a',
          light: '#4a4a4a',
        },
        accent: {
          DEFAULT: '#9ACD32',
          hover: '#7BA428',
          light: '#B5E550',
          alt: '#8DC641',
        },
        danger: '#EF4444',
        success: '#9ACD32',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: [
          'var(--font-geist-sans)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'var(--font-geist-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      borderWidth: {
        '3': '3px',
      },
      keyframes: {
        progressIndeterminate: {
          '0%': { transform: 'translateX(-100%) scaleX(0.5)' },
          '50%': { transform: 'translateX(50%) scaleX(0.6)' },
          '100%': { transform: 'translateX(200%) scaleX(0.5)' },
        },
      },
      animation: {
        progressIndeterminate:
          'progressIndeterminate 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
