import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        primary: {
          DEFAULT: '#000000',
          hover: '#1a1a1a',
          light: '#2d2d2d',
        },
        accent: {
          DEFAULT: '#9ACD32',
          hover: '#7BA428',
          light: '#B5E550',
        },
        danger: '#EF4444',
        success: '#9ACD32',
        warning: '#F59E0B',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
export default config
