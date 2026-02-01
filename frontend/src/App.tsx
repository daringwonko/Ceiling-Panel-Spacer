import React, { Suspense, lazy } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Lazy load heavy components
const CeilingWorkbench = lazy(() => import('./workbench/CeilingWorkbench'))
const BIMLayout = lazy(() => import('./components/Layout/BIMLayout'))
const StructuralObjectsDemo = lazy(() => import('./bim/StructuralObjectsDemo'))

// Query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

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
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
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

const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    color: '#888'
  }}>
    Loading...
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Ceiling Panel Designer - Default */}
              <Route path="/" element={<CeilingWorkbench />} />
              <Route path="/ceiling" element={<CeilingWorkbench />} />

              {/* BIM Workbench */}
              <Route path="/bim" element={<BIMLayout />} />
              <Route path="/bim/structural-demo" element={<StructuralObjectsDemo />} />

              {/* Legacy redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
