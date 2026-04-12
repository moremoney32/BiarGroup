import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens: {
      xs: '320px', // téléphones bas de gamme RDC Congo
      sm: '375px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Charte graphique BIAR GROUP
        primary: {
          DEFAULT: '#E91E8C',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#3B2F8F',
          foreground: '#ffffff',
        },
        background: '#0F0F1A',
        foreground: '#ffffff',
        border: 'rgba(255,255,255,0.08)',
        muted: {
          DEFAULT: 'rgba(255,255,255,0.06)',
          foreground: 'rgba(255,255,255,0.4)',
        },
        card: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          foreground: '#ffffff',
        },
      },
      backgroundImage: {
        'gradient-biar': 'linear-gradient(135deg, #E91E8C, #3B2F8F)',
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config
