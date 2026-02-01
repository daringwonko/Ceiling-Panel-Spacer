/**
 * Responsive Design System & Touch Gesture Support
 * Provides cross-platform responsive design for tablets/mobile contractors
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Breakpoint constants
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280
};

// Device type detection
export const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'desktop';
};

// Responsive hook
export const useResponsive = () => {
  const [deviceType, setDeviceType] = useState(getDeviceType());
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDeviceType(getDeviceType());
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { deviceType, dimensions, isMobile: deviceType === 'mobile', isTablet: deviceType === 'tablet' };
};

// Touch gesture types
export const GESTURES = {
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
  LONG_PRESS: 'long_press',
  SWIPE_LEFT: 'swipe_left',
  SWIPE_RIGHT: 'swipe_right',
  SWIPE_UP: 'swipe_up',
  SWIPE_DOWN: 'swipe_down',
  PINCH: 'pinch',
  ROTATE: 'rotate'
};

// Touch gesture hook
export const useTouchGestures = (elementRef, options = {}) => {
  const {
    onTap,
    onDoubleTap,
    onLongPress,
    onSwipe,
    onPinch,
    onRotate,
    longPressDuration = 500,
    swipeThreshold = 50,
    pinchThreshold = 0.1
  } = options;

  const touchStartRef = useRef(null);
  const gestureStartRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const lastTapRef = useRef(0);

  const getTouchDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1, touch2) => ({
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2
  });

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
      gestureStartRef.current = { distance: 0, rotation: 0 };

      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (touchStartRef.current) {
          onLongPress?.(touchStartRef.current);
          touchStartRef.current = null;
        }
      }, longPressDuration);
    } else if (e.touches.length === 2) {
      // Cancel long press on multi-touch
      clearTimeout(longPressTimerRef.current);
      
      gestureStartRef.current = {
        distance: getTouchDistance(e.touches[0], e.touches[1]),
        center: getTouchCenter(e.touches[0], e.touches[1]),
        rotation: 0
      };
    }
  }, [longPressDuration, onLongPress]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && gestureStartRef.current) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const distanceRatio = currentDistance / gestureStartRef.current.distance;
      
      if (Math.abs(distanceRatio - 1) > pinchThreshold) {
        onPinch?.({
          scale: distanceRatio,
          center: getTouchCenter(e.touches[0], e.touches[1])
        });
        gestureStartRef.current.distance = currentDistance;
      }
    }
  }, [pinchThreshold, onPinch]);

  const handleTouchEnd = useCallback((e) => {
    clearTimeout(longPressTimerRef.current);

    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check for tap
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        onDoubleTap?.({ x: touch.clientX, y: touch.clientY });
        lastTapRef.current = 0;
      } else {
        onTap?.({ x: touch.clientX, y: touch.clientY });
        lastTapRef.current = now;
      }
      touchStartRef.current = null;
      return;
    }

    // Check for swipe
    if (deltaTime < 300 && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        onSwipe?.(GESTURES.SWIPE_RIGHT, { deltaX, deltaY });
      } else {
        onSwipe?.(GESTURES.SWIPE_LEFT, { deltaX, deltaY });
      }
    } else if (deltaTime < 300 && Math.abs(deltaY) > swipeThreshold) {
      if (deltaY > 0) {
        onSwipe?.(GESTURES.SWIPE_DOWN, { deltaX, deltaY });
      } else {
        onSwipe?.(GESTURES.SWIPE_UP, { deltaX, deltaY });
      }
    }

    touchStartRef.current = null;
  }, [swipeThreshold, onTap, onDoubleTap, onSwipe]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);
};

// Touch-friendly button hook
export const useTouchFeedback = (elementRef) => {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = () => setIsPressed(true);
    const handleTouchEnd = () => setIsPressed(false);
    const handleTouchCancel = () => setIsPressed(false);

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [elementRef]);

  return { isPressed, setIsPressed };
};

// Responsive class names helper
export const responsive = {
  // Container classes
  container: {
    mobile: 'max-w-full px-4',
    tablet: 'max-w-[720px] px-6',
    desktop: 'max-w-[960px] px-8'
  },
  
  // Grid columns
  grid: {
    mobile: 'grid-cols-1',
    tablet: 'grid-cols-2',
    desktop: 'grid-cols-3'
  },
  
  // Spacing
  spacing: {
    mobile: 'gap-3',
    tablet: 'gap-4',
    desktop: 'gap-6'
  }
};

// Touch target size utility (minimum 44px for accessibility)
export const touchTarget = {
  minSize: 'min-h-[44px] min-w-[44px]',
  padding: 'p-3',
  optimized: 'p-4'
};

// Orientation utilities
export const useOrientation = () => {
  const [orientation, setOrientation] = useState(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { orientation, isLandscape: orientation === 'landscape', isPortrait: orientation === 'portrait' };
};
