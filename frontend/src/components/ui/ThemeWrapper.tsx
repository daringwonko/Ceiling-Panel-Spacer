import React, { useState, useMemo, createContext, useContext } from 'react'
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material'
import { bimTheme, bimDarkTheme } from '../themes/index'

// Theme context for managing theme state
interface ThemeContextType {
  mode: 'light' | 'dark'
  toggleTheme: () => void
  setMode: (mode: 'light' | 'dark') => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Custom hook for using theme context
export const useThemeContext = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeWrapper')
  }
  return context
}

// ThemeWrapper component for global Material Design integration
interface ThemeWrapperProps {
  children: React.ReactNode
  defaultMode?: 'light' | 'dark'
  enableSystemTheme?: boolean
}

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({
  children,
  defaultMode = 'light',
  enableSystemTheme = true,
}) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    // Check for user preference in localStorage
    const savedMode = localStorage.getItem('bim-theme-mode')
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode
    }
    
    // Check system preference if enabled
    if (enableSystemTheme && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    return defaultMode
  })

  const toggleTheme = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light'
      localStorage.setItem('bim-theme-mode', newMode)
      return newMode
    })
  }

  const theme = useMemo(() => {
    return mode === 'light' ? bimTheme : bimDarkTheme
  }, [mode])

  const contextValue = useMemo(() => ({
    mode,
    toggleTheme,
    setMode: (newMode: 'light' | 'dark') => {
      setMode(newMode)
      localStorage.setItem('bim-theme-mode', newMode)
    },
  }), [mode])

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

// Responsive breakpoint hook
export const useResponsive = () => {
  const theme = useMemo(() => {
    const savedMode = localStorage.getItem('bim-theme-mode')
    return savedMode === 'dark' ? bimDarkTheme : bimTheme
  }, [])

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < theme.breakpoints.values.sm
  }, [theme])

  const isTablet = useMemo(() => {
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    return width >= theme.breakpoints.values.sm && width < theme.breakpoints.values.md
  }, [theme])

  const isDesktop = useMemo(() => {
    if (typeof window === 'undefined') return true
    return window.innerWidth >= theme.breakpoints.values.md
  }, [theme])

  return { isMobile, isTablet, isDesktop }
}

// Breakpoint-aware component wrapper
interface ResponsiveWrapperProps {
  children: React.ReactNode
  mobile?: React.ReactNode
  tablet?: React.ReactNode
  desktop?: React.ReactNode
  fallback?: React.ReactNode
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
  children,
  mobile,
  tablet,
  desktop,
  fallback,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive()

  if (isMobile && mobile) return <>{mobile}</>
  if (isTablet && tablet) return <>{tablet}</>
  if (isDesktop && desktop) return <>{desktop}</>
  if (fallback) return <>{fallback}</>
  return <>{children}</>
}

export default ThemeWrapper
