import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'pk-green': '#01411C',
        'pk-green-light': '#0a5a28',
        'pk-gold': '#E8A33D',
        'pk-gold-light': '#f0bb65',
        'pk-cream': '#F4EDE4',
        'pk-sage': '#7A9E7E',
        'pk-sage-light': '#9ab89e',
        'pk-terra': '#C1440E',
        'pk-dark': '#1C1C1C',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        urdu: ['var(--font-noto-nastaliq)', 'var(--font-jameel)', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(1, 65, 28, 0.08)',
        'warm-lg': '0 8px 40px rgba(1, 65, 28, 0.12)',
        'gold': '0 4px 20px rgba(232, 163, 61, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
