/**
 * Accessibility Utilities
 * WCAG 2.1 AA compliant utilities for BIM Workbench
 */

// Skip to main content link
export const SkipToContent: React.FC<{ targetId?: string }> = ({ targetId = 'main-content' }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.tabIndex = -1;
      target.focus();
      target.removeAttribute('tabindex');
    }
  };

  return (
    <>
      <style>{`
        .skip-to-content {
          position: absolute;
          top: -40px;
          left: 0;
          background: #2196f3;
          color: white;
          padding: 8px 16px;
          z-index: 10000;
          text-decoration: none;
          font-weight: 600;
          border-radius: 0 0 4px 0;
          transition: top 0.2s;
        }
        .skip-to-content:focus {
          top: 0;
          outline: 3px solid #ff9800;
          outline-offset: -3px;
        }
      `}</style>
      <a
        href={'#' + targetId}
        className="skip-to-content"
        onClick={handleClick}
      >
        Skip to main content
      </a>
    </>
  );
};

// Live region for screen reader announcements
export class Announcer {
  private static instance: Announcer;
  private region: HTMLElement | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): Announcer {
    if (!Announcer.instance) {
      Announcer.instance = new Announcer();
    }
    return Announcer.instance;
  }

  private init() {
    if (typeof document === 'undefined') return;

    this.region = document.createElement('div');
    this.region.setAttribute('role', 'status');
    this.region.setAttribute('aria-live', 'polite');
    this.region.setAttribute('aria-atomic', 'true');
    this.region.className = 'sr-only';
    this.region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(this.region);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.region) return;

    this.region.setAttribute('aria-live', priority);
    this.region.textContent = '';

    // Use setTimeout to ensure screen readers pick up the change
    setTimeout(() => {
      if (this.region) {
        this.region.textContent = message;
      }
    }, 100);
  }
}

// Focus trap for modals
export const createFocusTrap = (container: HTMLElement) => {
  const focusableSelector = [
    'button',
    'a[href]',
    'input',
    'select',
    'textarea',
    '[tabindex]:not([tabindex="-1"])'
  ].join(', ');

  const getFocusableElements = () => {
    return container.querySelectorAll<HTMLElement>(focusableSelector);
  };

  const getFirstFocusable = () => {
    const elements = getFocusableElements();
    return elements[0] || null;
  };

  const getLastFocusable = () => {
    const elements = getFocusableElements();
    return elements[elements.length - 1] || null;
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === getFirstFocusable()) {
        event.preventDefault();
        getLastFocusable()?.focus();
      }
    } else {
      if (document.activeElement === getLastFocusable()) {
        event.preventDefault();
        getFirstFocusable()?.focus();
      }
    }
  };

  const activate = () => {
    document.addEventListener('keydown', handleKeyDown);
    getFirstFocusable()?.focus();
  };

  const deactivate = () => {
    document.removeEventListener('keydown', handleKeyDown);
  };

  return { activate, deactivate };
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  items: any[],
  onSelect: (index: number) => void,
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
  } = {}
) => {
  const { orientation = 'vertical', wrap = true } = options;
  const [focusedIndex, setFocusedIndex] = useState(0);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    let newIndex = focusedIndex;

    switch (event.key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = Math.min(focusedIndex + 1, items.length - 1);
          if (!wrap && newIndex === focusedIndex) return;
          if (wrap && newIndex >= items.length) newIndex = 0;
        }
        break;

      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault();
          newIndex = Math.max(focusedIndex - 1, 0);
          if (!wrap && newIndex === focusedIndex) return;
          if (wrap && newIndex < 0) newIndex = items.length - 1;
        }
        break;

      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = Math.min(focusedIndex + 1, items.length - 1);
          if (!wrap && newIndex === focusedIndex) return;
          if (wrap && newIndex >= items.length) newIndex = 0;
        }
        break;

      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault();
          newIndex = Math.max(focusedIndex - 1, 0);
          if (!wrap && newIndex === focusedIndex) return;
          if (wrap && newIndex < 0) newIndex = items.length - 1;
        }
        break;

      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        newIndex = items.length - 1;
        break;

      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(focusedIndex);
        return;

      default:
        return;
    }

    setFocusedIndex(newIndex);
  }, [focusedIndex, items, orientation, wrap, onSelect]);

  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    getItemProps: (index: number) => ({
      tabIndex: index === focusedIndex ? 0 : -1,
      'aria-selected': index === focusedIndex
    })
  };
};

// Color contrast checker (WCAG 2.1 AA requires 4.5:1 for normal text)
export const getContrastRatio = (color1: string, color2: string): number => {
  const getLuminance = (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;

    const toLinear = (c: number) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const meetsContrastRequirements = (
  fg: string,
  bg: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(fg, bg);

  if (size === 'large') {
    return level === 'AAA' ? ratio >= 4.5 : ratio >= 3;
  }

  return level === 'AAA' ? ratio >= 7 : ratio >= 4.5;
};

// Focus visible styles
export const getFocusVisibleStyles = (color: string = '#2196f3') => `
  &:focus-visible {
    outline: 2px solid ${color};
    outline-offset: 2px;
  }

  &:focus:not(:focus-visible) {
    outline: none;
  }
`;

// Reduced motion preference
export const useReducedMotion = (): boolean => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
};

// High contrast mode detection
export const useHighContrastMode = (): boolean => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(forced-colors: active)');
    setHighContrast(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return highContrast;
};

// Accessible form validation
export const getValidationMessage = (
  value: string,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  }
): string | null => {
  if (rules.required && !value.trim()) {
    return 'This field is required';
  }

  if (rules.minLength && value.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters`;
  }

  if (rules.pattern && !rules.pattern.test(value)) {
    return 'Invalid format';
  }

  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

import React, { useState, useEffect, useCallback } from 'react';

// Screen reader only content
export const VisuallyHidden: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="sr-only" style={{
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  }}>
    {children}
  </span>
);

export default {
  SkipToContent,
  Announcer,
  createFocusTrap,
  useKeyboardNavigation,
  getContrastRatio,
  meetsContrastRequirements,
  useReducedMotion,
  useHighContrastMode,
  getValidationMessage,
  VisuallyHidden
};
