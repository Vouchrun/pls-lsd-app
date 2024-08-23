import { createTheme } from '@mui/material';

declare module '@mui/material/styles' {
  // interface Theme {
  //   background: {
  //     darkButton: React.CSSProperties["color"];
  //   };
  // }
  // // allow configuration using `createTheme`
  // interface ThemeOptions {
  //   background?: {
  //     darkButton?: React.CSSProperties["color"];
  //   };
  // }

  interface TypographyVariants {
    bold: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    bold?: React.CSSProperties;
  }
}

declare module '@mui/material/styles/createPalette' {
  interface Palette {
    darkButtonBg: Palette['primary'];
    darkBg: Palette['primary'];
  }
  interface PaletteOptions {
    darkButtonBg: PaletteOptions['primary'];
    darkBg: PaletteOptions['primary'];
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    bold: true;
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    darkButtonBg: true;
  }
}

declare module '@mui/material/AppBar' {
  interface AppBarPropsColorOverrides {
    darkBg: true;
  }
}

export const theme = createTheme({
  palette: {
    primary: {
      main: '#5A5DE0',
    },
    secondary: {
      main: '#5b6872',
    },
    info: {
      main: '#0095EB',
    },
    darkBg: {
      main: '#000000',
    },
    darkButtonBg: {
      main: '#292E35',
    },
    action: {
      disabledBackground: 'rgba(142, 101, 255, 0.5)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    text: {
      disabled: '#ffffff',
    },
    grey: {
      // skeleton light mode
      100: '#6C86AD33',
      400: '#587798',
      600: '#1A2835',
      // skeleton dark mode
      900: '#ffffff4D',
    },
  },
  typography: {
    // fontFamily: [
    //   '"Arial"',
    //   "sans-serif",
    //   "-apple-system",
    //   "BlinkMacSystemFont",
    //   '"Segoe UI"',
    //   "Roboto",
    //   '"Apple Color Emoji"',
    //   '"Segoe UI Emoji"',
    //   '"Segoe UI Symbol"',
    //   "-apple-system",
    // ].join(","),
    // bold: {
    //   fontFamily: [
    //     '"Arial"',
    //     "sans-serif",
    //     "-apple-system",
    //     "BlinkMacSystemFont",
    //     '"Segoe UI"',
    //     "Roboto",
    //     '"Apple Color Emoji"',
    //     '"Segoe UI Emoji"',
    //     '"Segoe UI Symbol"',
    //     "-apple-system",
    //   ].join(","),
    //   fontWeight: "bold",
    // },
  },
  components: {
    MuiPopover: {
      styleOverrides: {
        paper: {
          // boxShadow: "0 20px 25px -5px #6C86AD50, 0 8px 10px -6px #6C86AD50",
          filter: 'drop-shadow(0px 10px 32px rgba(108, 134, 173, 0.2))',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1B1B1Fe0',
          // border: "1px solid #1A2835",
          borderRadius: '4px',
          // boxShadow: "0 20px 25px -5px #0000005b, 0 8px 10px -6px #0000005b",
          padding: '5px 10px',
          // color: "#5B6872",
          fontSize: '.14rem',
          // lineHeight: ".22rem",
        },
      },
    },
  },
});
