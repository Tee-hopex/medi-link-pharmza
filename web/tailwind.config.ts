import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1E8A6E',
          50: '#EAFAF5',
          100: '#C6F0E2',
          200: '#8EE0C8',
          300: '#55CAAC',
          400: '#2EB08F',
          500: '#1E8A6E',
          600: '#176F59',
          700: '#115546',
          800: '#0C3E34',
          900: '#072921',
        },
        accent: {
          DEFAULT: '#2990B0',
          light: '#E8F5FA',
          medium: '#5AB2CC',
          dark: '#1D6B85',
        },
        surface: '#FFFFFF',
        sidebar: '#0F1A13',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
