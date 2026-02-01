/**
 * Tooltip Help Component
 * Accessible tooltip with help information for UI elements
 */

import React, { useState, useRef, useEffect } from 'react';

interface TooltipHelpProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  showArrow?: boolean;
  maxWidth?: number;
}

export const TooltipHelp: React.FC<TooltipHelpProps> = ({
  content,
  children,
  position = 'top',
  delay = 200,
  showArrow = true,
  maxWidth = 250
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    showTooltip();
  };

  const handleBlur = () => {
    setIsFocused(false);
    hideTooltip();
  };

  const handleMouseEnter = () => {
    showTooltip();
  };

  const handleMouseLeave = () => {
    hideTooltip();
  };

  // Handle keyboard escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  const getPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' };
      default:
        return {};
    }
  };

  const getArrowStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { bottom: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
      case 'bottom':
        return { top: '-6px', left: '50%', transform: 'translateX(-50%) rotate(45deg)' };
      case 'left':
        return { right: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
      case 'right':
        return { left: '-6px', top: '50%', transform: 'translateY(-50%) rotate(45deg)' };
      default:
        return {};
    }
  };

  return (
    <div
      className="tooltip-help-container"
      ref={tooltipRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger element */}
      <div
        className="tooltip-trigger"
        onFocus={handleFocus}
        onBlur={handleBlur}
        aria-describedby="tooltip"
        tabIndex={0}
      >
        {children}
      </div>

      {/* Tooltip */}
      {isVisible && (
        <div
          className={`tooltip-help tooltip-help-${position}`}
          style={getPositionStyle()}
          role="tooltip"
          id="tooltip"
          aria-live="polite"
        >
          <div
            className="tooltip-content"
            style={{ maxWidth }}
          >
            {content}
          </div>
          {showArrow && (
            <div
              className="tooltip-arrow"
              style={getArrowStyle()}
            />
          )}
        </div>
      )}

      {/* Styles */}
      <style>{`
        .tooltip-help-container {
          position: relative;
          display: inline-block;
        }

        .tooltip-trigger {
          display: inline-block;
          cursor: help;
        }

        .tooltip-trigger:focus {
          outline: 2px solid #2196f3;
          outline-offset: 2px;
          border-radius: 2px;
        }

        .tooltip-help {
          position: absolute;
          z-index: 1000;
          animation: tooltipFade 0.15s ease-out;
        }

        @keyframes tooltipFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .tooltip-content {
          padding: 8px 12px;
          background: #333;
          color: white;
          font-size: 13px;
          line-height: 1.4;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .tooltip-arrow {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #333;
          transform: rotate(45deg);
        }

        .tooltip-help-top .tooltip-arrow {
          bottom: -6px;
        }

        .tooltip-help-bottom .tooltip-arrow {
          top: -6px;
        }

        .tooltip-help-left .tooltip-arrow {
          right: -6px;
        }

        .tooltip-help-right .tooltip-arrow {
          left: -6px;
        }

        /* Reduce motion preference */
        @media (prefers-reduced-motion: reduce) {
          .tooltip-help {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Pre-built tooltips for common BIM Workbench actions
export const TooltipHelpItems = {
  line: {
    content: 'Draw 2D line segments. Click start and end points.',
    shortcut: 'L'
  },
  rectangle: {
    content: 'Draw rectangular shapes. Click corner points.',
    shortcut: 'R'
  },
  circle: {
    content: 'Draw circles. Click center, then edge point.',
    shortcut: 'C'
  },
  wall: {
    content: 'Create 3D wall objects with height and thickness.',
    shortcut: 'W'
  },
  door: {
    content: 'Place door openings in walls.',
    shortcut: 'D'
  },
  window: {
    content: 'Place window openings in walls.',
    shortcut: 'N'
  },
  select: {
    content: 'Select and manipulate objects.',
    shortcut: 'S'
  },
  move: {
    content: 'Move selected objects.',
    shortcut: 'M'
  },
  rotate: {
    content: 'Rotate selected objects.',
    shortcut: 'O'
  },
  scale: {
    content: 'Scale selected objects.',
    shortcut: 'SC'
  },
  undo: {
    content: 'Undo last action.',
    shortcut: 'Ctrl+Z'
  },
  redo: {
    content: 'Redo last undone action.',
    shortcut: 'Ctrl+Y'
  },
  save: {
    content: 'Save current project.',
    shortcut: 'Ctrl+S'
  },
  delete: {
    content: 'Delete selected objects.',
    shortcut: 'Delete'
  },
  escape: {
    content: 'Cancel current operation.',
    shortcut: 'Esc'
  }
};

export default TooltipHelp;
