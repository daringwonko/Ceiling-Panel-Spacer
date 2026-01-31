/**
 * GridSystem Component
 * 
 * Renders configurable grid overlay on SVG canvas.
 * Supports major/minor grid lines with performance optimization.
 */

import React, { useMemo } from 'react';
import type { GridConfig, ViewBox } from '../../types/drafting';

interface GridSystemProps {
  /** Grid configuration */
  config: GridConfig;
  /** Current viewBox */
  viewBox: ViewBox;
  /** Current zoom level */
  zoom: number;
}

/**
 * GridSystem component renders an SVG grid overlay
 * Optimized to only render visible grid lines
 */
export const GridSystem: React.FC<GridSystemProps> = React.memo(({
  config,
  viewBox,
  zoom,
}) => {
  // Don't render if grid is not visible
  if (!config.visible) {
    return null;
  }

  /**
   * Calculate grid line positions
   */
  const gridLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; isMajor: boolean }[] = [];
    
    // Calculate visible range with padding
    const padding = Math.max(config.majorSize, config.minorSize) * 2;
    const minX = Math.floor((viewBox.minX - padding) / config.minorSize) * config.minorSize;
    const maxX = Math.ceil((viewBox.minX + viewBox.width + padding) / config.minorSize) * config.minorSize;
    const minY = Math.floor((viewBox.minY - padding) / config.minorSize) * config.minorSize;
    const maxY = Math.ceil((viewBox.minY + viewBox.height + padding) / config.minorSize) * config.minorSize;
    
    // Determine if we should show minor lines based on zoom
    const minorSpacingPx = config.minorSize * zoom;
    const showMinorLines = minorSpacingPx >= 5;
    
    // Generate vertical lines
    for (let x = minX; x <= maxX; x += config.minorSize) {
      const isMajor = Math.abs(x % config.majorSize) < 0.001;
      
      if (isMajor || showMinorLines) {
        lines.push({
          x1: x,
          y1: minY,
          x2: x,
          y2: maxY,
          isMajor,
        });
      }
    }
    
    // Generate horizontal lines
    for (let y = minY; y <= maxY; y += config.minorSize) {
      const isMajor = Math.abs(y % config.majorSize) < 0.001;
      
      if (isMajor || showMinorLines) {
        lines.push({
          x1: minX,
          y1: y,
          x2: maxX,
          y2: y,
          isMajor,
        });
      }
    }
    
    return lines;
  }, [config, viewBox, zoom]);

  /**
   * Clip path to prevent grid lines from extending beyond viewBox
   */
  const clipPathId = useMemo(() => `grid-clip-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <g className="grid-system" style={{ pointerEvents: 'none' }}>
      {/* Define clip path */}
      <defs>
        <clipPath id={clipPathId}>
          <rect
            x={viewBox.minX}
            y={viewBox.minY}
            width={viewBox.width}
            height={viewBox.height}
          />
        </clipPath>
      </defs>
      
      {/* Grid lines group with clip */}
      <g clipPath={`url(#${clipPathId})`}>
        {gridLines.map((line, index) => (
          <line
            key={index}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.isMajor ? config.majorColor : config.minorColor}
            strokeWidth={line.isMajor ? 1 : 0.5}
            opacity={line.isMajor ? 0.6 : 0.3}
          />
        ))}
      </g>
      
      {/* Origin axes (special styling) */}
      <g clipPath={`url(#${clipPathId})`}>
        <line
          x1={0}
          y1={viewBox.minY}
          x2={0}
          y2={viewBox.minY + viewBox.height}
          stroke="rgba(200, 200, 200, 0.4)"
          strokeWidth={1.5}
        />
        <line
          x1={viewBox.minX}
          y1={0}
          x2={viewBox.minX + viewBox.width}
          y2={0}
          stroke="rgba(200, 200, 200, 0.4)"
          strokeWidth={1.5}
        />
      </g>
    </g>
  );
});

GridSystem.displayName = 'GridSystem';

export default GridSystem;
