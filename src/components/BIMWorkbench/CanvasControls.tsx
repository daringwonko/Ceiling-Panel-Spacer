/**
 * CanvasControls Component
 * 
 * Provides zoom, fit, and view control buttons for the canvas.
 * Vertical toolbar positioned at top-right with tooltips.
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Home,
  Grid3X3,
  Magnet,
} from 'lucide-react';

interface CanvasControlsProps {
  /** Zoom in handler */
  onZoomIn: () => void;
  /** Zoom out handler */
  onZoomOut: () => void;
  /** Fit to view handler */
  onFitToView: () => void;
  /** Reset view handler */
  onResetView: () => void;
  /** Toggle grid visibility */
  onToggleGrid: () => void;
  /** Toggle snap enabled */
  onToggleSnap: () => void;
  /** Current grid visibility state */
  gridVisible: boolean;
  /** Current snap enabled state */
  snapEnabled: boolean;
  /** Current zoom percentage */
  zoom: number;
}

/**
 * CanvasControls provides navigation and view control buttons
 */
export const CanvasControls: React.FC<CanvasControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitToView,
  onResetView,
  onToggleGrid,
  onToggleSnap,
  gridVisible,
  snapEnabled,
  zoom,
}) => {
  /**
   * Format zoom as percentage
   */
  const zoomPercent = Math.round(zoom * 100);

  /**
   * Control button component
   */
  const ControlButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    isActive?: boolean;
  }> = ({ onClick, icon, label, shortcut, isActive = false }) => (
    <button
      onClick={onClick}
      aria-label={label}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? 'rgba(79, 195, 247, 0.2)' : 'transparent',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        color: isActive ? '#4fc3f7' : '#ccc',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = isActive
          ? 'rgba(79, 195, 247, 0.3)'
          : 'rgba(255, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = isActive
          ? 'rgba(79, 195, 247, 0.2)'
          : 'transparent';
      }}
    >
      {icon}
    </button>
  );

  return (
    <div
      className="canvas-controls"
      style={{
        position: 'absolute',
        top: '12px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(100, 100, 100, 0.5)',
        borderRadius: '6px',
        padding: '6px',
        zIndex: 100,
      }}
    >
      {/* Zoom Controls */}
      <ControlButton
        onClick={onZoomIn}
        icon={<ZoomIn size={18} />}
        label="Zoom In"
        shortcut="+"
      />
      <ControlButton
        onClick={onZoomOut}
        icon={<ZoomOut size={18} />}
        label="Zoom Out"
        shortcut="-"
      />

      {/* Separator */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(100, 100, 100, 0.5)',
          margin: '4px 0',
        }}
      />

      {/* View Controls */}
      <ControlButton
        onClick={onFitToView}
        icon={<Maximize size={18} />}
        label="Fit to View"
        shortcut="F"
      />
      <ControlButton
        onClick={onResetView}
        icon={<Home size={18} />}
        label="Reset View"
        shortcut="Home"
      />

      {/* Separator */}
      <div
        style={{
          height: '1px',
          backgroundColor: 'rgba(100, 100, 100, 0.5)',
          margin: '4px 0',
        }}
      />

      {/* Toggle Controls */}
      <ControlButton
        onClick={onToggleGrid}
        icon={<Grid3X3 size={18} />}
        label="Toggle Grid"
        shortcut="G"
        isActive={gridVisible}
      />
      <ControlButton
        onClick={onToggleSnap}
        icon={<Magnet size={18} />}
        label="Toggle Snap"
        shortcut="S"
        isActive={snapEnabled}
      />

      {/* Zoom Percentage */}
      <div
        style={{
          textAlign: 'center',
          paddingTop: '4px',
          marginTop: '4px',
          borderTop: '1px solid rgba(100, 100, 100, 0.5)',
          fontSize: '11px',
          color: '#888',
          fontFamily: 'monospace',
        }}
      >
        {zoomPercent}%
      </div>
    </div>
  );
};

export default CanvasControls;
