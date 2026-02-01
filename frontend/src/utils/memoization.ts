// Memoization and caching utilities for performance optimization
import { useMemo, useCallback, useRef, useEffect, DependencyList } from 'react'

// Simple cache implementation with LRU eviction
export class LRUCache<K, V> {
  private cache: Map<K, V>
  private maxSize: number
  
  constructor(maxSize: number = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    
    const value = this.cache.get(key)!
    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, value)
    return value
  }
  
  set(key: K, value: V): void {
    // Remove if exists (to update position)
    this.cache.delete(key)
    // Add to end
    this.cache.set(key, value)
    // Evict oldest if over limit
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
  }
  
  has(key: K): boolean {
    return this.cache.has(key)
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key)
  }
  
  clear(): void {
    this.cache.clear()
  }
  
  get size(): number {
    return this.cache.size
  }
  
  get keys(): K[] {
    return Array.from(this.cache.keys())
  }
  
  get values(): V[] {
    return Array.from(this.cache.values())
  }
}

// TTL Cache with time-based expiration
export class TTLCache<K, V> {
  private cache: Map<K, { value: V; expiresAt: number }>
  private ttl: number // milliseconds
  
  constructor(ttlMs: number = 60000, maxSize: number = 100) {
    this.cache = new Map()
    this.ttl = ttlMs
    // Limit size to prevent memory issues
    this.maxSize = maxSize
  }
  
  private maxSize: number
  
  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined
    
    const entry = this.cache.get(key)!
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }
    
    return entry.value
  }
  
  set(key: K, value: V): void {
    // Evict expired entries first
    this.evictExpired()
    
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    })
  }
  
  private evictExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }
  
  clear(): void {
    this.cache.clear()
  }
}

// Memoize function with custom key generator
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  cache?: LRUCache<string, ReturnType<T>>
): T {
  const memoCache = cache || new LRUCache<string, ReturnType<T>>(100)
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator 
      ? keyGenerator(...args) 
      : JSON.stringify(args)
    
    if (memoCache.has(key)) {
      return memoCache.get(key)!
    }
    
    const result = fn(...args)
    memoCache.set(key, result)
    return result
  }) as T
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delayMs)
  }
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limitMs)
    }
  }
}

// React hooks for memoization
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList,
  memoCache?: LRUCache<string, any>
): T {
  return useCallback(memoize(callback, undefined, memoCache), deps)
}

export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<T | null>(null)
  
  if (ref.current === null) {
    ref.current = factory()
  }
  
  useEffect(() => {
    ref.current = factory()
  }, deps)
  
  return ref.current as T
}

// Compute-heavy operation cache
const computationCache = new LRUCache<string, any>(50)

export function cachedComputation<T>(
  key: string,
  computation: () => T,
  deps: any[] = []
): T {
  const fullKey = `${key}:${JSON.stringify(deps)}`
  
  if (computationCache.has(fullKey)) {
    return computationCache.get(fullKey)!
  }
  
  const result = computation()
  computationCache.set(fullKey, result)
  return result
}

// Material cache for Three.js
export const materialCache = new LRUCache<string, any>(20)

// Geometry cache for Three.js
export const geometryCache = new LRUCache<string, any>(50)

// Texture cache for Three.js
export const textureCache = new TTLCache<string, any>(300000, 10) // 5 min TTL

// Export utilities
export default {
  LRUCache,
  TTLCache,
  memoize,
  debounce,
  throttle,
  useMemoizedCallback,
  useDeepMemo,
  cachedComputation,
  materialCache,
  geometryCache,
  textureCache
}
