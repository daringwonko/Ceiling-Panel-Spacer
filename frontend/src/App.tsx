import React, { Suspense, lazy } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ErrorBoundary from './components/ErrorBoundary'

// Lazy load heavy components
// CEILING WORKBENCH JAILED - Phase 8 decoupling - moved to staging/ceiling-panel-jail/
// const CeilingWorkbench = lazy(() => import('./workbench/CeilingWorkbench'))
const KitchenWorkbench = lazy(() => import('./components/Kitchen/KitchenWorkbench'))
const BIMLayout = lazy(() => import('./components/Layout/BIMLayout'))
const StructuralObjectsDemo = lazy(() => import('./bim/StructuralObjectsDemo'))
const LineToolHandler = lazy(() => import('./components/BIM/tools/LineToolHandler'))
const CircleToolHandler = lazy(() => import('./components/BIM/tools/CircleToolHandler'))
const ArcToolHandler = lazy(() => import('./components/BIM/tools/ArcToolHandler'))
const RectangleToolHandler = lazy(() => import('./components/BIM/tools/RectangleToolHandler'))
const PolygonToolHandler = lazy(() => import('./components/BIM/tools/PolygonToolHandler'))
const DoorToolHandler = lazy(() => import('./components/BIM/tools/DoorToolHandler'))
const WindowToolHandler = lazy(() => import('./components/BIM/tools/WindowToolHandler'))
const StairsToolHandler = lazy(() => import('./components/BIM/tools/StairsToolHandler'))
const PolylineToolHandler = lazy(() => import('./components/BIM/tools/PolylineToolHandler'))
const EllipseToolHandler = lazy(() => import('./components/BIM/tools/EllipseToolHandler'))

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
          <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
              {/* Savage Cabinetry - Default */}
              <Route path="/" element={<KitchenWorkbench />} />
              <Route path="/ceiling" element={<KitchenWorkbench />} />

              {/* BIM Workbench */}
              <Route path="/bim/*" element={<BIMLayout />} />
              <Route path="/bim/structural-demo" element={<StructuralObjectsDemo />} />
              <Route path="/bim/tools/line" element={<LineToolHandler />} />
              <Route path="/bim/tools/circle" element={<CircleToolHandler />} />
              <Route path="/bim/tools/arc" element={<ArcToolHandler />} />
              <Route path="/bim/tools/rectangle" element={<RectangleToolHandler />} />
              <Route path="/bim/tools/polygon" element={<PolygonToolHandler />} />
              <Route path="/bim/tools/door" element={<DoorToolHandler />} />
              <Route path="/bim/tools/window" element={<WindowToolHandler />} />
              <Route path="/bim/tools/stairs" element={<StairsToolHandler />} />
              <Route path="/bim/tools/polyline" element={<PolylineToolHandler />} />
              <Route path="/bim/tools/ellipse" element={<EllipseToolHandler />} />

              {/* Kitchen Design */}
              <Route path="/kitchen" element={<div style={{padding: '40px', color: '#888'}}>Kitchen Design - Coming Soon</div>} />

              {/* Legacy redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
