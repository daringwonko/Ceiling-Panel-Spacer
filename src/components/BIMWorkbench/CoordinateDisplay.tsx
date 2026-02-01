/**
 * CoordinateDisplay Component
 * 
 * Displays mouse position coordinates and distance measurements.
 * Positioned at bottom-left of canvas with real-time updates.
 */

import React, { useMemo } from 'react';
import type { Point2D } from '../../types/drafting';

interface CoordinateDisplayProps {
  /** Mouse position in screen coordinates */
  mousePosition: Point2D;
  /** Mouse position in world coordinates (mm) */
  worldPosition: Point2D;
  /** Whether distance mode is active */
  isDistanceMode?: boolean;
  /** Starting point for distance calculation */
  distanceStart?: Point2D | null;
}

/**
 * CoordinateDisplay shows current mouse position and distance measurements
 */
export const CoordinateDisplay: React.FC<CoordinateDisplayProps> = ({
  mousePosition,
  worldPosition,
  isDistanceMode = false,
  distanceStart = null,
}) => {
  /**
   * Calculate distance measurements
   */
  const distanceInfo = useMemo(() => {
    if (!isDistanceMode || !distanceStart) {
      return null;
    }

    const dx = worldPosition.x - distanceStart.x;
    const dy = worldPosition.y - distanceStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return {
      dx,
      dy,
      distance,
    };
  }, [isDistanceMode, distanceStart, worldPosition]);

  /**
   * Format coordinate value with 1 decimal place
   */
  const formatCoord = (value: number): string => {
    return value.toFixed(1).padStart(10, ' ');
  };

  /**
   * Format distance with 1 decimal place
   */
  const formatDistance = (value: number): string => {
    return value.toFixed(1).padStart(8, ' ');
  };

  return (
    <div
      className="coordinate-display"
      style={{
        position: 'absolute',
        bottom: '12px',
        left: '12px',
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        border: '1px solid rgba(100, 100, 100, 0.5)',
        borderRadius: '4px',
        padding: '8px 12px',
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e0e0e0',
        userSelect: 'none',
        pointerEvents: 'none',
        zIndex: 100,
        minWidth: '140px',
      }}
    >
      {/* Current Position */}
      <div style={{ marginBottom: distanceInfo ? '8px' : 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>X:</span>
          <span>{formatCoord(worldPosition.x)} mm</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#888' }}>Y:</span>
          <span>{formatCoord(worldPosition.y)} mm</span>
        </div>
      </div>

      {/* Distance Measurements */}
      {distanceInfo && (
        <div
          style={{
            borderTop: '1px solid rgba(100, 100, 100, 0.3)',
            paddingTop: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>ΔX:</span>
            <span>{formatCoord(distanceInfo.dx)} mm</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#888' }}>ΔY:</span>
            <span>{formatCoord(distanceInfo.dy)} mm</span>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
              paddingTop: '4px',
              borderTop: '1px dashed rgba(100, 100, 100, 0.3)',
            }}
          >
            <span style={{ color: '#aaa', fontWeight: 'bold' }}>Dist:</span>
            <span style={{ fontWeight: 'bold', color: '#4fc3f7' }}>
              {formatDistance(distanceInfo.distance)} mm
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinateDisplay;
