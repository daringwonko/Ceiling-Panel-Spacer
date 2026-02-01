import React, { Suspense } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import CeilingWorkbench from './workbench/CeilingWorkbench'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1'
    },
    secondary: {
      main: '#8b5cf6'
    },
    background: {
      default: '#1a1a2e',
      paper: '#16213e'
    },
    text: {
      primary: '#eaeaea',
      secondary: '#a0a0a0'
    }
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none'
        }
      }
    }
  }
})

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: '#888'
        }}>
          Loading Ceiling Panel Designer...
        </div>
      }>
        <CeilingWorkbench />
      </Suspense>
    </ThemeProvider>
  )
}

export default App
