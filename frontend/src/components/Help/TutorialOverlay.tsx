/**
 * Tutorial Overlay Component
 * Interactive in-app tour for new users
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TooltipHelp } from './TooltipHelp';

// Tour step definition
interface TourStep {
  target: string;
  title: string;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Pre-built tours
const NEW_USER_TOUR: TourStep[] = [
  {
    target: '[data-tour="toolbar"]',
    title: 'Welcome to BIM Workbench!',
    content: 'This toolbar contains all your drafting and modeling tools. Let\'s take a quick tour.',
    position: 'bottom'
  },
  {
    target: '[data-tour="line-tool"]',
    title: '2D Drafting Tools',
    content: 'Start with basic shapes like lines, rectangles, and circles for your floor plans.',
    position: 'bottom',
    action: {
      label: 'Next',
      onClick: () => {}
    }
  },
  {
    target: '[data-tour="wall-tool"]',
    title: '3D Modeling',
    content: 'Create walls, doors, and windows for your building model. All objects are BIM-compatible.',
    position: 'bottom'
  },
  {
    target: '[data-tour="canvas"]',
    title: 'Workspace',
    content: 'This is your drafting canvas. Click here to place objects. Use mouse wheel to zoom.',
    position: 'top'
  },
  {
    target: '[data-tour="hierarchy"]',
    title: 'Project Hierarchy',
    content: 'View and manage your project structure. Objects are organized by Site, Building, and Level.',
    position: 'left'
  },
  {
    target: '[data-tour="properties"]',
    title: 'Properties Panel',
    content: 'Edit selected object properties here. Change dimensions, materials, and more.',
    position: 'left'
  },
  {
    target: '[data-tour="shortcuts"]',
    title: 'Keyboard Shortcuts',
    content: 'Press ? to see all keyboard shortcuts. Speed up your workflow with these hotkeys.',
    position: 'left'
  }
];

const QUICK_TIPS: TourStep[] = [
  {
    target: '[data-tour="line-tool"]',
    title: 'Quick Tip: Lines',
    content: 'Hold Shift while drawing for orthogonal (straight) lines.',
    position: 'bottom'
  },
  {
    target: '[data-tour="select-tool"]',
    title: 'Quick Tip: Selection',
    content: 'Click to select, Shift+Click to add to selection. Drag to marquee select.',
    position: 'bottom'
  },
  {
    target: '[data-tour="undo"]',
    title: 'Quick Tip: Undo',
    content: 'Made a mistake? Press Ctrl+Z to undo. Ctrl+Y to redo.',
    position: 'bottom'
  }
];

interface TutorialOverlayProps {
  tour?: 'new-user' | 'quick-tips' | TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  autoShow?: boolean;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  tour = 'new-user',
  onComplete,
  onSkip,
  autoShow = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(autoShow);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Get tour steps
  const steps: TourStep[] = React.useMemo(() => {
    if (Array.isArray(tour)) {
      return tour;
    }
    switch (tour) {
      case 'new-user':
        return NEW_USER_TOUR;
      case 'quick-tips':
        return QUICK_TIPS;
      default:
        return NEW_USER_TOUR;
    }
  }, [tour]);

  // Check if user has seen tour before
  useEffect(() => {
    const seen = localStorage.getItem('bim-workbench-tour-seen');
    if (seen) {
      setHasSeenTour(true);
    }
  }, []);

  // Show tour on mount if autoShow and not seen
  useEffect(() => {
    if (autoShow && !hasSeenTour) {
      setIsVisible(true);
    }
  }, [autoShow, hasSeenTour]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isVisible) return;

      switch (event.key) {
        case 'ArrowRight':
        case 'Enter':
        case ' ':
          event.preventDefault();
          nextStep();
          break;
        case 'ArrowLeft':
          event.preventDefault();
          prevStep();
          break;
        case 'Escape':
          event.preventDefault();
          skipTour();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, currentStep]);

  // Focus management for accessibility
  useEffect(() => {
    if (isVisible) {
      const focusable = overlayRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }
  }, [isVisible, currentStep]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      completeTour();
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('bim-workbench-tour-seen', 'true');
    onSkip?.();
  }, [onSkip]);

  const completeTour = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('bim-workbench-tour-seen', 'true');
    onComplete?.();
  }, [onComplete]);

  // Don't render if not visible or tour already seen
  if (!isVisible || hasSeenTour) {
    return null;
  }

  const step = steps[currentStep];

  return (
    <div
      className="tutorial-overlay"
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-content"
    >
      {/* Backdrop */}
      <div className="tutorial-backdrop" />

      {/* Spotlight effect on target */}
      <div className="tutorial-spotlight" data-target={step.target} />

      {/* Tutorial card */}
      <div className={`tutorial-card tutorial-card-${step.position || 'bottom'}`}>
        <div className="tutorial-header">
          <span className="tutorial-progress">
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            className="tutorial-skip"
            onClick={skipTour}
            aria-label="Skip tutorial"
          >
            Skip Tour
          </button>
        </div>

        <div className="tutorial-body">
          <h2 id="tutorial-title">{step.title}</h2>
          <p id="tutorial-content">{step.content}</p>
        </div>

        <div className="tutorial-footer">
          <button
            className="tutorial-button tutorial-button-secondary"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            Previous
          </button>

          {step.action && (
            <button
              className="tutorial-button tutorial-button-action"
              onClick={step.action.onClick}
            >
              {step.action.label}
            </button>
          )}

          <button
            className="tutorial-button tutorial-button-primary"
            onClick={nextStep}
            autoFocus
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="tutorial-shortcuts">
          <span>Navigate:</span>
          <kbd>→</kbd>
          <kbd>Enter</kbd>
          <span>Next</span>
          <kbd>←</kbd>
          <span>Prev</span>
          <kbd>Esc</kbd>
          <span>Skip</span>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .tutorial-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          pointer-events: none;
        }

        .tutorial-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          pointer-events: auto;
          animation: tutorialFadeIn 0.3s ease-out;
        }

        @keyframes tutorialFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .tutorial-spotlight {
          position: absolute;
          border: 3px solid #2196f3;
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease-out;
          pointer-events: none;
        }

        .tutorial-card {
          position: absolute;
          width: 380px;
          max-width: 90vw;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          pointer-events: auto;
          animation: tutorialCardIn 0.3s ease-out;
        }

        @keyframes tutorialCardIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .tutorial-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .tutorial-progress {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .tutorial-skip {
          background: none;
          border: none;
          color: #666;
          font-size: 12px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .tutorial-skip:hover {
          background: #e0e0e0;
          color: #333;
        }

        .tutorial-body {
          padding: 20px 24px;
        }

        .tutorial-body h2 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .tutorial-body p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #555;
        }

        .tutorial-footer {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 24px;
          background: #fafafa;
          border-top: 1px solid #e0e0e0;
        }

        .tutorial-button {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .tutorial-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tutorial-button-primary {
          background: #2196f3;
          color: white;
          margin-left: auto;
        }

        .tutorial-button-primary:hover:not(:disabled) {
          background: #1976d2;
        }

        .tutorial-button-secondary {
          background: #e0e0e0;
          color: #333;
        }

        .tutorial-button-secondary:hover:not(:disabled) {
          background: #bdbdbd;
        }

        .tutorial-button-action {
          background: #4caf50;
          color: white;
        }

        .tutorial-button-action:hover:not(:disabled) {
          background: #388e3c;
        }

        .tutorial-shortcuts {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 24px;
          background: #f5f5f5;
          border-top: 1px solid #e0e0e0;
          font-size: 11px;
          color: #888;
        }

        .tutorial-shortcuts kbd {
          display: inline-block;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 10px;
          background: white;
          border: 1px solid #ddd;
          border-radius: 3px;
          box-shadow: 0 1px 0 #ccc;
        }

        /* Card positions */
        .tutorial-card-top {
          bottom: calc(100% + 20px);
          left: 50%;
          transform: translateX(-50%);
        }

        .tutorial-card-bottom {
          top: calc(100% + 20px);
          left: 50%;
          transform: translateX(-50%);
        }

        .tutorial-card-left {
          right: calc(100% + 20px);
          top: 50%;
          transform: translateY(-50%);
        }

        .tutorial-card-right {
          left: calc(100% + 20px);
          top: 50%;
          transform: translateY(-50%);
        }

        /* Reduce motion */
        @media (prefers-reduced-motion: reduce) {
          .tutorial-backdrop,
          .tutorial-card {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Hook for managing tutorial state
export const useTutorial = () => {
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [currentTour, setCurrentTour] = useState<'new-user' | 'quick-tips' | null>(null);

  const startTour = useCallback((tour: 'new-user' | 'quick-tips') => {
    setCurrentTour(tour);
    setIsTourVisible(true);
  }, []);

  const endTour = useCallback(() => {
    setIsTourVisible(false);
    setCurrentTour(null);
  }, []);

  const resetTourProgress = useCallback(() => {
    localStorage.removeItem('bim-workbench-tour-seen');
  }, []);

  return {
    isTourVisible,
    currentTour,
    startTour,
    endTour,
    resetTourProgress
  };
};

export default TutorialOverlay;
