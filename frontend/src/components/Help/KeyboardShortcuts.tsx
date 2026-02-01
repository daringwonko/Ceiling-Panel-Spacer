/**
 * Keyboard Shortcut Reference Panel
 * Displays all available keyboard shortcuts with search functionality
 */

import React, { useState, useMemo } from 'react';

interface KeyboardShortcut {
  key: string;
  modifiers?: string[];
  action: string;
  category: string;
  description?: string;
}

const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // File Operations
  { key: 'N', modifiers: ['Ctrl'], action: 'New Project', category: 'File' },
  { key: 'O', modifiers: ['Ctrl'], action: 'Open Project', category: 'File' },
  { key: 'S', modifiers: ['Ctrl'], action: 'Save Project', category: 'File' },
  { key: 'S', modifiers: ['Ctrl', 'Shift'], action: 'Save As', category: 'File' },
  { key: 'E', modifiers: ['Ctrl'], action: 'Export', category: 'File' },
  { key: 'P', modifiers: ['Ctrl'], action: 'Print', category: 'File' },

  // Editing
  { key: 'Z', modifiers: ['Ctrl'], action: 'Undo', category: 'Edit', description: 'Undo last action' },
  { key: 'Y', modifiers: ['Ctrl'], action: 'Redo', category: 'Edit', description: 'Redo last undone action' },
  { key: 'Z', modifiers: ['Ctrl', 'Shift'], action: 'Redo (Alt)', category: 'Edit' },
  { key: 'C', modifiers: ['Ctrl'], action: 'Copy', category: 'Edit' },
  { key: 'V', modifiers: ['Ctrl'], action: 'Paste', category: 'Edit' },
  { key: 'X', modifiers: ['Ctrl'], action: 'Cut', category: 'Edit' },
  { key: 'D', modifiers: ['Ctrl'], action: 'Duplicate', category: 'Edit' },
  { key: 'Delete', modifiers: [], action: 'Delete', category: 'Edit', description: 'Delete selected objects' },
  { key: 'Backspace', modifiers: [], action: 'Delete', category: 'Edit' },
  { key: 'A', modifiers: ['Ctrl'], action: 'Select All', category: 'Edit' },
  { key: 'A', modifiers: ['Ctrl', 'Shift'], action: 'Deselect All', category: 'Edit' },

  // 2D Drafting Tools
  { key: 'L', modifiers: [], action: 'Line Tool', category: '2D Tools', description: 'Draw line segments' },
  { key: 'R', modifiers: [], action: 'Rectangle Tool', category: '2D Tools', description: 'Draw rectangles' },
  { key: 'C', modifiers: [], action: 'Circle Tool', category: '2D Tools', description: 'Draw circles' },
  { key: 'A', modifiers: [], action: 'Arc Tool', category: '2D Tools', description: 'Draw arcs' },
  { key: 'P', modifiers: [], action: 'Polyline Tool', category: '2D Tools', description: 'Draw polylines' },
  { key: 'G', modifiers: [], action: 'Polygon Tool', category: '2D Tools', description: 'Draw polygons' },
  { key: 'E', modifiers: [], action: 'Ellipse Tool', category: '2D Tools', description: 'Draw ellipses' },

  // 3D Modeling Tools
  { key: 'W', modifiers: [], action: 'Wall Tool', category: '3D Tools', description: 'Create 3D walls' },
  { key: 'F', modifiers: [], action: 'Floor Tool', category: '3D Tools', description: 'Create floor slabs' },
  { key: 'O', modifiers: [], action: 'Door Tool', category: '3D Tools', description: 'Place doors' },
  { key: 'N', modifiers: [], action: 'Window Tool', category: '3D Tools', description: 'Place windows' },
  { key: 'B', modifiers: [], action: 'Column Tool', category: '3D Tools', description: 'Add structural columns' },
  { key: 'M', modifiers: [], action: 'Beam Tool', category: '3D Tools', description: 'Add structural beams' },

  // Selection & Manipulation
  { key: 'S', modifiers: [], action: 'Select Tool', category: 'Selection', description: 'Select and manipulate objects' },
  { key: 'M', modifiers: [], action: 'Move Tool', category: 'Manipulation', description: 'Move selected objects' },
  { key: 'O', modifiers: [], action: 'Rotate Tool', category: 'Manipulation', description: 'Rotate selected objects' },
  { key: 'R', modifiers: [], action: 'Scale Tool', category: 'Manipulation', description: 'Scale selected objects' },
  { key: 'F', modifiers: [], action: 'Mirror Tool', category: 'Manipulation', description: 'Mirror selected objects' },
  { key: 'T', modifiers: [], action: 'Trim/Extend Tool', category: 'Manipulation', description: 'Trim or extend objects' },
  { key: 'I', modifiers: [], action: 'Offset Tool', category: 'Manipulation', description: 'Create parallel copies' },

  // Snapping & Precision
  { key: 'Shift', modifiers: [], action: 'Snap Toggle', category: 'Snapping', description: 'Toggle snap mode' },
  { key: 'Alt', modifiers: [], action: 'Ortho Mode', category: 'Snapping', description: 'Force orthogonal movement' },
  { key: 'Ctrl', modifiers: [], action: 'Precise Input', category: 'Snapping', description: 'Enable precise coordinate input' },

  // View Controls
  { key: '+', modifiers: [], action: 'Zoom In', category: 'View' },
  { key: '-', modifiers: [], action: 'Zoom Out', category: 'View' },
  { key: '0', modifiers: [], action: 'Zoom to Fit', category: 'View' },
  { key: '1', modifiers: [], action: 'Zoom to Selection', category: 'View' },
  { key: 'F', modifiers: [], action: 'Fit View', category: 'View' },
  { key: 'H', modifiers: [], action: 'Pan View', category: 'View', description: 'Hold to pan' },

  // 3D Navigation
  { key: '2', modifiers: [], action: 'Top View', category: '3D View', description: 'XY plane (plan view)' },
  { key: '3', modifiers: [], action: 'Front View', category: '3D View', description: 'XZ plane (elevation)' },
  { key: '4', modifiers: [], action: 'Side View', category: '3D View', description: 'YZ plane (elevation)' },
  { key: '5', modifiers: [], action: 'Perspective View', category: '3D View', description: '3D perspective' },
  { key: '7', modifiers: [], action: 'ISO View', category: '3D View', description: 'Isometric view' },

  // Working Planes
  { key: 'Q', modifiers: [], action: 'Top Plane', category: 'Working Plane' },
  { key: 'W', modifiers: [], action: 'Front Plane', category: 'Working Plane' },
  { key: 'E', modifiers: [], action: 'Side Plane', category: 'Working Plane' },
  { key: 'R', modifiers: [], action: 'Rotate Plane', category: 'Working Plane' },

  // Interface
  { key: '?', modifiers: [], action: 'Show Shortcuts', category: 'Interface', description: 'Toggle shortcut reference panel' },
  { key: '/', modifiers: [], action: 'Quick Help', category: 'Interface', description: 'Show context-sensitive help' },
  { key: 'F1', modifiers: [], action: 'Help', category: 'Interface', description: 'Open help documentation' },
  { key: 'Escape', modifiers: [], action: 'Cancel', category: 'Interface', description: 'Cancel current operation' },
  { key: 'Enter', modifiers: [], action: 'Confirm', category: 'Interface', description: 'Confirm current operation' },
  { key: 'Tab', modifiers: [], action: 'Next Tool', category: 'Interface', description: 'Cycle through tools' },
  { key: 'Tab', modifiers: ['Shift'], action: 'Previous Tool', category: 'Interface', description: 'Cycle through tools backward' },

  // Panels
  { key: 'F2', modifiers: [], action: 'Properties Panel', category: 'Interface' },
  { key: 'F3', modifiers: [], action: 'Hierarchy Panel', category: 'Interface' },
  { key: 'F4', modifiers: [], action: 'Materials Panel', category: 'Interface' },
  { key: 'F5', modifiers: [], action: 'Layers Panel', category: 'Interface' },
  { key: 'F6', modifiers: [], action: 'Views Panel', category: 'Interface' },

  // Clipboard for Views
  { key: 'C', modifiers: ['Ctrl', 'Shift'], action: 'Copy View', category: 'View', description: 'Copy current view to clipboard' },
  { key: 'V', modifiers: ['Ctrl', 'Shift'], action: 'Paste View', category: 'View', description: 'Paste view from clipboard' },

  // Annotations
  { key: 'D', modifiers: [], action: 'Dimension Tool', category: 'Annotations', description: 'Add dimensions' },
  { key: 'T', modifiers: [], action: 'Text Tool', category: 'Annotations', description: 'Add text annotations' },
  { key: 'L', modifiers: [], action: 'Leader Tool', category: 'Annotations', description: 'Add leader lines' },
];

const CATEGORIES = ['File', 'Edit', '2D Tools', '3D Tools', 'Selection', 'Manipulation', 'Snapping', 'View', '3D View', 'Working Plane', 'Interface', 'Annotations'];

interface KeyboardShortcutPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutPanel: React.FC<KeyboardShortcutPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter shortcuts based on search and category
  const filteredShortcuts = useMemo(() => {
    return KEYBOARD_SHORTCUTS.filter(shortcut => {
      const matchesSearch = searchQuery === '' ||
        shortcut.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shortcut.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shortcut.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === null ||
        shortcut.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Group by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};

    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });

    return groups;
  }, [filteredShortcuts]);

  if (!isOpen) return null;

  return (
    <div
      className="shortcut-panel-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-panel-title"
    >
      <div
        className="shortcut-panel"
        onClick={e => e.stopPropagation()}
      >
        <div className="shortcut-header">
          <h2 id="shortcut-panel-title">Keyboard Shortcuts</h2>
          <button
            className="shortcut-close"
            onClick={onClose}
            aria-label="Close shortcuts panel"
          >
            ×
          </button>
        </div>

        <div className="shortcut-search">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="shortcut-search-input"
            aria-label="Search keyboard shortcuts"
          />
        </div>

        <div className="shortcut-categories">
          <button
            className={`category-pill ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            All
          </button>
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="shortcut-list" role="list">
          {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
            <div key={category} className="shortcut-group">
              <h3 className="shortcut-group-title">{category}</h3>
              <div className="shortcut-items">
                {shortcuts.map((shortcut, index) => (
                  <div key={`${category}-${index}`} className="shortcut-item">
                    <div className="shortcut-keys">
                      {shortcut.modifiers?.map(mod => (
                        <kbd key={mod}>{mod}</kbd>
                      ))}
                      <kbd>{shortcut.key}</kbd>
                    </div>
                    <div className="shortcut-action">
                      <span className="shortcut-action-name">{shortcut.action}</span>
                      {shortcut.description && (
                        <span className="shortcut-action-desc">{shortcut.description}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcut-footer">
          <p>Press <kbd>?</kbd> to toggle this panel</p>
        </div>
      </div>

      <style>{`
        .shortcut-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: shortcutFadeIn 0.2s ease-out;
        }

        @keyframes shortcutFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .shortcut-panel {
          width: 700px;
          max-width: 95vw;
          max-height: 85vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: shortcutSlideIn 0.3s ease-out;
        }

        @keyframes shortcutSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .shortcut-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #2196f3;
          color: white;
        }

        .shortcut-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }

        .shortcut-close {
          background: none;
          border: none;
          color: white;
          font-size: 28px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          opacity: 0.8;
          transition: opacity 0.2s;
        }

        .shortcut-close:hover {
          opacity: 1;
        }

        .shortcut-search {
          padding: 16px 24px;
          border-bottom: 1px solid #e0e0e0;
        }

        .shortcut-search-input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .shortcut-search-input:focus {
          outline: none;
          border-color: #2196f3;
        }

        .shortcut-categories {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 24px;
          border-bottom: 1px solid #e0e0e0;
          background: #fafafa;
        }

        .category-pill {
          padding: 6px 12px;
          border: 1px solid #ddd;
          border-radius: 20px;
          background: white;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .category-pill:hover {
          background: #f0f0f0;
        }

        .category-pill.active {
          background: #2196f3;
          color: white;
          border-color: #2196f3;
        }

        .shortcut-list {
          flex: 1;
          overflow-y: auto;
          padding: 16px 24px;
        }

        .shortcut-group {
          margin-bottom: 24px;
        }

        .shortcut-group-title {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .shortcut-items {
          display: grid;
          gap: 8px;
        }

        .shortcut-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #f8f8f8;
          border-radius: 6px;
          transition: background 0.2s;
        }

        .shortcut-item:hover {
          background: #f0f0f0;
        }

        .shortcut-keys {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .shortcut-keys kbd {
          display: inline-block;
          padding: 4px 8px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          font-weight: 500;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 1px 0 #bbb;
          min-width: 28px;
          text-align: center;
        }

        .shortcut-action {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-left: 16px;
        }

        .shortcut-action-name {
          font-size: 13px;
          font-weight: 500;
          color: #333;
        }

        .shortcut-action-desc {
          font-size: 11px;
          color: #888;
          margin-top: 2px;
        }

        .shortcut-footer {
          padding: 12px 24px;
          background: #f5f5f5;
          border-top: 1px solid #e0e0e0;
          text-align: center;
        }

        .shortcut-footer p {
          margin: 0;
          font-size: 12px;
          color: #666;
        }

        .shortcut-footer kbd {
          display: inline-block;
          padding: 2px 6px;
          font-family: monospace;
          font-size: 11px;
          background: white;
          border: 1px solid #ccc;
          border-radius: 3px;
          box-shadow: 0 1px 0 #ccc;
        }

        /* Reduce motion */
        @media (prefers-reduced-motion: reduce) {
          .shortcut-panel-overlay,
          .shortcut-panel {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Keyboard shortcut hook
export const useKeyboardShortcuts = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useState(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.target?.matches('input, textarea')) {
        event.preventDefault();
        setShowShortcuts(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return { showShortcuts, setShowShortcuts };
};

export default KeyboardShortcutPanel;
