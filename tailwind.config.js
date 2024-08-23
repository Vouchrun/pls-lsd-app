/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    colors: {
      transparent: 'transparent',
      white: '#ffffff',
      primary: '#00F3AB',
      // Background
      bgPage: '#E8EFFD',
      bgPageDark: '#1B1B1F',
      bg1: '#FFFFFF',
      bg1Dark: '#6C86AD80',
      bg2: '#FFFFFF80',
      bg2Dark: '#6C86AD4D',
      bg3: '#6C86AD1A',
      bg3Dark: '#6C86AD1A',
      bgHighlight: '#1B1B1F',
      bgHighlightDark: '#E8EFFD',
      bgHover: '#DEE6F7',
      bgHoverDark: '#6C86AD80',
      bgSuccess: '#80CAFF80',
      // Border
      border1: '#ffffff',
      border1Dark: '#6C86AD80',
      borderActive: '#85E0A3',
      borderActiveDark: '#85E0A350',
      // Divider
      divider1: '#E8EFFD',
      divider1Dark: '#6C86AD80',
      divider2: '#6C86AD14',
      divider2Dark: '#6C86AD14',
      // Text
      text1: '#1B1B1F',
      text1Dark: '#E8EFFD',
      text2: '#6C86AD',
      text2Dark: '#FFFFFF80',
      textHighlight: '#ffffff',
      textHighlightDark: '#1B1B1F',
      link: '#5A5DE0',
      linkDark: '#ffffff',
      error: '#FF52C4',
    },
    fontFamily: {
      helvetica: [
        'Helvetica',
        '-apple-system',
        'BlinkMacSystemFont',
        'Segoe UI',
        'Roboto',
        'Oxygen',
        'Ubuntu',
        'Cantarell',
        'Fira Sans',
        'Droid Sans',
        'Helvetica Neue',
        'sans-serif',
      ],
    },
    extend: {
      spacing: {
        faqGap: '.1rem',
        smallContentW: '11.8rem',
        contentW: '12.8rem',
        largeContentW: '13.8rem',
      },
      transitionProperty: {
        height: 'height',
        width: 'width',
        spacing: 'margin, padding',
      },
      keyframes: {
        beeScale: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.4)' },
        },
        beeLight: {
          '0%, 100%': { opacity: 0 },
          '50%': { opacity: 1 },
        },
        expand: {
          '0%': { transform: 'scale(0,1)' },
          '50%': { transform: 'scale(0.5,1)' },
          '100%': { transform: 'scale(1,1)' },
        },
        collapse: {
          '0%': { transform: 'scale(1,1)' },
          '50%': { transform: 'scale(0.5,1)' },
          '100%': { transform: 'scale(0,1)' },
        },
      },
      animation: {
        beeScale: 'beeScale 1.5s linear infinite',
        beeLight: 'beeLight 1.5s linear infinite',
        expand: 'expand .3s linear',
        collapse: 'collapse .3s linear',
      },
    },
  },
  plugins: [],
};
