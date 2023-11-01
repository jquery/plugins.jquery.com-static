const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: ['_site/**/*.html'],
  safelist: [],
  theme: {
    extend: {
      boxShadow: {
        border: '#000000 0 -1px 0'
      },
      colors: {
        background: '#2b69a8',
        blue: {
          light: '#8dcdf0'
        },
        border: {
          DEFAULT: '#5b5959',
          dark: '#333333'
        },
        button: {
          DEFAULT: '#0f67a1',
          hover: '#0e3a58'
        },
        gray: {
          DEFAULT: '#333333',
          dark: '#242424',
          darker: '#191919',
          light: '#666666',
          lighter: '#e6e6e6'
        },
        link: {
          DEFAULT: '#0769AD',
          hover: '#0e3a58',
          active: '#1695e9',
          visited: '#0f67a1',
          light: '#e6e6e6'
        },
        'footer-text': {
          DEFAULT: '#aaaaaa',
          hover: '#e6e6e6'
        },
        transparent: 'transparent'
      },
      fontFamily: {
        ...defaultTheme.fontFamily,
        sans: ['Helvetica Neue', 'Helvetica', ...defaultTheme.fontFamily.sans]
      }
    }
  },
  plugins: []
}
