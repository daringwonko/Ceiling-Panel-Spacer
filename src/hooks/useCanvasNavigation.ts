/**
 * useCanvasNavigation Hook
 * 
 * Provides canvas navigation operations: pan, zoom, fit-to-view,
 * and coordinate transformations between screen and world space.
 */

import { useState, useCallback, useRef, useMemo } from 'react';
import type { Point2D, ViewBox, Bounds, CanvasState } from '../types/drafting';
import { DEFAULT_CANVAS_STATE } from '../types/drafting';

export interface CanvasNavigation {
  /** Current canvas state */
  state: CanvasState;
  
  // Pan methods
  startPan: (screenX: number, screenY: number) => void;
  pan: (dx: number, dy: number) => void;
  endPan: () => void;
  
  // Zoom methods
  zoomIn: (centerX?: number, centerY?: number) => void;
  zoomOut: (centerX?: number, centerY?: number) => void;
  zoomTo: (factor: number, centerX?: number, centerY?: number) => void;
  wheelZoom: (delta: number, mouseX: number, mouseY: number) => void;
  
  // Fit methods
  fitToView: (bounds: Bounds) => void;
  zoomToSelection: (selectionBounds: Bounds) => void;
  resetView: () => void;
  
  // Coordinate transformations
  screenToWorld: (screenX: number, screenY: number) => Point2D;
  worldToScreen: (worldX: number, worldY: number) => Point2D;
  
  // Current viewBox for SVG
  viewBox: ViewBox;
  zoom: number;
}

/**
 * Hook for canvas navigation operations
 * @returns CanvasNavigation object with all navigation methods and state
 */
export function useCanvasNavigation(): CanvasNavigation {
  const [state, setState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);
  const containerRef = useRef<HTMLElement | null>(null);

  /**
   * Start panning operation
   * Records the starting position for delta calculations
   */
  const startPan = useCallback((screenX: number, screenY: number) => {
    setState(prev => ({
      ...prev,
      isPanning: true,
      panStart: { x: screenX, y: screenY },
    }));
  }, []);

  /**
   * Update pan based on mouse movement delta
   * Adjusts viewBox minX/minY to pan the canvas
   */
  const pan = useCallback((dx: number, dy: number) => {
    setState(prev => {
      if (!prev.isPanning) return prev;
      
      // Convert screen delta to world delta based on zoom
      const worldDx = dx / prev.zoom;
      const worldDy = dy / prev.zoom;
      
      return {
        ...prev,
        viewBox: {
          ...prev.viewBox,
          minX: prev.viewBox.minX - worldDx,
          minY: prev.viewBox.minY - worldDy,
        },
      };
    });
  }, []);

  /**
   * End panning operation
   */
  const endPan = useCallback(() => {
    setState(prev => ({
      ...prev,
      isPanning: false,
      panStart: null,
    }));
  }, []);

  /**
   * Calculate new viewBox for zoom centered on a point
   */
  const calculateZoomedViewBox = useCallback((
    currentViewBox: ViewBox,
    currentZoom: number,
    newZoom: number,
    centerX: number,
    centerY: number
  ): ViewBox => {
    // Convert center point to world coordinates
    const worldCenterX = currentViewBox.minX + (centerX / currentZoom);
    const worldCenterY = currentViewBox.minY + (centerY / currentZoom);
    
    // Calculate new viewBox dimensions
    const zoomRatio = currentZoom / newZoom;
    const newWidth = currentViewBox.width * zoomRatio;
    const newHeight = currentViewBox.height * zoomRatio;
    
    // Calculate new minX/minY to keep center point stable
    const newMinX = worldCenterX - (centerX / newZoom);
    const newMinY = worldCenterY - (centerY / newZoom);
    
    return {
      minX: newMinX,
      minY: newMinY,
      width: newWidth,
      height: newHeight,
    };
  }, []);

  /**
   * Zoom in by 20%
   */
  const zoomIn = useCallback((centerX?: number, centerY?: number) => {
    setState(prev => {
      const newZoom = prev.zoom * 1.2;
      const cx = centerX ?? prev.viewBox.width / 2;
      const cy = centerY ?? prev.viewBox.height / 2;
      
      return {
        ...prev,
        zoom: newZoom,
        viewBox: calculateZoomedViewBox(prev.viewBox, prev.zoom, newZoom, cx, cy),
      };
    });
  }, [calculateZoomedViewBox]);

  /**
   * Zoom out by 20%
   */
  const zoomOut = useCallback((centerX?: number, centerY?: number) => {
    setState(prev => {
      const newZoom = prev.zoom / 1.2;
      const cx = centerX ?? prev.viewBox.width / 2;
      const cy = centerY ?? prev.viewBox.height / 2;
      
      return {
        ...prev,
        zoom: newZoom,
        viewBox: calculateZoomedViewBox(prev.viewBox, prev.zoom, newZoom, cx, cy),
      };
    });
  }, [calculateZoomedViewBox]);

  /**
   * Zoom to specific factor
   */
  const zoomTo = useCallback((factor: number, centerX?: number, centerY?: number) => {
    setState(prev => {
      const cx = centerX ?? prev.viewBox.width / 2;
      const cy = centerY ?? prev.viewBox.height / 2;
      
      return {
        ...prev,
        zoom: factor,
        viewBox: calculateZoomedViewBox(prev.viewBox, prev.zoom, factor, cx, cy),
      };
    });
  }, [calculateZoomedViewBox]);

  /**
   * Handle mouse wheel zoom
   * Zooms centered on mouse position
   */
  const wheelZoom = useCallback((delta: number, mouseX: number, mouseY: number) => {
    setState(prev => {
      // Calculate zoom factor from wheel delta
      const zoomFactor = delta > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(50, prev.zoom * zoomFactor));
      
      return {
        ...prev,
        zoom: newZoom,
        viewBox: calculateZoomedViewBox(prev.viewBox, prev.zoom, newZoom, mouseX, mouseY),
      };
    });
  }, [calculateZoomedViewBox]);

  /**
   * Fit view to bounds with padding
   */
  const fitToView = useCallback((bounds: Bounds) => {
    setState(prev => {
      const padding = 50; // 50mm padding
      const contentWidth = bounds.maxX - bounds.minX + (padding * 2);
      const contentHeight = bounds.maxY - bounds.minY + (padding * 2);
      
      // Calculate zoom to fit
      const zoomX = prev.viewBox.width / contentWidth;
      const zoomY = prev.viewBox.height / contentHeight;
      const newZoom = Math.min(zoomX, zoomY);
      
      // Center the content
      const newMinX = bounds.minX - padding;
      const newMinY = bounds.minY - padding;
      
      return {
        ...prev,
        zoom: newZoom,
        viewBox: {
          minX: newMinX,
          minY: newMinY,
          width: contentWidth,
          height: contentHeight,
        },
      };
    });
  }, []);

  /**
   * Zoom to specific selection bounds
   */
  const zoomToSelection = useCallback((selectionBounds: Bounds) => {
    fitToView(selectionBounds);
  }, [fitToView]);

  /**
   * Reset view to default state
   */
  const resetView = useCallback(() => {
    setState(DEFAULT_CANVAS_STATE);
  }, []);

  /**
   * Convert screen coordinates to world coordinates
   */
  const screenToWorld = useCallback((screenX: number, screenY: number): Point2D => {
    return {
      x: state.viewBox.minX + (screenX / state.zoom),
      y: state.viewBox.minY + (screenY / state.zoom),
    };
  }, [state.viewBox, state.zoom]);

  /**
   * Convert world coordinates to screen coordinates
   */
  const worldToScreen = useCallback((worldX: number, worldY: number): Point2D => {
    return {
      x: (worldX - state.viewBox.minX) * state.zoom,
      y: (worldY - state.viewBox.minY) * state.zoom,
    };
  }, [state.viewBox, state.zoom]);

  return useMemo(() => ({
    state,
    startPan,
    pan,
    endPan,
    zoomIn,
    zoomOut,
    zoomTo,
    wheelZoom,
    fitToView,
    zoomToSelection,
    resetView,
    screenToWorld,
    worldToScreen,
    viewBox: state.viewBox,
    zoom: state.zoom,
  }), [
    state,
    startPan,
    pan,
    endPan,
    zoomIn,
    zoomOut,
    zoomTo,
    wheelZoom,
    fitToView,
    zoomToSelection,
    resetView,
    screenToWorld,
    worldToScreen,
  ]);
}

export default useCanvasNavigation;
