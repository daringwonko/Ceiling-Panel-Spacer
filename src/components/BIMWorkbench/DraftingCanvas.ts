  import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { useCanvasNavigation } from '../../hooks/useCanvasNavigation';
import { useSelectionRectangle } from '../../hooks/useSelectionRectangle';
import { GridSystem } from './GridSystem';
import { CoordinateDisplay } from './CoordinateDisplay';
import { CanvasControls } from './CanvasControls';
import type {
  GridConfig,
  Point2D,
  Bounds,
} from '../../types/drafting';
import { DEFAULT_GRID_CONFIG } from '../../types/drafting';
import './drafting-canvas.css';
interface DraftingCanvasProps {
  /** Canvas width (default: 100%) */
  width?: string | number;
  /** Canvas height (default: 100%) */
  height?: string | number;
  /** Grid configuration overrides */
  gridConfig?: Partial<GridConfig>;
  /** Callback when selection changes */
  onSelectionChange?: (bounds: Bounds | null) => void;
}
export interface DraftingCanvasRef {
  /** Reset view to default */
  resetView: () => void;
  /** Fit view to specific bounds */
  fitToView: (bounds: Bounds) => void;
  /** Zoom to specific factor */
  zoomTo: (factor: number) => void;
  /** Get current viewBox */
  getViewBox: () => { minX: number; minY: number; width: number; height: number };
}
/**
 * DraftingCanvas - Main SVG canvas component for 2D drafting
 */
export const DraftingCanvas = forwardRef<DraftingCanvasRef, DraftingCanvasProps>(
  ({ width = '100%', height = '100%', gridConfig = {}, onSelectionChange }, ref) => {
    // Refs
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Grid configuration
    const [grid, setGrid] = useState<GridConfig>({
      ...DEFAULT_GRID_CONFIG,
      ...gridConfig,
    });
    // Navigation hook
    const navigation = useCanvasNavigation();
    // Selection hook
    const selection = useSelectionRectangle();
    // Mouse state
    const [mousePosition, setMousePosition] = useState<Point2D>({ x: 0, y: 0 });
    const [worldPosition, setWorldPosition] = useState<Point2D>({ x: 0, y: 0 });
    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      resetView: navigation.resetView,
      fitToView: navigation.fitToView,
      zoomTo: (factor: number) => navigation.zoomTo(factor),
      getViewBox: () => navigation.viewBox,
    }));
    /**
     * Get mouse position relative to SVG
     */
    const getMousePosition = useCallback(
      (e: React.MouseEvent): Point2D => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      },
      []
    );
    /**
     * Handle mouse down
     * Middle button: pan, Left button: selection
     */
    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        const pos = getMousePosition(e);
        if (e.button === 1) {
          // Middle button - start pan
          navigation.startPan(pos.x, pos.y);
        } else if (e.button === 0) {
          // Left button - start selection
          selection.startSelection(pos.x, pos.y);
        }
      },
      [getMousePosition, navigation, selection]
    );
    /**
     * Handle mouse move
     * Update pan, selection, and coordinates
     */
    const handleMouseMove = useCallback(
      (e: React.MouseEvent) => {
        const screenPos = getMousePosition(e);
        const worldPos = navigation.screenToWorld(screenPos.x, screenPos.y);
        setMousePosition(screenPos);
        setWorldPosition(worldPos);
        if (navigation.state.isPanning) {
          const dx = screenPos.x - (navigation.state.panStart?.x || 0);
          const dy = screenPos.y - (navigation.state.panStart?.y || 0);
          navigation.pan(dx, dy);
          navigation.startPan(screenPos.x, screenPos.y);
        }
        if (selection.isSelecting) {
          selection.updateSelection(screenPos.x, screenPos.y);
        }
      },
      [getMousePosition, navigation, selection]
    );
    /**
     * Handle mouse up
     * End pan or selection
     */
    const handleMouseUp = useCallback(
      (e: React.MouseEvent) => {
        if (navigation.state.isPanning) {
          navigation.endPan();
        }
        if (selection.isSelecting) {
          const bounds = selection.endSelection();
          if (bounds && onSelectionChange) {
            onSelectionChange(bounds);
          }
        }
      },
      [navigation, selection, onSelectionChange]
    );
    /**
     * Handle mouse leave
     * Cancel ongoing operations
     */
    const handleMouseLeave = useCallback(() => {
      if (navigation.state.isPanning) {
        navigation.endPan();
      }
      if (selection.isSelecting) {
        selection.cancelSelection();
      }
    }, [navigation, selection]);
    /**
     * Handle mouse wheel for zoom
     */
    const handleWheel = useCallback(
      (e: React.WheelEvent) => {
        e.preventDefault();
        const pos = getMousePosition(e);
        navigation.wheelZoom(e.deltaY, pos.x, pos.y);
      },
      [getMousePosition, navigation]
    );
    /**
     * Prevent context menu on right-click
     */
    const handleContextMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
    }, []);
    /**
     * Toggle grid visibility
     */
    const toggleGrid = useCallback(() => {
      setGrid((prev) => ({ ...prev, visible: !prev.visible }));
    }, []);
    /**
     * Toggle snap enabled
     */
    const toggleSnap = useCallback(() => {
      setGrid((prev) => ({ ...prev, snapEnabled: !prev.snapEnabled }));
    }, []);
    // Cursor style based on state
    const cursorStyle = navigation.state.isPanning
      ? 'grabbing'
      : selection.isSelecting
      ? 'crosshair'
      : 'grab';
    return (
      <div
        ref={containerRef}
        className="drafting-canvas-container"
        style={{
          width,
          height,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#1a1a1a',
        }}
      >
        <svg
          ref={svgRef}
          className="drafting-canvas"
          viewBox={`${navigation.viewBox.minX} ${navigation.viewBox.minY} ${navigation.viewBox.width} ${navigation.viewBox.height}`}
          style={{
            width: '100%',
            height: '100%',
            cursor: cursorStyle,
            userSelect: 'none',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onContextMenu={handleContextMenu}
        >
          {/* Grid layer */}
          <GridSystem
            config={grid}
            viewBox={navigation.viewBox}
            zoom={navigation.zoom}
          />
          {/* Drawing layer (for future shapes) */}
          <g id="drawing-layer" />
          {/* Selection rectangle overlay */}
          {selection.selectionRect?.active && (
            <rect
              x={Math.min(selection.selectionRect.start.x, selection.selectionRect.end.x)}
              y={Math.min(selection.selectionRect.start.y, selection.selectionRect.end.y)}
              width={Math.abs(selection.selectionRect.end.x - selection.selectionRect.start.x)}
              height={Math.abs(selection.selectionRect.end.y - selection.selectionRect.start.y)}
              fill="rgba(79, 195, 247, 0.1)"
              stroke="#4fc3f7"
              strokeWidth={1 / navigation.zoom}
              strokeDasharray={`${4 / navigation.zoom} ${2 / navigation.zoom}`}
              style={{ pointerEvents: 'none' }}
            />
          )}
        </svg>
        {/* Coordinate display */}
        <CoordinateDisplay
          mousePosition={mousePosition}
          worldPosition={worldPosition}
        />
        {/* Canvas controls */}
        <CanvasControls
          onZoomIn={navigation.zoomIn}
          onZoomOut={navigation.zoomOut}
          onFitToView={() =>
            navigation.fitToView({ minX: -500, minY: -500, maxX: 500, maxY: 500 })
          }
          onResetView={navigation.resetView}
          onToggleGrid={toggleGrid}
          onToggleSnap={toggleSnap}
          gridVisible={grid.visible}
          snapEnabled={grid.snapEnabled}
          zoom={navigation.zoom}
        />
      </div>
    );
  }
);