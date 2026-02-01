import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'

// Increase timeout for async operations
vi.setConfig({
  testTimeout: 10000,
  asyncUtilTimeout: 5000
})

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  // Mock ResizeObserver
  class ResizeObserver {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  }
  Object.defineProperty(window, 'ResizeObserver', {
    writable: true,
    value: ResizeObserver
  })

  // Mock scrollTo
  window.scrollTo = vi.fn()
})

// Clean up after all tests
afterAll(() => {
  vi.clearAllMocks()
  vi.clearAllTimers()
})
