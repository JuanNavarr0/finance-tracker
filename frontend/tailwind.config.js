/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          // Dark theme colors
          dark: {
            bg: '#0a0a0a',
            card: '#141414',
            border: '#262626',
            hover: '#1f1f1f',
          },
          // Primary colors
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          // Accent colors
          accent: {
            green: '#10b981',
            red: '#ef4444',
            yellow: '#f59e0b',
            purple: '#8b5cf6',
            pink: '#ec4899',
            cyan: '#06b6d4',
          },
          // Chart colors
          chart: {
            1: '#3b82f6',
            2: '#10b981',
            3: '#f59e0b',
            4: '#ef4444',
            5: '#8b5cf6',
            6: '#ec4899',
            7: '#06b6d4',
            8: '#6366f1',
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          mono: ['JetBrains Mono', 'monospace'],
        },
        fontSize: {
          '2xs': '0.625rem',
        },
        animation: {
          'fade-in': 'fadeIn 0.5s ease-in-out',
          'slide-up': 'slideUp 0.3s ease-out',
          'slide-down': 'slideDown 0.3s ease-out',
          'slide-left': 'slideLeft 0.3s ease-out',
          'slide-right': 'slideRight 0.3s ease-out',
          'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          'shimmer': 'shimmer 2s linear infinite',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: '0' },
            '100%': { opacity: '1' },
          },
          slideUp: {
            '0%': { transform: 'translateY(10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          slideDown: {
            '0%': { transform: 'translateY(-10px)', opacity: '0' },
            '100%': { transform: 'translateY(0)', opacity: '1' },
          },
          slideLeft: {
            '0%': { transform: 'translateX(10px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
          },
          slideRight: {
            '0%': { transform: 'translateX(-10px)', opacity: '0' },
            '100%': { transform: 'translateX(0)', opacity: '1' },
          },
          pulseGlow: {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.5' },
          },
          shimmer: {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
          'gradient-glow': 'linear-gradient(to right, transparent, rgba(59, 130, 246, 0.5), transparent)',
        },
        boxShadow: {
          'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
          'glow-lg': '0 0 40px rgba(59, 130, 246, 0.5)',
          'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.1)',
        },
        borderRadius: {
          '4xl': '2rem',
        },
        backdropBlur: {
          xs: '2px',
        },
      },
    },
    plugins: [],
  }
