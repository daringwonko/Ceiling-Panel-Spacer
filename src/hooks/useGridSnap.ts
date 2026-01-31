/**
 * useGridSnap Hook
 * 
 * Provides grid snapping functionality for precise positioning.
 * Calculates snap points based on grid configuration and zoom level.
 */

import { useMemo, useCallback } from 'react';
import type { Point2D, GridConfig, ViewBox } from '../types/drafting';

export interface GridSnap {
  /** Snap point to nearest grid intersection */
  snapToGrid: (point: Point2D) => Point2D;
  /** Snap to minor grid lines */
  snapToMinor: (point: Point2D) => Point2D;
  /** Snap to major grid lines */
  snapToMajor: (point: Point2D) => Point2D;
  /** Check if point is near a snap point within threshold */
  isNearSnapPoint: (point: Point2D, threshold: number) => boolean;
  /** Calculate grid spacing in screen pixels */
  getGridSpacing: () => { majorPx: number; minorPx: number };
  /** Check if grid lines should be visible at current zoom */
  shouldShowMinorLines: () => boolean;
  /** Get visible grid range */
  getVisibleGridRange: () => { minX: number; maxX: number; minY: number; maxY: number };
}

/**
 * Hook for grid snapping functionality
 * @param config Grid configuration
 * @param viewBox Current viewBox
 * @param zoom Current zoom level
 * @returns GridSnap object with snap methods
 */
export function useGridSnap(
  config: GridConfig,
  viewBox: ViewBox,
  zoom: number
): GridSnap {
  /**
   * Calculate grid spacing in screen pixels
   */
  const getGridSpacing = useCallback(() => {
    const majorPx = config.majorSize * zoom;
    const minorPx = config.minorSize * zoom;
    return { majorPx, minorPx };
  }, [config.majorSize, config.minorSize, zoom]);

  /**
   * Determine if minor grid lines should be shown
   * Hide if spacing is less than 5px for performance
   */
  const shouldShowMinorLines = useCallback(() => {
    const { minorPx } = getGridSpacing();
    return minorPx >= 5;
  }, [getGridSpacing]);

  /**
   * Calculate visible grid range based on viewBox
   */
  const getVisibleGridRange = useCallback(() => {
    const padding = Math.max(config.majorSize, config.minorSize) * 2;
    
    return {
      minX: Math.floor((viewBox.minX - padding) / config.minorSize) * config.minorSize,
      maxX: Math.ceil((viewBox.minX + viewBox.width + padding) / config.minorSize) * config.minorSize,
      minY: Math.floor((viewBox.minY - padding) / config.minorSize) * config.minorSize,
      maxY: Math.ceil((viewBox.minY + viewBox.height + padding) / config.minorSize) * config.minorSize,
    };
  }, [viewBox, config.majorSize, config.minorSize]);

  /**
   * Snap coordinate to nearest grid multiple
   */
  const snapCoordinate = useCallback((value: number, gridSize: number): number => {
    return Math.round(value / gridSize) * gridSize;
  }, []);

  /**
   * Snap point to nearest grid intersection
   * Returns original point if snapEnabled is false
   */
  const snapToGrid = useCallback((point: Point2D): Point2D => {
    if (!config.snapEnabled) {
      return point;
    }
    
    return {
      x: snapCoordinate(point.x, config.minorSize),
      y: snapCoordinate(point.y, config.minorSize),
    };
  }, [config.snapEnabled, config.minorSize, snapCoordinate]);

  /**
   * Snap to minor grid lines (same as snapToGrid)
   */
  const snapToMinor = useCallback((point: Point2D): Point2D => {
    if (!config.snapEnabled) {
      return point;
    }
    
    return {
      x: snapCoordinate(point.x, config.minorSize),
      y: snapCoordinate(point.y, config.minorSize),
    };
  }, [config.snapEnabled, config.minorSize, snapCoordinate]);

  /**
   * Snap to major grid lines
   */
  const snapToMajor = useCallback((point: Point2D): Point2D => {
    if (!config.snapEnabled) {
      return point;
    }
    
    return {
      x: snapCoordinate(point.x, config.majorSize),
      y: snapCoordinate(point.y, config.majorSize),
    };
  }, [config.snapEnabled, config.majorSize, snapCoordinate]);

  /**
   * Check if point is near a snap point
   * Useful for showing snap indicators
   */
  const isNearSnapPoint = useCallback((point: Point2D, threshold: number): boolean => {
    if (!config.snapEnabled) {
      return false;
    }
    
    const snapped = snapToGrid(point);
    const dx = Math.abs(point.x - snapped.x);
    const dy = Math.abs(point.y - snapped.y);
    
    // Convert threshold from screen pixels to world units
    const worldThreshold = threshold / zoom;
    
    return dx <= worldThreshold && dy <= worldThreshold;
  }, [config.snapEnabled, snapToGrid, zoom]);

  return useMemo(() => ({
    snapToGrid,
    snapToMinor,
    snapToMajor,
    isNearSnapPoint,
    getGridSpacing,
    shouldShowMinorLines,
    getVisibleGridRange,
  }), [
    snapToGrid,
    snapToMinor,
    snapToMajor,
    isNearSnapPoint,
    getGridSpacing,
    shouldShowMinorLines,
    getVisibleGridRange,
  ]);
}

export default useGridSnap;
