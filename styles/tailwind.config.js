const defaultTheme = require('tailwindcss/defaultTheme')
const plugin = require('tailwindcss/plugin')

module.exports = {
  mode: 'jit',
  content: ['_site/**/*.html'],
  safelist: [],
  theme: {
    extend: {
      boxShadow: {
        border: '#000000 0 -1px 0'
      },
      colors: {
        background: '#0769ad',
        blue: {
          light: '#8ccffa'
        },
        border: {
          DEFAULT: 'rgb(0,0,0,0.2)',
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
          lighter: '#999999',
          lightest: '#eeeeee'
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
        sans: ['Helvetica Neue', 'Helvetica', ...defaultTheme.fontFamily.sans],
        serif: ['Cairo', ...defaultTheme.fontFamily.serif]
      }
    }
  },
  plugins: [
    plugin(function ({ addBase }) {
      addBase({
        '@font-face': {
          fontFamily: 'Cairo',
          src: 'url("/fonts/Cairo/Cairo-Bold.ttf") format("truetype")',
          fontWeight: 'bold'
        }
      })
    })
  ]
}
