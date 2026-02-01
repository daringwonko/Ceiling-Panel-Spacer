import React, { lazy, Suspense, LazyExoticComponent, ComponentType } from 'react';

// Lazy loading utilities for heavy components

// Lazy load heavy BIM components
export const LazyBIM3DCanvas = lazy(() => import('../components/BIM3DCanvas'))
export const LazyDraftingCanvas = lazy(() => import('../components/DraftingCanvas/DraftingCanvas'))
export const LazyHierarchyPanel = lazy(() => import('../components/bim/HierarchyPanel'))
export const LazyPropertiesPanel = lazy(() => import('../components/bim/PropertiesPanel'))
export const LazyMaterialsPanel = lazy(() => import('../components/bim/MaterialsPanel'))
export const LazyLayersPanel = lazy(() => import('../components/bim/LayersPanel'))
export const LazyAnnotationsPanel = lazy(() => import('../components/bim/AnnotationsPanel'))
export const LazySectionsPanel = lazy(() => import('../components/bim/SectionsPanel'))
export const LazyViewTemplates = lazy(() => import('../components/bim/ViewTemplates'))

// Loading fallback component
export const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <div 
    className="flex items-center justify-center p-8"
    role="status"
    aria-live="polite"
  >
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
    <span className="text-gray-600">{message}</span>
  </div>
)

// Higher-order component for lazy loading with suspense
export function lazyLoad<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
): LazyExoticComponent<ComponentType<P>> {
  return lazy(importFn, fallback as any)
}

// Preload lazy components on hover
const preloadedComponents = new Set<string>()

export function preloadOnHover(
  componentImport: () => Promise<any>,
  componentName: string
): void {
  const handleMouseEnter = () => {
    if (!preloadedComponents.has(componentName)) {
      preloadedComponents.add(componentName)
      componentImport().catch(() => {
        // Silent fail - component not critical
        preloadedComponents.delete(componentName)
      })
    }
  }
  
  // Return cleanup function
  return () => {
    // Component stays preloaded for better UX
  }
}

// Intersection Observer based lazy loading
export function useIntersectionLazyLoad<P extends object>(
  WrappedComponent: ComponentType<P>,
  threshold: number = 0.1
): ComponentType<P> & { preload: () => void } {
  let observer: IntersectionObserver | null = null
  let preloaded = false
  
  const LazyWrapper = (props: P) => {
    const [isVisible, setIsVisible] = React.useState(false)
    const componentRef = React.useRef<HTMLDivElement>(null)
    
    React.useEffect(() => {
      if (!componentRef.current || preloaded) return
      
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            preloaded = true
            if (observer) {
              observer.disconnect()
            }
          }
        },
        { threshold }
      )
      
      observer.observe(componentRef.current)
      
      return () => {
        if (observer) {
          observer.disconnect()
        }
      }
    }, [threshold])
    
    if (!isVisible) {
      return (
        <div ref={componentRef} className="min-h-[200px]">
          <LoadingFallback message="Preparing component..." />
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
  
  LazyWrapper.preload = () => {
    preloaded = true
  }
  
  return LazyWrapper as any
}

// Network-aware loading
export function useNetworkAwareLazyLoad<P extends object>(
  WrappedComponent: ComponentType<P>,
  connectionSpeed: 'slow' | 'fast' = 'fast'
): ComponentType<P> {
  const [shouldLoad, setShouldLoad] = React.useState(connectionSpeed === 'fast')
  const [isLoaded, setIsLoaded] = React.useState(false)
  
  React.useEffect(() => {
    if (connectionSpeed === 'fast') {
      setShouldLoad(true)
      return
    }
    
    // Check connection speed
    const connection = (navigator as any).connection
    if (connection) {
      const effectiveType = connection.effectiveType
      if (effectiveType === '4g') {
        setShouldLoad(true)
      } else {
        // Delay load for slower connections
        const timer = setTimeout(() => {
          setShouldLoad(true)
        }, 2000)
        
        return () => clearTimeout(timer)
      }
    } else {
      setShouldLoad(true)
    }
  }, [connectionSpeed])
  
  const [Component, setComponent] = React.useState<ComponentType<P> | null>(null)
  
  React.useEffect(() => {
    if (shouldLoad && !isLoaded) {
      // Dynamic import would happen here
      setIsLoaded(true)
    }
  }, [shouldLoad, isLoaded])
  
  if (!isLoaded) {
    return LoadingFallback as any
  }
  
  return <WrappedComponent {...({} as P)} />
}

// Export utilities
export default {
  lazy: lazyLoad,
  Suspense,
  LoadingFallback,
  preloadOnHover,
  useIntersectionLazyLoad,
  useNetworkAwareLazyLoad
}
