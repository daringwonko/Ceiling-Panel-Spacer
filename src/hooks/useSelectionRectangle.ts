/**
 * useSelectionRectangle Hook
 * 
 * Manages click-drag selection rectangle operations.
 * Supports minimum drag threshold and normalized bounds.
 */

import { useState, useCallback, useMemo } from 'react';
import type { Point2D, SelectionRect, Bounds } from '../types/drafting';

export interface SelectionRectangleState {
  /** Current selection rectangle or null if inactive */
  selectionRect: SelectionRect | null;
  /** Whether selection operation is currently active */
  isSelecting: boolean;
  /** Start a new selection at the given point */
  startSelection: (screenX: number, screenY: number) => void;
  /** Update the selection end point while dragging */
  updateSelection: (screenX: number, screenY: number) => void;
  /** End the current selection operation */
  endSelection: () => Bounds | null;
  /** Cancel the current selection */
  cancelSelection: () => void;
  /** Get normalized selection bounds */
  getSelectedBounds: () => Bounds | null;
}

/** Minimum drag distance in pixels to activate selection */
const MIN_DRAG_DISTANCE = 5;

/**
 * Hook for click-drag selection rectangle functionality
 * @returns SelectionRectangleState with selection methods and state
 */
export function useSelectionRectangle(): SelectionRectangleState {
  const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [dragStart, setDragStart] = useState<Point2D | null>(null);

  /**
   * Start a new selection operation
   * Only activates if left mouse button is used
   */
  const startSelection = useCallback((screenX: number, screenY: number) => {
    const startPoint = { x: screenX, y: screenY };
    
    setDragStart(startPoint);
    setSelectionRect({
      start: startPoint,
      end: startPoint,
      active: false, // Not active yet, waiting for threshold
    });
    setIsSelecting(true);
  }, []);

  /**
   * Update selection while dragging
   * Activates selection once minimum drag distance is exceeded
   */
  const updateSelection = useCallback((screenX: number, screenY: number) => {
    if (!dragStart || !selectionRect) return;

    const currentPoint = { x: screenX, y: screenY };
    
    // Calculate drag distance
    const dx = currentPoint.x - dragStart.x;
    const dy = currentPoint.y - dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Activate selection once threshold is crossed
    const shouldActivate = distance >= MIN_DRAG_DISTANCE;

    setSelectionRect({
      start: dragStart,
      end: currentPoint,
      active: shouldActivate,
    });
  }, [dragStart, selectionRect]);

  /**
   * Calculate normalized bounds from selection rectangle
   * Ensures min < max regardless of drag direction
   */
  const calculateBounds = useCallback((rect: SelectionRect): Bounds => {
    return {
      minX: Math.min(rect.start.x, rect.end.x),
      minY: Math.min(rect.start.y, rect.end.y),
      maxX: Math.max(rect.start.x, rect.end.x),
      maxY: Math.max(rect.start.y, rect.end.y),
    };
  }, []);

  /**
   * End the selection operation
   * Returns bounds if selection was active, null otherwise
   */
  const endSelection = useCallback((): Bounds | null => {
    let result: Bounds | null = null;

    if (selectionRect?.active) {
      result = calculateBounds(selectionRect);
    }

    setSelectionRect(null);
    setIsSelecting(false);
    setDragStart(null);

    return result;
  }, [selectionRect, calculateBounds]);

  /**
   * Cancel the current selection without returning bounds
   */
  const cancelSelection = useCallback(() => {
    setSelectionRect(null);
    setIsSelecting(false);
    setDragStart(null);
  }, []);

  /**
   * Get normalized bounds of current selection
   * Returns null if no active selection
   */
  const getSelectedBounds = useCallback((): Bounds | null => {
    if (!selectionRect?.active) return null;
    return calculateBounds(selectionRect);
  }, [selectionRect, calculateBounds]);

  return useMemo(() => ({
    selectionRect,
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    cancelSelection,
    getSelectedBounds,
  }), [
    selectionRect,
    isSelecting,
    startSelection,
    updateSelection,
    endSelection,
    cancelSelection,
    getSelectedBounds,
  ]);
}

export default useSelectionRectangle;
