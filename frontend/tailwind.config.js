/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'tablet': '768px',
        'desktop': '1024px',
        'mobile': '480px',
      },
      colors: {
        // BIM Workbench Professional Color Palette
        'bim-primary': '#1976d2',
        'bim-primary-hover': '#1565c0',
        'bim-secondary': '#424242',
        'bim-accent': '#ff9800',
        'bim-background': '#fafafa',
        'bim-surface': '#ffffff',
        'bim-on-surface': '#212121',
        'bim-toolbar': '#f5f5f5',
        'bim-divider': '#e0e0e0',
        'bim-focus': '#e3f2fd',
        'bim-selected': '#bbdefb',
        // Standard primary color scale for BIM (matching React Three controls)
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Main BIM blue
          600: '#2563eb', // BIM button primary
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Savage Cabinetry Brand Colors
        savage: {
          primary: '#1E40AF',      // Royal blue - primary brand color
          'primary-hover': '#1E3A8A', // Darker blue for hover states
          accent: '#F59E0B',       // Amber - accent/highlight
          dark: '#0F172A',         // Slate 900 - main background
          surface: '#1E293B',      // Slate 800 - card/panel backgrounds
          text: '#F8FAFC',         // Slate 50 - primary text
          'text-muted': '#94A3B8', // Slate 400 - secondary text
          success: '#10B981',      // Emerald - success states
          danger: '#EF4444',       // Red - error/danger states
          warning: '#F59E0B',      // Amber - warning states (same as accent)
        },
      },
      fontFamily: {
        // Professional typography for BIM tools
        'sans': ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.25' }],
        'sm': ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem', { lineHeight: '1.5' }],
        'lg': ['1.125rem', { lineHeight: '1.75' }],
        'xl': ['1.25rem', { lineHeight: '1.75' }],
        '2xl': ['1.5rem', { lineHeight: '2' }],
        '3xl': ['1.875rem', { lineHeight: '2.25' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'md': '6px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'toolbar': '0 1px 3px rgba(0, 0, 0, 0.2)',
        'floating': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
