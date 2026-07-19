import { createTheme } from '@mui/material/styles';

export const palettes = {
  light: {
    mainBg: '#eef2f6',
    primary: '#47b4ec',
    secondary: '#3b9dd8',
    secondaryTwo: '#4e7593',
    textDark: '#58595a',
    textLight: '#6d7072',
    white: '#ffffff',
    border: '#e5e5e5',
    green: '#38b05d',
    yellow: '#e7aa3f',
    red: '#ff4343',
  },
  dark: {
    mainBg: '#1f2229',
    primary: '#3aa8e6',
    secondary: '#4db3f5',
    secondaryTwo: '#7fa8c7',
    textDark: '#e0e0e0',
    textLight: '#b0b0b0',
    white: '#212121',
    border: '#333333',
    green: '#45c86f',
    yellow: '#ffc152',
    red: '#ff6b6b',
  },
};

export function buildTheme(mode) {
  const p = palettes[mode] || palettes.light;
  return createTheme({
    palette: {
      mode,
      primary: {
        main: p.primary,
        dark: p.secondary,
      },
      secondary: {
        main: p.secondaryTwo,
      },
      background: {
        default: p.mainBg,
        paper: p.white,
      },
      text: {
        primary: p.textDark,
        secondary: p.textLight,
      },
      divider: p.border,
      success: {
        main: p.green,
      },
      warning: {
        main: p.yellow,
      },
      error: {
        main: p.red,
      },
    },
    shape: {
      borderRadius: 8,
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
      h6: { fontWeight: 500 },
      subtitle2: { fontWeight: 500 },
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: p.white,
            color: p.textDark,
            borderBottom: `1px solid ${p.border}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 6,
          },
        },
      },
    },
  });
}
