/**
 * PWA Infrastructure Module Index
 * Exports all offline-first PWA functionality
 */

// Service Worker
export { registerServiceWorker, unregisterServiceWorker } from './serviceWorkerRegistration';

// Local File System
export { localFileSystem, useLocalFileSystem } from './localFileSystem';

// Offline Calculator
export {
  offlineCalculator,
  OfflineCalculator,
  Dimensions,
  Gap,
  Material,
  LayoutResult
} from './offlineCalculator';

// Responsive Design & Touch Gestures
export {
  useResponsive,
  useOrientation,
  useTouchGestures,
  useTouchFeedback,
  responsive,
  touchTarget,
  BREAKPOINTS,
  GESTURES
} from './responsive';
