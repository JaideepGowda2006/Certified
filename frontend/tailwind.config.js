/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neutral: {
          850: '#141416',
          925: '#0d0d0f',
          950: '#08080a',
        },
        apple: {
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          gray: '#86868b',
          'dark-gray': '#6e6e73',
          ink: '#1d1d1f',
          canvas: '#fbfbfd',
          'dark-canvas': '#000000',
        },
        brand: {
          50: '#f5f7fa',
          100: '#ebeef5',
          200: '#dbe1ec',
          500: '#0071e3',
          600: '#0062c4',
          700: '#0052a3',
          900: '#0a1d37',
        },
      },
      fontFamily: {
        sans: [
          'Sora',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Space Grotesk"',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      boxShadow: {
        hairline: '0 0 0 1px rgba(0, 0, 0, 0.06)',
        'hairline-dark': '0 0 0 1px rgba(255, 255, 255, 0.08)',
        apple: '0 8px 30px rgba(0, 0, 0, 0.04)',
        'apple-dark': '0 8px 30px rgba(0, 0, 0, 0.35)',
        'apple-hover': '0 14px 40px -10px rgba(0, 0, 0, 0.08)',
        'apple-hover-dark': '0 14px 40px -10px rgba(0, 0, 0, 0.6)',
      },
      backdropBlur: {
        xl: '20px',
        '2xl': '32px',
      },
    },
  },
  plugins: [],
}
