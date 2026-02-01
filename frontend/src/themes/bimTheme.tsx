import { createTheme, ThemeOptions } from '@mui/material/styles'

// BIM Workbench Professional Theme
// Professional styling equivalent to commercial CAD tools

const baseTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2', // BIM Professional Blue
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#424242', // BIM Professional Gray
      light: '#616161',
      dark: '#212121',
      contrastText: '#ffffff',
    },
    error: {
      main: '#ef5350',
      light: '#e57373',
      dark: '#c62828',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
      contrastText: '#000000',
    },
    info: {
      main: '#03a9f4',
      light: '#4fc3f7',
      dark: '#0277bd',
      contrastText: '#ffffff',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafafa', // BIM surface background
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd',
    },
    divider: '#e0e0e0',
    // Custom BIM-specific colors
    bim: {
      grid: '#e0e0e0',
      selection: '#1976d2',
      ghost: 'rgba(25, 118, 210, 0.1)',
      highlight: '#ffeb3b',
      error: '#f44336',
      warning: '#ff9800',
      success: '#4caf50',
      info: '#2196f3',
    },
    surface: {
      level1: '#ffffff',
      level2: '#f5f5f5',
      level3: '#eeeeee',
      border: '#e0e0e0',
    },
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'system-ui', 'sans-serif'].join(','),
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.25,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.02857em',
      textTransform: 'none', // No uppercase for professional look
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: 2.66,
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
    },
    // Technical/BIM-specific typography
    technical: {
      dimension: {
        fontFamily: 'Roboto Mono, monospace',
        fontSize: '0.8125rem',
        fontWeight: 400,
      },
      coordinate: {
        fontFamily: 'Roboto Mono, monospace',
        fontSize: '0.75rem',
        fontWeight: 500,
      },
      annotation: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 500,
      },
    },
  },
  breakpoints: {
    values: {
      xs: 0, // Mobile
      sm: 600, // Small tablet
      md: 768, // Tablet
      lg: 1024, // Desktop
      xl: 1536,
      'tablet': 768,
      'desktop': 1024,
      'mobile': 480,
    },
  },
  spacing: (factor: number) => `${0.25 * factor}rem`,
  shape: {
    borderRadius: 6, // Slightly rounded for modern look
  },
}

export const bimTheme = createTheme({
  ...baseTheme,
  components: {
    ...baseTheme.components,
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 36,
          padding: '8px 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
          },
        },
        contained: {
          backgroundImage: 'none',
          '&:hover': {
            backgroundColor: '#1565c0',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
          },
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)',
          borderRadius: 8,
          border: '1px solid rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        elevation1: {
          boxShadow: '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
          },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          borderRadius: 3,
        },
        thumb: {
          height: 20,
          width: 20,
          borderRadius: 10,
        },
        track: {
          borderRadius: 3,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'collapse',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#fafafa',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 4,
          fontSize: '0.75rem',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 6,
          boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: 6,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #e0e0e0',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
        },
      },
    },
    MuiExpansionPanel: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          '&:before': {
            display: 'none',
          },
        },
      },
    },
    MuiExpansionPanelSummary: {
      styleOverrides: {
        root: {
          minHeight: 48,
        },
      },
    },
  },
})

// Dark theme variant for professional BIM workbench
export const bimDarkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
      disabled: '#606060',
    },
    divider: '#333333',
    surface: {
      level1: '#1e1e1e',
      level2: '#2d2d2d',
      level3: '#3d3d3d',
      border: '#333333',
    },
  },
  components: {
    ...baseTheme.components,
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          border: '1px solid #333333',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.4)',
          },
        },
        contained: {
          '&:hover': {
            backgroundColor: '#42a5f5',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)',
          },
        },
      },
    },
  },
})

export default bimTheme