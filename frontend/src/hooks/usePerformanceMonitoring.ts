/**
 * Performance Monitoring Hooks
 * Tracks FPS, memory usage, and interaction speeds
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import analytics from '../services/analytics';
import type { PerformanceMetrics } from '../types/analytics';

interface UsePerformanceMonitoringReturn {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  performanceScore: number;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  recordInteraction: (duration: number) => void;
}

export function usePerformanceMonitoring(): UsePerformanceMonitoringReturn {
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [renderTime, setRenderTime] = useState(0);
  const [performanceScore, setPerformanceScore] = useState(100);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafIdRef = useRef<number | null>(null);
  const interactionLatenciesRef = useRef<number[]>([]);
  
  const measurePerformance = useCallback(() => {
    frameCountRef.current++;
    const currentTime = performance.now();
    
    if (currentTime - lastTimeRef.current >= 1000) {
      const measuredFps = Math.round(frameCountRef.current * 1000 / (currentTime - lastTimeRef.current));
      
      // Get memory usage if available
      const memUsage = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0;
      
      setFps(measuredFps);
      setMemoryUsage(memUsage);
      
      // Record metrics
      const avgLatency = interactionLatenciesRef.current.length > 0
        ? interactionLatenciesRef.current.reduce((a, b) => a + b, 0) / interactionLatenciesRef.current.length
        : 0;
      
      const metrics: PerformanceMetrics = {
        fps: measuredFps,
        memoryUsage: memUsage,
        interactionLatency: avgLatency,
        renderTime: renderTime,
        loadTime: performance.timing?.loadEventEnd ?? 0,
        timestamp: Date.now()
      };
      
      analytics.recordPerformanceMetrics(metrics);
      
      // Calculate performance score
      const fpsScore = Math.min(measuredFps / 60, 1) * 40;
      const memoryScore = Math.max(0, (1 - memUsage / (500 * 1024 * 1024))) * 30; // 500MB baseline
      const latencyScore = Math.max(0, (100 - avgLatency) / 100) * 30;
      const newScore = Math.round(fpsScore + memoryScore + latencyScore);
      setPerformanceScore(newScore);
      
      frameCountRef.current = 0;
      lastTimeRef.current = currentTime;
      interactionLatenciesRef.current = [];
    }
    
    rafIdRef.current = requestAnimationFrame(measurePerformance);
  }, [renderTime]);
  
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    frameCountRef.current = 0;
    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(measurePerformance);
  }, [isMonitoring, measurePerformance]);
  
  const stopMonitoring = useCallback(() => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setIsMonitoring(false);
  }, []);
  
  const recordInteraction = useCallback((duration: number) => {
    interactionLatenciesRef.current.push(duration);
    
    // Keep only last 100 latencies
    if (interactionLatenciesRef.current.length > 100) {
      interactionLatenciesRef.current = interactionLatenciesRef.current.slice(-100);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);
  
  return {
    fps,
    memoryUsage,
    renderTime,
    performanceScore,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    recordInteraction
  };
}

// Hook for tracking specific interaction performance
interface UseInteractionTrackingOptions {
  trackClick?: boolean;
  trackDrag?: boolean;
  trackRender?: boolean;
  onSlowInteraction?: (duration: number, threshold: number) => void;
}

export function useInteractionTracking(options: UseInteractionTrackingOptions = {}) {
  const {
    trackClick = true,
    trackDrag = true,
    trackRender = true,
    onSlowInteraction
  } = options;
  
  const interactionStartRef = useRef<Map<string, number>>(new Map());
  
  const startInteraction = useCallback((type: string) => {
    interactionStartRef.current.set(type, performance.now());
  }, []);
  
  const endInteraction = useCallback((type: string, threshold = 100): number => {
    const startTime = interactionStartRef.current.get(type);
    if (!startTime) return 0;
    
    const duration = performance.now() - startTime;
    interactionStartRef.current.delete(type);
    
    if (duration > threshold && onSlowInteraction) {
      onSlowInteraction(duration, threshold);
    }
    
    return duration;
  }, [onSlowInteraction]);
  
  // Set up global interaction tracking
  useEffect(() => {
    if (!trackClick && !trackDrag) return;
    
    const handleClick = () => {
      startInteraction('click');
      setTimeout(() => endInteraction('click'), 0);
    };
    
    const handleDragStart = () => startInteraction('drag');
    const handleDragEnd = () => endInteraction('drag', 200);
    
    if (trackClick) {
      document.addEventListener('click', handleClick);
    }
    
    if (trackDrag) {
      document.addEventListener('mousedown', handleDragStart);
      document.addEventListener('mouseup', handleDragEnd);
    }
    
    return () => {
      if (trackClick) {
        document.removeEventListener('click', handleClick);
      }
      if (trackDrag) {
        document.removeEventListener('mousedown', handleDragStart);
        document.removeEventListener('mouseup', handleDragEnd);
      }
    };
  }, [trackClick, trackDrag, startInteraction, endInteraction]);
  
  return {
    startInteraction,
    endInteraction
  };
}

// Hook for FPS display component
interface UseFPSDisplayReturn {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  frameCount: number;
}

export function useFPSDisplay(): UseFPSDisplayReturn {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const [minFps, setMinFps] = useState(60);
  const [maxFps, setMaxFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  
  const historyRef = useRef<number[]>([]);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  
  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      
      if (currentTime - lastTimeRef.current >= 1000) {
        const measuredFps = frameCountRef.current;
        setFps(measuredFps);
        setFrameCount(prev => prev + measuredFps);
        
        // Update history
        historyRef.current.push(measuredFps);
        if (historyRef.current.length > 60) {
          historyRef.current.shift();
        }
        
        // Calculate stats
        if (historyRef.current.length > 0) {
          const sum = historyRef.current.reduce((a, b) => a + b, 0);
          setAvgFps(Math.round(sum / historyRef.current.length));
          setMinFps(Math.min(...historyRef.current));
          setMaxFps(Math.max(...historyRef.current));
        }
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    const rafId = requestAnimationFrame(measureFPS);
    
    return () => cancelAnimationFrame(rafId);
  }, []);
  
  return { fps, avgFps, minFps, maxFps, frameCount };
}

// Hook for memory monitoring
interface UseMemoryMonitoringReturn {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usagePercentage: number;
}

export function useMemoryMonitoring(): UseMemoryMonitoringReturn {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  }>({
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0
  });
  
  useEffect(() => {
    const updateMemory = () => {
      const perf = performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } };
      if (perf.memory) {
        setMemoryInfo({
          usedJSHeapSize: perf.memory.usedJSHeapSize,
          totalJSHeapSize: perf.memory.totalJSHeapSize,
          jsHeapSizeLimit: perf.memory.jsHeapSizeLimit
        });
      }
    };
    
    updateMemory();
    const interval = setInterval(updateMemory, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  const usagePercentage = memoryInfo.jsHeapSizeLimit > 0
    ? Math.round((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100)
    : 0;
  
  return {
    ...memoryInfo,
    usagePercentage
  };
}
