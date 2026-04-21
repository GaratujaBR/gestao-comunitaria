// tailwind.config.js — Community Hub Design System
// Cole este objeto dentro do seu theme.extend existente

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary':    '#4CAF50',
        'bg-surface':    '#F3EFE0',
        'bg-section':    '#D5E8D4',

        // Accents
        'accent':        '#88C9A1',
        'accent-dark':   '#2D5A27',
        'accent-pink':   '#F8BBD0',

        // Texto
        'text-primary':  '#1A1A1A',
        'text-secondary':'#4D4D4D',

        // Bordas
        'border-default':'#6B8E23',
        'border-dark':   '#4A5D23',

        // Status
        'status-success':'#90EE90',
        'status-alert':  '#FF80AB',

        // Escala de verdes (uso: green-100, green-500 etc.)
        green: {
          100: '#D5E8D4',
          200: '#90EE90',
          300: '#88C9A1',
          500: '#4CAF50',
          700: '#6B8E23',
          900: '#2D5A27',
        },
      },

      fontFamily: {
        sans: ['Nunito', 'Poppins', 'sans-serif'],
      },

      fontSize: {
        'xs':  ['12px', { lineHeight: '1.5' }],
        'sm':  ['14px', { lineHeight: '1.5' }],
        'base':['16px', { lineHeight: '1.7' }],
        'lg':  ['20px', { lineHeight: '1.4' }],
        'xl':  ['24px', { lineHeight: '1.3' }],
        '2xl': ['32px', { lineHeight: '1.2' }],
      },

      spacing: {
        'xs':  '4px',
        'sm':  '8px',
        'md':  '16px',
        'lg':  '24px',
        'xl':  '32px',
        '2xl': '48px',
      },

      borderRadius: {
        'sm':  '6px',
        'md':  '12px',
        'lg':  '20px',
        'xl':  '28px',
        'pill':'9999px',
      },

      boxShadow: {
        'card':    '0 2px 8px rgba(45, 90, 39, 0.10)',
        'elevated':'0 4px 16px rgba(45, 90, 39, 0.15)',
      },
    },
  },
  plugins: [],
}
