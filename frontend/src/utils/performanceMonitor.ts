// Performance monitoring utilities for BIM Workbench
export interface PerformanceMetrics {
  fps: number
  frameTime: number
  renderTime: number
  interactionLatency: number
  memoryUsage: number
  objectCount: number
}

export interface PerformanceThresholds {
  minFps: number
  maxFrameTime: number
  maxRenderTime: number
  maxInteractionLatency: number
}

export interface PerformanceSnapshot {
  timestamp: number
  metrics: PerformanceMetrics
  component: string
}

// Default performance thresholds
export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFps: 60,
  maxFrameTime: 16.67, // 60fps = 16.67ms per frame
  maxRenderTime: 50,   // Target <50ms render time
  maxInteractionLatency: 100 // Target <100ms interaction latency
}

class PerformanceMonitor {
  private snapshots: PerformanceSnapshot[] = []
  private frameCount = 0
  private lastFrameTime = performance.now()
  private fpsHistory: number[] = []
  private renderHistory: number[] = []
  private interactionHistory: number[] = []
  private isMonitoring = false
  private monitoringInterval: number | null = null

  constructor() {
    // Bind methods for event handlers
    this.startFrame = this.startFrame.bind(this)
    this.endFrame = this.endFrame.bind(this)
    this.recordInteraction = this.recordInteraction.bind(this)
  }

  // Frame timing
  private frameStartTime = 0

  startFrame(): void {
    this.frameStartTime = performance.now()
  }

  endFrame(): number {
    const frameTime = performance.now() - this.frameStartTime
    this.frameCount++
    
    // Calculate FPS
    const now = performance.now()
    const delta = now - this.lastFrameTime
    
    if (delta >= 1000) {
      const fps = (this.frameCount * 1000) / delta
      this.fpsHistory.push(fps)
      this.frameCount = 0
      this.lastFrameTime = now
      
      // Keep only last 60 samples
      if (this.fpsHistory.length > 60) {
        this.fpsHistory.shift()
      }
    }
    
    this.renderHistory.push(frameTime)
    if (this.renderHistory.length > 100) {
      this.renderHistory.shift()
    }
    
    return frameTime
  }

  // Interaction timing
  recordInteraction<T>(operation: () => T): T {
    const startTime = performance.now()
    const result = operation()
    const endTime = performance.now()
    
    const latency = endTime - startTime
    this.interactionHistory.push(latency)
    
    if (this.interactionHistory.length > 100) {
      this.interactionHistory.shift()
    }
    
    return result
  }

  async recordInteractionAsync<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    const result = await operation()
    const endTime = performance.now()
    
    const latency = endTime - startTime
    this.interactionHistory.push(latency)
    
    if (this.interactionHistory.length > 100) {
      this.interactionHistory.shift()
    }
    
    return result
  }

  // Get current metrics
  getMetrics(objectCount: number = 0): PerformanceMetrics {
    const avgFps = this.calculateAverage(this.fpsHistory)
    const avgRenderTime = this.calculateAverage(this.renderHistory)
    const avgInteractionLatency = this.calculateAverage(this.interactionHistory)
    
    return {
      fps: avgFps,
      frameTime: 1000 / (avgFps || 60),
      renderTime: avgRenderTime,
      interactionLatency: avgInteractionLatency,
      memoryUsage: this.getMemoryUsage(),
      objectCount
    }
  }

  // Get performance snapshot
  getSnapshot(component: string, objectCount: number = 0): PerformanceSnapshot {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(objectCount),
      component
    }
  }

  // Record snapshot
  recordSnapshot(snapshot: PerformanceSnapshot): void {
    this.snapshots.push(snapshot)
    
    // Keep only last 100 snapshots
    if (this.snapshots.length > 100) {
      this.snapshots.shift()
    }
  }

  // Calculate average of array
  private calculateAverage(arr: number[]): number {
    if (arr.length === 0) return 0
    return arr.reduce((sum, value) => sum + value, 0) / arr.length
  }

  // Get memory usage (if available)
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memInfo = (performance as any).memory
      return memInfo.usedJSHeapSize || 0
    }
    return 0
  }

  // Check if performance meets thresholds
  checkThresholds(metrics: PerformanceMetrics, thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS): {
    passed: boolean
    failures: string[]
  } {
    const failures: string[] = []
    
    if (metrics.fps < thresholds.minFps) {
      failures.push(`FPS below threshold: ${metrics.fps.toFixed(1)} < ${thresholds.minFps}`)
    }
    
    if (metrics.frameTime > thresholds.maxFrameTime) {
      failures.push(`Frame time above threshold: ${metrics.frameTime.toFixed(2)}ms > ${thresholds.maxFrameTime}ms`)
    }
    
    if (metrics.renderTime > thresholds.maxRenderTime) {
      failures.push(`Render time above threshold: ${metrics.renderTime.toFixed(2)}ms > ${thresholds.maxRenderTime}ms`)
    }
    
    if (metrics.interactionLatency > thresholds.maxInteractionLatency) {
      failures.push(`Interaction latency above threshold: ${metrics.interactionLatency.toFixed(2)}ms > ${thresholds.maxInteractionLatency}ms`)
    }
    
    return {
      passed: failures.length === 0,
      failures
    }
  }

  // Performance report
  generateReport(objectCount: number = 0): string {
    const metrics = this.getMetrics(objectCount)
    const check = this.checkThresholds(metrics)
    
    let report = '=== Performance Report ===\n'
    report += `FPS: ${metrics.fps.toFixed(1)}\n`
    report += `Frame Time: ${metrics.frameTime.toFixed(2)}ms\n`
    report += `Render Time: ${metrics.renderTime.toFixed(2)}ms\n`
    report += `Interaction Latency: ${metrics.interactionLatency.toFixed(2)}ms\n`
    report += `Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB\n`
    report += `Object Count: ${metrics.objectCount}\n`
    report += `Status: ${check.passed ? 'PASS' : 'FAIL'}\n`
    
    if (!check.passed) {
      report += '\nFailures:\n'
      check.failures.forEach(failure => {
        report += `  - ${failure}\n`
      })
    }
    
    return report
  }

  // Start monitoring
  startMonitoring(intervalMs: number = 1000): void {
    if (this.isMonitoring) return
    
    this.isMonitoring = true
    this.monitoringInterval = window.setInterval(() => {
      const snapshot = this.getSnapshot('monitor', this.getMetrics().objectCount)
      this.recordSnapshot(snapshot)
    }, intervalMs)
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return
    
    this.isMonitoring = false
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  // Get history
  getHistory(): PerformanceSnapshot[] {
    return [...this.snapshots]
  }

  // Clear history
  clearHistory(): void {
    this.snapshots = []
    this.fpsHistory = []
    this.renderHistory = []
    this.interactionHistory = []
    this.frameCount = 0
  }

  // Performance mark for specific operations
  mark(name: string): number {
    return performance.now()
  }

  measure(name: string, startMark: number): number {
    const duration = performance.now() - startMark
    console.log(`${name}: ${duration.toFixed(2)}ms`)
    return duration
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Higher-order component for performance tracking
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
): React.FC<P> {
  return function PerformanceTrackedComponent(props: P) {
    usePerformanceTracking(componentName)
    return <WrappedComponent {...props} />
  }
}

// Hook for performance tracking
export function usePerformanceTracking(componentName: string): void {
  const snapshot = performanceMonitor.getSnapshot(componentName)
  performanceMonitor.recordSnapshot(snapshot)
}

// Decorator for performance tracking
export function trackPerformance(
  componentName: string,
  targetLatency: number = 100
) {
  return function <T extends (...args: any[]) => any>(
    _target: any,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value
    
    descriptor.value = function (...args: Parameters<T>): ReturnType<T> {
      const startTime = performance.now()
      const result = originalMethod.apply(this, args)
      const endTime = performance.now()
      
      const latency = endTime - startTime
      
      if (latency > targetLatency) {
        console.warn(
          `[Performance] ${componentName}.${String(_propertyKey)} exceeded target latency: ${latency.toFixed(2)}ms > ${targetLatency}ms`
        )
      }
      
      return result
    } as T
    
    return descriptor
  }
}

// Export utilities
export default performanceMonitor
