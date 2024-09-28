const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  mode: 'jit',
  content: ['./content/**/*.{njk,md}', './_includes/**/*.njk'],
  safelist: [],
  theme: {
    extend: {
      backgroundImage: {
        'dark-tiles': 'url(/img/dark-grey-tile.png)',
        'sidebar-gradient':
          'radial-gradient(ellipse at left, #f2f2f2, #ffffff 80%)',
        'sidebar-header-gradient': 'linear-gradient(to right, #efefef, #f3f3f3)'
      },
      boxShadow: {
        border: '#000000 0 -1px 0'
      },
      colors: {
        background: '#0769ad',
        blue: {
          DEFAULT: '#305e91',
          hover: '#3d76b8',
          light: '#8ccffa'
        },
        border: {
          DEFAULT: 'rgb(0,0,0,0.2)',
          dark: '#333333',
          light: '#cccccc'
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
        list: {
          DEFAULT: '#4d4d4d'
        },
        'footer-text': {
          DEFAULT: '#aaaaaa',
          hover: '#e6e6e6'
        },
        transparent: 'transparent',
        warning: {
          DEFAULT: '#ffffaa'
        },
        white: {
          DEFAULT: '#ffffff',
          dark: '#f2f2f2',
          hover: '#e6e6e6',
          active: '#cccccc'
        }
      },
      fontFamily: {
        ...defaultTheme.fontFamily,
        sans: ['Helvetica Neue', 'Helvetica', ...defaultTheme.fontFamily.sans],
        title: [
          'Cairo',
          'Arial-Adjusted',
          'Helvetica',
          ...defaultTheme.fontFamily.sans
        ]
      }
    }
  }
}
