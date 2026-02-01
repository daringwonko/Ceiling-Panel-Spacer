/**
 * Contextual Help Component
 * Provides context-sensitive help for BIM Workbench features
 */

import React, { useState, useEffect, useRef } from 'react';
import { useBIMStore } from '../../stores/useBIMStore';

// Help content definitions
interface HelpContent {
  id: string;
  title: string;
  content: string | React.ReactNode;
  category: 'tool' | 'workflow' | 'shortcut' | 'concept';
}

const HELP_CONTENT: HelpContent[] = [
  {
    id: 'line-tool',
    title: 'Line Tool',
    category: 'tool',
    content: (
      <div>
        <p>The Line tool creates 2D line segments for drafting.</p>
        <h4>Usage:</h4>
        <ol>
          <li>Click to set the start point</li>
          <li>Click to set the end point</li>
          <li>Press <kbd>Escape</kbd> to cancel</li>
        </ol>
        <h4>Tips:</h4>
        <ul>
          <li>Hold <kbd>Shift</kbd> for orthogonal (horizontal/vertical) lines</li>
          <li>Press <kbd>Ctrl+Z</kbd> to undo</li>
        </ul>
      </div>
    )
  },
  {
    id: 'wall-tool',
    title: 'Wall Tool',
    category: 'tool',
    content: (
      <div>
        <p>The Wall tool creates 3D BIM wall objects.</p>
        <h4>Usage:</h4>
        <ol>
          <li>Switch to 3D Modeling category</li>
          <li>Select Wall tool</li>
          <li>Click start point on the working plane</li>
          <li>Click end point</li>
          <li>Set height in the properties panel</li>
        </ol>
      </div>
    )
  },
  {
    id: 'select-tool',
    title: 'Selection Tool',
    category: 'tool',
    content: (
      <div>
        <p>Select and manipulate objects in the workspace.</p>
        <h4>Actions:</h4>
        <ul>
          <li><strong>Click:</strong> Select single object</li>
          <li><strong>Shift+Click:</strong> Add to selection</li>
          <li><strong>Drag:</strong> Marquee selection</li>
          <li><strong>Delete:</strong> Remove selected objects</li>
        </ul>
      </div>
    )
  },
  {
    id: 'working-plane',
    title: 'Working Planes',
    category: 'concept',
    content: (
      <div>
        <p>Working planes define where objects are created in 3D space.</p>
        <h4>Available Planes:</h4>
        <ul>
          <li><strong>Top (XY):</strong> Ground plane, used for floor objects</li>
          <li><strong>Front (XZ):</strong> Vertical plane, used for walls</li>
          <li><strong>Side (YZ):</strong> Side elevation plane</li>
          <li><strong>Custom:</strong> Arbitrary plane for complex layouts</li>
        </ul>
        <p>Switch planes using the Working Plane System in the 3D toolbar.</p>
      </div>
    )
  },
  {
    id: 'hierarchy',
    title: 'Project Hierarchy',
    category: 'concept',
    content: (
      <div>
        <p>The project hierarchy organizes your BIM model:</p>
        <ul>
          <li><strong>Site:</strong> Top-level container with geographic data</li>
          <li><strong>Building:</strong> Contains levels, auto-calculates bounds</li>
          <li><strong>Level:</strong> Floor/elevation level with objects</li>
          <li><strong>Objects:</strong> Walls, doors, windows, etc.</li>
        </ul>
        <p>Drag objects between levels to reorganize. Right-click for context menu.</p>
      </div>
    )
  },
  {
    id: 'undo-redo',
    title: 'Undo & Redo',
    category: 'workflow',
    content: (
      <div>
        <p>All actions can be undone and redone.</p>
        <h4>Shortcuts:</h4>
        <ul>
          <li><kbd>Ctrl+Z</kbd> - Undo last action</li>
          <li><kbd>Ctrl+Y</kbd> - Redo undone action</li>
          <li><kbd>Ctrl+Shift+Z</kbd> - Redo (alternative)</li>
        </ul>
      </div>
    )
  }
];

interface ContextualHelpProps {
  targetId?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  targetId,
  position = 'bottom',
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHelp, setActiveHelp] = useState<HelpContent | null>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const { showHelp, setShowHelp, currentHelpId } = useBIMStore();

  // Get help content based on current context
  useEffect(() => {
    if (targetId) {
      const help = HELP_CONTENT.find(h => h.id === targetId);
      setActiveHelp(help || null);
    } else if (currentHelpId) {
      const help = HELP_CONTENT.find(h => h.id === currentHelpId);
      setActiveHelp(help || null);
    }
  }, [targetId, currentHelpId]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1') {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPositionStyle = (): React.CSSProperties => {
    switch (position) {
      case 'top':
        return { bottom: '100%', marginBottom: '8px' };
      case 'bottom':
        return { top: '100%', marginTop: '8px' };
      case 'left':
        return { right: '100%', marginRight: '8px' };
      case 'right':
        return { left: '100%', marginLeft: '8px' };
      default:
        return {};
    }
  };

  return (
    <div className="contextual-help" ref={helpRef}>
      {/* Trigger element */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="help-trigger"
        aria-label="Help"
        role="button"
        tabIndex={0}
      >
        {children || (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )}
      </div>

      {/* Help panel */}
      {isOpen && activeHelp && (
        <div
          className={`help-panel help-panel-${position}`}
          style={getPositionStyle()}
          role="tooltip"
          aria-live="polite"
        >
          <div className="help-header">
            <h3>{activeHelp.title}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="help-close"
              aria-label="Close help"
            >
              ×
            </button>
          </div>
          <div className="help-content">{activeHelp.content}</div>
          <div className="help-footer">
            <span className="help-category">{activeHelp.category}</span>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        .contextual-help {
          position: relative;
          display: inline-block;
        }

        .help-trigger {
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .help-trigger:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .help-panel {
          position: absolute;
          width: 320px;
          max-width: 90vw;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          overflow: hidden;
          animation: helpFadeIn 0.2s ease-out;
        }

        @keyframes helpFadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .help-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .help-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .help-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #666;
          padding: 0;
          line-height: 1;
        }

        .help-close:hover {
          color: #333;
        }

        .help-content {
          padding: 16px;
          font-size: 13px;
          line-height: 1.5;
          color: #555;
          max-height: 400px;
          overflow-y: auto;
        }

        .help-content h4 {
          margin: 12px 0 6px;
          font-size: 12px;
          font-weight: 600;
          color: #333;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .help-content h4:first-child {
          margin-top: 0;
        }

        .help-content ol,
        .help-content ul {
          margin: 0;
          padding-left: 20px;
        }

        .help-content li {
          margin-bottom: 4px;
        }

        .help-content kbd {
          display: inline-block;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 12px;
          background: #f0f0f0;
          border: 1px solid #ccc;
          border-radius: 3px;
          box-shadow: 0 1px 0 #ccc;
        }

        .help-footer {
          padding: 8px 16px;
          background: #fafafa;
          border-top: 1px solid #e0e0e0;
        }

        .help-category {
          font-size: 11px;
          color: #888;
          text-transform: capitalize;
        }

        .help-panel-top,
        .help-panel-bottom {
          left: 50%;
          transform: translateX(-50%);
        }

        .help-panel-top {
          bottom: 100%;
        }

        .help-panel-bottom {
          top: 100%;
        }
      `}</style>
    </div>
  );
};

export default ContextualHelp;
